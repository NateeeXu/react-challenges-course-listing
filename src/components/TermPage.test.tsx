import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TermPage } from './TermPage';

const courses = {
  F101: { term: 'Fall', number: '101', title: 'Fall course', meets: 'MWF 9:00' },
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
});
