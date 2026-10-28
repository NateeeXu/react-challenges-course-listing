import { describe, expect, it } from 'vitest';
import { courseResolver, courseSchema, courseTerms, type Course } from './course';

const course = { title: 'AI', term: 'Fall', number: '213-2', meets: 'MWF 12:00-13:20' } satisfies Course;

describe('courseSchema', () => {
  it.each(courseTerms)('accepts the %s term', (term) => {
    expect(courseSchema.safeParse({ ...course, term }).success).toBe(true);
  });

  it.each(['', 'fall', 'Autumn', 'Fall ', 2026, null])('rejects invalid term %j', (term) => {
    expect(courseSchema.safeParse({ ...course, term }).success).toBe(false);
  });

  it('accepts a two-character title and trims surrounding whitespace', () => {
    expect(courseSchema.parse({ ...course, title: ' AI ' }).title).toBe('AI');
  });

  it.each(['', 'X', '  ', ' X ', null, 12])('rejects invalid title %j', (title) => {
    expect(courseSchema.safeParse({ ...course, title }).success).toBe(false);
  });

  it.each(['101', '213-2', '396-12', '0'])('accepts course number %s', (number) => {
    expect(courseSchema.safeParse({ ...course, number }).success).toBe(true);
  });

  it.each(['', 'CS 213', '213-', '-213', '213-a', '213-2-1', '213.5', ' 213', '213\n', 213])('rejects invalid number %j', (number) => {
    expect(courseSchema.safeParse({ ...course, number }).success).toBe(false);
  });

  it.each(['', 'M 0:00-0:01', 'F 23:58-23:59', 'TuTh 14:00-15:20', 'MTuWThF 09:00-10:00', 'ThTu 9:00-9:50'])('accepts meeting time %j', (meets) => {
    expect(courseSchema.safeParse({ ...course, meets }).success).toBe(true);
  });

  it('accepts every nonempty subset of weekdays without requiring a fixed order', () => {
    const days = ['M', 'Tu', 'W', 'Th', 'F'];
    for (let subset = 1; subset < 2 ** days.length; subset += 1) {
      const selectedDays = days.filter((_, index) => subset & (1 << index));
      for (const dayString of [selectedDays.join(''), [...selectedDays].reverse().join('')]) {
        expect(courseSchema.safeParse({ ...course, meets: `${dayString} 9:00-10:00` }).success).toBe(true);
      }
    }
  });

  it.each([
    ' ', 'MWF', '9:00-10:00', 'MWF 9:00', 'T 9:00-10:00', 'Sat 9:00-10:00',
    'MM 9:00-10:00', 'TuTu 9:00-10:00', 'ThMTh 9:00-10:00',
    'M 24:00-25:00', 'M 23:00-24:00', 'M 9:60-10:00', 'M 9:00-10:60',
    'M 10:00-9:00', 'M 9:00-9:00', 'M 9:0-10:00', 'M 9:00 AM-10:00 AM',
    'M 9:00-10:00 extra', 'M 9:00-10:00\n', 'M\n9:00-10:00', null,
  ])('rejects illegal meeting time %j', (meets) => {
    expect(courseSchema.safeParse({ ...course, meets }).success).toBe(false);
  });

  it('does not coerce numbers into strings or accept missing course fields', () => {
    expect(courseSchema.safeParse({ title: 'AI' }).success).toBe(false);
    expect(courseSchema.safeParse(null).success).toBe(false);
  });
});

describe('courseResolver', () => {
  it('returns validated values and no field errors for a valid draft', () => {
    expect(courseResolver(course)).toEqual({ values: course, errors: {} });
  });

  it('maps errors to all four fields and returns no validated values for an invalid draft', () => {
    const result = courseResolver({ title: 'X', term: 'Autumn', number: 'CS 213', meets: 'M 10:00-9:00' });
    expect(result.values).toEqual({});
    expect(Object.keys(result.errors).sort()).toEqual(['meets', 'number', 'term', 'title']);
    expect(result.errors.meets?.message).toBe('The start time must be earlier than the end time.');
  });

  it('returns a helpful duplicate-day message', () => {
    expect(courseResolver({ ...course, meets: 'TuTu 9:00-10:00' }).errors.meets?.message).toContain('only once');
  });

  it('does not mutate the original draft when normalizing the title', () => {
    const draft = { ...course, title: ' AI ' };
    expect(courseResolver(draft).values.title).toBe('AI');
    expect(draft.title).toBe(' AI ');
  });
});
