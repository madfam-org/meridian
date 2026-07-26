/**
 * `lib/tools/mrz.ts` — the machine-readable-zone view model.
 *
 * The property that matters here is not "does it detect a bad MRZ". It is that
 * a defect is *located*: a person retyping a passport number off a page needs to
 * know it is the date-of-birth digit that disagrees, at line 2 column 20, so
 * they can re-read one character rather than start again. "Invalid passport" is
 * useless to them, and a tool that collapses the verdict into a boolean has
 * thrown away the only part of the answer that helps.
 *
 * Every specimen below is synthetic — issuing state `ZZZ`, which ICAO assigns to
 * nobody, and a surname of `SPECIMEN`. This repository is public and carries no
 * real travel-document number anywhere, including in its tests.
 */

import { describe, expect, it } from 'vitest';

import type { IsoDate } from '@meridian/core';
import { isoDate } from '@meridian/core';

import {
  DEFAULT_REFERENCE_DATE,
  ICAO_9303_CITATION,
  MRZ_SPECIMENS,
  runMrzCheck,
  specimenText,
  type MrzReport,
} from '@/lib/tools/mrz';

const REFERENCE = DEFAULT_REFERENCE_DATE;

function specimen(id: string): readonly string[] {
  const found = MRZ_SPECIMENS.find((s) => s.id === id);
  if (found === undefined) throw new Error(`no such specimen: ${id}`);
  return found.lines;
}

/** The specimen's lines as the reader would paste them. */
function pasted(id: string): string {
  return specimen(id).join('\n');
}

/** Replace one character, 1-indexed by line and column, as a reader would read it. */
function corrupt(lines: readonly string[], line: number, column: number, char: string): string {
  const copy = [...lines];
  const target = copy[line - 1];
  if (target === undefined) throw new Error(`no line ${line}`);
  copy[line - 1] = `${target.slice(0, column - 1)}${char}${target.slice(column)}`;
  return copy.join('\n');
}

function check(id: string, line?: number, column?: number, char?: string): MrzReport {
  const lines = specimen(id);
  const text =
    line === undefined || column === undefined || char === undefined
      ? lines.join('\n')
      : corrupt(lines, line, column, char);
  return runMrzCheck(text, REFERENCE);
}

function checkNamed(report: MrzReport, label: string): boolean {
  const row = report.checks.find((c) => c.label.en === label);
  if (row === undefined) throw new Error(`no check digit row for ${label}`);
  return row.ok;
}

// ---------------------------------------------------------------------------
// A well-formed zone
// ---------------------------------------------------------------------------

describe('a well-formed machine-readable zone', () => {
  it('parses every specimen clean, with no failures', () => {
    for (const spec of MRZ_SPECIMENS) {
      const report = runMrzCheck(specimenText(spec), REFERENCE);

      expect(report.selfConsistent, `${spec.id} is not self-consistent`).toBe(true);
      expect(report.failures, `${spec.id} reported a failure`).toEqual([]);
      expect(report.checks.every((c) => c.ok)).toBe(true);
      expect(report.lines).toEqual(spec.lines);
    }
  });

  it('reads a TD3 passport field by field', () => {
    const report = check('td3');
    const value = (key: string): string | undefined =>
      report.fields.find((f) => f.key === key)?.value;

    expect(report.format).toBe('TD3');
    expect(value('documentCode')).toBe('P');
    expect(value('issuingState')).toBe('ZZZ');
    expect(value('surname')).toBe('SPECIMEN');
    expect(value('givenNames')).toBe('ALEX QUINN');
    expect(value('dateOfBirth')).toBe('1980-01-01');
    expect(value('dateOfExpiry')).toBe('2030-01-01');
  });

  it('detects the geometry from the line count and length', () => {
    expect(check('td1').format).toBe('TD1');
    expect(check('td3').format).toBe('TD3');
    expect(check('td1').checks).toHaveLength(4);
    // A passport carries a composite digit and a personal-number digit; a TD1
    // card carries neither in the same place.
    expect(check('td3').checks).toHaveLength(5);
  });

  it('shows the substring each digit is computed over, so the arithmetic is checkable', () => {
    const report = check('td3');
    const dob = report.checks.find((c) => c.label.en === 'Date of birth');

    expect(dob?.covers).toBe('800101');
    expect(dob?.line).toBe(2);
    expect(dob?.column).toBe(20);
    expect(dob?.expected).toBe(4);
    expect(dob?.present).toBe('4');
  });

  it('carries a longer document number through the optional-data overflow', () => {
    const report = check('td3-extended');
    const number = report.fields.find((f) => f.key === 'documentNumber');

    expect(report.selfConsistent).toBe(true);
    expect(number?.value).toBe('ZZ00000001234');
    expect(number?.note?.en).toContain('optional-data');
  });
});

