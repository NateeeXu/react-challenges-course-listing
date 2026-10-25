import { Link } from 'react-router';

export interface Course {
  term: string;
  number: string;
  meets: string;
  title: string;
}

interface CourseCardProps {
  courseId: string;
  course: Course;
  selected: boolean;
  conflict: boolean;
  onToggle: () => void;
}

export const CourseCard = ({ courseId, course, selected, conflict, onToggle }: CourseCardProps) => (
  <article
    className={`relative flex h-full min-w-0 flex-col overflow-hidden rounded-md border px-5 pt-5 pb-5 transition-colors sm:px-6 sm:pt-6 sm:pb-5 ${
      selected
        ? 'border-[var(--accent)] bg-[#fff8f4]'
        : conflict
          ? 'border-[var(--line)] bg-[#edf0ee] opacity-60'
          : 'border-[var(--line)] bg-white'
    }`}
  >
    <button
      type="button"
      aria-label={`Select CS ${course.number}: ${course.title}${conflict ? ' (time conflict)' : ''}`}
      aria-pressed={selected}
      disabled={conflict && !selected}
      onClick={onToggle}
      className="absolute inset-0 z-10 cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed"
    />
    <span
      aria-hidden="true"
      className="absolute inset-y-0 left-0 w-[3px] bg-[var(--accent)]"
    />
    <div className="min-h-0 sm:min-h-[78px]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="m-0 text-xs font-bold tracking-wider text-[var(--accent)]">
          CS {course.number}
        </p>
        {selected && (
          <span className="text-xs font-bold text-[var(--accent)]" aria-hidden="true">
            ✓ Selected
          </span>
        )}
        {conflict && !selected && (
          <span className="text-xs font-bold text-[#9b3326]" aria-hidden="true">
            × Time conflict
          </span>
        )}
      </div>
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
    <Link
      to={`/courses/${encodeURIComponent(courseId)}/edit`}
      aria-label={`Edit CS ${course.number}: ${course.title}`}
      className="relative z-20 mt-4 self-start rounded px-2 py-1 text-sm font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      Edit course <span aria-hidden="true">↗</span>
    </Link>
  </article>
);
