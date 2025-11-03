import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
} from '@mui/material';
import { krogerAPI, KrogerProductSummary } from '../../../services/kroger-api';
import { ingredientCostDB } from '../../../database/ingredient-costs';

interface SearchIngredientDialogProps {
  open: boolean;
  onClose: () => void;
  ingredient: {
    ingredient: string;
    quantity: number;
    measurement: string;
  };
  onSuccess: () => void;
}

/**
 * Extracts the stored product description from notes field
 * Handles formats like "Kroger: {description} - ${price}" or "Auto-fetched from Kroger API - ${price}"
 */
const extractStoredProductDescription = (
  notes: string | undefined
): string | null => {
  if (!notes) return null;

  // Try to extract from "Kroger: {description} - ${price}" format
  const krogerMatch = notes.match(/^Kroger:\s*(.+?)\s*-\s*\$/);
  if (krogerMatch) {
    return krogerMatch[1].trim();
  }

  // For "Auto-fetched" format, we don't have the full description in notes
  // Return null to indicate we need to use other matching criteria
  return null;
};

/**
 * Normalizes product descriptions for comparison
 * Removes extra whitespace, converts to lowercase, and trims
 */
const normalizeProductDescription = (description: string): string => {
  return description.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Checks if a product matches the currently selected one
 * Uses multiple matching criteria for robustness:
 * 1. Product description (most specific)
 * 2. Brand + description + size (fallback)
 */
const isProductMatch = (
  product: KrogerProductSummary,
  currentCostData: ReturnType<typeof ingredientCostDB.getCostByName>
): boolean => {
  if (!currentCostData) return false;

  // Extract stored product description from notes
  const storedDescription = extractStoredProductDescription(
    currentCostData.notes
  );

  // Primary match: Exact product description match (most specific)
  // This prevents false positives like "Unbleached" vs "Organic"
  if (storedDescription && product.description) {
    const normalizedStored = normalizeProductDescription(storedDescription);
    const normalizedProduct = normalizeProductDescription(product.description);

    if (normalizedStored === normalizedProduct) {
      return true;
    }
    // If descriptions don't match, we have different products
    // Don't fall back to less specific matching to avoid false positives
    return false;
  }

  // Secondary match: Brand + description + size (when we have all three)
  // This ensures we have enough specificity to avoid false matches
  if (
    storedDescription &&
    product.description &&
    currentCostData.brand &&
    product.brand &&
    currentCostData.size &&
    product.size
  ) {
    const storedNormalized = normalizeProductDescription(storedDescription);
    const productNormalized = normalizeProductDescription(product.description);
    const brandMatch =
      normalizeProductDescription(currentCostData.brand) ===
      normalizeProductDescription(product.brand);
    const sizeMatch =
      normalizeProductDescription(currentCostData.size) ===
      normalizeProductDescription(product.size);

    // All three must match: brand, description, and size
    return brandMatch && sizeMatch && storedNormalized === productNormalized;
  }

  // Fallback: Only match on brand + size if we don't have description stored
  // This is less specific but necessary for products stored without full description
  // (e.g., "Auto-fetched from Kroger API" format)
  if (
    !storedDescription &&
    currentCostData.brand &&
    product.brand &&
    currentCostData.size &&
    product.size
  ) {
    const brandMatch =
      normalizeProductDescription(currentCostData.brand) ===
      normalizeProductDescription(product.brand);
    const sizeMatch =
      normalizeProductDescription(currentCostData.size) ===
      normalizeProductDescription(product.size);

    return brandMatch && sizeMatch;
  }

  return false;
};

export const SearchIngredientDialog: React.FC<SearchIngredientDialogProps> = ({
  open,
  onClose,
  ingredient,
  onSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState(ingredient.ingredient);
  const [products, setProducts] = useState<KrogerProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<KrogerProductSummary | null>(null);
  const [currentCostData, setCurrentCostData] = useState(() =>
    ingredientCostDB.getCostByName(ingredient.ingredient)
  );

  // Update cost data when dialog opens or when a new product is added
  const updateCurrentCostData = useCallback(() => {
    setCurrentCostData(ingredientCostDB.getCostByName(ingredient.ingredient));
  }, [ingredient.ingredient]);

  // Refresh cost data when dialog opens
  useEffect(() => {
    if (open) {
      updateCurrentCostData();
    }
  }, [open, updateCurrentCostData]);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError(null);
    setProducts([]);
    setSelectedProduct(null);

    try {
      const results = await krogerAPI.searchProducts({
        term: searchTerm.trim(),
        locationId: '01400943', // Default location
        limit: 10,
      });

      setProducts(results.products);

      if (results.products.length === 0) {
        setError('No products found. Try a different search term.');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to search products. Please try again.'
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const handleSelectProduct = useCallback((product: KrogerProductSummary) => {
    setSelectedProduct(product);
  }, []);

  const handleAddProduct = useCallback(() => {
    if (!selectedProduct) return;

    try {
      // Parse weight from size
      const weightInGrams = krogerAPI.parseWeightFromSize(
        selectedProduct.size,
        selectedProduct.description
      );

      if (weightInGrams instanceof Error || weightInGrams <= 0) {
        setError(
          'Could not determine weight from product size. Please use the manual add option.'
        );
        return;
      }

      if (!selectedProduct.price?.regular) {
        setError('Product does not have a valid price.');
        return;
      }

      // Calculate cost per gram
      const costPerGram =
        selectedProduct.price.regular / (weightInGrams as number);

      // Add to ingredient cost database
      ingredientCostDB.addOrUpdateIngredientCost({
        id: `kroger_${selectedProduct.productId}_${Date.now()}`,
        name: ingredient.ingredient, // Use the ingredient name from recipe
        costPerGram,
        source: 'kroger',
        lastUpdated: new Date(),
        locationId: '01400943',
        brand: selectedProduct.brand,
        size: selectedProduct.size,
        notes: `Kroger: ${
          selectedProduct.description
        } - $${selectedProduct.price.regular.toFixed(2)}`,
      });

      console.log(`✅ Added pricing data for ${ingredient.ingredient}`);
      console.log(`   Product: ${selectedProduct.description}`);
      console.log(`   Size: ${selectedProduct.size} (${weightInGrams}g)`);
      console.log(`   Price: $${selectedProduct.price.regular}`);
      console.log(`   Cost per gram: $${costPerGram.toFixed(6)}`);

      // Update current cost data to reflect the new selection
      updateCurrentCostData();

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to add product. Please try again.'
      );
    }
  }, [selectedProduct, ingredient, onSuccess, onClose, updateCurrentCostData]);

  const handleClose = useCallback(() => {
    setSearchTerm(ingredient.ingredient);
    setProducts([]);
    setSelectedProduct(null);
    setError(null);
    onClose();
  }, [ingredient.ingredient, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>Search for Pricing: {ingredient.ingredient}</DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Recipe needs: {ingredient.quantity} {ingredient.measurement}
          </Typography>

          {/* Current Pricing Information */}
          {currentCostData &&
            (() => {
              // Extract product description from notes
              // Format: "Kroger: {description} - ${price}" or "Auto-fetched from Kroger API - ${price}"
              let productDescription = '';
              let productPrice = '';

              if (currentCostData.notes) {
                // Try to extract description from "Kroger: {description} - ${price}" format
                // Make regex more flexible to handle variations in spacing
                const krogerMatch = currentCostData.notes.match(
                  /^Kroger:\s*(.+?)\s*-\s*\$\d+/
                );
                if (krogerMatch) {
                  productDescription = krogerMatch[1].trim();
                  const priceMatch =
                    currentCostData.notes.match(/-\s*\$([\d.]+)/);
                  if (priceMatch) {
                    productPrice = priceMatch[1];
                  }
                } else {
                  // Try "Auto-fetched from Kroger API - ${price}" format
                  const autoFetchedMatch = currentCostData.notes.match(
                    /^Auto-fetched from Kroger API/
                  );
                  if (autoFetchedMatch) {
                    // For auto-fetched, we don't have full description, so use brand + size
                    productDescription =
                      currentCostData.brand && currentCostData.size
                        ? `${currentCostData.brand} ${currentCostData.size}`
                        : currentCostData.brand || '';
                  }
                  const priceMatch =
                    currentCostData.notes.match(/-\s*\$([\d.]+)/);
                  if (priceMatch) {
                    productPrice = priceMatch[1];
                  }
                }
              }

              // Build the main product title: prioritize extracted description from notes
              // This ensures we show the full product name like "McCormick Pure Vanilla Extract"
              // instead of just "McCormick 2 fl oz"
              const mainProductName =
                productDescription ||
                (currentCostData.brand
                  ? `${currentCostData.brand}${
                      currentCostData.size ? ` ${currentCostData.size}` : ''
                    }`
                  : currentCostData.size || 'Unknown Product');

              // Check if size is already included in the product description to avoid duplication
              const sizeAlreadyInDescription =
                currentCostData.size &&
                mainProductName
                  .toLowerCase()
                  .includes(currentCostData.size.toLowerCase());

              return (
                <Alert severity='info' sx={{ mb: 2 }}>
                  <Typography variant='subtitle2' gutterBottom>
                    Currently Selected:
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 600, mb: 1 }}>
                    {mainProductName}
                  </Typography>
                  {currentCostData.size && !sizeAlreadyInDescription && (
                    <Typography
                      variant='body2'
                      sx={{ fontWeight: 500, color: 'text.primary', mb: 1 }}
                    >
                      Size: {currentCostData.size}
                    </Typography>
                  )}
                  <Box sx={{ mt: 1 }}>
                    {productPrice && (
                      <Typography variant='body2' sx={{ mb: 0.5 }}>
                        Price:{' '}
                        <strong>${parseFloat(productPrice).toFixed(2)}</strong>
                      </Typography>
                    )}
                    <Typography variant='caption' color='text.secondary'>
                      Cost per gram: ${currentCostData.costPerGram.toFixed(6)}
                    </Typography>
                  </Box>
                </Alert>
              );
            })()}

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label='Search Kroger Products'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter' && !loading) {
                  handleSearch();
                }
              }}
              placeholder='e.g., butter, flour, sugar'
              disabled={loading}
            />
            <Button
              variant='contained'
              onClick={handleSearch}
              disabled={loading || !searchTerm.trim()}
              sx={{ minWidth: 100 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Search'}
            </Button>
          </Box>

          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {products.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant='subtitle2' gutterBottom>
                Found {products.length} product(s):
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {products.map(product => {
                  const weightInGrams = krogerAPI.parseWeightFromSize(
                    product.size,
                    product.description
                  );
                  const hasValidPrice =
                    product.price?.regular !== undefined &&
                    product.price.regular > 0;
                  const isValid =
                    !(weightInGrams instanceof Error) &&
                    weightInGrams > 0 &&
                    hasValidPrice;
                  const isSelected =
                    selectedProduct?.productId === product.productId;

                  // Check if this product matches the currently selected one
                  const isCurrentlySelected = isProductMatch(
                    product,
                    currentCostData
                  );

                  return (
                    <Grid item xs={12} sm={6} key={product.productId}>
                      <Card
                        sx={{
                          cursor: isValid ? 'pointer' : 'not-allowed',
                          border: isSelected || isCurrentlySelected ? 2 : 1,
                          borderColor: isSelected
                            ? 'primary.main'
                            : isCurrentlySelected
                            ? 'info.main'
                            : 'divider',
                          backgroundColor: isCurrentlySelected
                            ? 'action.selected'
                            : 'transparent',
                          opacity: isValid ? 1 : 0.6,
                          '&:hover': isValid
                            ? {
                                boxShadow: 3,
                                borderColor: 'primary.main',
                              }
                            : {},
                        }}
                        onClick={() => isValid && handleSelectProduct(product)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Typography
                            variant='subtitle2'
                            fontWeight={600}
                            gutterBottom
                          >
                            {product.brand}
                          </Typography>
                          <Typography variant='body2' sx={{ mb: 1 }}>
                            {product.description}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              {product.size}
                            </Typography>
                            <Typography variant='h6' color='primary'>
                              ${product.price?.regular?.toFixed(2) || 'N/A'}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 1,
                              mt: 1,
                            }}
                          >
                            {isValid ? (
                              <Chip
                                label='Valid'
                                color='success'
                                size='small'
                              />
                            ) : (
                              <Chip
                                label={
                                  !hasValidPrice
                                    ? 'Invalid - No price'
                                    : 'Invalid size'
                                }
                                color='warning'
                                size='small'
                              />
                            )}
                            {isCurrentlySelected && (
                              <Chip
                                label='Currently Used'
                                color='info'
                                size='small'
                              />
                            )}
                            {isSelected && !isCurrentlySelected && (
                              <Chip
                                label='Selected'
                                color='primary'
                                size='small'
                              />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleAddProduct}
          variant='contained'
          disabled={!selectedProduct || loading}
        >
          Add Pricing Data
        </Button>
      </DialogActions>
    </Dialog>
  );
};
