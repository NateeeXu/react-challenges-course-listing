import { useState } from 'react';
import { CourseCard, type Course } from './CourseCard';
import { TermSelector, type Term } from './TermSelector';
import { SchedulePopup } from './SchedulePopup';
import { coursesConflict } from '../utilities/time-conflicts';

interface TermPageProps {
  courses: Record<string, Course>;
}

export function TermPage({ courses }: TermPageProps) {
  const [selectedTerm, setSelectedTerm] = useState<Term>('Fall');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const visibleCourses = Object.entries(courses).filter(
    ([, course]) => course.term === selectedTerm,
  );
  const selectedCourses = Object.entries(courses).filter(
    ([id]) => selectedCourseIds.includes(id),
  );

  const toggleCourse = (id: string) => {
    setSelectedCourseIds((current) => {
      if (current.includes(id)) return current.filter((courseId) => courseId !== id);
      if (current.some((selectedId) => coursesConflict(courses[id], courses[selectedId]))) {
        return current;
      }
      return [...current, id];
    });
  };

  return (
    <div className="subject-list">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TermSelector selectedTerm={selectedTerm} onSelect={setSelectedTerm} />
        <div className="flex items-center gap-3">
          <p className="m-0 text-sm font-semibold text-[var(--ink)]" aria-live="polite">
            {selectedCourseIds.length} selected
          </p>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setIsPlanOpen(true)}
            className="cursor-pointer rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Course plan
          </button>
        </div>
      </div>
      <section className="subject-section" aria-labelledby="selected-term">
        <div className="subject-heading">
          <h2 id="selected-term">{selectedTerm}</h2>
          <span>{visibleCourses.length}</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] items-stretch gap-3.5">
          {visibleCourses.map(([id, course]) => {
            const selected = selectedCourseIds.includes(id);
            const conflict = !selected && selectedCourses.some(
              ([, selectedCourse]) => coursesConflict(course, selectedCourse),
            );
            return (
              <CourseCard
                key={id}
                course={course}
                selected={selected}
                conflict={conflict}
                onToggle={() => toggleCourse(id)}
              />
            );
          })}
        </div>
      </section>
      {isPlanOpen && (
        <SchedulePopup courses={selectedCourses} onClose={() => setIsPlanOpen(false)} />
      )}
    </div>
  );
}
