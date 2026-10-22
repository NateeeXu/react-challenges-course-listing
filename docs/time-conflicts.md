# Catch Time Conflicts

Prevent selecting a course when it overlaps with an already selected course.
Two courses conflict only when they are in the same term, share at least one
meeting day, and their time intervals overlap. Treat Tu and Th as different
days. Times use a 24-hour clock. Courses with empty meeting times never
conflict, and back-to-back classes are allowed.

Mark conflicting cards clearly and disable selecting them. Selected courses
must remain removable. Recalculate availability immediately when selections
change, while keeping the existing term filter and course plan pop-up.

Put the calculation in a separate utility module with short, named helpers.
Keep only selected course IDs in state and derive which courses are unavailable.
