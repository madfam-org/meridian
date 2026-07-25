#!/usr/bin/env node
/**
 * Meridian does not take custody of a person's government authentication
 * credentials. This script is the repository-wide, executable form of that rule.
 *
 * WHY THIS IS A CI GATE AND NOT A CODE REVIEW NOTE
 *
 * A Spanish Cl@ve PIN, a Mexican e.firma private key, or the password to an
 * immigration account is not "sensitive data" in the ordinary sense. It is the
 * person's legal identity. Whoever holds it can act as them before the state —
 * file, withdraw, consent, waive — and every one of those acts is attributable
 * to the person, not to us. Encryption at rest does not change that: the whole
 * point of storing the credential is to be able to use it, so the system must be
 * able to decrypt it, so the capability exists.
 *
 * The refusal is enforced structurally inside packages/govtech: `CredentialFree<T>`
 * maps any credential-shaped property to a type nothing is assignable to, and
 * `guardCredentialFree` blocks the untyped boundaries. That protects the code
 * that goes through the adapters. It does not protect a new Prisma model with a
 * `clavePin` column, or a route that quietly takes a portal password in a
 * request body. This does.
 *
 * WHAT IT LOOKS FOR
 *
 * Identifier-shaped names only: the words must be joined by `_`, `-`, or
 * camelCase. Prose is not matched, deliberately. "Meridian never stores a
 * government portal password" is a sentence this repository needs to be able to
 * write — in this file, in secrets-template.yaml, in a README — and a checker
 * that fails on its own policy statement is a checker somebody disables.
 *
 * EXEMPTIONS, BY PATH
 *
 * Two paths are exempt, and both for the same reason: they are the refusal
 * itself. packages/govtech/src/credential-guard.ts has to name the forbidden
 * things in order to forbid them — its detection vocabulary is a list of exactly
 * these strings. packages/govtech/tests/ has to construct payloads carrying them
 * to prove the guard rejects them; a test that cannot build the bad input proves
 * nothing. This file is exempt for the same reason.
 *
 * The exemptions are paths, not patterns, and each one is asserted to exist. A
 * stale exemption that silently stops matching is how a checker turns green
 * while the thing it protects has moved.
 *
 * ANTI-VACUITY
 *
 * A gate that scans nothing passes everything. This script fails if it scans
 * zero files, if an exempt path has disappeared, or if the structural refusal in
 * packages/govtech is no longer present — the greps below are a backstop for
 * that refusal, not a replacement, and they should not be the last line standing
 * without anyone noticing.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'build',
  'out',
  'coverage',
]);

/** Lockfiles are machine-generated and enormous; a package name is not a field. */
const SKIP_FILES = new Set(['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock']);

const SCAN_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.yaml',
  '.yml',
  '.prisma',
  '.sql',
  '.sh',
  '.env',
  '.example',
  '.md',
  '.toml',
]);

/** Files with no extension that are still worth reading. */
const SCAN_BASENAME_PREFIXES = ['Dockerfile', 'Makefile'];

/**
 * Paths whose contents are the refusal and therefore necessarily contain the
 * vocabulary. Every entry must exist — see the module comment.
 */
const EXEMPT = [
  'packages/govtech/src/credential-guard.ts',
  'packages/govtech/tests',
  'scripts/check-no-credential-custody.mjs',
];

/**
 * Proof that the structural refusal is still in place. If these disappear, the
 * greps in this file are all that is left, and that is not enough — so the build
 * goes red and says why.
 */
const STRUCTURAL_ANCHORS = [
  {
    path: 'packages/govtech/src/credential-guard.ts',
    needles: [
      'export function guardCredentialFree',
      'export type CredentialFree',
      'CREDENTIAL_CUSTODY_POLICY',
    ],
  },
  {
    path: 'packages/core/src/errors.ts',
    needles: ["'CREDENTIAL_CUSTODY_REFUSED'"],
  },
];

/**
 * Each rule matches an identifier, never prose. `\b` is omitted at the head of
 * the government-scheme rules on purpose so that camelCase compounds like
 * `applicantClavePin` are caught; the cost is that a word ending in one of the
 * scheme names could match, which is a trade worth making for a name nobody
 * writes by accident.
 */
const RULES = [
  {
    id: 'clave-secret-field',
    // Cl@ve is the Spanish administration's identity scheme; its own branding
    // spells the "a" as "@", which is why both forms appear here.
    pattern:
      /(?:cl[a@]ve(?:[_-]?permanente)?|dnie)[_-]?(?:pin|password|passwd|pwd|passphrase|secret|otp|code)\b|(?:pin|password|passphrase)[_-]?(?:cl[a@]ve|dnie)\b/i,
    explain:
      'looks like a field holding a Spanish Cl@ve or DNIe authentication secret.',
  },
  {
    id: 'efirma-private-key',
    // e.firma (formerly FIEL) is the SAT-issued Mexican digital signature. Its
    // .key file plus its passphrase is a signing capability, not a login.
    pattern:
      /(?:e[._-]?firma|fiel)[_-]?(?:private[_-]?key|privatekey|keyfile|keypath|keypem|keybytes|password|passwd|passphrase|pfx|p12|cer|crt|pem|key)\b|(?:private[_-]?key|keyfile|passphrase)[_-]?(?:e[._-]?firma|fiel)\b/i,
    explain:
      'looks like handling of an e.firma / FIEL private key or its passphrase.',
  },
  {
    id: 'government-portal-password',
    pattern:
      /(?:gckey|sede(?:[_-]?electronica)?|portal|gob(?:mx)?|govmx|ircc|sat|imss|extranjeria|migracion|consular|consulate|government)[_-]?(?:password|passwd|pwd|passphrase|login[_-]?secret|account[_-]?password|credentials?)\b/i,
    explain:
      'looks like a stored password or credential for a government portal account.',
  },
];

