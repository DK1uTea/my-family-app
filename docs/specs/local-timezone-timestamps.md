# Spec: Local Timezone Timestamp Display

## Objective

Show timestamp values in the timezone of the viewer's browser/device while keeping API and database timestamp values as UTC instants.

## Assumptions

- ISO timestamps returned by the API represent actual UTC instants; `Z` must not be treated as Germany wall-clock time.
- No per-user timezone setting exists, so the browser/device timezone is the display timezone.
- Date-only values remain calendar dates using the existing UTC calendar representation.

## Scope

- In scope: shared timestamp formatting, date-time input/editing, timestamp detail display, greeting/last-login time, and the date/time convention in agent rules.
- Out of scope: date-only pickers/range filters and adding a stored user timezone preference.

## Behavior

- `formatDate(timestamp, format)` renders the timestamp's calendar date in the browser/device timezone.
- `formatCalendarDate(date, format)` renders a date-only value without timezone conversion.
- `formatDate(timestamp, format, true)` appends the local time.
- The date-time picker shows and edits local date/time, then returns a `Date` representing that instant.
- `toApiDate(date)` serializes the instant as an ISO UTC timestamp.
- Date-only picker and range behavior continues using UTC calendar dates.

## QA Coverage

- Update `tests/lib/date-utils.test.ts` so formatting is checked in a non-UTC timezone and serialization still produces the same UTC instant.
- Verify date-time picker local display, editing, and selected calendar day in a non-UTC timezone.
- Preserve the existing date-only picker/range expectations.

## Success Criteria

- A timestamp for 09:00 in Vietnam displays as the corresponding evening/night time for a viewer in the Americas.
- Editing and serializing that timestamp preserves the intended UTC instant.
- Date-only values do not shift to an adjacent calendar day.
- `pnpm typecheck` and `pnpm lint` pass; QA updates and runs the date utility/picker tests.
