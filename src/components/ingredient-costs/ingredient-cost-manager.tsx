import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Search, Delete, Refresh } from '@mui/icons-material';
import { useIngredientCosts } from '../../hooks/use-ingredient-costs';
import { useKroger } from '../../contexts/kroger-context';
import { IngredientInfo } from '../../database/ingredient-costs';

export const IngredientCostManager: React.FC = () => {
  const {
    ingredients,
    stats,
    loading,
    addIngredientCost,
    searchIngredients,
    calculateRecipeCost,
    clearAll,
    refresh,
  } = useIngredientCosts();

  const { isConnected, isFetchingCosts, fetchIngredientCosts } = useKroger();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredIngredients, setFilteredIngredients] = useState<
    IngredientInfo[]
  >([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newIngredient, setNewIngredient] = useState<Partial<IngredientInfo>>({
    name: '',
    costPerGram: 0,
    source: 'manual',
    brand: '',
    size: '',
    notes: '',
  });

  // Search ingredients
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchIngredients(query);
      setFilteredIngredients(results);
    } else {
      setFilteredIngredients(ingredients);
    }
  };

  // Add new ingredient
  const handleAddIngredient = () => {
    if (newIngredient.name && newIngredient.costPerGram) {
      const cost: IngredientInfo = {
        id: `manual_${Date.now()}`,
        name: newIngredient.name,
        costPerGram: newIngredient.costPerGram,
        source: newIngredient.source as 'manual' | 'kroger' | 'estimated',
        lastUpdated: new Date(),
        brand: newIngredient.brand,
        size: newIngredient.size,
        notes: newIngredient.notes,
      };

      addIngredientCost(cost);
      setNewIngredient({
        name: '',
        costPerGram: 0,
        source: 'manual',
        brand: '',
        size: '',
        notes: '',
      });
      setShowAddDialog(false);
    }
  };

  // Calculate sample recipe cost
  const sampleRecipe = [
    { name: 'flour', quantity: 2, measurement: 'cup' },
    { name: 'sugar', quantity: 1, measurement: 'cup' },
    { name: 'eggs', quantity: 3, measurement: 'whole' },
  ];

  const recipeCost = calculateRecipeCost(sampleRecipe);

  const displayIngredients = searchQuery ? filteredIngredients : ingredients;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom color='text.primary'>
        Ingredient Cost Database
      </Typography>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='primary'>
                {stats.totalIngredients}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total Ingredients
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='primary'>
                {stats.lastSync
                  ? new Date(stats.lastSync).toLocaleDateString()
                  : 'Never'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Last Updated
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Data Sources
              </Typography>
              {Object.entries(stats.sources).map(([source, count]) => (
                <Chip
                  key={source}
                  label={`${source}: ${count}`}
                  size='small'
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder='Search ingredients...'
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          sx={{ minWidth: 200 }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={() => setShowAddDialog(true)}
        >
          Add Ingredient
        </Button>
        <Button
          variant='outlined'
          startIcon={<Refresh />}
          onClick={refresh}
          disabled={loading}
        >
          Refresh
        </Button>
        {isConnected && (
          <Button
            variant='contained'
            color='primary'
            startIcon={<Refresh />}
            onClick={() => fetchIngredientCosts('01400943')}
            disabled={isFetchingCosts}
          >
            {isFetchingCosts
              ? 'Fetching from Kroger...'
              : 'Fetch Kroger Prices'}
          </Button>
        )}
        <Button
          variant='outlined'
          color='error'
          startIcon={<Delete />}
          onClick={clearAll}
        >
          Clear All
        </Button>
      </Box>

      {/* Sample Recipe Cost */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Sample Recipe Cost Calculation
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Recipe: 2 cups flour, 1 cup sugar, 3 eggs
          </Typography>
          <Typography variant='h5' color='primary'>
            Total Cost: ${recipeCost.totalCost.toFixed(2)}
          </Typography>
          {recipeCost.missingIngredients.length > 0 && (
            <Alert severity='warning' sx={{ mt: 2 }}>
              Missing cost data for: {recipeCost.missingIngredients.join(', ')}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Ingredients Table */}
      <Card>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Ingredients ({displayIngredients.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Cost/Gram</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayIngredients.map(ingredient => (
                  <TableRow key={ingredient.id}>
                    <TableCell>
                      <Typography variant='body2' fontWeight={500}>
                        {ingredient.name}
                      </Typography>
                      {ingredient.notes && (
                        <Typography variant='caption' color='text.secondary'>
                          {ingredient.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>${ingredient.costPerGram.toFixed(4)}</TableCell>
                    <TableCell>
                      <Chip
                        label={ingredient.source}
                        size='small'
                        color={
                          ingredient.source === 'kroger' ? 'primary' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>{ingredient.brand || '-'}</TableCell>
                    <TableCell>{ingredient.size || '-'}</TableCell>
                    <TableCell>
                      {new Date(ingredient.lastUpdated).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Ingredient Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Add Ingredient Cost</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Ingredient Name'
                value={newIngredient.name}
                onChange={e =>
                  setNewIngredient({ ...newIngredient, name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label='Cost per Gram ($)'
                type='number'
                value={newIngredient.costPerGram}
                onChange={e =>
                  setNewIngredient({
                    ...newIngredient,
                    costPerGram: parseFloat(e.target.value) || 0,
                  })
                }
                required
                inputProps={{ step: 0.0001 }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Source</InputLabel>
                <Select
                  value={newIngredient.source}
                  onChange={e =>
                    setNewIngredient({
                      ...newIngredient,
                      source: e.target.value as
                        | 'manual'
                        | 'kroger'
                        | 'estimated',
                    })
                  }
                >
                  <MenuItem value='manual'>Manual Entry</MenuItem>
                  <MenuItem value='estimated'>Estimated</MenuItem>
                  <MenuItem value='kroger'>Kroger API</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label='Brand'
                value={newIngredient.brand}
                onChange={e =>
                  setNewIngredient({ ...newIngredient, brand: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label='Size'
                value={newIngredient.size}
                onChange={e =>
                  setNewIngredient({ ...newIngredient, size: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Notes'
                multiline
                rows={2}
                value={newIngredient.notes}
                onChange={e =>
                  setNewIngredient({ ...newIngredient, notes: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddIngredient} variant='contained'>
            Add Ingredient
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
