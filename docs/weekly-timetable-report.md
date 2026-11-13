# Learning Report — Weekly timetable

Name: Xiance Xu

Task: Weekly timetable (custom extension)

## Learning goals

Learn how to turn meeting times into blocks on a weekly calendar.

## Specification

Add a Weekly timetable view to Course plan. Show selected courses by day and time for one term at a time. List courses with TBA times below the grid and allow horizontal scrolling on small screens.

## Plan

Filter the selected courses by term, parse their meeting days and times, and create a block for each meeting day. Use the start time to place each block and the duration to set its height.

## Resources

- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout)
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)

## Commit — core code (AI-assisted)

```ts
const termCourses = courses.filter(([, course]) => course.term === term)
  .map(([id, course]) => ({ id, course, meeting: parseMeeting(course.meets) }));
```

## GenAI Output tab — Prompt

Use the contents of `weekly-timetable.md` as the prompt.

## GenAI Output tab — Output

The AI reused the conflict detector's parser and generated a block for each meeting day. The position and size use minutes since midnight.

```tsx
style={{
  top: (start - startHour * minutesPerHour) * pixelsPerHour / minutesPerHour,
  height: (end - start) * pixelsPerHour / minutesPerHour,
  left: `calc(${column * 100 / columnEnds.length}% + 2px)`,
  width: `calc(${100 / columnEnds.length}% - 4px)`,
}}
```

## Consult

The AI used the same time parser for conflict checking and the timetable. It also gave overlapping meetings their own columns in case a course time changes after someone saves their plan.

## Ask

How can we make a weekly calendar easy to read on a phone when several courses meet close together?

## Integration summary

The extra work was handling TBA courses and making the grid scroll on small screens. I also learned how converting times to minutes makes it easier to place and size each block.
