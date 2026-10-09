import './App.css';
import { CourseCard, type Course } from './components/CourseCard';
import { useJsonQuery } from './utilities/fetch';

interface Schedule {
  title: string;
  courses: Record<string, Course>;
}

const scheduleUrl =
  'https://courses.cs.northwestern.edu/394/guides/data/cs-courses.php';

const terms = ['Fall', 'Winter', 'Spring'];

const App = () => {
  const [schedule, isLoading, error] = useJsonQuery<Schedule>(scheduleUrl);

  if (error) {
    return (
      <main className="course-page">
        <p className="status-message">Error loading courses: {error.message}</p>
      </main>
    );
  }

  if (isLoading || !schedule) {
    return (
      <main className="course-page">
        <p className="status-message">Loading courses…</p>
      </main>
    );
  }

  const courses = Object.entries(schedule.courses);
  const courseCount = courses.length;

  return (
    <main className="course-page">
      <header className="page-header">
        <p className="term-label">Course guide <span>CS</span></p>
        <div className="page-heading">
          <h1>{schedule.title}</h1>
          <p className="course-count">
            <span>{courseCount}</span>
            {courseCount === 1 ? ' course' : ' courses'}
          </p>
        </div>
        <p className="page-description">
          Course schedule fetched live, organized by term.
        </p>
      </header>

      <div className="subject-list">
        {terms.map((term, index) => {
          const termCourses = courses.filter(
            ([, course]) => course.term === term,
          );

          return (
            <section
              className="subject-section"
              key={term}
              aria-labelledby={`term-${index}`}
            >
              <div className="subject-heading">
                <h2 id={`term-${index}`}>{term}</h2>
                <span>{termCourses.length}</span>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] items-stretch gap-3.5">
                {termCourses.map(([id, course]) => (
                  <CourseCard key={id} course={course} />
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
