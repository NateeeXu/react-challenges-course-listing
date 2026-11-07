import { z } from 'zod';

export const personalPlanSchema = z.object({
  selectedCourseIds: z.array(z.string().min(1)).max(500)
    .refine((ids) => new Set(ids).size === ids.length, 'Duplicate course IDs.'),
  revision: z.number().int().min(1).max(2147483647),
}).strict();

export interface PersonalPlan {
  selectedCourseIds: string[];
  revision: number;
}

export const emptyPersonalPlan = (): PersonalPlan => ({ selectedCourseIds: [], revision: 0 });

export const parsePersonalPlan = (value: unknown): PersonalPlan => {
  const result = personalPlanSchema.safeParse(value);
  if (!result.success) throw new Error('Your saved plan contains invalid data.');
  return result.data;
};
