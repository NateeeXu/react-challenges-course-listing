# Learning report draft — Form Validation

This draft describes the AI-assisted changes in this repository. Adjust the reflections to match what you actually learned. The code below is not a separate pre-AI attempt.

## Learning goals

Learn how to validate React form inputs and show helpful messages for invalid fields.

## Specification

Validate the course title, term, number, and meeting times. Require at least two characters in the title, a valid term, and a number such as 213-2. Allow blank meeting times or valid weekday and time ranges. Show errors beside the fields and clear them after correction. Keep Cancel and do not save changes yet.

## Plan

Define the rules in a Zod schema. Use a resolver to turn validation issues into field messages. Check the draft as the user edits, and show errors for fields they have changed or left.

## Resources

- [Form validation assignment](https://courses.cs.northwestern.edu/394/guides/react-challenges.html#add-validation)
- [Zod schemas and refinements](https://zod.dev/api)
- [Forms in React](https://courses.cs.northwestern.edu/394/guides/react-examples.html#forms)

## Commit — relevant code, AI-assisted

Core schema rules from `src/types/course.ts`:

```ts
title: z.string().trim().min(2, 'Course title must have at least 2 characters.'),
term: z.enum(courseTerms, { error: 'Choose Fall, Winter, Spring, or Summer.' }),
number: z.string().regex(/^\d+(?:-\d+)?$(?![\s\S])/, 'Use a course number such as 213 or 213-2.'),
meets: z.string().superRefine((value, context) => {
  const message = meetingTimeError(value);
  if (message) context.addIssue({ code: 'custom', message });
}),
```

These fields belong inside the `z.object(...)` in the source. `meetingTimeError` checks weekday tokens, duplicate days, time bounds, and start-before-end.

## GenAI Output tab — Prompt

Copy the specification from [form-validation.md](./form-validation.md).

## GenAI Output tab — Output

The AI added a shared course schema, a field-error resolver, term and course-number inputs, and inline validation messages. It also added schema tests and form-interaction tests.

Relevant resolver code:

```ts
const result = courseSchema.safeParse(values);
if (result.success) return { values: result.data, errors: {} };
```

Relevant form code:

```tsx
const { errors } = courseResolver(draft);
const errorFor = (field: keyof Course) => touched[field] ? errors[field]?.message : undefined;
```

The field component associates errors with inputs using `aria-invalid` and `aria-describedby`. Its helper and resolver definitions are available in the source files.

## Consult

The AI added more than simple format checks. It also checked repeated weekdays and whether the start time came before the end time. Keeping these rules in one schema made the form code easier to follow.

## Ask

When is it better to show validation errors: while typing, after leaving a field, or after clicking Submit?

## Integration summary

The main challenge was checking meeting times, since the format could look right but still contain an invalid time range. I also learned how a schema can turn several validation rules into helpful messages for individual fields.

## Implementation and verification notes

- This task retains the previous Cancel-only, unsaved-draft behavior. Validation does not write to Firebase.
- Zod 4.3.6 already existed in the lockfile; it was declared as a runtime dependency without upgrading it or adding a form library.
- Full automated suite: 97 tests passed. Production build passed.
- Changed-file lint passed with the pre-existing unavailable `react-hooks/react-compiler` rule disabled for that check only. The repository's lint configuration was not changed.
- Existing dependency audit warnings remain outside this task's scope.
