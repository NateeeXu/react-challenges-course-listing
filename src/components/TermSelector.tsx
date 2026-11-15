export const terms = ['Fall', 'Winter', 'Spring'] as const;
export type Term = (typeof terms)[number];

interface TermSelectorProps {
  selectedTerm: Term;
  onSelect: (term: Term) => void;
}

export function TermSelector({ selectedTerm, onSelect }: TermSelectorProps) {
  return (
    <fieldset className="arcade-terms">
      <legend>Term</legend>
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
          <span>{term}</span>
        </label>
      ))}
    </fieldset>
  );
}
