import './App.css';
import { CourseCard, type Course } from './components/CourseCard';

const courses: Course[] = [
  {
    courseid: 'CS 392',
    name: 'Rapid Prototyping',
    subject: 'Computer Science',
    time: 'Mon, Wed, Fri · 2:00–3:20 PM',
    location: 'Tech',
  },
  {
    courseid: 'CS 349',
    name: 'Machine Learning',
    subject: 'Computer Science',
    time: 'Tues, Thurs · 9:30–10:50 AM',
    location: 'Tech',
  },
  {
    courseid: 'EE 475',
    name: 'Machine Learning',
    subject: 'Electrical Engineering',
    time: 'Monday · 5:00–7:50 PM',
    location: 'Tech',
  },
];

const subjects = ['Computer Science', 'Electrical Engineering'];

const App = () => {
  const courseCount = courses.length;

  return (
    <main className="course-page">
      <header className="page-header">
        <p className="term-label">Course guide <span>Fall 2026</span></p>
        <div className="page-heading">
          <h1>Courses</h1>
          <p className="course-count">
            <span>{courseCount}</span>
            {courseCount === 1 ? ' course' : ' courses'}
          </p>
        </div>
        <p className="page-description">
          Your semester, organized by department.
        </p>
      </header>

      <div className="subject-list">
        {subjects.map((subject, index) => {
          const subjectCourses = courses.filter(
            (course) => course.subject === subject,
          );

          return (
            <section
              className="subject-section"
              key={subject}
              aria-labelledby={`subject-${index}`}
            >
              <div className="subject-heading">
                <h2 id={`subject-${index}`}>{subject}</h2>
                <span>{subjectCourses.length}</span>
              </div>
              <div className="course-grid">
                {subjectCourses.map((course) => (
                  <CourseCard key={course.courseid} course={course} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
};

export default App;