function isScannable(path) {
  const base = path.slice(path.lastIndexOf(sep) + 1);
  if (SKIP_FILES.has(base)) return false;
  if (SCAN_BASENAME_PREFIXES.some((p) => base.startsWith(p))) return true;
  const dot = base.lastIndexOf('.');
  if (dot <= 0) return false;
  return SCAN_EXTENSIONS.has(base.slice(dot));
}

function collectFiles(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectFiles(join(dir, entry.name), out);
    } else if (entry.isFile() && isScannable(entry.name)) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

function isExempt(relPath) {
  const normalised = relPath.split(sep).join('/');
  return EXEMPT.some((e) => normalised === e || normalised.startsWith(`${e}/`));
}

function annotate(relPath, line, message) {
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log(`::error file=${relPath},line=${line}::${message}`);
  }
}

function main() {
  const failures = [];

  // 1. The exemptions must still point at something.
  for (const path of EXEMPT) {
    if (!existsSync(join(REPO_ROOT, path))) {
      failures.push(
        `exempt path no longer exists: ${path}\n` +
          '  An exemption that matches nothing silently stops exempting, and the\n' +
          '  next contributor sees an unexplained failure in a file that is allowed\n' +
          '  to contain these strings. Update EXEMPT in this script to the new path.',
      );
    }
  }

  // 2. The structural refusal must still be in place.
  for (const anchor of STRUCTURAL_ANCHORS) {
    const abs = join(REPO_ROOT, anchor.path);
    if (!existsSync(abs)) {
      failures.push(
        `structural refusal missing: ${anchor.path} does not exist.\n` +
          '  The type-level refusal of credential custody lives there. Without it\n' +
          '  the pattern scan below is the only control, and a pattern scan is a\n' +
          '  backstop, not a boundary.',
      );
      continue;
    }
    const text = readFileSync(abs, 'utf8');
    for (const needle of anchor.needles) {
      if (!text.includes(needle)) {
        failures.push(
          `structural refusal weakened: ${anchor.path} no longer contains ${needle}.\n` +
            '  Restore it, or if the refusal genuinely moved, point STRUCTURAL_ANCHORS\n' +
            '  in this script at its new home in the same commit.',
        );
      }
    }
  }

  // 3. The scan itself.
  const files = collectFiles(REPO_ROOT, []);
  let scanned = 0;
  const hits = [];

  for (const abs of files) {
    const rel = relative(REPO_ROOT, abs);
    if (isExempt(rel)) continue;
    if (statSync(abs).size > 2_000_000) continue;

    const text = readFileSync(abs, 'utf8');
    scanned += 1;

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      for (const rule of RULES) {
        const match = rule.pattern.exec(line);
        if (match) {
          hits.push({
            file: rel.split(sep).join('/'),
            line: i + 1,
            rule: rule.id,
            explain: rule.explain,
            text: line.trim().slice(0, 160),
          });
        }
      }
    }
  }

  if (scanned === 0) {
    failures.push(
      'scanned 0 files.\n' +
        '  This check passes trivially when it reads nothing, which is the exact\n' +
        '  failure mode it must not have. Either the repository layout moved or\n' +
        '  SKIP_DIRS / SCAN_EXTENSIONS in this script are wrong.',
    );
  }

  for (const hit of hits) {
    const message = `${hit.rule}: ${hit.explain}`;
    annotate(hit.file, hit.line, message);
    failures.push(
      `${hit.file}:${hit.line}  [${hit.rule}]\n` +
        `  ${hit.text}\n` +
        `  ${hit.explain}\n` +
        '  Meridian does not hold this. Produce an assisted handoff instead: the\n' +
        '  steps, the documents, and the computed field values, performed by the\n' +
        '  person themselves. See packages/govtech/src/handoff.ts.\n' +
        '  If this is the refusal itself rather than an implementation of custody,\n' +
        '  add the path to EXEMPT in this script and say why.',
    );
  }

  if (failures.length > 0) {
    console.error('\ncheck-no-credential-custody: FAILED\n');
    for (const f of failures) console.error(`- ${f}\n`);
    console.error(
      `Scanned ${scanned} files under ${EXEMPT.length} path exemptions.\n`,
    );
    process.exit(1);
  }

  console.log(
    `check-no-credential-custody: OK — ${scanned} files scanned, ` +
      `${RULES.length} rules, ${EXEMPT.length} path exemptions, ` +
      `${STRUCTURAL_ANCHORS.length} structural anchors verified.`,
  );
}

main();
