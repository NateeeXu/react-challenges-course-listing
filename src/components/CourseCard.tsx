export interface Course {
  courseid: string;
  name: string;
  subject: string;
  time: string;
  location: string;
}

interface CourseCardProps {
  course: Course;
}

export const CourseCard = ({ course }: CourseCardProps) => (
  <article className="course-card">
    <div className="course-card-heading">
      <p className="course-number">{course.courseid}</p>
      <h3>{course.name}</h3>
    </div>
    <dl className="course-details">
      <div>
        <dt>Meeting time</dt>
        <dd>{course.time}</dd>
      </div>
      <div>
        <dt>Location</dt>
        <dd>{course.location}</dd>
      </div>
    </dl>
  </article>
);