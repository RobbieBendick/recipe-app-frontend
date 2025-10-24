import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
} from '@mui/material';
import {
  ExpandMore,
  Store,
  LocalShipping,
  Home,
  Warning,
  Info,
} from '@mui/icons-material';
import { krogerAPI } from '../../services/kroger-api';
import type { KrogerProduct } from '../../types/kroger-api';

interface KrogerProductDetailsProps {
  productId: string;
  locationId?: string;
}

export const KrogerProductDetails: React.FC<KrogerProductDetailsProps> = ({
  productId,
  locationId,
}) => {
  const [product, setProduct] = useState<KrogerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const details = await krogerAPI.getProductDetails(
          productId,
          locationId
        );
        setProduct(details);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load product details'
        );
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId, locationId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!product) {
    return (
      <Alert severity='info' sx={{ m: 2 }}>
        Product not found
      </Alert>
    );
  }

  const getAvailabilityChips = () => {
    const chips = [];
    if (product.items?.[0]?.fulfillment?.instore)
      chips.push({
        label: 'In Store',
        icon: <Store />,
        color: 'success' as const,
      });
    if (product.items?.[0]?.fulfillment?.curbside)
      chips.push({
        label: 'Curbside',
        icon: <Store />,
        color: 'info' as const,
      });
    if (product.items?.[0]?.fulfillment?.delivery)
      chips.push({
        label: 'Delivery',
        icon: <LocalShipping />,
        color: 'warning' as const,
      });
    if (product.items?.[0]?.fulfillment?.shiptohome)
      chips.push({
        label: 'Ship to Home',
        icon: <Home />,
        color: 'secondary' as const,
      });
    return chips;
  };

  const getStockLevelColor = (stockLevel?: string) => {
    switch (stockLevel) {
      case 'HIGH':
        return 'success';
      case 'LOW':
        return 'warning';
      case 'TEMPORARILY_OUT_OF_STOCK':
        return 'error';
      default:
        return 'default';
    }
  };

  const firstItem = product.items?.[0];
  const firstImage = product.images?.[0]?.sizes?.[0];

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {/* Product Image and Basic Info */}
        <Grid item xs={12} md={6}>
          {firstImage && (
            <CardMedia
              component='img'
              image={firstImage.url}
              alt={product.description}
              sx={{
                maxHeight: 400,
                objectFit: 'contain',
                borderRadius: 1,
                mb: 2,
              }}
            />
          )}

          <Typography variant='h4' gutterBottom>
            {product.description}
          </Typography>

          <Typography variant='h6' color='text.secondary' gutterBottom>
            {product.brand}
          </Typography>

          {product.categories.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {product.categories.map((category, index) => (
                <Chip
                  key={index}
                  label={category}
                  variant='outlined'
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          )}

          {product.ratingsAndReviews && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Rating
                value={product.ratingsAndReviews.averageOverallRating}
                readOnly
                precision={0.1}
                size='small'
              />
              <Typography variant='body2' sx={{ ml: 1 }}>
                {product.ratingsAndReviews.averageOverallRating.toFixed(1)} (
                {product.ratingsAndReviews.totalReviewCount} reviews)
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Product Details */}
        <Grid item xs={12} md={6}>
          {/* Price and Availability */}
          {firstItem?.price && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant='h5' color='primary' gutterBottom>
                  ${firstItem.price.regular.toFixed(2)}
                  {firstItem.price.promo && (
                    <Typography
                      component='span'
                      variant='h6'
                      color='error'
                      sx={{ ml: 1 }}
                    >
                      (Sale: ${firstItem.price.promo.toFixed(2)})
                    </Typography>
                  )}
                </Typography>

                <Typography variant='body2' color='text.secondary' gutterBottom>
                  Size: {firstItem.size} • Sold by: {firstItem.soldBy}
                </Typography>

                {firstItem.inventory?.stockLevel && (
                  <Chip
                    label={firstItem.inventory.stockLevel.replace('_', ' ')}
                    color={getStockLevelColor(firstItem.inventory.stockLevel)}
                    sx={{ mb: 2 }}
                  />
                )}

                <Box sx={{ mb: 2 }}>
                  {getAvailabilityChips().map((chip, index) => (
                    <Chip
                      key={index}
                      icon={chip.icon}
                      label={chip.label}
                      color={chip.color}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Aisle Location */}
          {product.aisleLocations && product.aisleLocations.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Store Location
                </Typography>
                {product.aisleLocations.map((location, index) => (
                  <Typography key={index} variant='body2'>
                    📍 {location.description}
                    {location.bayNumber && ` • Bay ${location.bayNumber}`}
                    {location.shelfNumber && ` • Shelf ${location.shelfNumber}`}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Product Information Accordions */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant='h6'>Product Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                <ListItem>
                  <ListItemText primary='UPC' secondary={product.upc} />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary='Product ID'
                    secondary={product.productId}
                  />
                </ListItem>
                {product.countryOrigin && (
                  <ListItem>
                    <ListItemText
                      primary='Country of Origin'
                      secondary={product.countryOrigin}
                    />
                  </ListItem>
                )}
                {product.alcohol && (
                  <ListItem>
                    <ListItemText
                      primary='Alcohol Content'
                      secondary={`${product.alcoholProof}% proof`}
                    />
                  </ListItem>
                )}
                {product.ageRestriction && (
                  <ListItem>
                    <ListItemIcon>
                      <Warning color='warning' />
                    </ListItemIcon>
                    <ListItemText primary='Age Restricted' />
                  </ListItem>
                )}
                {product.snapEligible && (
                  <ListItem>
                    <ListItemIcon>
                      <Info color='info' />
                    </ListItemIcon>
                    <ListItemText primary='SNAP Eligible' />
                  </ListItem>
                )}
              </List>
            </AccordionDetails>
          </Accordion>

          {/* Allergens and Dietary Info */}
          {(product.allergens.length > 0 || product.allergensDescription) && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant='h6'>
                  Allergens & Dietary Information
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {product.allergensDescription && (
                  <Typography variant='body2' sx={{ mb: 2 }}>
                    {product.allergensDescription}
                  </Typography>
                )}
                {product.allergens.length > 0 && (
                  <Box>
                    <Typography variant='subtitle2' gutterBottom>
                      Allergens:
                    </Typography>
                    {product.allergens.map((allergen, index) => (
                      <Chip
                        key={index}
                        label={`${allergen.levelOfContainmentName}: ${allergen.name}`}
                        variant='outlined'
                        color={
                          allergen.levelOfContainmentName === 'Free from'
                            ? 'success'
                            : 'warning'
                        }
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}

                <Box sx={{ mt: 2 }}>
                  {product.hypoallergenic && (
                    <Chip
                      label='Hypoallergenic'
                      color='info'
                      sx={{ mr: 1, mb: 1 }}
                    />
                  )}
                  {product.nonGmo && (
                    <Chip
                      label='Non-GMO'
                      color='success'
                      sx={{ mr: 1, mb: 1 }}
                    />
                  )}
                  {product.certifiedForPassover && (
                    <Chip
                      label='Passover Certified'
                      color='secondary'
                      sx={{ mr: 1, mb: 1 }}
                    />
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Nutrition Information */}
          {product.nutritionInformation && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant='h6'>Nutrition Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant='body2' sx={{ mb: 2 }}>
                  {product.nutritionInformation.ingredientStatement}
                </Typography>

                <Typography variant='subtitle2' gutterBottom>
                  Serving Size:{' '}
                  {product.nutritionInformation.servingSize.description}
                </Typography>

                <Typography variant='subtitle2' gutterBottom>
                  Servings per Package:{' '}
                  {product.nutritionInformation.servingsPerPackage.description}
                </Typography>

                {product.nutritionInformation.nutrients.length > 0 && (
                  <Box>
                    <Typography variant='subtitle2' gutterBottom>
                      Key Nutrients:
                    </Typography>
                    <List dense>
                      {product.nutritionInformation.nutrients
                        .slice(0, 10)
                        .map((nutrient, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={nutrient.displayName}
                              secondary={`${nutrient.quantity} ${nutrient.unitOfMeasure.abbreviation} (${nutrient.percentDailyIntake}% DV)`}
                            />
                          </ListItem>
                        ))}
                    </List>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          )}

          {/* Warnings */}
          {product.warnings && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant='h6'>Warnings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant='body2' color='warning.main'>
                  {product.warnings}
                </Typography>
              </AccordionDetails>
            </Accordion>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};
