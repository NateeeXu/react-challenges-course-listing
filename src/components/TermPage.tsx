import { useState } from 'react';
import { CourseCard, type Course } from './CourseCard';
import { TermSelector, type Term } from './TermSelector';

interface TermPageProps {
  courses: Record<string, Course>;
}

export function TermPage({ courses }: TermPageProps) {
  const [selectedTerm, setSelectedTerm] = useState<Term>('Fall');
  const visibleCourses = Object.entries(courses).filter(
    ([, course]) => course.term === selectedTerm,
  );

  return (
    <div className="subject-list">
      <TermSelector selectedTerm={selectedTerm} onSelect={setSelectedTerm} />
      <section className="subject-section" aria-labelledby="selected-term">
        <div className="subject-heading">
          <h2 id="selected-term">{selectedTerm}</h2>
          <span>{visibleCourses.length}</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] items-stretch gap-3.5">
          {visibleCourses.map(([id, course]) => (
            <CourseCard key={id} course={course} />
          ))}
        </div>
      </section>
    </div>
  );
}
