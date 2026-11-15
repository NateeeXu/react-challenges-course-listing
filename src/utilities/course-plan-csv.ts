import type { Course } from '../types/course';

function csvCell(value: string) {
  // Spreadsheet apps can interpret a title that starts with a formula marker.
  const text = /^(?:\s*[=+\-@＝＋－＠]|[\t\r\n])/u.test(value) ? `'${value}` : value;
  return `"${text.replaceAll('"', '""')}"`;
}

export function formatCoursePlanCsv(courses: Course[]) {
  const rows = [
    ['Term', 'Course', 'Title', 'Meeting time'],
    ...courses.map((course) => [course.term, `CS ${course.number}`, course.title, course.meets || 'TBA']),
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function downloadCoursePlan(courses: Course[]) {
  // The UTF-8 marker helps spreadsheet apps recognize non-ASCII titles.
  const file = new Blob(['\uFEFF', formatCoursePlanCsv(courses)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'course-plan.csv';
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
