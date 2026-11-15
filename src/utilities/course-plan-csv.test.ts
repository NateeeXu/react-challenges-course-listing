import { describe, expect, it } from 'vitest';
import { formatCoursePlanCsv } from './course-plan-csv';

describe('formatCoursePlanCsv', () => {
  it('exports selected courses from different terms, escaping titles and retaining TBA', () => {
    const csv = formatCoursePlanCsv([
      { term: 'Fall', number: '101', title: 'Computing, "then and now"\n计算机', meets: 'MWF 9:00-9:50' },
      { term: 'Winter', number: '399-1', title: 'Independent study', meets: '' },
    ]);

    expect(csv).toBe([
      '"Term","Course","Title","Meeting time"',
      '"Fall","CS 101","Computing, ""then and now""\n计算机","MWF 9:00-9:50"',
      '"Winter","CS 399-1","Independent study","TBA"',
      '',
    ].join('\r\n'));
  });

  it.each(['=1+1', ' +2', '-3', '@text', '＝1', '\ttext'])('prefixes formula-like title %j with a text marker', (title) => {
    const csv = formatCoursePlanCsv([{ term: 'Spring', number: '101', title, meets: '' }]);
    expect(csv).toContain(`"'${title}"`);
  });
});
