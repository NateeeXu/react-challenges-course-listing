import { z } from 'zod';
import { courseSchema } from './course.ts';

export const scheduleDocumentId = 'CS-2018-2019';

export const scheduleSchema = z.object({
  title: z.string().trim().min(1),
  courses: z.record(z.string(), courseSchema),
  // Firestore orders map keys; retain the original JSON's display order explicitly.
  courseOrder: z.array(z.string()).optional(),
});

export type Schedule = Pick<z.infer<typeof scheduleSchema>, 'title' | 'courses'>;

export const parseSchedule = (value: unknown): Schedule => {
  const result = scheduleSchema.safeParse(value);
  if (!result.success) throw new Error('The course schedule contains invalid data.');

  const { title, courses, courseOrder = [] } = result.data;
  const orderedIds = [...new Set([...courseOrder, ...Object.keys(courses)])];
  return {
    title,
    courses: Object.fromEntries(
      orderedIds.filter((id) => Object.hasOwn(courses, id)).map((id) => [id, courses[id]]),
    ),
  };
};
