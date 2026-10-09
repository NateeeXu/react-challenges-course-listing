# Fetch Course Data

Update the course listing so the courses are no longer hard-coded in `App.tsx`.
Instead, fetch the course schedule JSON from
`https://courses.cs.northwestern.edu/394/guides/data/cs-courses.php` when the app loads.

The JSON has this shape:

```json
{
  "title": "CS Courses for 2018-2019",
  "courses": {
    "F101": { "term": "Fall", "number": "101", "meets": "MWF 11:00-11:50", "title": "..." }
  }
}
```

- Put the fetching logic in a reusable hook, `useJsonQuery(url)`, in `src/utilities/fetch.ts`,
  using `useEffect` + `useState` and returning `[data, isLoading, error]`.
- Show "Loading courses…" while fetching and an error message if the request fails.
- Display the schedule `title` as the page heading.
- Group the course cards by term (Fall, Winter, Spring) instead of subject.
- Update `CourseCard` to the new data shape: show `CS {number}`, `title`, and `meets`.
- Keep the existing Tailwind card styling and responsive grid.
