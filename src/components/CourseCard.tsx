import { Link } from 'react-router';
import type { Course } from '../types/course';
export type { Course } from '../types/course';

interface CourseCardProps {
  courseId: string;
  course: Course;
  canEdit: boolean;
  canTakeNotes: boolean;
  selected: boolean;
  conflict: boolean;
  selectionDisabled?: boolean;
  onToggle: () => void;
}

export const CourseCard = ({ courseId, course, canEdit, canTakeNotes, selected, conflict, selectionDisabled = false, onToggle }: CourseCardProps) => (
  <article className="course-key" data-selected={selected} data-conflict={conflict}>
    <button
      type="button"
      aria-label={`Select CS ${course.number}: ${course.title}${conflict ? ' (time conflict)' : ''}`}
      aria-pressed={selected}
      disabled={selectionDisabled || (conflict && !selected)}
      onClick={onToggle}
      className="keycap-press"
    />
    <div className="keycap-face">
      <div className="keycap-top">
        <p className="keycap-code">CS {course.number}</p>
        <span className="keycap-indicator" aria-hidden="true">{selected ? '✓' : conflict ? '×' : '↵'}</span>
      </div>
      <h3>{course.title}</h3>
      <dl className="keycap-meeting">
        <dt className="sr-only">Meeting time</dt>
        <dd><span aria-hidden="true" className="keycap-clock" />{course.meets || 'TBA'}</dd>
      </dl>
      {selected && <p className="keycap-state">✓ Selected</p>}
      {conflict && <p className="keycap-state">× Time conflict</p>}
      {(canTakeNotes || canEdit) && (
        <div className="keycap-actions">
          {canTakeNotes && <Link to={`/courses/${encodeURIComponent(courseId)}/note`}
            aria-label={`My note for CS ${course.number}: ${course.title}`}>My note</Link>}
          {canEdit && <Link to={`/courses/${encodeURIComponent(courseId)}/edit`}
            aria-label={`Edit CS ${course.number}: ${course.title}`}>Edit course <span aria-hidden="true">↗</span></Link>}
        </div>
      )}
    </div>
  </article>
);
