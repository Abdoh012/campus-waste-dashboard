/**
 * Domain models for the sign-in feature.
 *
 * These describe the sign-in form's own state — the credential fields the
 * operator fills in, the per-field validation messages, and the submit status.
 * They are plain data contracts with no UI or network concerns, so the form
 * components and any future auth service can depend on them without a cycle.
 *
 * Nothing here authenticates. The app is frontend-only and runs on mock data;
 * these types only shape the form the operator sees.
 */

/** The credential fields on the sign-in form. */
export type LoginField = 'email' | 'password';

/** Per-field validation messages, keyed by field. Absent key = no error. */
export type LoginErrors = Partial<Record<LoginField, string>>;

/** Sign-in submit status. `idle` is the resting form; `submitting` is in flight. */
export type LoginStatus = 'idle' | 'submitting';
