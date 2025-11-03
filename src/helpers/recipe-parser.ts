// Recipe Parser Utility
// Parses recipe text to extract ingredients and instructions

import { ingredientCostDB } from '../database/ingredient-costs';

export interface ParsedIngredient {
  quantity: number;
  measurement: string;
  name: string;
}

export interface ParsedRecipe {
  description?: string;
  ingredients: ParsedIngredient[];
  instructions: string[];
}

export class RecipeParser {
  // Common measurement units and their variations
  private static measurements = [
    'cup',
    'cups',
    'tablespoon',
    'tablespoons',
    'tbsp',
    'teaspoon',
    'teaspoons',
    'tsp',
    'pound',
    'pounds',
    'lb',
    'ounce',
    'ounces',
    'oz',
    'gram',
    'grams',
    'g',
    'kilogram',
    'kg',
    'liter',
    'l',
    'milliliter',
    'ml',
    'pint',
    'pints',
    'quart',
    'quarts',
    'gallon',
    'gallons',
    'stick',
    'sticks',
    'whole',
    'piece',
    'pieces',
    'can',
    'bottle',
    'package',
    'bag',
    'box',
    'jar',
    'container',
  ];

  // Common fractions and their decimal equivalents
  private static fractions: Record<string, number> = {
    '1/8': 0.125,
    '1/4': 0.25,
    '1/3': 0.333,
    '3/8': 0.375,
    '1/2': 0.5,
    '5/8': 0.625,
    '2/3': 0.667,
    '3/4': 0.75,
    '7/8': 0.875,
    // Unicode fractions
    '½': 0.5,
    '¼': 0.25,
    '¾': 0.75,
    '⅓': 0.333,
    '⅔': 0.667,
    '⅛': 0.125,
    '⅜': 0.375,
    '⅝': 0.625,
    '⅞': 0.875,
  };

  static parseRecipe(text: string): ParsedRecipe {
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    let description = '';
    let ingredients: ParsedIngredient[] = [];
    let instructions: string[] = [];

    let currentSection = 'description';
    const ingredientLines: string[] = [];
    const instructionLines: string[] = [];

    // Parse line by line to identify sections
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();

      // Check for section headers
      if (line.includes('ingredients:') || line.includes('ingredient:')) {
        currentSection = 'ingredients';
        continue;
      } else if (
        line.includes('instructions:') ||
        line.includes('instruction:') ||
        line.includes('directions:') ||
        line.includes('steps:')
      ) {
        currentSection = 'instructions';
        continue;
      }

      // Skip empty lines and section headers
      if (lines[i].length === 0) continue;

      // Collect content based on current section
      if (
        currentSection === 'description' &&
        !this.looksLikeIngredient(lines[i]) &&
        !this.looksLikeInstruction(lines[i])
      ) {
        if (description) description += ' ';
        description += lines[i];
      } else if (currentSection === 'ingredients') {
        ingredientLines.push(lines[i]);
      } else if (currentSection === 'instructions') {
        instructionLines.push(lines[i]);
      }
    }

    // If no explicit sections found, try to auto-detect
    if (ingredientLines.length === 0 && instructionLines.length === 0) {
      for (const line of lines) {
        if (this.looksLikeIngredient(line)) {
          ingredientLines.push(line);
        } else if (this.looksLikeInstruction(line)) {
          instructionLines.push(line);
        } else if (
          !description &&
          !this.looksLikeIngredient(line) &&
          !this.looksLikeInstruction(line)
        ) {
          if (description) description += ' ';
          description += line;
        }
      }
    }

    // Parse ingredients
    ingredients = ingredientLines
      .map(line => this.parseIngredient(line))
      .filter(ingredient => ingredient !== null) as ParsedIngredient[];

    // Parse instructions
    instructions = instructionLines
      .map(line => this.cleanInstruction(line))
      .filter(instruction => instruction.length > 0);

    console.log('Parsed ingredients:', ingredients);
    console.log('Parsed instructions:', instructions);

