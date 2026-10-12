# Term Filters

Add an interactive term filter to the existing CS course schedule. Let the user
choose Fall, Winter, or Spring with radio buttons. Fall should be selected when
the page first loads. When a different term is selected, immediately show only
the courses for that term without fetching the schedule again.

Create a `TermSelector` component for the radio buttons and a `TermPage`
component that keeps track of the selected term and displays the filtered
courses. Keep the existing course cards and responsive layout. Make the
selected option clear and ensure the controls can be used with a keyboard.
