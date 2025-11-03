// Ingredient Constants
// Contains densities, conversions, and weights for ingredient calculations

export const INGREDIENT_DENSITIES: Record<string, number> = {
  // Flours and starches
  'all purpose flour': 120,
  flour: 120,
  'bread flour': 130,
  'cake flour': 115,
  'whole wheat flour': 120,
  cornstarch: 120,
  'cocoa powder': 85,

  // Sugars
  'granulated sugar': 200,
  sugar: 200,
  'brown sugar': 220,
  'powdered sugar': 120,
  'confectioners sugar': 120,
  honey: 340,
  'maple syrup': 320,

  // Fats and oils
  butter: 227,
  margarine: 227,
  'vegetable oil': 218,
  'olive oil': 218,
  'coconut oil': 218,

  // Dairy
  milk: 245,
  'heavy cream': 240,
  'sour cream': 240,
  yogurt: 245,

  // Nuts and seeds
  almonds: 140,
  walnuts: 100,
  pecans: 100,
  cashews: 140,
  peanuts: 150,
  'sesame seeds': 140,

  rice: 200,
  oats: 80,
  breadcrumbs: 60,
  'chocolate chips': 170,
  raisins: 150,
  coconut: 80,

  // Fruits - cup measurements
  strawberries: 150, // sliced strawberries
  blueberries: 150,
  raspberries: 120,
  blackberries: 150,
  grapes: 150,
  cherries: 150,
  bananas: 225, // sliced bananas
  apples: 125, // chopped apples
  oranges: 200, // orange segments
  lemons: 200, // lemon slices
  limes: 200, // lime slices
  peaches: 150, // sliced peaches
  pears: 150, // sliced pears
  plums: 150, // sliced plums
  pineapple: 200, // chopped pineapple
  mango: 200, // chopped mango
  avocado: 150, // mashed avocado
  kiwi: 150, // sliced kiwi

  // Additional fruits - cup measurements
  cranberries: 100, // fresh cranberries
  elderberries: 120, // fresh elderberries
  gooseberries: 120, // fresh gooseberries
  currants: 100, // fresh currants
  figs: 150, // chopped figs
  dates: 150, // chopped dates
  prunes: 150, // chopped prunes
  apricots: 150, // sliced apricots
  nectarines: 150, // sliced nectarines
  persimmons: 150, // chopped persimmons
  pomegranate: 150, // pomegranate seeds
  'passion fruit': 150, // passion fruit pulp
  'dragon fruit': 150, // cubed dragon fruit
  'star fruit': 150, // sliced star fruit
  papaya: 150, // cubed papaya
  guava: 150, // cubed guava

  // Condiments and spreads - cup measurements
  'peanut butter': 250, // creamy peanut butter
  jelly: 320, // grape jelly
  jam: 320, // strawberry jam
  'hot sauce': 240, // liquid hot sauce
  sriracha: 240, // sriracha sauce
  tabasco: 240, // tabasco sauce
  ketchup: 240, // tomato ketchup
  mustard: 240, // yellow mustard
  mayonnaise: 240, // real mayonnaise
  'ranch dressing': 240, // ranch salad dressing
  'italian dressing': 240, // italian salad dressing
  'balsamic vinegar': 240, // balsamic vinegar
  'apple cider vinegar': 240, // apple cider vinegar
  'white vinegar': 240, // distilled white vinegar
  'soy sauce': 240, // soy sauce
  'worcestershire sauce': 240, // worcestershire sauce
  'barbecue sauce': 240, // bbq sauce
  'teriyaki sauce': 240, // teriyaki sauce
  'buffalo sauce': 240, // buffalo wing sauce
  'chili sauce': 240, // sweet chili sauce
  'sweet and sour sauce': 240, // sweet and sour sauce
  'honey mustard': 240, // honey mustard dressing

  // Baking ingredients and extracts
  'vanilla extract': 240, // vanilla extract
  'almond extract': 240, // almond extract
  'lemon extract': 240, // lemon extract
  'mint extract': 240, // mint extract
  'orange extract': 240, // orange extract
  'baking powder': 220, // baking powder (grams per cup)
  'baking soda': 220, // baking soda (grams per cup)
  'cream of tartar': 200, // cream of tartar
  'active dry yeast': 100, // active dry yeast
  'instant yeast': 100, // instant yeast
  'bread yeast': 100, // bread yeast
  gelatin: 200, // unflavored gelatin
  'corn syrup': 320, // light corn syrup
  molasses: 320, // molasses
  'agave nectar': 320, // agave nectar
  'maple extract': 240, // maple extract
  'rum extract': 240, // rum extract
  'coconut extract': 240, // coconut extract
  'peppermint extract': 240, // peppermint extract
  'rose water': 240, // rose water
  'orange blossom water': 240, // orange blossom water

  // Spices and seasonings
  cinnamon: 120, // ground cinnamon
  nutmeg: 120, // ground nutmeg
  ginger: 120, // ground ginger
  cloves: 120, // ground cloves
  allspice: 120, // ground allspice
  cardamom: 120, // ground cardamom
  'pumpkin pie spice': 120, // pumpkin pie spice blend
  'apple pie spice': 120, // apple pie spice blend
  'chai spice': 120, // chai spice blend
  'poultry seasoning': 120, // poultry seasoning blend
  'italian seasoning': 120, // italian seasoning blend
  'herbs de provence': 120, // herbs de provence blend
  'garlic powder': 120, // garlic powder
  'onion powder': 120, // onion powder
  paprika: 120, // paprika
  'cayenne pepper': 120, // cayenne pepper
  'black pepper': 120, // ground black pepper
  'white pepper': 120, // ground white pepper
  'red pepper flakes': 120, // red pepper flakes
  oregano: 120, // dried oregano
  thyme: 120, // dried thyme
  rosemary: 120, // dried rosemary
  basil: 120, // dried basil
  parsley: 120, // dried parsley
  sage: 120, // dried sage
  'bay leaves': 120, // dried bay leaves
  dill: 120, // dried dill
  chives: 120, // dried chives
  tarragon: 120, // dried tarragon
  marjoram: 120, // dried marjoram
  'fennel seeds': 120, // fennel seeds
  cumin: 120, // ground cumin
  coriander: 120, // ground coriander
  turmeric: 120, // ground turmeric
  'curry powder': 120, // curry powder
  'chili powder': 120, // chili powder
  'smoked paprika': 120, // smoked paprika
  'chipotle powder': 120, // chipotle powder
  'ancho powder': 120, // ancho powder
  sumac: 120, // ground sumac
  "za'atar": 120, // za'atar spice blend
  berbere: 120, // berbere spice blend
  'garam masala': 120, // garam masala spice blend
  'five spice': 120, // chinese five spice blend
  'old bay': 120, // old bay seasoning
  'cajun seasoning': 120, // cajun seasoning blend
  'taco seasoning': 120, // taco seasoning blend
  'ranch seasoning': 120, // ranch seasoning blend
  'everything bagel seasoning': 120, // everything bagel seasoning
  furikake: 120, // furikake seasoning
  togarashi: 120, // togarashi seasoning
  'sichuan peppercorns': 120, // sichuan peppercorns
  'star anise': 120, // star anise
  'caraway seeds': 120, // caraway seeds
  'mustard seeds': 120, // mustard seeds
  'poppy seeds': 120, // poppy seeds
  'chia seeds': 120, // chia seeds
  'flax seeds': 120, // flax seeds
  'hemp seeds': 120, // hemp seeds
  'sunflower seeds': 120, // sunflower seeds
  'pumpkin seeds': 120, // pumpkin seeds
  'pine nuts': 120, // pine nuts
  hazelnuts: 120, // hazelnuts
  'macadamia nuts': 120, // macadamia nuts
  pistachios: 120, // pistachios
  'brazil nuts': 120, // brazil nuts
};

