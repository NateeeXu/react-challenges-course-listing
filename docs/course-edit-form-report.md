# Learning report draft — Course form

These answers describe the AI-assisted implementation in this repository. Adjust the learning/reflection statements to match your own experience. No separate pre-AI code was supplied, so the core code below should not be described as an independent pre-AI attempt.

## Learning goals

Learn how to use React forms and routes to open an edit page with a course's existing data.

## Specification

Add an Edit link to each course card. Open a separate page with the course title and meeting times prefilled. Allow typing, but do not save anything. Add Cancel to discard the edits and return to the course list. Keep my selected term and courses.

## Plan

Use a route containing the course ID to open the right form. Store input values in local state and update them with onChange. Prevent form submission, and use Cancel to return to the list without changing the original data.

## Resources

- [Forms in React](https://courses.cs.northwestern.edu/394/guides/react-examples.html#forms)
- [React Router — Routing](https://reactrouter.com/start/declarative/routing)

## Commit — core code, AI-assisted

These are the relevant state and form lines from CourseEditPage.tsx, with visual styling omitted:

```tsx
const [title, setTitle] = useState(course.title);
const [meets, setMeets] = useState(course.meets);
const navigate = useNavigate();

<form onSubmit={(event) => event.preventDefault()}>
  <label>
    Course title
    <input value={title} onChange={(event) => setTitle(event.target.value)} />
  </label>
  <label>
    Meeting times
    <input value={meets} onChange={(event) => setMeets(event.target.value)} />
  </label>
  <button type="button" onClick={() => navigate('/')}>Cancel</button>
</form>
```

## GenAI Output tab — Prompt

Use the contents of [course-edit-form.md](./course-edit-form.md), the implementation specification recorded for this task.

## GenAI Output tab — Output

The AI generated CourseEditPage.tsx, added an Edit link to CourseCard, and set up React Router. The form uses local state and prevents default submission. It also added tests for prefilled values, Cancel, preserved selections, and invalid course links.

Relevant routing code:

```tsx
<Route path="/" element={courseList} />
<Route path="/courses/:courseId/edit" element={<CourseEditPage courses={courses} />} />

const { courseId } = useParams();
const course = courseId && Object.hasOwn(courses, courseId) ? courses[courseId] : undefined;
```

Include the form excerpt above too if the output field needs the input-handling code.

## Consult

The AI kept the form's draft separate from the original course data. It also kept the list state above the route switch, so returning from the form does not clear my selections. These details made the form fit the existing app.

## Ask

How could I warn users before they leave a form with unsaved changes?

## Integration summary

The extra work was making sure Edit did not also select a course and Cancel did not reset my selections. I also learned how local form state lets users change inputs without changing the original course data.

## Verification notes

- Production build: passed.
- Automated tests: 26 passed.
- Changed files: passed ESLint with the repository's unavailable `react-hooks/react-compiler` rule disabled for this check only. The existing lint configuration was not changed.
- Full `npm run lint` remains blocked by that pre-existing rule configuration.
- Dependency audit reports existing warnings in Firebase and build-related dependencies; dependency upgrades were not part of this task.
- Browser check: edit fields prefill, allow typing, do not submit on Enter, and Cancel discards the draft while retaining selections.
- Firebase Hosting: deployed to [the course scheduler](https://xiance-cs392-courses-2026.web.app/); the edit route also works after refreshing its direct URL.
- Saving and validation are intentionally not implemented in this challenge.
