import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import type { Course } from '../types/course';
import { loadCourseNote, maxCourseNoteLength, saveCourseNote } from '../services/course-notes';

interface CourseNotePageProps {
  courses: Record<string, Course>;
  uid: string | null;
  authLoading: boolean;
}

const secondaryButton = 'rounded-md border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[#f4f7f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]';

export function CourseNotePage({ courses, uid, authLoading }: CourseNotePageProps) {
  const { courseId } = useParams();
  if (authLoading) return <p role="status" className="status-message">Checking sign-in…</p>;
  if (!uid || !courseId || !Object.hasOwn(courses, courseId)) return (
    <section className="subject-list">
      <h2>{uid ? 'Course not found' : 'Sign in to write a course note'}</h2>
      <Link to="/" className="text-[var(--accent)] underline">Return to courses</Link>
    </section>
  );

  return <CourseNoteForm key={`${uid}:${courseId}`} uid={uid} courseId={courseId} course={courses[courseId]} />;
}

function CourseNoteForm({ uid, courseId, course }: { uid: string; courseId: string; course: Course }) {
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const [original, setOriginal] = useState('');
  const [draft, setDraft] = useState('');
  const [conflict, setConflict] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const changed = draft.trim() !== original;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    let active = true;
    void loadCourseNote(uid, courseId).then((text) => {
      if (!active) return;
      setOriginal(text);
      setDraft(text);
      setLoadState('ready');
    }, () => {
      if (active) setLoadState('error');
    });
    return () => { active = false; };
  }, [uid, courseId, retry]);

  return (
    <section className="pt-9" aria-labelledby="course-note-heading">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-[var(--line)] bg-white">
        <header className="border-b border-[var(--line)] px-6 py-6 sm:px-9">
          <p className="mb-2 text-xs font-bold tracking-wider text-[var(--accent)] uppercase">{course.term} · CS {course.number}</p>
          <h2 id="course-note-heading" ref={headingRef} tabIndex={-1} className="font-serif text-3xl focus:outline-none">My course note</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{course.title}</p>
        </header>
        {loadState === 'ready' ? (
          <form aria-labelledby="course-note-heading" className="grid gap-4 px-6 py-6 sm:px-9" onSubmit={async (event) => {
            event.preventDefault();
            if (!changed || draft.length > maxCourseNoteLength || savingRef.current) return;
            savingRef.current = true;
            setIsSaving(true);
            setSaveError('');
            setSavedMessage('');
            try {
              const result = await saveCourseNote(uid, courseId, original, draft);
              setOriginal(result.text);
              if (result.status === 'conflict') {
                setConflict(result.text);
              } else {
                setDraft(result.text);
                setConflict(null);
                setSavedMessage(result.text ? 'Note saved.' : 'Note cleared.');
              }
            } catch (error) {
              setSaveError(error instanceof Error ? error.message : 'Unable to save your note. Please try again.');
            } finally {
              savingRef.current = false;
              setIsSaving(false);
            }
          }}>
            <div>
              <label htmlFor="course-note" className="mb-2 block text-sm font-semibold">Note</label>
              <textarea id="course-note" rows={6} maxLength={maxCourseNoteLength}
                placeholder="Questions to ask, reminders, or why you’re considering this course"
                value={draft} readOnly={isSaving} aria-describedby="course-note-help"
                onChange={(event) => {
                  setDraft(event.target.value);
                  setSaveError('');
                  setSavedMessage('');
                }}
                className="w-full resize-y rounded-md border border-[var(--line)] bg-[#fafbf9] p-3 text-base focus-visible:outline-2 focus-visible:outline-[var(--accent)]" />
              <div className="mt-1 flex flex-wrap justify-between gap-1 text-xs text-[var(--muted)]">
                <p id="course-note-help">Private to your account. Save an empty note to clear it.</p>
                <p>{draft.length} / {maxCourseNoteLength}</p>
              </div>
            </div>
            {conflict !== null && (
              <div className="grid gap-2 rounded-md border border-[#edc7b6] bg-[#fff8f4] p-4 text-sm">
                <p role="alert" className="font-semibold">A newer saved note was found. Your draft is still above.</p>
                <p className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words">{conflict || 'The saved note is empty.'}</p>
                <button type="button" disabled={isSaving} className={`justify-self-start ${secondaryButton}`}
                  onClick={() => {
                    setDraft(conflict);
                    setConflict(null);
                    setSaveError('');
                  }}>Use saved note</button>
              </div>
            )}
            {saveError && <p role="alert" className="text-sm text-[#9b3326]">{saveError}</p>}
            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-4">
              <button type="submit" disabled={!changed || isSaving || draft.length > maxCourseNoteLength}
                className="rounded-md bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-50">
                {isSaving ? 'Saving…' : conflict !== null ? 'Replace saved note' : 'Save note'}
              </button>
              <Link to="/" className={secondaryButton}>Back to courses</Link>
              <p role="status" className="text-sm text-[var(--muted)]">{savedMessage}</p>
            </div>
          </form>
        ) : (
          <div className="grid justify-items-start gap-4 px-6 py-6 sm:px-9">
            {loadState === 'loading' ? <p role="status">Loading note…</p> : (
              <>
                <p role="alert" className="text-[#9b3326]">Unable to load your course note. Check your connection and try again.</p>
                <button type="button" className={secondaryButton} onClick={() => {
                  setLoadState('loading');
                  setRetry((count) => count + 1);
                }}>Retry</button>
              </>
            )}
            <Link to="/" className={secondaryButton}>Back to courses</Link>
          </div>
        )}
      </div>
    </section>
  );
}
