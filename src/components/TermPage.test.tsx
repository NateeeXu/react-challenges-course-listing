import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TermPage } from './TermPage';

const courses = {
  F101: { term: 'Fall', number: '101', title: 'Fall course', meets: 'MWF 9:00' },
  F102: { term: 'Fall', number: '102', title: 'Another fall course', meets: 'MWF 11:00' },
  W201: { term: 'Winter', number: '201', title: 'Winter course', meets: 'MWF 10:00' },
  S301: { term: 'Spring', number: '301', title: 'Spring course', meets: 'MWF 11:00' },
};

describe('TermPage', () => {
  it('shows Fall by default and switches courses when a term is selected', () => {
    render(<TermPage courses={courses} />);

    expect((screen.getByRole('radio', { name: 'Fall' }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText('Fall course')).toBeTruthy();
    expect(screen.queryByText('Winter course')).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: 'Winter' }));
    expect((screen.getByRole('radio', { name: 'Winter' }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText('Winter course')).toBeTruthy();
    expect(screen.queryByText('Fall course')).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: 'Spring' }));
    expect(screen.getByText('Spring course')).toBeTruthy();
    expect(screen.queryByText('Winter course')).toBeNull();
  });

  it('selects multiple courses, keeps selections across terms, and unselects a course', () => {
    render(<TermPage courses={courses} />);

    const fall101 = screen.getByRole('button', { name: /Select CS 101/ });
    const fall102 = screen.getByRole('button', { name: /Select CS 102/ });
    expect(fall101.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(fall101);
    fireEvent.click(fall102);
    expect(screen.getByText('2 selected')).toBeTruthy();
    expect(fall101.getAttribute('aria-pressed')).toBe('true');
    expect(fall102.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('radio', { name: 'Winter' }));
    fireEvent.click(screen.getByRole('button', { name: /Select CS 201/ }));
    expect(screen.getByText('3 selected')).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: 'Fall' }));
    expect(screen.getByRole('button', { name: /Select CS 101/ }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /Select CS 101/ }));
    expect(screen.getByText('2 selected')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Select CS 101/ }).getAttribute('aria-pressed')).toBe('false');
  });
});
