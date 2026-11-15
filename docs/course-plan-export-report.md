# Learning Report — Course plan CSV export

Name: Xiance Xu

Task: Course plan CSV export (custom extension)

## Learning goals

Learn how to turn React data into a file that users can download.

## Specification

Let users download their selected courses from all terms as a CSV file from the Course plan popup.

## Plan

Take the selected courses, create a row for each one, and escape the text before joining it into CSV. Use a Blob and a temporary download link to save the file.

## Resources

- [CSV format, RFC 4180](https://www.rfc-editor.org/rfc/rfc4180)
- [URL.createObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static)
- [URL.revokeObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static)

## Commit — core code (AI-assisted)

```tsx
<button
  type="button"
  onClick={() => downloadCoursePlan(courses.map(([, course]) => course))}
>
  Download all terms (CSV)
</button>
```

## GenAI Output tab — Prompt

Add a “Download all terms (CSV)” button to the Course plan popup. Export one row for each selected course across all terms, with columns for term, course number, title, and meeting time. Use TBA for courses without a meeting time. Generate the file in the browser, handle commas and quotes in titles, and treat formula-like values as text. Show the button once there is a course to export.

## GenAI Output tab — Output

```ts
export function formatCoursePlanCsv(courses: Course[]) {
  const rows = [
    ['Term', 'Course', 'Title', 'Meeting time'],
    ...courses.map((course) => [course.term, `CS ${course.number}`, course.title, course.meets || 'TBA']),
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
```

```ts
const file = new Blob(['\uFEFF', formatCoursePlanCsv(courses)], { type: 'text/csv;charset=utf-8' });
const url = URL.createObjectURL(file);
```

## Consult

The button passes the selected courses to a separate export function. The AI handled titles with commas or quotes and added a UTF-8 marker for spreadsheet compatibility.

## Ask

Why can a CSV open correctly in one spreadsheet app but show the wrong characters or columns in another?

## Integration summary

The main extra work was checking the downloaded file with courses from two terms. I also learned why CSV needs special handling for quotes and how a browser can generate the file locally.
