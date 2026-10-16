import { useState } from 'react';
import { CourseCard, type Course } from './CourseCard';
import { TermSelector, type Term } from './TermSelector';

interface TermPageProps {
  courses: Record<string, Course>;
}

export function TermPage({ courses }: TermPageProps) {
  const [selectedTerm, setSelectedTerm] = useState<Term>('Fall');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const visibleCourses = Object.entries(courses).filter(
    ([, course]) => course.term === selectedTerm,
  );

  const toggleCourse = (id: string) => {
    setSelectedCourseIds((current) =>
      current.includes(id)
        ? current.filter((courseId) => courseId !== id)
        : [...current, id],
    );
  };

  return (
    <div className="subject-list">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TermSelector selectedTerm={selectedTerm} onSelect={setSelectedTerm} />
        <p className="m-0 text-sm font-semibold text-[var(--ink)]" aria-live="polite">
          {selectedCourseIds.length} selected
        </p>
      </div>
      <section className="subject-section" aria-labelledby="selected-term">
        <div className="subject-heading">
          <h2 id="selected-term">{selectedTerm}</h2>
          <span>{visibleCourses.length}</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] items-stretch gap-3.5">
          {visibleCourses.map(([id, course]) => (
            <CourseCard
              key={id}
              course={course}
              selected={selectedCourseIds.includes(id)}
              onToggle={() => toggleCourse(id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
