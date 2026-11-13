import { useId } from 'react';
import type { Course } from '../types/course';
import { meetingDays, parseMeeting } from '../utilities/time-conflicts';
import type { Term } from './TermSelector';

interface WeeklyTimetableProps {
  courses: [string, Course][];
  term: Term;
}

const weekdays = Object.entries(meetingDays);
const minutesPerHour = 60;
const hoursPerDay = 24;
const pixelsPerHour = 76;

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / minutesPerHour);
  return `${String(hours).padStart(2, '0')}:${String(minutes % minutesPerHour).padStart(2, '0')}`;
}

export function WeeklyTimetable({ courses, term }: WeeklyTimetableProps) {
  const titleId = useId();
  const termCourses = courses.filter(([, course]) => course.term === term)
    .map(([id, course]) => ({ id, course, meeting: parseMeeting(course.meets) }));
  if (termCourses.length === 0) {
    return <p className="rounded-md border border-[var(--line)] bg-white p-5">No courses selected for {term}.</p>;
  }

  const meetings = termCourses.flatMap(({ id, course, meeting }) =>
    meeting ? [{ id, course, ...meeting }] : [],
  );
  const unscheduled = termCourses.filter(({ meeting }) => !meeting);
  const startHour = Math.floor(Math.min(hoursPerDay * minutesPerHour, ...meetings.map(({ start }) => start)) / minutesPerHour);
  const endHour = Math.ceil(Math.max(0, ...meetings.map(({ end }) => end)) / minutesPerHour);
  const hours = Array.from({ length: Math.max(0, endHour - startHour) }, (_, index) => startHour + index);

  return (
    <section aria-labelledby={titleId}>
      <h3 id={titleId} className="mb-3 font-serif text-xl">{term} weekly timetable</h3>
      {hours.length > 0 && (
        <p className="mb-2 text-xs text-[var(--muted)] min-[880px]:hidden">Scroll sideways to see all five days.</p>
      )}
      {hours.length > 0 && (
        <div
          role="region"
          aria-label={`${term} timetable grid, scroll horizontally to see all days`}
          tabIndex={0}
          className="overflow-x-auto rounded-lg border border-[var(--line)] bg-white focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          <div className="grid min-w-[46rem] grid-cols-[3.75rem_repeat(5,minmax(0,1fr))]">
            <div className="sticky left-0 z-10 border-b border-[var(--line)] bg-white p-2 text-center text-xs font-semibold text-[var(--muted)]">Time</div>
            {weekdays.map(([day, name]) => (
              <div key={day} className="border-b border-l border-[var(--line)] p-2 text-center text-xs font-semibold">{name}</div>
            ))}
            <div aria-hidden="true" className="sticky left-0 z-10 bg-white">
              {hours.map((hour) => (
                <div key={hour} style={{ height: pixelsPerHour }} className="border-b border-[var(--line)] px-2 py-1 text-right text-xs tabular-nums text-[var(--muted)] last:border-b-0">
                  {formatTime(hour * minutesPerHour)}
                </div>
              ))}
            </div>
            {weekdays.map(([day, name]) => {
              const dayMeetings = meetings.filter((meeting) => meeting.days.includes(day))
                .sort((first, second) => first.start - second.start);
              // Assign a separate column when catalog edits introduce overlapping meetings.
              const columnEnds: number[] = [];
              const blocks = dayMeetings.map((meeting) => {
                const availableColumn = columnEnds.findIndex((end) => end <= meeting.start);
                const column = availableColumn === -1 ? columnEnds.length : availableColumn;
                columnEnds[column] = meeting.end;
                return { ...meeting, column };
              });

              return (
                <ul key={day} aria-label={name} className="relative m-0 list-none border-l border-[var(--line)] p-0"
                  style={{ backgroundImage: 'linear-gradient(to bottom, transparent calc(100% - 1px), var(--line) 0)', backgroundSize: `100% ${pixelsPerHour}px` }}>
                  {blocks.map(({ id, course, start, end, column }) => {
                    const time = `${formatTime(start)}–${formatTime(end)}`;
                    return (
                      <li
                        key={id}
                        title={`CS ${course.number} · ${course.title} · ${time}`}
                        className="absolute overflow-hidden rounded border border-[#b5d0c4] bg-[#e5f1eb] px-1.5 text-xs leading-tight"
                        style={{
                          top: (start - startHour * minutesPerHour) * pixelsPerHour / minutesPerHour,
                          height: (end - start) * pixelsPerHour / minutesPerHour,
                          left: `calc(${column * 100 / columnEnds.length}% + 2px)`,
                          width: `calc(${100 / columnEnds.length}% - 4px)`,
                        }}
                      >
                        <p className="truncate pt-1 font-bold">CS {course.number}</p>
                        <p className="truncate tabular-nums">{time}</p>
                        <p className="truncate text-[var(--muted)]">{course.title}</p>
                      </li>
                    );
                  })}
                </ul>
              );
            })}
          </div>
        </div>
      )}
      {unscheduled.length > 0 && (
        <div className="mt-4 rounded-md border border-[var(--line)] bg-white p-4">
          <h4 className="mb-2 text-sm font-semibold">Meeting times TBA</h4>
          <ul className="grid list-none gap-2 p-0 text-sm text-[var(--muted)]">
            {unscheduled.map(({ id, course }) => <li key={id}>CS {course.number} · {course.title}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
