import { describe, expect, it } from 'vitest';
import { coursesConflict } from './time-conflicts';

describe('coursesConflict', () => {
  it.each([
    ['MWF 9:00-9:50', 'W 9:30-10:20', true],
    ['MWF 9:00-9:50', 'MWF 9:00-9:50', true],
    ['M 9:00-12:00', 'M 10:00-11:00', true],
    ['MWF 9:00-9:50', 'M 9:50-10:40', false],
    ['M 10:00-10:50', 'M 9:00-10:00', false],
    ['Tu 9:00-10:00', 'Th 9:00-10:00', false],
    ['TuTh 14:00-15:20', 'Th 15:00-16:00', true],
    ['MWF 9:00-10:00', 'TuTh 9:00-10:00', false],
    ['M 0:00-1:00', 'M 0:30-2:00', true],
    ['F 22:00-23:59', 'F 23:00-23:59', true],
    ['', 'MWF 9:00-10:00', false],
    ['MWF 9:00-10:00', '', false],
    ['', '', false],
  ])('%s versus %s gives %s', (first, second, expected) => {
    const a = { term: 'Fall', meets: first };
    const b = { term: 'Fall', meets: second };
    expect(coursesConflict(a, b)).toBe(expected);
    expect(coursesConflict(b, a)).toBe(expected);
  });

  it('allows identical meeting times in different terms', () => {
    expect(coursesConflict(
      { term: 'Fall', meets: 'MWF 9:00-10:00' },
      { term: 'Winter', meets: 'MWF 9:00-10:00' },
    )).toBe(false);
  });
});
