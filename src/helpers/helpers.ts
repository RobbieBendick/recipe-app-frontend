export function pluralizeMeasurement(
  quantity: number,
  measurement: string
): string {
  if (quantity <= 1) {
    return measurement;
  }

  // Units that don't pluralize (abbreviations and special cases)
  const nonPluralUnits = [
    'lb',
    'pound',
    'pounds',
    'oz',
    'ounce',
    'ounces',
    'ml',
    'milliliter',
    'milliliters',
    'l',
    'liter',
    'liters',
    'g',
    'gram',
    'grams',
    'kg',
    'kilogram',
    'kilograms',
    'ct',
    'count',
    'fl oz',
    'fluid ounce',
    'fluid ounces',
    'tsp',
    'teaspoon',
    'teaspoons',
    'tbsp',
    'tablespoon',
    'tablespoons',
    'whole',
    'quarter',
  ];

  // Check if it's a non-plural unit (case-insensitive)
  const measurementLower = measurement.toLowerCase();
  if (nonPluralUnits.some(unit => unit.toLowerCase() === measurementLower)) {
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
