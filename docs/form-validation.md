# Course form validation

Add validation to the existing routed course editor, keeping its current style and Cancel-only workflow.

## Rules

- Define a shared Zod schema and infer the Course type from it.
- Require a title with at least two non-whitespace characters after trimming surrounding whitespace.
- Accept only Fall, Winter, Spring, or Summer as the term.
- Require a string course number containing digits with an optional numeric section, such as 213 or 213-2. Do not coerce numeric input.
- Allow an empty meeting string for TBA. Otherwise require one or more weekday tokens (M, Tu, W, Th, F), no repeated days, and a 24-hour start-end timespan. Hours must be 0–23, minutes 00–59, and start must be strictly earlier than end. Day order is not restricted.

## Form behavior

- Prefill and allow editing all four fields: title, term, course number, and meeting times.
- Convert schema issues into field-specific errors with a reusable courseResolver function.
- Revalidate the local draft on change. Show errors for fields the user has changed or blurred; clear errors immediately after correction.
- Include helpful text next to invalid fields, error borders, aria-invalid, and associated error descriptions for assistive technology.
- Prevent default form submission. Do not add Submit, Save, database writes, or persistence in this task. Cancel must work even when the draft is invalid and must discard all edits.
- Preserve existing selections, term filters, time-conflict behavior, and the schedule popup.

## Implementation

Zod 4.3.6 was already installed as a transitive development dependency. Declare that same version as a direct runtime dependency because the browser now imports it. Keep the current controlled-input form instead of adding a form library. The resolver returns validated values or per-field errors for this form.

## Verification

Test schema boundaries, invalid and corrected field feedback, TBA, Summer, duplicate weekdays, equal/reversed times, and Cancel with invalid data. Run the full automated suite and production build, then verify the deployed editor on Firebase Hosting. Deploy only to xiance-cs392-courses-2026.

## References

- [Assignment](https://courses.cs.northwestern.edu/394/guides/react-challenges.html#add-validation)
- [Zod schemas](https://zod.dev/api)
- [Forms in React](https://courses.cs.northwestern.edu/394/guides/react-examples.html#forms)
