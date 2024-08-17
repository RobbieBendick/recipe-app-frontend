export interface IRecipe {
  title: string;
  description: string;
  ingredients: Ingredient[];
}

export interface Ingredient {
  _id: number;
  title: string;
  quantity: number;
  measurement: MeasurementUnit;
}

export enum MeasurementUnit {
  LB = 'lb',
  OZ = 'oz',
  CAN = 'can',
  TEASPOON = 'teaspoon',
  TABLESPOON = 'tablespoon',
  CUP = 'cup',
  PINT = 'pint',
  QUART = 'quart',
  GALLON = 'gallon',
  MILLILITER = 'ml',
  LITER = 'l',
  GRAM = 'g',
  KILOGRAM = 'kg',
  WHOLE = 'whole',
  HALF = 'half',
  QUARTER = 'quarter',
}
