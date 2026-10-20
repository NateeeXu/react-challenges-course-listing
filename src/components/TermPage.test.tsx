import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TermPage } from './TermPage';

const courses = {
  F101: { term: 'Fall', number: '101', title: 'Fall course', meets: 'MWF 9:00' },
  F102: { term: 'Fall', number: '102', title: 'Another fall course', meets: 'MWF 11:00' },
  W201: { term: 'Winter', number: '201', title: 'Winter course', meets: 'MWF 10:00' },
  S301: { term: 'Spring', number: '301', title: 'Spring course', meets: 'MWF 11:00' },
};

// jsdom does not implement the browser's native dialog methods.
const dialogMethods = ['showModal', 'close'] as const;
const originalMethods = dialogMethods.map((name) =>
  Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, name),
);

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) { this.setAttribute('open', ''); },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) { this.removeAttribute('open'); },
  });
});

afterAll(() => {
  dialogMethods.forEach((name, index) => {
    const original = originalMethods[index];
    if (original) Object.defineProperty(HTMLDialogElement.prototype, name, original);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  });
});

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

  it('explains an empty plan, keeps content clicks open, and closes with the Close button', () => {
    render(<TermPage courses={courses} />);
    fireEvent.click(screen.getByRole('button', { name: 'Course plan' }));

    const popup = screen.getByRole('dialog', { name: 'Course plan' });
    expect(within(popup).getByText('No courses selected yet.')).toBeTruthy();
    fireEvent.click(within(popup).getByText('No courses selected yet.'));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(within(popup).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('lists selected courses across terms and closes on outside click or Escape without clearing selections', () => {
    render(<TermPage courses={courses} />);
    fireEvent.click(screen.getByRole('button', { name: /Select CS 101/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'Winter' }));
    fireEvent.click(screen.getByRole('button', { name: /Select CS 201/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Course plan' }));

    const popup = screen.getByRole('dialog');
    expect(within(popup).getByText('Fall · CS 101')).toBeTruthy();
    expect(within(popup).getByText('Winter · CS 201')).toBeTruthy();
    expect(within(popup).getByText('Meeting time: MWF 9:00')).toBeTruthy();
    expect(within(popup).getByText('Winter course')).toBeTruthy();
    expect(within(popup).queryByText('Another fall course')).toBeNull();

    fireEvent.click(popup);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('2 selected')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Course plan' }));
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('2 selected')).toBeTruthy();
  });
});
