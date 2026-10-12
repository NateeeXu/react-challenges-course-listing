export const terms = ['Fall', 'Winter', 'Spring'] as const;
export type Term = (typeof terms)[number];

interface TermSelectorProps {
  selectedTerm: Term;
  onSelect: (term: Term) => void;
}

export function TermSelector({ selectedTerm, onSelect }: TermSelectorProps) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2 border-0 p-0">
      <legend className="mb-3 text-sm font-semibold text-[var(--muted)]">
        Choose a term
      </legend>
      {terms.map((term) => (
        <label key={term} className="cursor-pointer">
          <input
            className="peer sr-only"
            type="radio"
            name="term"
            value={term}
            checked={selectedTerm === term}
            onChange={() => onSelect(term)}
          />
          <span className="inline-block rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition-colors peer-checked:border-[var(--ink)] peer-checked:bg-[var(--ink)] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent)]">
            {term}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
