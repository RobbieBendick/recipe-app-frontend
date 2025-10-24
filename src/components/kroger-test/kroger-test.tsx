import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  TextField,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import { useKroger } from '../../contexts/kroger-context';
import { KrogerProductSearch } from '../kroger-product-search/kroger-product-search';
import { KrogerProductDetails } from '../kroger-product-details/kroger-product-details';
import type { KrogerProductSummary } from '../../types/kroger-api';

export const KrogerTest: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    connectionError,
    testConnection,
    clearError,
  } = useKroger();
  const [selectedProduct, setSelectedProduct] =
    useState<KrogerProductSummary | null>(null);
  const [locationId, setLocationId] = useState('');

  const handleTestConnection = async () => {
    clearError();
    await testConnection();
  };

  const handleProductSelect = (product: KrogerProductSummary) => {
    setSelectedProduct(product);
  };

  const getStatusColor = () => {
    if (isConnecting) return 'info';
    if (isConnected) return 'success';
    if (connectionError) return 'error';
    return 'default';
  };

  const getStatusText = () => {
    if (isConnecting) return 'Testing Connection...';
    if (isConnected) return 'Connected to Kroger API';
    if (connectionError) return 'Connection Failed';
    return 'Not Tested';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            API Connection Test
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant='contained'
              onClick={handleTestConnection}
              disabled={isConnecting}
              startIcon={
                isConnecting ? <CircularProgress size={20} /> : undefined
              }
            >
              {isConnecting ? 'Testing...' : 'Test Connection'}
            </Button>

            <Chip
              label={getStatusText()}
              color={getStatusColor()}
              variant={isConnected ? 'filled' : 'outlined'}
            />
          </Box>

          {connectionError && (
            <Alert severity='error' sx={{ mt: 2 }}>
              {connectionError}
            </Alert>
          )}

          {isConnected && (
            <Alert severity='success' sx={{ mt: 2 }}>
              Successfully connected to Kroger API! You can now search for
              products.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Location ID Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Store Location (Optional)
          </Typography>

          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Enter a Kroger store location ID to get location-specific pricing
            and availability. You can find location IDs by visiting Kroger
            stores and checking their store locator.
          </Typography>

          <TextField
            label='Location ID'
            value={locationId}
            onChange={e => setLocationId(e.target.value)}
            placeholder='e.g., 01400943'
            helperText='8-digit location ID (optional)'
            sx={{ maxWidth: 300 }}
          />
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Product Search */}
      {isConnected && (
        <Box>
          <Typography variant='h5' gutterBottom color='text.primary'>
            Product Search
          </Typography>

          <KrogerProductSearch
            onProductSelect={handleProductSelect}
            locationId={locationId || undefined}
            showAddToCart={true}
          />
        </Box>
      )}

      {/* Product Details */}
      {selectedProduct && (
        <Box sx={{ mt: 3 }}>
          <Typography variant='h5' gutterBottom>
            Product Details
          </Typography>

          <KrogerProductDetails
            productId={selectedProduct.productId}
            locationId={locationId || undefined}
          />
        </Box>
      )}

      {/* API Information */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            API Information
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant='subtitle2' gutterBottom>
                Rate Limits
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                10,000 calls per day for the Products API
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant='subtitle2' gutterBottom>
                Required Scopes
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                product.compact - Read access to general product information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant='subtitle2' gutterBottom>
                Authentication
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                OAuth2 Client Credentials Grant
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant='subtitle2' gutterBottom>
                Base URL
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                https://api.kroger.com/v1
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};
