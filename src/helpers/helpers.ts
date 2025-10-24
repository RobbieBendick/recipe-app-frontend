export function pluralizeMeasurement(
  quantity: number,
  measurement: string
): string {
  if (quantity <= 1) {
    return measurement;
  }
  const nonPluralUnits = ['whole', 'quarter'];

  if (measurement === 'half') {
    return 'halves';
  }
  if (!nonPluralUnits.includes(measurement)) {
    return measurement + 's';
  }

  return measurement;
}
