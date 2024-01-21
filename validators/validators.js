export function areInputFieldsNumeric(...inputFields) {
  return inputFields.every(inputField => Number.isFinite(inputField));
}

export function areInputFieldsPositive(...inputFields) {
  return inputFields.every(inputField => inputField > 0);
}
