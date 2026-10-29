# Specification locations

Keep specifications with the code they describe:

- UI and frontend feature specs stay in `docs/specs/<feature>.md`.
- Backend domain specs live at `src/server/modules/<domain>/SPEC.md` beside that server
  module. For example, auth requirements belong in `src/server/modules/auth/SPEC.md`,
  while user profile requirements belong in `src/server/modules/users/SPEC.md`.
- Cross-cutting server architecture belongs in `src/server/SPEC.md`.

The spec-driven-development workflow applies in each location. A spec is the reviewed
contract for behavior and implementation; `README.md` files explain architecture and
navigation, not endpoint requirements.
