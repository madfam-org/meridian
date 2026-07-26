/**
 * `lib/tools/validation.ts` — the field readers every tool shares.
 *
 * Two bugs are being prevented here and both are invisible until the arithmetic
 * is already wrong:
 *
 *  - A validator built on `new Date(value)` accepts `2026-02-30`, silently rolls
 *    it to 1 March, and rejects nothing a person would notice. One day is the
 *    difference between a lawful 90-day stay and an overstay.
 *  - `Number(raw)` accepts `1e3`, `0x10`, `Infinity` and the empty string. A day
 *    count that arrives as `1e3` is a day count nobody typed.
 *
 * The third property is not about parsing at all: every issue carries the DOM id
 * of the control it belongs to, because the error summary links to `#id` and an
 * error message with no field attached is one a keyboard user cannot reach.
 */

import { describe, expect, it } from 'vitest';

import { bi } from '@/lib/i18n';
import {
  collect,
  issue,
  issueFor,
  readDateField,
  readIntegerField,
  requireText,
} from '@/lib/tools/validation';

const FIELD_ID = 'some-control';

describe('reading a civil date', () => {
  it('rejects a day that does not exist rather than rolling it forward', () => {
    for (const value of ['2026-02-30', '2025-02-29', '2026-13-01', '2026-04-31', '2026-00-10']) {
      const result = readDateField(FIELD_ID, value);
      expect(result.date, `${value} was accepted`).toBeNull();
      expect(result.issue?.fieldId).toBe(FIELD_ID);
      expect(result.issue?.message.en).toContain(value);
    }
  });

  it('accepts a real leap day', () => {
    expect(readDateField(FIELD_ID, '2024-02-29').date).toBe('2024-02-29');
    expect(readDateField(FIELD_ID, '2000-02-29').date).toBe('2000-02-29');
  });

  it('rejects a shape that is not YYYY-MM-DD', () => {
    for (const value of ['25/07/2026', '2026-7-25', '20260725', 'today', '2026-07-25T00:00:00Z']) {
      expect(readDateField(FIELD_ID, value).date, `${value} was accepted`).toBeNull();
    }
  });

  it('distinguishes an absent field from an invalid one', () => {
    // The caller usually needs this: absent means the reader said nothing,
    // which is a legitimate state the engine reports as `unknown`.
    const absent = readDateField(FIELD_ID, '');
    expect(absent.date).toBeNull();
    expect(absent.issue).toBeNull();

    const required = readDateField(FIELD_ID, '', { required: true });
    expect(required.date).toBeNull();
    expect(required.issue?.fieldId).toBe(FIELD_ID);
  });

  it('treats a field holding only whitespace as blank', () => {
    expect(readDateField(FIELD_ID, '   ').issue).toBeNull();
    expect(readDateField(FIELD_ID, ' 2026-07-25 ').date).toBe('2026-07-25');
  });
});

describe('reading a whole number', () => {
  it('rejects everything JavaScript would coerce for you', () => {
    for (const value of ['1e3', '0x10', 'Infinity', '1.5', '1,000', '+7', ' 12 3', 'NaN']) {
      const result = readIntegerField(FIELD_ID, value);
      expect(result.value, `${value} was accepted`).toBeNull();
      expect(result.issue?.fieldId).toBe(FIELD_ID);
    }
  });

  it('accepts a plain integer, including zero and a negative one', () => {
    expect(readIntegerField(FIELD_ID, '0').value).toBe(0);
    expect(readIntegerField(FIELD_ID, '42').value).toBe(42);
    expect(readIntegerField(FIELD_ID, ' 7 ').value).toBe(7);
    expect(readIntegerField(FIELD_ID, '-3').value).toBe(-3);
  });

  it('applies bounds inclusively at both ends', () => {
    const bounded = (raw: string): number | null =>
      readIntegerField(FIELD_ID, raw, { min: 1, max: 365 }).value;

    expect(bounded('1')).toBe(1);
    expect(bounded('365')).toBe(365);
    expect(bounded('0')).toBeNull();
    expect(bounded('366')).toBeNull();
  });

  it('names the bound in the message, in both languages', () => {
    const low = readIntegerField(FIELD_ID, '0', { min: 1 }).issue;
    const high = readIntegerField(FIELD_ID, '131', { max: 130 }).issue;

    expect(low?.message.en).toContain('1');
    expect(low?.message.es).toContain('1');
    expect(high?.message.en).toContain('130');
    expect(high?.message.es).toContain('130');
  });

  it('distinguishes an absent field from an invalid one', () => {
    expect(readIntegerField(FIELD_ID, '').issue).toBeNull();
    expect(readIntegerField(FIELD_ID, '', { required: true }).issue?.fieldId).toBe(FIELD_ID);
  });
});

describe('requiring text', () => {
  it('measures blankness after trimming', () => {
    // A field containing three spaces is empty to everybody except `length`.
    expect(requireText(FIELD_ID, '   ')).not.toBeNull();
    expect(requireText(FIELD_ID, '')).not.toBeNull();
    expect(requireText(FIELD_ID, ' x ')).toBeNull();
  });

  it('carries the message the caller supplied', () => {
    const message = bi('Paste the lines.', 'Pegue las líneas.');
    expect(requireText(FIELD_ID, '', message)?.message).toBe(message);
  });
});

describe('joining issues up with controls', () => {
  it('shows one message per control, and it is the first', () => {
    // A stack of messages under a single input is noise a screen reader has to
    // walk through.
    const issues = [
      issue(FIELD_ID, bi('first', 'primero')),
      issue(FIELD_ID, bi('second', 'segundo')),
      issue('other', bi('elsewhere', 'en otro sitio')),
    ];

    expect(issueFor(FIELD_ID, issues)?.en).toBe('first');
    expect(issueFor('other', issues)?.en).toBe('elsewhere');
    expect(issueFor('absent', issues)).toBeUndefined();
  });

  it('collects in declaration order and drops the absences', () => {
    // The summary is read top to bottom, and a list that jumps around the form
    // is a list somebody works through twice.
    const a = issue('a', bi('a', 'a'));
    const b = issue('b', bi('b', 'b'));

    expect(collect([null, a, null, b, null])).toEqual([a, b]);
    expect(collect([])).toEqual([]);
    expect(collect([null, null])).toEqual([]);
  });

  it('authors every message in both languages', () => {
    const messages = [
      readDateField(FIELD_ID, 'nope').issue?.message,
      readDateField(FIELD_ID, '', { required: true }).issue?.message,
      readIntegerField(FIELD_ID, 'nope').issue?.message,
      readIntegerField(FIELD_ID, '5', { min: 6 }).issue?.message,
      readIntegerField(FIELD_ID, '5', { max: 4 }).issue?.message,
      requireText(FIELD_ID, '')?.message,
    ];

    for (const message of messages) {
      expect(message?.en.length).toBeGreaterThan(0);
      expect(message?.es.length).toBeGreaterThan(0);
      expect(message?.en).not.toBe(message?.es);
    }
  });
});
