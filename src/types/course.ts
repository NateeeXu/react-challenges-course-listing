import { z } from 'zod';

export const courseTerms = ['Fall', 'Winter', 'Spring', 'Summer'] as const;

const meetingTimeError = (value: string): string | undefined => {
  if (value === '') return;

  const match = /^((?:Tu|Th|M|W|F)+) +((?:[01]?\d|2[0-3]):[0-5]\d)-((?:[01]?\d|2[0-3]):[0-5]\d)$/.exec(value);
  if (!match || match[0] !== value) {
    return 'Use days and a 24-hour start-end time, e.g., MWF 12:00-13:20, or leave blank for TBA.';
  }

  const days = match[1].match(/Tu|Th|M|W|F/g) ?? [];
  if (new Set(days).size !== days.length) {
    return 'Use each meeting day only once (M, Tu, W, Th, F).';
  }

  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  if (toMinutes(match[2]) >= toMinutes(match[3])) {
    return 'The start time must be earlier than the end time.';
  }
};

export const courseSchema = z.object({
  title: z.string().trim().min(2, 'Course title must have at least 2 characters.'),
  term: z.enum(courseTerms, { error: 'Choose Fall, Winter, Spring, or Summer.' }),
  number: z.string().regex(/^\d+(?:-\d+)?$(?![\s\S])/, 'Use a course number such as 213 or 213-2.'),
  meets: z.string().superRefine((value, context) => {
    const message = meetingTimeError(value);
    if (message) context.addIssue({ code: 'custom', message });
  }),
});

export type Course = z.infer<typeof courseSchema>;
// Form inputs may contain invalid strings while the user is editing them.
export type CourseDraft = Record<keyof Course, string>;
export type CourseErrors = Partial<Record<keyof Course, { type: 'validation'; message: string }>>;

interface CourseResolution {
  values: Course | Record<string, never>;
  errors: CourseErrors;
}

// Adapt schema issues to field errors without tying the rules to a form library.
export const courseResolver = (values: CourseDraft): CourseResolution => {
  const result = courseSchema.safeParse(values);
  if (result.success) return { values: result.data, errors: {} };

  const errors: CourseErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof Course;
    if (Object.hasOwn(courseSchema.shape, field) && !errors[field]) {
      errors[field] = { type: 'validation', message: issue.message };
    }
  }
  return { values: {}, errors };
};
