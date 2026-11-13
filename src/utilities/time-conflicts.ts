interface ScheduledCourse {
  term: string;
  meets: string;
}

export const meetingDays = { M: 'Monday', Tu: 'Tuesday', W: 'Wednesday', Th: 'Thursday', F: 'Friday' } as const;

interface Meeting {
  days: string[];
  start: number;
  end: number;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function parseMeeting(meets: string): Meeting | null {
  const match = /^((?:Tu|Th|M|W|F)+)\s+((?:[01]?\d|2[0-3]):[0-5]\d)-((?:[01]?\d|2[0-3]):[0-5]\d)$/.exec(meets.trim());
  if (!match) return null;
  const start = toMinutes(match[2]);
  const end = toMinutes(match[3]);
  if (start >= end) return null;
  return { days: match[1].match(/Tu|Th|M|W|F/g) ?? [], start, end };
}

export function coursesConflict(first: ScheduledCourse, second: ScheduledCourse) {
  if (first.term !== second.term) return false;

  const firstMeeting = parseMeeting(first.meets);
  const secondMeeting = parseMeeting(second.meets);
  return Boolean(firstMeeting && secondMeeting &&
    firstMeeting.days.some((day) => secondMeeting.days.includes(day)) &&
    firstMeeting.start < secondMeeting.end && secondMeeting.start < firstMeeting.end);
}
