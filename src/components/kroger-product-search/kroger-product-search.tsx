import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  ShoppingCart,
  Store,
  LocalShipping,
  Home,
} from '@mui/icons-material';
import { krogerAPI } from '../../services/kroger-api';
import type {
  KrogerProductSummary,
  KrogerProductSearchParams,
} from '../../types/kroger-api';

interface KrogerProductSearchProps {
  onProductSelect?: (product: KrogerProductSummary) => void;
  locationId?: string;
  showAddToCart?: boolean;
}

export const KrogerProductSearch: React.FC<KrogerProductSearchProps> = ({
  onProductSelect,
  locationId,
  showAddToCart = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [brand, setBrand] = useState('');
  const [fulfillment, setFulfillment] = useState<string>('');
  const [products, setProducts] = useState<KrogerProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    start: 0,
    limit: 10,
    total: 0,
  });

  const searchProducts = async (start = 0) => {
    if (!searchTerm.trim() && !brand.trim()) {
      setError('Please enter a search term or brand');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchParams: KrogerProductSearchParams = {
        term: searchTerm.trim() || undefined,
        brand: brand.trim() || undefined,
        locationId,
        fulfillment: fulfillment as 'ais' | 'csp' | 'dth' | 'sth' | undefined,
        start,
        limit: 10,
      };

      const results = await krogerAPI.searchProducts(searchParams);
      setProducts(results.products);
      setPagination({
        start: results.pagination.start,
        limit: results.pagination.limit,
        total: results.pagination.total || 0,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to search products'
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchProducts(0);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    const start = (page - 1) * pagination.limit;
    searchProducts(start);
  };

  const handleProductClick = (product: KrogerProductSummary) => {
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  const getAvailabilityChips = (product: KrogerProductSummary) => {
    const chips = [];
    if (product.availability?.instore)
      chips.push({
        label: 'In Store',
        icon: <Store />,
        color: 'success' as const,
      });
    if (product.availability?.curbside)
      chips.push({
        label: 'Curbside',
        icon: <Store />,
        color: 'info' as const,
      });
    if (product.availability?.delivery)
      chips.push({
        label: 'Delivery',
        icon: <LocalShipping />,
        color: 'warning' as const,
      });
    if (product.availability?.shiptohome)
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

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label='Search Term'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder='e.g., milk, bread, apples'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Search />
                </InputAdornment>
              ),
            }}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label='Brand'
            value={brand}
            onChange={e => setBrand(e.target.value)}
            placeholder='e.g., Kroger, Organic Valley'
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Fulfillment</InputLabel>
            <Select
              value={fulfillment}
              onChange={e => setFulfillment(e.target.value)}
              label='Fulfillment'
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='ais'>In Store</MenuItem>
              <MenuItem value='csp'>Curbside Pickup</MenuItem>
              <MenuItem value='dth'>Delivery to Home</MenuItem>
              <MenuItem value='sth'>Ship to Home</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={2}>
          <Button
            fullWidth
            variant='contained'
            onClick={handleSearch}
            disabled={loading}
            sx={{ height: '56px' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Search'}
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {products.length > 0 && (
        <>
          <Typography variant='h6' gutterBottom>
            Search Results ({products.length} products)
          </Typography>

          <Grid container spacing={2}>
            {products.map(product => (
              <Grid item xs={12} sm={6} md={4} key={product.productId}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => handleProductClick(product)}
                >
                  {product.image && (
                    <CardMedia
                      component='img'
                      height='200'
                      image={product.image}
                      alt={product.description}
                      sx={{ objectFit: 'contain', p: 1 }}
                    />
                  )}

                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant='h6' component='h3' gutterBottom>
                      {product.description}
                    </Typography>

                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      {product.brand} • {product.size}
                    </Typography>

                    {product.price && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant='h6' color='primary'>
                          ${product.price.regular.toFixed(2)}
                          {product.price.promo && (
                            <Typography
                              component='span'
                              variant='body2'
                              color='error'
                              sx={{ ml: 1 }}
                            >
                              (Sale: ${product.price.promo.toFixed(2)})
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    )}

                    {product.availability && (
                      <Box sx={{ mb: 2 }}>
                        {getAvailabilityChips(product).map((chip, index) => (
                          <Chip
                            key={index}
                            icon={chip.icon}
                            label={chip.label}
                            color={chip.color}
                            size='small'
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}

                        {product.availability.stockLevel && (
                          <Chip
                            label={product.availability.stockLevel.replace(
                              '_',
                              ' '
                            )}
                            color={getStockLevelColor(
                              product.availability.stockLevel
                            )}
                            size='small'
                            sx={{ ml: 0.5, mb: 0.5 }}
                          />
                        )}
                      </Box>
                    )}

                    {product.aisleLocation && (
                      <Typography variant='body2' color='text.secondary'>
                        📍 {product.aisleLocation}
                      </Typography>
                    )}

                    {product.rating && (
                      <Typography variant='body2' color='text.secondary'>
                        ⭐ {product.rating.average.toFixed(1)} (
                        {product.rating.count} reviews)
                      </Typography>
                    )}

                    {showAddToCart && (
                      <Button
                        variant='outlined'
                        startIcon={<ShoppingCart />}
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={e => {
                          e.stopPropagation();
                          handleProductClick(product);
                        }}
                      >
                        Add to Cart
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {pagination.total > pagination.limit && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(pagination.total / pagination.limit)}
                page={Math.floor(pagination.start / pagination.limit) + 1}
                onChange={handlePageChange}
                color='primary'
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
