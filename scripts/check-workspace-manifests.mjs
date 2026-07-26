#!/usr/bin/env node
/**
 * Every workspace manifest must be copied into every Dockerfile's deps stage.
 *
 * WHY
 *
 * `pnpm install --frozen-lockfile` compares the lockfile against the **whole**
 * workspace, not just the project being filtered. So adding one package to the
 * monorepo breaks the image build of every *other* service until its manifest is
 * copied too. The failure is remote from its cause — you add `packages/atlas`,
 * and `Dockerfile.api` stops building.
 *
 * This has now happened twice in this repository. First when `apps/landing` was
 * added and the other three Dockerfiles kept building from a stale lockfile;
 * then when `packages/atlas` was added and CI's root install failed while the
 * image builds passed, because they were still resolving the pre-atlas lockfile.
 * Both times the diagnosis cost more than the fix.
 *
 * Twice is a pattern, and a comment saying "remember to update the Dockerfiles"
 * is not a control — Dockerfile.api already carried exactly that comment, in
 * capitals, and it was not enough. So the rule is executable.
 *
 * WHAT IS CHECKED
 *
 *   1. Every directory matched by pnpm-workspace.yaml that has a package.json is
 *      COPY'd in every Dockerfile.
 *   2. No Dockerfile copies a manifest that no longer exists — a stale COPY
 *      fails the build with a far less obvious message than a missing one.
 *   3. The lockfile has an importer for every workspace project, which is the
 *      thing `--frozen-lockfile` will actually reject.
 *
 * ANTI-VACUITY
 *
 * A checker that finds no Dockerfiles agrees with everything. If this repo has
 * Dockerfiles and none are recognised, that is a failure rather than a quiet
 * pass, and the run prints what it examined so a reader can tell the difference.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Workspace globs are simple here: `apps/*` and `packages/*`. Read them rather than assume. */
function workspaceProjects() {
  const wsPath = join(ROOT, 'pnpm-workspace.yaml');
  if (!existsSync(wsPath)) {
    fail(['pnpm-workspace.yaml not found — this checker is anchored to a pnpm workspace.']);
  }
  const globs = [...readFileSync(wsPath, 'utf8').matchAll(/^\s*-\s*['"]?([^'"\n]+)['"]?\s*$/gm)]
    .map((m) => m[1].trim())
    .filter(Boolean);

  const found = [];
  for (const glob of globs) {
    if (!glob.endsWith('/*')) continue;
    const dir = glob.slice(0, -2);
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) continue;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (existsSync(join(abs, entry.name, 'package.json'))) found.push(`${dir}/${entry.name}`);
    }
  }
  return found.sort();
}

function dockerfiles() {
  return readdirSync(ROOT).filter((f) => f.startsWith('Dockerfile')).sort();
}

function fail(lines) {
  console.error('\ncheck-workspace-manifests FAILED\n');
  for (const l of lines) console.error('  ' + l);
  console.error(
    '\nWhy this matters: `pnpm install --frozen-lockfile` validates the lockfile against\n' +
      'the whole workspace. A manifest missing from a Dockerfile breaks that image even\n' +
      'when the package is unrelated to it, and the error names the lockfile rather than\n' +
      'the missing COPY.\n',
  );
  process.exit(1);
}

const projects = workspaceProjects();
const files = dockerfiles();

if (projects.length === 0) fail(['no workspace projects found — the glob resolution is broken.']);
if (files.length === 0) fail(['no Dockerfile found — this checker would pass vacuously.']);

const problems = [];

for (const file of files) {
  const text = readFileSync(join(ROOT, file), 'utf8');
  // Only the manifest COPY lines, not `COPY packages/ ./packages/` in a later stage.
  const copied = new Set(
    [...text.matchAll(/^COPY\s+((?:apps|packages)\/[^/\s]+)\/package\.json\s/gm)].map((m) => m[1]),
  );
  for (const p of projects) {
    if (!copied.has(p)) problems.push(`${file}: does not copy ${p}/package.json`);
  }
  for (const c of copied) {
    if (!projects.includes(c)) problems.push(`${file}: copies ${c}/package.json, which does not exist`);
  }
}

const lockPath = join(ROOT, 'pnpm-lock.yaml');
if (!existsSync(lockPath)) {
  problems.push('pnpm-lock.yaml not found');
} else {
  const lock = readFileSync(lockPath, 'utf8');
  for (const p of projects) {
    // Importers appear as `  <path>:` under `importers:`.
    if (!new RegExp(`^\\s{2}${p.replace(/[/.]/g, '\\$&')}:`, 'm').test(lock)) {
      problems.push(
        `pnpm-lock.yaml has no importer for ${p} — run \`pnpm install\` and commit the lockfile.`,
      );
    }
  }
}

if (problems.length > 0) fail(problems);

console.log(
  `check-workspace-manifests: OK — ${projects.length} workspace projects ` +
    `(${projects.join(', ')}) present in all ${files.length} Dockerfiles (${files.join(', ')}) ` +
    `and in the lockfile.`,
);