// Whole item measurement types
export const WHOLE_ITEM_MEASUREMENTS: string[] = [
  'whole',
  'piece',
  'pieces',
  'each',
  'item',
  'items',
  'ct',
  'stick',
  'sticks',
  'clove',
  'cloves',
  'head',
  'heads',
];

// Fraction measurements
export const FRACTION_MEASUREMENTS = [
  'half',
  'quarter',
  'third',
  'eighth',
  'sixteenth',
  'three-quarters',
  'two-thirds',
  'five-eighths',
  'seven-eighths',
  'three-eighths',
  'one-half',
  'one-quarter',
  'one-third',
  'one-eighth',
  'one-sixteenth',
];

// Fraction to decimal conversion
export const FRACTION_TO_DECIMAL: Record<string, number> = {
  half: 0.5,
  quarter: 0.25,
  third: 0.333,
  eighth: 0.125,
  sixteenth: 0.0625,
  'three-quarters': 0.75,
  'two-thirds': 0.667,
  'five-eighths': 0.625,
  'seven-eighths': 0.875,
  'three-eighths': 0.375,
  'one-half': 0.5,
  'one-quarter': 0.25,
  'one-third': 0.333,
  'one-eighth': 0.125,
  'one-sixteenth': 0.0625,
};

export const MEASUREMENT_CONVERSIONS: Record<string, number> = {
  // Weight conversions
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  lb: 453.592,
  pound: 453.592,
  pounds: 453.592,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,

  // Volume conversions (approximate for liquids)
  'fl oz': 29.5735, // 1 fl oz = ~29.57 ml, assuming 1ml = 1g for most liquids
  floz: 29.5735,
  'fluid ounce': 29.5735,
  'fluid ounces': 29.5735,

  // Volume conversions
  ml: 1, // Assuming 1ml = 1g for most liquids
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  cup: 240, // Default fallback
  cups: 240,
  tablespoon: 15, // Approximate
  tablespoons: 15,
  tbsp: 15,
  teaspoon: 5, // Approximate
  teaspoons: 5,
  tsp: 5,
  pint: 473.176,
  pints: 473.176,
  quart: 946.353,
  quarts: 946.353,
  gallon: 3785.41,
  gallons: 3785.41,
  gal: 3785.41,
  '1/2 gal': 1892.71,
  '1/4 gal': 946.353,

  // Count-based items (whole pieces)
  whole: 1, // Will be handled by ingredient-specific logic
  piece: 1,
  pieces: 1,
  each: 1,
  item: 1,
  items: 1,
  stick: 113.5, // 1 stick of butter = 113.5g (1/2 cup or 4 oz)
  sticks: 113.5,

  // reference the particular item to get the grams per count
  ct: 1,
  count: 1,
};

