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
import { krogerAPI } from '../../services/kroger-api';
import { KrogerProductSearch } from '../kroger-product-search/kroger-product-search';
import { KrogerProductDetails } from '../kroger-product-details/kroger-product-details';
import type { KrogerProductSummary } from '../../types/kroger-api';

export const KrogerTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<KrogerProductSummary | null>(null);
  const [locationId, setLocationId] = useState('');

  const testConnection = async () => {
    setConnectionStatus('testing');
    setError(null);

    try {
      // Test both environments
      console.log('Testing both Kroger API environments...');
      await krogerAPI.testBothEnvironments();

      const isConnected = await krogerAPI.testConnection();
      setConnectionStatus(isConnected ? 'success' : 'error');
      if (!isConnected) {
        setError(
          'Failed to connect to Kroger API. Please check your credentials.'
        );
      }
    } catch (err) {
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const handleProductSelect = (product: KrogerProductSummary) => {
    setSelectedProduct(product);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'testing':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'success':
        return 'Connected to Kroger API';
      case 'error':
        return 'Connection Failed';
      case 'testing':
        return 'Testing Connection...';
      default:
        return 'Not Tested';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom>
        Kroger API Integration Test
      </Typography>

      <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
        Test the Kroger API integration with your application. Make sure you
        have set up your VITE_KROGER_CLIENT_ID and VITE_KROGER_CLIENT_SECRET
        environment variables.
      </Typography>

      {/* Connection Test */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            API Connection Test
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant='contained'
              onClick={testConnection}
              disabled={connectionStatus === 'testing'}
              startIcon={
                connectionStatus === 'testing' ? (
                  <CircularProgress size={20} />
                ) : undefined
              }
            >
              {connectionStatus === 'testing'
                ? 'Testing...'
                : 'Test Connection'}
            </Button>

            <Chip
              label={getStatusText()}
              color={getStatusColor()}
              variant={connectionStatus === 'idle' ? 'outlined' : 'filled'}
            />
          </Box>

          {error && (
            <Alert severity='error' sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {connectionStatus === 'success' && (
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
      {connectionStatus === 'success' && (
        <Box>
          <Typography variant='h5' gutterBottom>
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
