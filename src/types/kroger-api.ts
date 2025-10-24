// Kroger API TypeScript Types
// Based on OpenAPI specification v1.3.0

export interface KrogerAPIError {
  timestamp: number;
  code: string;
  reason: string;
}

export interface KrogerAPIErrorUnauthorized {
  errors: {
    error_description: string;
    error: string;
  };
}

export interface KrogerAPIErrorForbidden {
  errors: {
    reason: string;
    code: string;
    timestamp: number;
  };
}

export interface KrogerAPIErrorServerError {
  errors: {
    reason: string;
    code: string;
    timestamp: number;
  };
}

// Product Search Parameters
export interface KrogerProductSearchParams {
  term?: string;
  locationId?: string;
  productId?: string;
  brand?: string;
  fulfillment?: 'ais' | 'csp' | 'dth' | 'sth';
  start?: number;
  limit?: number;
}

// Product Item Models
export interface KrogerProductItemInventory {
  stockLevel: 'HIGH' | 'LOW' | 'TEMPORARILY_OUT_OF_STOCK';
}

export interface KrogerProductItemFulfillment {
  curbside: boolean;
  delivery: boolean;
  instore: boolean;
  shiptohome: boolean;
}

export interface KrogerDateValue {
  value: string;
  timezone: string;
}

export interface KrogerProductItemPrice {
  regular: number;
  promo?: number;
  regularPerUnitEstimate?: number;
  promoPerUnitEstimate?: number;
  expirationDate?: KrogerDateValue;
  effectiveDate?: KrogerDateValue;
}

export interface KrogerProductItem {
  itemId: string;
  inventory?: KrogerProductItemInventory;
  favorite?: boolean;
  fulfillment?: KrogerProductItemFulfillment;
  price?: KrogerProductItemPrice;
  nationalPrice?: KrogerProductItemPrice;
  size: string;
  soldBy: string;
}

// Product Aisle Location
export interface KrogerProductAisleLocation {
  bayNumber: string;
  description: string;
  number: string;
  numberOfFacings: string;
  sequenceNumber: string;
  side: string;
  shelfNumber: string;
  shelfPositionInBay: string;
}

// Product Dimensions
export interface KrogerProductBoxedDimensions {
  depth: string;
  height: string;
  width: string;
  grossWeight: string;
  netWeight: string;
  averageWeightPerUnit: string;
}

// Product Temperature
export interface KrogerProductTemperature {
  indicator: string;
  heatSensitive: boolean;
}

// Product Image
export interface KrogerProductImageSize {
  id: string;
  size: string;
  url: string;
}

export interface KrogerProductImage {
  id?: string;
  perspective: string;
  default: boolean;
  sizes: KrogerProductImageSize[];
}

// Nutrition Information
export interface KrogerUnitOfMeasure {
  abbreviation: string;
  code: string;
  name: string;
}

export interface KrogerServingSize {
  description: string;
  quantity: number;
  unitOfMeasure: KrogerUnitOfMeasure;
}

export interface KrogerNutrient {
  code: string;
  description: string;
  displayName: string;
  percentDailyIntake: number;
  quantity: number;
  precision: {
    code: string;
    name: string;
  };
  unitOfMeasure: KrogerUnitOfMeasure;
}

export interface KrogerNutritionInformation {
  ingredientStatement: string;
  dailyValueIntakeReference: string;
  servingSize: KrogerServingSize;
  nutrients: KrogerNutrient[];
  preparationState: {
    code: string;
    name: string;
  };
  servingsPerPackage: {
    description: string;
    value: number;
  };
  nutritionalRating: string;
}

// Allergens
export interface KrogerAllergen {
  levelOfContainmentName: string;
  name: string;
}

// Restrictions
export interface KrogerRestrictions {
  maximumOrderQuantity: number;
  minimumOrderQuantity: number;
  postalCode: string[];
  shippable: boolean;
  stateCodes: string[];
}

// Ratings and Reviews
export interface KrogerRatingsAndReviews {
  averageOverallRating: number;
  totalReviewCount: number;
}

// Sweetening Methods
export interface KrogerSweeteningMethods {
  code: string;
  name: string;
}

// Main Product Model
export interface KrogerProduct {
  productId: string;
  productPageURI: string;
  aliasProductIds: string[];
  aisleLocations?: KrogerProductAisleLocation[];
  brand: string;
  categories: string[];
  countryOrigin: string;
  description: string;
  alcohol: boolean;
  alcoholProof: number;
  ageRestriction: boolean;
  snapEligible: boolean;
  manufacturerDeclarations: string[];
  sweeteningMethods: KrogerSweeteningMethods;
  allergens: KrogerAllergen[];
  allergensDescription: string;
  certifiedForPassover: boolean;
  hypoallergenic: boolean;
  nonGmo: boolean;
  nonGmoClaimName: string;
  organicClaimName: string;
  receiptDescription: string;
  warnings: string;
  retstrictions?: KrogerRestrictions;
  items: KrogerProductItem[];
  itemInformation?: KrogerProductBoxedDimensions;
  temperature?: KrogerProductTemperature;
  images: KrogerProductImage[];
  upc: string;
  ratingsAndReviews?: KrogerRatingsAndReviews;
  nutritionInformation?: KrogerNutritionInformation;
}

// API Response Models
export interface KrogerProductPayload {
  data: KrogerProduct;
  meta: Record<string, unknown>;
}

export interface KrogerProductsPayload {
  data: KrogerProduct[];
  meta: Record<string, unknown>;
}

// Simplified Product Interface for UI
export interface KrogerProductSummary {
  productId: string;
  upc: string;
  brand: string;
  description: string;
  image?: string;
  size: string;
  price?: {
    regular: number;
    promo?: number;
  };
  availability?: {
    instore: boolean;
    curbside: boolean;
    delivery: boolean;
    shiptohome: boolean;
    stockLevel?: 'HIGH' | 'LOW' | 'TEMPORARILY_OUT_OF_STOCK';
  };
  aisleLocation?: string;
  rating?: {
    average: number;
    count: number;
  };
}

// API Service Configuration
export interface KrogerAPIConfig {
  clientId: string;
  clientSecret: string;
  baseURL?: string;
  scope?: string;
}

// Search Results with Pagination
export interface KrogerSearchResults {
  products: KrogerProductSummary[];
  pagination: {
    start: number;
    limit: number;
    total?: number;
  };
}
