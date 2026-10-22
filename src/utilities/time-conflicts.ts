interface ScheduledCourse {
  term: string;
  meets: string;
}

interface Meeting {
  days: string[];
  start: number;
  end: number;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function parseMeeting(meets: string): Meeting {
  const [days, times] = meets.trim().split(/\s+/);
  const [start, end] = times.split('-').map(toMinutes);
  return { days: days.match(/Tu|Th|M|W|F/g) ?? [], start, end };
}

function shareDay(first: Meeting, second: Meeting) {
  return first.days.some((day) => second.days.includes(day));
}

function overlapInTime(first: Meeting, second: Meeting) {
  return first.start < second.end && second.start < first.end;
}

export function coursesConflict(first: ScheduledCourse, second: ScheduledCourse) {
  if (first.term !== second.term || !first.meets.trim() || !second.meets.trim()) {
    return false;
  }

  const firstMeeting = parseMeeting(first.meets);
  const secondMeeting = parseMeeting(second.meets);
  return shareDay(firstMeeting, secondMeeting) && overlapInTime(firstMeeting, secondMeeting);
}
