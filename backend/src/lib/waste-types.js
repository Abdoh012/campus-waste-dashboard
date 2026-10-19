/**
 * The three material streams a station is expected to separate.
 *
 * This is an optional classification on a container, not a sensor reading:
 * `fillLevel` remains the device's single percentage. Legacy containers that
 * predate this field keep `wasteType: null`.
 */
export const WASTE_TYPES = Object.freeze({
  PAPER: 'paper',
  PLASTIC: 'plastic',
  LIQUIDS: 'liquids',
});

export const WASTE_TYPE_VALUES = Object.freeze(Object.values(WASTE_TYPES));

/** True only for the exact supported strings. */
export function isWasteType(value) {
  return WASTE_TYPE_VALUES.includes(value);
}

/** Return a supported value, or null for missing/malformed legacy data. */
export function normalisedWasteType(value) {
  return isWasteType(value) ? value : null;
}