    return {
      description: description.trim(),
      ingredients,
      instructions,
    };
  }

  private static looksLikeIngredient(line: string): boolean {
    // Check if line looks like an ingredient (has quantity and measurement)
    const hasNumber = /\d/.test(line);
    const hasMeasurement = this.measurements.some(measurement =>
      line.toLowerCase().includes(measurement)
    );

    // Also check if it contains known ingredients from our database
    const allIngredients = ingredientCostDB.getAllIngredients();
    const hasKnownIngredient = allIngredients.some(
      ingredient =>
        line.toLowerCase().includes(ingredient.name.toLowerCase()) ||
        ingredient.name.toLowerCase().includes(line.toLowerCase())
    );

    // Check for common ingredient patterns even without measurements
    const hasCommonIngredientWords =
      /\b(flour|sugar|butter|eggs|vanilla|chocolate|salt|pepper|oil|milk|cream|cheese|chicken|beef|pork|fish|vegetable|fruit|herb|spice|extract|chips|soda|baking)\b/i.test(
        line
      );

    return (
      hasNumber &&
      (hasMeasurement || hasKnownIngredient || hasCommonIngredientWords)
    );
  }

  static parseIngredient(line: string): ParsedIngredient | null {
    try {
      // Remove bullet points, dashes, etc.
      const cleanLine = line.replace(/^[-•*▢]\s*/, '').trim();

      // Find quantity (number, fraction, or Unicode fraction)
      const quantityMatch = cleanLine.match(
        /^(\d+(?:\/\d+)?(?:\s+\d+\/\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])\s*/
      );
      if (!quantityMatch) return null;

      const quantityStr = quantityMatch[1];
      const quantity = this.parseQuantity(quantityStr);

      // Find measurement
      let measurement = '';
      let name = '';

      for (const measure of this.measurements) {
        const measureRegex = new RegExp(`\\b${measure}\\b`, 'i');
        if (measureRegex.test(cleanLine)) {
          measurement = measure;
          // Extract name after measurement
          const afterMeasure = cleanLine.replace(quantityStr, '').trim();
          const measureIndex = afterMeasure.toLowerCase().indexOf(measure);
          if (measureIndex !== -1) {
            name = afterMeasure.substring(measureIndex + measure.length).trim();
          }
          break;
        }
      }

      // If no measurement found, try to extract name directly
      if (!measurement) {
        const afterQuantity = cleanLine.replace(quantityStr, '').trim();
        name = afterQuantity;
        measurement = 'whole'; // Default to whole if no measurement
      }

      // Clean up name - remove parenthetical info
      name = name.replace(/\([^)]*\)/g, '').trim();
      name = name.replace(/^of\s+/, '').trim();

      // Try to fuzzy match with known ingredients
      const matchedIngredient = this.fuzzyMatchIngredient(name);
      if (matchedIngredient) {
        name = matchedIngredient;
      }

      return {
        quantity,
        measurement,
        name,
      };
    } catch (error) {
      console.error('Error parsing ingredient:', line, error);
      return null;
    }
  }

  private static fuzzyMatchIngredient(ingredientName: string): string | null {
    const allIngredients = ingredientCostDB.getAllIngredients();
    const normalizedName = ingredientName.toLowerCase().trim();

    // First try exact match
    for (const ingredient of allIngredients) {
      if (ingredient.name.toLowerCase() === normalizedName) {
        return ingredient.name;
      }
    }

    // Then try partial matches
    for (const ingredient of allIngredients) {
      const dbName = ingredient.name.toLowerCase();
      if (dbName.includes(normalizedName) || normalizedName.includes(dbName)) {
        return ingredient.name;
      }
    }

    // Try word-by-word matching for compound ingredients
    const nameWords = normalizedName.split(/\s+/);
    for (const ingredient of allIngredients) {
      const dbWords = ingredient.name.toLowerCase().split(/\s+/);
      const matchingWords = nameWords.filter(word =>
        dbWords.some(dbWord => dbWord.includes(word) || word.includes(dbWord))
      );

      if (matchingWords.length >= Math.min(2, nameWords.length)) {
        return ingredient.name;
      }
    }

    return null;
  }

  private static parseQuantity(quantityStr: string): number {
    // Clean the input string
    const cleanStr = quantityStr.trim();

    // Handle mixed numbers like "1 1/2" or "1 ½"
    const mixedMatch = cleanStr.match(/^(\d+)\s+(\d+\/\d+|[½¼¾⅓⅔⅛⅜⅝⅞])$/);
    if (mixedMatch) {
      const whole = parseInt(mixedMatch[1]);
      const fraction = this.fractions[mixedMatch[2]] || 0;
      return whole + fraction;
    }

    // Handle fractions (both regular and Unicode)
    if (this.fractions[cleanStr]) {
      return this.fractions[cleanStr];
    }

    // Handle decimals
    const decimal = parseFloat(cleanStr);
    if (!isNaN(decimal)) {
      return decimal;
    }

    return 1; // Default fallback
  }

  private static looksLikeInstruction(line: string): boolean {
    // Check if line looks like an instruction (numbered or starts with action words)
    const hasNumber = /^\d+\./.test(line);
    const hasActionWord =
      /^(preheat|mix|add|stir|beat|blend|bake|cook|heat|chop|cut|slice|dice|mince|sauté|fry|boil|simmer|roast|grill|broil|steam|blend|whisk|fold|knead|roll|spread|pour|drizzle|sprinkle|garnish|serve)/i.test(
        line
      );

    return hasNumber || hasActionWord;
  }

  private static cleanInstruction(line: string): string {
    // Remove step numbers (1., 2., etc.)
    let cleaned = line.replace(/^\d+\.\s*/, '');

    // Remove bullet points and dashes
    cleaned = cleaned.replace(/^[-•*▢]\s*/, '');

    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned.trim();
  }
}
