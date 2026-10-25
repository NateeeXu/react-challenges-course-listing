# Course edit form

Implement the course-form challenge in the existing React TypeScript app.

- Add an Edit course link to every card, including cards unavailable due to a time conflict.
- Open a separate route, `/courses/:courseId/edit`, with that course's title and meeting times prefilled in labeled text inputs.
- Let the user edit both fields using local React state.
- Include a Cancel button that returns to the course list and discards the draft.
- Do not add a Submit or Save button, validation, or database writes. Prevent the form's default submission so it does not reload or navigate.
- Keep the selected term, selected courses, schedule popup, and time-conflict behavior working when navigating back to the list.
- Retain the existing visual style and support narrow screens and keyboard access.
- Show a helpful message and return link if a course ID is missing from the schedule.
- Verify direct edit URLs and refreshes on Firebase Hosting, run automated tests and a production build, then commit, push, and deploy to `xiance-cs392-courses-2026`.

## References

- [Assignment](https://courses.cs.northwestern.edu/394/guides/react-challenges.html#add-edit-page)
- [Forms in React](https://courses.cs.northwestern.edu/394/guides/react-examples.html#forms)
- [React Router: routing](https://reactrouter.com/start/declarative/routing)

## Implementation note

This app uses React Router's declarative routes, rather than the TanStack file-based routing setup in the course examples. `TermPage` owns list state above its route switch, so opening the editor does not reset selections. Form state is a separate draft, keyed by course ID and never written to the fetched schedule.
