export function pluralizeMeasurement(
  quantity: number,
  measurement: string
): string {
  if (quantity <= 1) {
    return measurement;
  }
  const nonPluralUnits = ['whole', 'quarter'];
  if (nonPluralUnits.includes(measurement)) {
    return measurement;
  }

  if (measurement === 'half') {
    return 'halves';
  }

  if (!measurement.endsWith('s')) {
    return measurement + 's';
  }

  return measurement;
}
