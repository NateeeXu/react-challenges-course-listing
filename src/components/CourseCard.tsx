export interface Course {
  term: string;
  number: string;
  meets: string;
  title: string;
}

interface CourseCardProps {
  course: Course;
}

export const CourseCard = ({ course }: CourseCardProps) => (
  <article className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-md border border-[var(--line)] bg-white px-5 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-5">
    <span
      aria-hidden="true"
      className="absolute inset-y-0 left-0 w-[3px] bg-[var(--accent)]"
    />
    <div className="min-h-0 sm:min-h-[78px]">
      <p className="mb-2 text-xs font-bold tracking-wider text-[var(--accent)]">
        CS {course.number}
      </p>
      <h3 className="font-serif text-[1.45rem] leading-[1.2] font-medium text-[var(--ink)]">
        {course.title}
      </h3>
    </div>
    <dl className="mt-auto grid gap-4 border-t border-[#e9eeeb] pt-4">
      <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
        <dt className="text-xs text-[var(--muted)]">Meeting time</dt>
        <dd className="m-0 text-sm leading-[1.4] font-semibold text-[var(--ink)]">
          {course.meets || 'TBA'}
        </dd>
      </div>
    </dl>
  </article>
);