export const WHOLE_ITEM_WEIGHTS: Record<string, number> = {
  // Common whole items and their typical weights
  'large egg': 50,
  'medium egg': 44,
  'small egg': 38,
  egg: 45,
  eggs: 45,
  'extra large egg': 56,
  'jumbo egg': 63,

  // Fruits
  'large apple': 200,
  'medium apple': 150,
  'small apple': 100,
  'large banana': 150,
  'medium banana': 120,
  'small banana': 90,
  'large orange': 200,
  'medium orange': 150,
  'small orange': 100,
  'large lemon': 100,
  'medium lemon': 80,
  'small lemon': 60,
  'large lime': 80,
  'medium lime': 60,
  'small lime': 40,
  'large peach': 150,
  'medium peach': 120,
  'small peach': 90,
  'large pear': 200,
  'medium pear': 150,
  'small pear': 100,
  'large avocado': 200,
  'medium avocado': 150,
  'small avocado': 100,
  watermelon: 10000,

  // Vegetables
  'large onion': 200,
  'medium onion': 150,
  'small onion': 100,
  'large potato': 300,
  'medium potato': 200,
  'small potato': 100,
  'large tomato': 200,
  'medium tomato': 150,
  'small tomato': 100,
  'large carrot': 100,
  'medium carrot': 75,
  'small carrot': 50,
  'large bell pepper': 200,
  'medium bell pepper': 150,
  'small bell pepper': 100,
  'large cucumber': 300,
  'medium cucumber': 200,
  'small cucumber': 100,
  'large zucchini': 300,
  'medium zucchini': 200,
  'small zucchini': 100,

  // Proteins
  'large chicken breast': 200,
  'medium chicken breast': 150,
  'small chicken breast': 100,
  'large chicken thigh': 150,
  'medium chicken thigh': 100,
  'small chicken thigh': 75,
  'large chicken wing': 50,
  'medium chicken wing': 40,
  'small chicken wing': 30,
  'large salmon fillet': 200,
  'medium salmon fillet': 150,
  'small salmon fillet': 100,
  'large steak': 300,
  'medium steak': 200,
  'small steak': 150,
  'large pork chop': 200,
  'medium pork chop': 150,
  'small pork chop': 100,

  // Dairy
  'large stick butter': 113.5,
  'medium stick butter': 85,
  'small stick butter': 57,
  'large cheese block': 500,
  'medium cheese block': 250,
  'small cheese block': 125,

  // Bread and baked goods
  'large loaf bread': 500,
  'medium loaf bread': 400,
  'small loaf bread': 300,
  'large bagel': 100,
  'medium bagel': 80,
  'small bagel': 60,
  'large muffin': 100,
  'medium muffin': 80,
  'small muffin': 60,
  'large cookie': 30,
  'medium cookie': 20,
  'small cookie': 15,

  // Nuts and seeds
  'large walnut': 5,
  'medium walnut': 4,
  'small walnut': 3,
  'large almond': 2,
  'medium almond': 1.5,
  'small almond': 1,
  'large pecan': 3,
  'medium pecan': 2,
  'small pecan': 1.5,

  // Herbs and aromatics
  'large garlic clove': 5,
  'medium garlic clove': 3,
  'small garlic clove': 2,
  'large shallot': 50,
  'medium shallot': 30,
  'small shallot': 20,
  'large leek': 200,
  'medium leek': 150,
  'small leek': 100,

  // Miscellaneous
  'large marshmallow': 5,
  'medium marshmallow': 3,
  'small marshmallow': 2,
  'large olive': 5,
  'medium olive': 3,
  'small olive': 2,
  'large cherry': 5,
  'medium cherry': 3,
  'small cherry': 2,
  'large grape': 3,
  'medium grape': 2,
  'small grape': 1,
};

