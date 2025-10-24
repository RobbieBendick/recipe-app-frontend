# Kroger API Integration

This document describes the complete integration of Kroger's Products API with your recipe application.

## Overview

The integration provides comprehensive access to Kroger's product catalog, including:

- Product search by term, brand, or product ID
- Detailed product information with pricing, availability, and nutrition data
- Location-based pricing and inventory information
- Rich product details including allergens, ratings, and images

## Setup Instructions

### 1. Get Kroger API Credentials

1. Visit [Kroger Developer Portal](https://developer.kroger.com/)
2. Create an account and register your application
3. Note down your `Client ID` and `Client Secret`

### 2. Environment Configuration

Create a `.env` file in your project root with the following variables:

```env
VITE_KROGER_CLIENT_ID=your_client_id_here
VITE_KROGER_CLIENT_SECRET=your_client_secret_here
```

For testing, you can optionally use the certification environment:

```env
VITE_KROGER_BASE_URL=https://api-ce.kroger.com/v1
```

### 3. API Rate Limits

- **10,000 calls per day** for the Products API
- Rate limiting is enforced per client, not per endpoint
- Consider implementing caching for frequently accessed data

## File Structure

```
src/
├── types/
│   └── kroger-api.ts              # TypeScript types for API responses
├── services/
│   └── kroger-api.ts             # Enhanced API service with full functionality
├── components/
│   ├── kroger-product-search/     # Product search component
│   ├── kroger-product-details/   # Detailed product view
│   └── kroger-test/              # Integration testing component
└── env.example                   # Environment variables template
```

## API Service Features

### Enhanced KrogerAPIService

The service now includes:

- **OAuth2 Authentication**: Automatic token management with expiry handling
- **Comprehensive Search**: Support for all search parameters (term, brand, productId, locationId, fulfillment)
- **Error Handling**: Detailed error messages for different API response codes
- **Data Transformation**: Converts complex API responses to simplified UI-friendly formats
- **Token Management**: Automatic token refresh and caching

### Key Methods

```typescript
// Search products with comprehensive parameters
await krogerAPI.searchProducts({
  term: 'milk',
  brand: 'Kroger',
  locationId: '01400943',
  fulfillment: 'ais',
  limit: 10,
});

// Get product details
await krogerAPI.getProduct(productId, locationId);

// Get full product details (raw API response)
await krogerAPI.getProductDetails(productId, locationId);

// Test API connection
await krogerAPI.testConnection();
```

## React Components

### KrogerProductSearch

A comprehensive product search component with:

- Search by term or brand
- Fulfillment type filtering
- Location-based results
- Pagination support
- Real-time availability indicators
- Stock level indicators

### KrogerProductDetails

Detailed product view showing:

- Product images and descriptions
- Pricing information (regular and promotional)
- Availability and fulfillment options
- Aisle locations
- Nutrition information
- Allergen information
- Customer ratings and reviews

### KrogerTest

Integration testing component that:

- Tests API connectivity
- Provides search functionality
- Shows detailed product information
- Displays API usage information

## Usage Examples

### Basic Product Search

```typescript
import { krogerAPI } from './services/kroger-api';

// Search for products
const results = await krogerAPI.searchProducts({
  term: 'organic milk',
  locationId: '01400943',
  limit: 10,
});

console.log(results.products);
```

### Advanced Search with Filters

```typescript
// Search by brand with specific fulfillment
const results = await krogerAPI.searchProducts({
  brand: 'Kroger',
  fulfillment: 'ais', // Available in store
  locationId: '01400943',
});
```

### Get Product Details

```typescript
// Get detailed product information
const product = await krogerAPI.getProductDetails('0001111041700', '01400943');

console.log(product.description);
console.log(product.nutritionInformation);
```

## API Response Types

The integration includes comprehensive TypeScript types for all API responses:

- `KrogerProduct`: Full product details from API
- `KrogerProductSummary`: Simplified product data for UI
- `KrogerProductSearchParams`: Search parameters
- `KrogerSearchResults`: Search results with pagination

## Error Handling

The service includes robust error handling for:

- **400 Bad Request**: Invalid parameters
- **401 Unauthorized**: Invalid or expired tokens
- **403 Forbidden**: Missing required scopes
- **500 Server Error**: Internal server errors

## Testing the Integration

1. Navigate to `/kroger-test` in your application
2. Click "Test Connection" to verify API credentials
3. Enter a location ID (optional) for location-specific data
4. Search for products using the search interface
5. View detailed product information

## Location IDs

To get location-specific pricing and availability:

1. Visit [Kroger Store Locator](https://www.kroger.com/store-locator)
2. Find your preferred store
3. The location ID is typically an 8-digit number (e.g., "01400943")

## Best Practices

1. **Caching**: Implement caching for frequently accessed products
2. **Error Handling**: Always handle API errors gracefully
3. **Rate Limiting**: Monitor your API usage to stay within limits
4. **Location Data**: Use location IDs for accurate pricing and availability
5. **User Experience**: Show loading states and error messages

## Future Enhancements

Potential improvements for the integration:

1. **Shopping Cart Integration**: Add products to a shopping cart
2. **Price Comparison**: Compare prices across different locations
3. **Favorites**: Save favorite products for quick access
4. **Nutrition Analysis**: Analyze recipe nutrition using product data
5. **Inventory Alerts**: Notify users when products are back in stock

## Support

For API-related issues:

- [Kroger Developer Documentation](https://developer.kroger.com/)
- [API Support](mailto:APISupport@kroger.com)

For integration questions, refer to the component documentation and TypeScript types.