// ---------------------------------------------------------------------------
// A defect, located
// ---------------------------------------------------------------------------

describe('a corrupted check digit', () => {
  it('names the field that failed and leaves the others reading clean', () => {
    // Line 2, column 20 is the date-of-birth check digit on a TD3.
    const report = check('td3', 2, 20, '5');

    expect(report.selfConsistent).toBe(false);
    expect(checkNamed(report, 'Date of birth')).toBe(false);
    expect(checkNamed(report, 'Document number')).toBe(true);
    expect(checkNamed(report, 'Date of expiry')).toBe(true);
  });

  it('locates the defect to a line and a column', () => {
    const report = check('td3', 2, 20, '5');
    const located = report.failures.filter((f) => f.line !== undefined);

    expect(located.length).toBeGreaterThan(0);
    expect(located.some((f) => f.line === 2 && f.column === 20)).toBe(true);
    // The engine's own message, shown verbatim: it names the field, the
    // characters it covers and both numbers.
    expect(located[0]?.message).toContain('date of birth');
    expect(located[0]?.message).toContain('800101');
  });

  it('points at a different field when a different digit is wrong', () => {
    // The same corruption one field over. If the report named the same field
    // both times, the location would be decoration rather than a finding.
    const dob = check('td3', 2, 20, '5');
    const documentNumber = check('td3', 2, 10, '1');

    expect(checkNamed(dob, 'Date of birth')).toBe(false);
    expect(checkNamed(dob, 'Document number')).toBe(true);

    expect(checkNamed(documentNumber, 'Document number')).toBe(false);
    expect(checkNamed(documentNumber, 'Date of birth')).toBe(true);
  });

  it('reports the composite digit alongside, because it covers the same characters', () => {
    const report = check('td3', 2, 20, '5');

    expect(checkNamed(report, 'Composite — the whole zone')).toBe(false);
    // Two findings, not one collapsed verdict: the reader needs to know the
    // composite failure is a consequence rather than a second transcription
    // error to hunt for.
    expect(report.failures).toHaveLength(2);
  });

  it('never repairs a character', () => {
    // A parser that "fixes" a 0 into an O produces a document number belonging
    // to somebody else.
    const report = runMrzCheck(pasted('td3').replace('ZZ00000000', 'ZZO0000000'), REFERENCE);
    const number = report.fields.find((f) => f.key === 'documentNumber');

    expect(number?.value).toBe('ZZO000000');
    expect(report.selfConsistent).toBe(false);
  });
});

