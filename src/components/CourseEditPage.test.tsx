import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { TermPage } from './TermPage';
import type { Course } from '../types/course';

const course = { title: 'AI', term: 'Fall', number: '213-2', meets: 'TuTh 14:00-15:20' } satisfies Course;
const renderEditor = (initialCourse: Course = course) => render(
  <MemoryRouter initialEntries={['/courses/F213-2/edit']}>
    <TermPage courses={{ 'F213-2': initialCourse }} />
  </MemoryRouter>,
);

describe('course form validation', () => {
  it('prefills all four fields and does not show errors before interaction', () => {
    renderEditor();
    expect((screen.getByLabelText('Course title') as HTMLInputElement).value).toBe('AI');
    expect((screen.getByLabelText('Term') as HTMLSelectElement).value).toBe('Fall');
    expect((screen.getByLabelText('Course number') as HTMLInputElement).value).toBe('213-2');
    expect((screen.getByLabelText('Meeting times') as HTMLInputElement).value).toBe('TuTh 14:00-15:20');
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('button', { name: /Submit|Save/i })).toBeNull();
  });

  it('shows accessible title feedback during typing and removes it after correction', () => {
    renderEditor();
    const title = screen.getByLabelText('Course title');
    fireEvent.change(title, { target: { value: 'X' } });
    expect(title.getAttribute('aria-invalid')).toBe('true');
    expect(title.getAttribute('aria-describedby')).toContain('course-title-error');
    expect(screen.getByText('Course title must have at least 2 characters.')).toBeTruthy();
    fireEvent.change(title, { target: { value: 'AI' } });
    expect(title.getAttribute('aria-invalid')).toBe('false');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('validates a prefilled invalid field on blur, without marking untouched fields', () => {
    renderEditor({ ...course, title: 'X' });
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.blur(screen.getByLabelText('Course title'));
    expect(screen.getByText('Course title must have at least 2 characters.')).toBeTruthy();
    expect(screen.getByLabelText('Meeting times').getAttribute('aria-invalid')).toBe('false');
  });

  it('validates the course number and term, including Summer', () => {
    renderEditor();
    const number = screen.getByLabelText('Course number');
    const term = screen.getByLabelText('Term');
    fireEvent.change(number, { target: { value: 'CS 213' } });
    fireEvent.change(term, { target: { value: '' } });
    expect(screen.getByText('Use a course number such as 213 or 213-2.')).toBeTruthy();
    expect(screen.getByText('Choose Fall, Winter, Spring, or Summer.')).toBeTruthy();
    fireEvent.change(number, { target: { value: '213-2' } });
    fireEvent.change(term, { target: { value: 'Summer' } });
    expect(screen.queryByRole('status')).toBeNull();
    expect((term as HTMLSelectElement).value).toBe('Summer');
  });

  it('checks format, duplicate days and chronological order, and accepts blank TBA', () => {
    renderEditor();
    const meets = screen.getByLabelText('Meeting times');
    fireEvent.change(meets, { target: { value: 'MWF 24:00-25:00' } });
    expect(screen.getByText(/Use days and a 24-hour/)).toBeTruthy();
    expect(meets.getAttribute('aria-describedby')).toBe('course-meets-help course-meets-error');
    fireEvent.change(meets, { target: { value: 'TuTu 9:00-10:00' } });
    expect(screen.getByText(/Use each meeting day only once/)).toBeTruthy();
    fireEvent.change(meets, { target: { value: 'TuTh 10:00-9:00' } });
    expect(screen.getByText('The start time must be earlier than the end time.')).toBeTruthy();
    fireEvent.change(meets, { target: { value: '' } });
    expect(screen.queryByRole('status')).toBeNull();
    expect(meets.getAttribute('aria-invalid')).toBe('false');
    fireEvent.change(meets, { target: { value: 'F 23:58-23:59' } });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('prevents submission and reveals errors without saving or changing routes', () => {
    renderEditor({ ...course, title: 'X', number: 'CS 213', meets: 'MWF' });
    const submit = new Event('submit', { bubbles: true, cancelable: true });
    fireEvent(screen.getByRole('form', { name: 'Edit course' }), submit);
    expect(submit.defaultPrevented).toBe(true);
    expect(screen.getAllByRole('status')).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'Edit course' })).toBeTruthy();
    expect(course.title).toBe('AI');
  });

  it('allows Cancel even with invalid data and reopens the original valid values', async () => {
    renderEditor();
    fireEvent.change(screen.getByLabelText('Course title'), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText('Term'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Course number'), { target: { value: '-' } });
    fireEvent.change(screen.getByLabelText('Meeting times'), { target: { value: 'invalid' } });
    expect(screen.getAllByRole('status')).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await screen.findByRole('link', { name: 'Edit CS 213-2: AI' });
    expect(screen.getByRole('heading', { name: 'AI' })).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'Edit CS 213-2: AI' }));
    await waitFor(() => expect((screen.getByLabelText('Term') as HTMLSelectElement).value).toBe('Fall'));
    expect((screen.getByLabelText('Course title') as HTMLInputElement).value).toBe('AI');
    expect(screen.queryByRole('status')).toBeNull();
  });
});
