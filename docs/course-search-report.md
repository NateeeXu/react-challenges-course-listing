# Learning Report — Course search

Name: Xiance Xu

Task: Course search (custom extension)

## Learning goals

Learn how to use a controlled input to filter a list as someone types.

## Specification

Add a search box for course numbers and titles. Search within the active term, show the number of matches, and let users clear the search. Keep selected courses in the plan even when they are hidden by the filter.

## Plan

Store the search text in React state. Normalize the text, split it into keywords, and check each course in the current term. Show the filtered list and a message when there are no matches.

## Resources

- [React controlled inputs](https://react.dev/reference/react-dom/components/input)
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)

## Commit — core code (AI-assisted)

```tsx
const [query, setQuery] = useState('');
const termCourses = Object.entries(courses).filter(([, course]) => course.term === selectedTerm);
```

## GenAI Output tab — Prompt

Use the contents of `course-search.md` as the prompt.

## GenAI Output tab — Output

```ts
const keywords = query.toLowerCase().trim().replace(/\bcs(?=\d)/g, 'cs ').split(/\s+/).filter(Boolean);
const visibleCourses = termCourses.filter(([, course]) => {
  const searchableText = `cs ${course.number} ${course.title.toLowerCase()}`;
  return keywords.every((keyword) => searchableText.includes(keyword));
});
```

## Consult

The basic idea was to filter the list using the input. The AI version also handled searches like “CS110 intro” and kept the query when switching terms.

## Ask

If the catalog gets much larger, when should search move from the browser to the server?

## Integration summary

The extra work was checking that hiding a selected course didn't remove it from the plan. I also learned how a single search can match both the course number and words in its title.