describe('input the reader gets wrong in other ways', () => {
  it('normalises whitespace and case without touching the characters', () => {
    const lines = specimen('td3');
    const messy = `  ${lines[0]?.toLowerCase() ?? ''}  \n\n ${lines[1] ?? ''} \n`;

    const report = runMrzCheck(messy, REFERENCE);
    expect(report.selfConsistent).toBe(true);
    expect(report.lines).toEqual(lines);
  });

  it('reports a geometry it cannot recognise rather than guessing at one', () => {
    const report = runMrzCheck('NOT<AN<MRZ<AT<ALL', REFERENCE);

    expect(report.format).toBeNull();
    expect(report.formatName).toBeNull();
    expect(report.fields).toEqual([]);
    expect(report.failures.length).toBeGreaterThan(0);
    expect(report.failures[0]?.code.en).toContain('Doc 9303');
  });

  it('reports empty input as nothing to read', () => {
    const report = runMrzCheck('   ', REFERENCE);

    expect(report.selfConsistent).toBe(false);
    expect(report.failures.map((f) => f.code.en)).toEqual(['Nothing to read']);
  });

  it('turns a refusal from the engine into a rendered failure, not a blank page', () => {
    // Cast deliberately: the branded constructor would reject this, and the
    // point is what happens when a future caller does not use it.
    const report = runMrzCheck(pasted('td3'), 'not-a-date' as IsoDate);

    expect(report.selfConsistent).toBe(false);
    expect(report.failures).toHaveLength(1);
    expect(report.failures[0]?.message.length).toBeGreaterThan(0);
    expect(report.format).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// The century convention
// ---------------------------------------------------------------------------

describe('the two-digit year', () => {
  it('resolves against the reference date, not against a hard-coded pivot', () => {
    // Doc 9303 writes a year as two digits and does not say which century it
    // belongs to. Meridian slides the window with the reference date, which is
    // an implementation convention and is surfaced as one.
    const now = check('td3');
    const later = runMrzCheck(pasted('td3'), isoDate('2081-01-01'));

    expect(now.fields.find((f) => f.key === 'dateOfBirth')?.value).toBe('1980-01-01');
    expect(later.fields.find((f) => f.key === 'dateOfBirth')?.value).toBe('2080-01-01');
    expect(now.resolvedADate).toBe(true);
  });

  it('shows the characters as printed beside the resolved reading', () => {
    // The resolved date is a convention; the six characters are the document.
    const dob = check('td3').fields.find((f) => f.key === 'dateOfBirth');

    expect(dob?.printed).toBe('800101');
    expect(dob?.value).toBe('1980-01-01');
  });

  it('carries the reference date into the report so the reading is reproducible', () => {
    expect(check('td3').referenceDate).toBe(REFERENCE);
  });
});

// ---------------------------------------------------------------------------
// The instrument
// ---------------------------------------------------------------------------

describe('the citation this tool applies', () => {
  it('names the instrument and records when a human last read it', () => {
    expect(ICAO_9303_CITATION.instrument).toContain('ICAO Doc 9303');
    expect(ICAO_9303_CITATION.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(ICAO_9303_CITATION.jurisdiction).toBe('INT');
  });

  it('records no URL rather than guessing a canonical one', () => {
    // A wrong canonical link teaches a reader to stop checking, which costs
    // more than the missing convenience.
    expect(ICAO_9303_CITATION.url).toBeUndefined();
    expect(ICAO_9303_CITATION.provision).toBeUndefined();
    expect(ICAO_9303_CITATION.note).toContain('has not been re-read');
  });
});

// ---------------------------------------------------------------------------
// The specimens themselves
// ---------------------------------------------------------------------------

describe('the synthetic specimens', () => {
  it('are issued by nobody and named SPECIMEN', () => {
    for (const spec of MRZ_SPECIMENS) {
      const text = specimenText(spec);
      expect(text).toContain('SPECIMEN');
      expect(text).toContain('ZZZ');
    }
  });

  it('verify clean without having been copied from a real document', () => {
    // The check digits were computed from the fabricated fields. A specimen
    // that failed its own arithmetic would be one somebody had edited by hand.
    for (const spec of MRZ_SPECIMENS) {
      expect(runMrzCheck(specimenText(spec), REFERENCE).selfConsistent).toBe(true);
    }
  });
});
