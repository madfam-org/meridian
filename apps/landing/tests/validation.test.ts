/**
 * Reading a date out of a field, and attaching a complaint to the control it
 * belongs to.
 *
 * The whole reason this module exists rather than `new Date(value)` is in its
 * header: `new Date('2026-02-30')` rolls silently to 1 March, and
 * `new Date('2026-07-25')` is midnight UTC, which is 2026-07-24 in Mexico City.
 * Either one moves a ninety-day stay by a day. So the tests below are mostly
 * about *refusal*: the shapes this must not accept, and the fact that an issue
 * always names a field a keyboard user can reach.
 */

import { describe, expect, it } from 'vitest';

import { collect, issue, issueFor, messageFor, readDateField } from '@/lib/validation';
import { bi } from '@/lib/i18n';

describe('reading a civil date', () => {
  it('accepts a zero-padded calendar date', () => {
    expect(readDateField('f', '2026-07-25')).toEqual({ date: '2026-07-25', issue: null });
  });

  it('accepts 29 February in a leap year', () => {
    expect(readDateField('f', '2024-02-29').date).toBe('2024-02-29');
  });

  it('refuses 29 February in a common year rather than rolling it forward', () => {
    // `new Date('2026-02-29')` is 1 March. That is the defect this module exists
    // to prevent, and it is a whole day of somebody's allowance.
    const read = readDateField('f', '2026-02-29');
    expect(read.date).toBeNull();
    expect(read.issue?.message.en).toContain('not a calendar date');
  });

  it('refuses 30 February', () => {
    expect(readDateField('f', '2026-02-30').date).toBeNull();
  });

  it('refuses a month that does not exist', () => {
    expect(readDateField('f', '2026-13-01').date).toBeNull();
  });

  it('refuses an unpadded date, because YYYY-MM-DD is what the control emits', () => {
    expect(readDateField('f', '2026-7-25').date).toBeNull();
  });

  it('refuses a timestamp, a compact date and free text', () => {
    for (const raw of ['2026-07-25T00:00:00Z', '20260725', '25/07/2026', 'today', 'yesterday']) {
      expect(readDateField('f', raw).date, raw).toBeNull();
    }
  });

  it('trims surrounding whitespace rather than rejecting a pasted value', () => {
    expect(readDateField('f', '  2026-07-25  ').date).toBe('2026-07-25');
  });

  it('quotes the offending text back, in both languages', () => {
    const read = readDateField('f', '2026-02-30');
    expect(read.issue?.message.en).toContain('2026-02-30');
    expect(read.issue?.message.es).toContain('2026-02-30');
    expect(read.issue?.message.es).not.toBe(read.issue?.message.en);
  });
});

describe('absent is not invalid', () => {
  it('returns no date and no complaint for a blank optional field', () => {
    expect(readDateField('f', '')).toEqual({ date: null, issue: null });
    expect(readDateField('f', '   ')).toEqual({ date: null, issue: null });
  });

  it('complains about a blank required field, and says what shape it wants', () => {
    const read = readDateField('f', '', { required: true });
    expect(read.date).toBeNull();
    expect(read.issue?.fieldId).toBe('f');
    expect(read.issue?.message.en).toContain('YYYY-MM-DD');
    expect(read.issue?.message.es).toContain('AAAA-MM-DD');
  });

  it('treats `required: false` the same as an omitted option', () => {
    expect(readDateField('f', '', { required: false })).toEqual({ date: null, issue: null });
  });
});

describe('every complaint names a control', () => {
  it('carries the DOM id it was asked about', () => {
    expect(readDateField('sch-stay-1-start', 'nonsense', { required: true }).issue?.fieldId).toBe(
      'sch-stay-1-start',
    );
  });

  it('returns the first message for a field and no more', () => {
    // A stack of messages under one input is a stack a screen reader walks
    // through before reaching the control.
    const issues = [
      issue('a', bi('first', 'primero')),
      issue('a', bi('second', 'segundo')),
      issue('b', bi('other', 'otro')),
    ];
    expect(issueFor('a', issues)?.en).toBe('first');
    expect(issueFor('b', issues)?.en).toBe('other');
    expect(issueFor('c', issues)).toBeUndefined();
  });

  it('resolves a message to the served locale, and only that half', () => {
    const issues = [issue('a', bi('Enter a date', 'Introduzca una fecha'))];
    expect(messageFor('a', issues, 'en')).toBe('Enter a date');
    expect(messageFor('a', issues, 'es')).toBe('Introduzca una fecha');
    expect(messageFor('missing', issues, 'en')).toBeUndefined();
  });
});

describe('collecting optional complaints', () => {
  it('drops the nulls and keeps declaration order', () => {
    const a = issue('a', bi('A', 'A'));
    const b = issue('b', bi('B', 'B'));
    expect(collect([null, a, null, b, null])).toEqual([a, b]);
  });

  it('returns an empty list rather than null when nothing is wrong', () => {
    expect(collect([null, null])).toEqual([]);
  });
});