export const ALL_INGREDIENT_NAMES = [
  'white bread',
  'eggs',
  'egg',
  'whole milk',
  'all purpose flour',
  'granulated sugar',
  'butter',
  'cheddar cheese',
  'mozzarella cheese',
  'provolone cheese',
  'swiss cheese',
  'american cheese',
  'parmesan cheese',
  'chicken breast',
  'ground beef',
  'jasmine rice',
  'spaghetti pasta',
  'vegetable oil',
  'table salt',
  'black pepper',
  'yellow onions',
  'garlic',
  'tomatoes',
  'russet potatoes',
  'bananas',

  // Fruits
  'red apples',
  'oranges',
  'lemons',
  'limes',
  'strawberries',
  'blueberries',
  'raspberries',
  'blackberries',
  'grapes',
  'peaches',
  'pears',
  'plums',
  'cherries',
  'pineapple',
  'mango',
  'avocado',
  'kiwi',
  'cantaloupe',
  'watermelon',
  'honeydew melon',
  'cranberries',
  'blackberries',
  'elderberries',
  'gooseberries',
  'currants',
  'figs',
  'dates',
  'prunes',
  'apricots',
  'nectarines',
  'persimmons',
  'pomegranate',
  'passion fruit',
  'dragon fruit',
  'star fruit',
  'papaya',
  'guava',
  'coconut',
  'lime',
  'lemon',

  'brown sugar',
  'powdered sugar',
  'honey',
  'maple syrup',
  'olive oil',
  'coconut oil',
  'heavy cream',
  'sour cream',
  'yogurt',
  'almonds',
  'walnuts',
  'pecans',
  'cashews',
  'peanuts',
  'sesame seeds',
  'oats',
  'breadcrumbs',
  'chocolate chips',
  'raisins',
  'coconut',
  'cornstarch',
  'cocoa powder',
  'baking powder',
  'baking soda',
  'vanilla extract',
  'cinnamon',
  'nutmeg',
  'oregano',
  'basil',
  'thyme',
  'rosemary',
  'parsley',
  'cilantro',
  'ginger',
  'turmeric',
  'paprika',
  'cumin',
  'chili powder',
  'garlic powder',
  'onion powder',
  'red pepper flakes',
  'bay leaves',
  'dill',
  'sage',

  // Condiments and spreads
  'peanut butter',
  'jelly',
  'jam',
  'hot sauce',
  'sriracha',
  'tabasco',
  'ketchup',
  'mustard',
  'mayonnaise',
  'ranch dressing',
  'italian dressing',
  'balsamic vinegar',
  'apple cider vinegar',
  'white vinegar',
  'soy sauce',
  'worcestershire sauce',
  'barbecue sauce',
  'teriyaki sauce',
  'buffalo sauce',
  'chili sauce',
  'sweet and sour sauce',
  'honey mustard',
  'ranch seasoning',
  'taco seasoning',
  'italian seasoning',
  'garlic salt',

  // Proteins
  'salmon',
  'tilapia',
  'cod',
  'shrimp',
  'crab',
  'lobster',
  'tuna',
  'pork chops',
  'pork tenderloin',
  'bacon',
  'ham',
  'sausage',
  'turkey breast',
  'ground turkey',
  'lamb chops',
  'veal',

  // Vegetables
  'carrots',
  'celery',
  'bell peppers',
  'broccoli',
  'cauliflower',
  'spinach',
  'lettuce',
  'cabbage',
  'cucumber',
  'zucchini',
  'squash',
  'eggplant',
  'mushrooms',
  'asparagus',
  'green beans',
  'peas',
  'corn',
  'sweet potatoes',
  'beets',
  'radishes',
  'turnips',

  // Dairy alternatives
  'almond milk',
  'soy milk',
  'coconut milk',
  'oat milk',
  'rice milk',
  'vegan butter',
  'nutritional yeast',
  'tofu',
  'tempeh',

  // Grains and legumes
  'brown rice',
  'wild rice',
  'quinoa',
  'barley',
  'bulgur',
  'couscous',
  'black beans',
  'kidney beans',
  'chickpeas',
  'lentils',
  'split peas',
  'pinto beans',
  'navy beans',
  'lima beans',
  'black eyed peas',

  // Nuts and seeds
  'pumpkin seeds',
  'sunflower seeds',
  'chia seeds',
  'flax seeds',
  'hemp seeds',
  'poppy seeds',
  'pine nuts',
  'macadamia nuts',
  'hazelnuts',
  'pistachios',
  'brazil nuts',
  'walnuts',
];
