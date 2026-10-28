import './App.css';
import { TermPage } from './components/TermPage';
import { useSchedule } from './hooks/useSchedule';

const App = () => {
  const { schedule, isLoading, error } = useSchedule();

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

  const courseCount = Object.keys(schedule.courses).length;

  return (
    <main className="course-page">
      <header className="page-header">
        <p className="term-label">Course guide <span>CS</span></p>
        <div className="page-heading">
          <h1>{schedule.title}</h1>
          <p className="course-count">
            <span>{courseCount}</span>
            {courseCount === 1 ? ' total course' : ' total courses'}
          </p>
        </div>
        <p className="page-description">
          Course schedule fetched live, organized by term.
        </p>
      </header>

      <TermPage courses={schedule.courses} />
    </main>
  );
};

export default App;
