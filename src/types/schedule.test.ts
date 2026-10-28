import { describe, expect, it } from 'vitest';
import { parseSchedule } from './schedule';

const course = { title: 'AI', term: 'Fall', number: '101', meets: 'MWF 9:00-10:00' };

describe('parseSchedule', () => {
  it('validates a stored schedule and preserves its original display order', () => {
    const schedule = parseSchedule({
      title: 'Sample schedule',
      courses: { F101: course, F110: { ...course, number: '110' } },
      courseOrder: ['F110', 'F101'],
    });
    expect(schedule.title).toBe('Sample schedule');
    expect(Object.keys(schedule.courses)).toEqual(['F110', 'F101']);
    expect(schedule.courses.F101).toEqual(course);
  });

  it('supports documents without explicit ordering', () => {
    expect(parseSchedule({ title: 'Sample', courses: { F101: course } }).courses).toEqual({ F101: course });
  });

  it('ignores deleted IDs, deduplicates ordering and appends newly added courses', () => {
    const schedule = parseSchedule({
      title: 'Sample',
      courses: { F101: course, F110: { ...course, number: '110' } },
      courseOrder: ['deleted', 'F110', 'F110'],
    });
    expect(Object.keys(schedule.courses)).toEqual(['F110', 'F101']);
  });

  it('allows a valid empty course list', () => {
    expect(parseSchedule({ title: 'Empty schedule', courses: {} }).courses).toEqual({});
  });

  it.each([
    null, {}, { title: 'Sample' }, { title: '', courses: {} },
    { title: 'Sample', courses: [] },
    { title: 'Sample', courses: { F101: { ...course, term: 'Autumn' } } },
    { title: 'Sample', courses: { F101: { ...course, meets: 'M 10:00-9:00' } } },
  ])('reports malformed database data: %j', (data) => {
    expect(() => parseSchedule(data)).toThrow('The course schedule contains invalid data.');
  });
});
