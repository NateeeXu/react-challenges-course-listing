import './App.css';
import { TermPage } from './components/TermPage';
import { useSchedule } from './hooks/useSchedule';
import { AuthBanner } from './components/AuthBanner';

const App = () => {
  const { schedule, isLoading, error } = useSchedule();

  if (error) {
    return (
      <main className="course-page">
        <AuthBanner />
        <p className="status-message">Error loading courses: {error.message}</p>
      </main>
    );
  }

  if (isLoading || !schedule) {
    return (
      <main className="course-page">
        <AuthBanner />
        <p className="status-message">Loading courses…</p>
      </main>
    );
  }

  const courseCount = Object.keys(schedule.courses).length;

  return (
    <main className="course-page arcade-page">
      <div className="arcade-topbar">
        <div className="arcade-brand">
          <span className="arcade-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          CS Scheduler
        </div>
        <AuthBanner />
      </div>
      <header className="arcade-hero">
        <div className="arcade-intro">
          <p className="arcade-catalog"><span aria-hidden="true" />{schedule.title}</p>
          <h1>Course <em>Arcade</em></h1>
          <p className="arcade-lead">Press a key to add a course to your plan.</p>
          <p className="arcade-total">
            <span>{courseCount}</span>{courseCount === 1 ? ' total course' : ' total courses'}
          </p>
        </div>
        <img className="arcade-art" src="/course-arcade-comic.jpg" alt="" width="1672" height="941" />
      </header>

      <TermPage courses={schedule.courses} />
    </main>
  );
};

export default App;
