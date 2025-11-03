import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore,
  Search,
  Refresh,
  Storage,
  TrendingUp,
  Warning,
  CheckCircle,
  Info,
  Add,
  Delete,
  Save,
  Cancel,
} from '@mui/icons-material';
import { ingredientCostDB } from '../../database/ingredient-costs';
import { useKroger } from '../../contexts/kroger-context';
import { krogerAPI, KrogerProductSummary } from '../../services/kroger-api';

export const TestDB: React.FC = () => {
  const [dbStats, setDbStats] = useState<{
    totalIngredients: number;
    sources: Record<string, number>;
    lastSync: Date | null;
  } | null>(null);
  const [ingredients, setIngredients] = useState<
    Array<{
      id: string;
      name: string;
      costPerGram: number;
      source: string;
      lastUpdated: Date;
      brand?: string;
      size?: string;
    }>
  >([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<KrogerProductSummary[]>(
    []
  );
  const [searching, setSearching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualIngredient, setManualIngredient] = useState({
    name: '',
    costPerGram: 0,
    brand: '',
    size: '',
  });
  const { isConnected, isFetchingCosts, completeIngredientDatabase } =
    useKroger();

  const loadData = () => {
    setLoading(true);
    try {
      const stats = ingredientCostDB.getStats();
      const allIngredients = ingredientCostDB.getAllIngredients();

      setDbStats(stats);
      setIngredients(allIngredients);
    } catch (error) {
      console.error('Error loading database data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'kroger':
        return 'primary';
      case 'manual':
        return 'success';
      case 'estimated':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'kroger':
        return '🛒';
      case 'manual':
        return '✏️';
      case 'estimated':
        return '📊';
      default:
        return '❓';
    }
  };

  // Search for ingredients using Kroger API
  const searchIngredients = async () => {
    if (!ingredientSearchTerm.trim()) return;

    setSearching(true);
    try {
      const results = await krogerAPI.searchProducts({
        term: ingredientSearchTerm,
        locationId: '01400943',
        limit: 10,
      });
      setSearchResults(results.products);
    } catch (error) {
      console.error('Error searching ingredients:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Add ingredient from Kroger search results
  const addIngredientFromKroger = async (product: KrogerProductSummary) => {
    try {
      // Use the kroger-api's improved weight parsing
      const weightInGrams = krogerAPI.parseWeightFromSize(
        product.size,
        product.description
      );

      if (weightInGrams instanceof Error || weightInGrams <= 0) {
        alert(
          'Could not determine weight from product size. Please add manually.'
        );
        return;
      }

      const costPerGram = product.price?.regular
        ? product.price.regular / (weightInGrams as number)
        : 0;
      const ingredientCost = {
        id: `kroger_${product.productId}_${Date.now()}`,
        name: product.description,
        costPerGram,
        source: 'kroger' as const,
        lastUpdated: new Date(),
        brand: product.brand,
        size: product.size,
      };

      ingredientCostDB.addOrUpdateIngredientCost(ingredientCost);
      loadData();
      alert(`Added ${product.description} to database`);
    } catch (error) {
      console.error('Error adding ingredient:', error);
      alert('Failed to add ingredient');
    }
  };

  // Add manual ingredient
  const addManualIngredient = () => {
    if (!manualIngredient.name || manualIngredient.costPerGram <= 0) {
      alert('Please fill in name and cost per gram');
      return;
    }

    const ingredientCost = {
      id: `manual_${Date.now()}`,
      name: manualIngredient.name,
      costPerGram: manualIngredient.costPerGram,
      source: 'manual' as const,
      lastUpdated: new Date(),
      brand: manualIngredient.brand,
      size: manualIngredient.size,
    };

    ingredientCostDB.addIngredientCost(ingredientCost);
    loadData();
    setManualIngredient({ name: '', costPerGram: 0, brand: '', size: '' });
    setShowAddForm(false);
    alert(`Added ${manualIngredient.name} to database`);
  };

  // Remove ingredient
  const removeIngredient = (ingredientId: string, ingredientName: string) => {
    if (
      window.confirm(`Are you sure you want to remove "${ingredientName}"?`)
    ) {
      const removed = ingredientCostDB.removeIngredient(ingredientId);
      if (removed) {
        loadData();
        alert(`Removed "${ingredientName}" from database`);
      } else {
        alert('Failed to remove ingredient');
      }
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant='h4'
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          color='text.primary'
        >
          Ingredient Cost Database
        </Typography>
        <Typography variant='subtitle1' color='text.secondary'>
          Visual representation of the cached ingredient cost database
        </Typography>
      </Box>

      {/* Database Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
              >
                <Storage color='primary' />
                <Typography variant='h6'>Total Ingredients</Typography>
              </Box>
              <Typography variant='h3' color='primary'>
                {dbStats?.totalIngredients || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
              >
                <TrendingUp color='success' />
                <Typography variant='h6'>Kroger Data</Typography>
              </Box>
              <Typography variant='h3' color='success.main'>
                {dbStats?.sources?.kroger || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
              >
                <CheckCircle color='info' />
                <Typography variant='h6'>Manual Data</Typography>
              </Box>
              <Typography variant='h3' color='info.main'>
                {dbStats?.sources?.manual || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
              >
                <Warning color='warning' />
                <Typography variant='h6'>Estimated Data</Typography>
              </Box>
              <Typography variant='h3' color='warning.main'>
                {dbStats?.sources?.estimated || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Alerts */}
      <Box sx={{ mb: 3 }}>
        {isConnected ? (
          <Alert severity='success' sx={{ mb: 1 }}>
            ✅ Kroger API Connected - Real-time data available
          </Alert>
        ) : (
          <Alert severity='warning' sx={{ mb: 1 }}>
            ⚠️ Kroger API Disconnected - Using cached data only
          </Alert>
        )}

        {isFetchingCosts && (
          <Alert severity='info' sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              {isFetchingCosts
                ? 'Completing ingredient database...'
                : 'Fetching latest ingredient costs from Kroger...'}
            </Box>
          </Alert>
        )}

        {dbStats?.lastSync && (
          <Alert severity='info'>
            <Info sx={{ mr: 1 }} />
            Last updated: {new Date(dbStats.lastSync).toLocaleString()}
          </Alert>
        )}
      </Box>

      {/* Search and Controls */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <TextField
          placeholder='Search ingredients...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        <Button variant='outlined' startIcon={<Refresh />} onClick={loadData}>
          Refresh Data
        </Button>
        <Button
          variant='outlined'
          color='warning'
          onClick={() => {
            const result = ingredientCostDB.removeDuplicates();
            alert(
              `Removed ${result.removed} duplicates, kept ${result.kept} ingredients`
            );
            loadData();
          }}
          sx={{ minWidth: 150 }}
        >
          🗑️ Remove Duplicates
        </Button>
        <Button
          variant='outlined'
          color='error'
          onClick={() => {
            if (
              window.confirm(
                '⚠️ Are you sure you want to wipe the entire database? This will delete ALL ingredient data and cannot be undone!'
              )
            ) {
              if (
                window.confirm(
                  '🚨 FINAL WARNING: This will permanently delete all ingredient cost data. Continue?'
                )
              ) {
                ingredientCostDB.clear();
                loadData();
                alert('🗑️ Database wiped successfully!');
              }
            }
          }}
          sx={{ minWidth: 150 }}
        >
          🧹 Wipe Database
        </Button>
        <Button
          variant='outlined'
          color='info'
          onClick={async () => {
            console.log('🍉 Testing watermelon search...');
            try {
              const results = await krogerAPI.searchProducts({
                term: 'watermelon',
                locationId: '01400943',
                limit: 10,
              });
              console.log('🍉 Watermelon search results:', results);
              console.log(
                `Found ${results.products.length} watermelon products:`
              );
              results.products.forEach((product, index) => {
                console.log(
                  `${index + 1}. ${product.brand} ${product.description}`
                );
                console.log(
                  `   Size: "${product.size}" | Price: $${
                    product.price?.regular || 'N/A'
                  }`
                );
                console.log(
                  `   Availability: ${JSON.stringify(product.availability)}`
                );
              });
              alert(
                `Found ${results.products.length} watermelon products - check console for details`
              );
            } catch (error) {
              console.error('❌ Watermelon search failed:', error);
              alert('Watermelon search failed - check console for details');
            }
          }}
          sx={{ minWidth: 150 }}
        >
          🍉 Test Watermelon
        </Button>
        <Button
          variant='outlined'
          color='secondary'
          onClick={async () => {
            console.log('🔍 Testing watermelon count-based searches...');
            const searchTerms = [
              'watermelon',
              'whole watermelon',
              'seedless watermelon',
              'watermelon 1 ct',
              'watermelon each',
            ];

            for (const term of searchTerms) {
              try {
                console.log(`\n🔍 Searching for: "${term}"`);
                const results = await krogerAPI.searchProducts({
                  term: term,
                  locationId: '01400943',
                  limit: 3,
                });

                console.log(
                  `Found ${results.products.length} products for "${term}":`
                );
                results.products.forEach((product, index) => {
                  console.log(
                    `  ${index + 1}. ${product.brand} ${product.description}`
                  );
                  console.log(
                    `     Size: "${product.size}" | Price: $${
                      product.price?.regular || 'N/A'
                    }`
                  );

                  // Test weight parsing for count-based items
                  if (product.size) {
                    console.log(`     Size analysis: "${product.size}"`);
                    const hasCount = /(\d+)\s*(ct|count|each|whole)/i.test(
                      product.size
                    );
                    const hasWhole = product.size
                      .toLowerCase()
                      .includes('whole');
                    console.log(`     Contains count indicator: ${hasCount}`);
                    console.log(`     Contains 'whole': ${hasWhole}`);

                    if (hasCount || hasWhole) {
                      console.log(
                        `     ✅ This is a count-based watermelon (~2000g each)`
                      );
                      console.log(
                        `     💰 Cost per gram: $${
                          (product.price?.regular || 0) / 2000
                        }`
                      );
                    } else {
                      console.log(
                        `     ❓ Not clearly count-based, may need weight parsing`
                      );
                    }
                  }
                });

                if (results.products.length > 0) {
                  console.log(`✅ Found results for "${term}"`);
                  break;
                }
              } catch (error) {
                console.error(`❌ Search failed for "${term}":`, error);
              }
            }

            alert(
              'Watermelon count analysis complete - check console for details'
            );
          }}
          sx={{ minWidth: 150 }}
        >
          🔍 Count Analysis
        </Button>
        <Button
          variant='outlined'
          color='success'
          onClick={() => {
            console.log('🧈 Testing butter stick conversion...');

            // Test 1 stick of butter conversion
            const grams = ingredientCostDB.convertToGrams(1, 'stick', 'butter');
            console.log(`1 stick of butter = ${grams} grams`);

            // Test 2 sticks of butter
            const grams2 = ingredientCostDB.convertToGrams(
              2,
              'stick',
              'butter'
            );
            console.log(`2 sticks of butter = ${grams2} grams`);

            // Test with different butter names
            const butterNames = [
              'butter',
              'unsalted butter',
              'salted butter',
              'sweet butter',
            ];
            butterNames.forEach(name => {
              const testGrams = ingredientCostDB.convertToGrams(
                1,
                'stick',
                name
              );
              console.log(`1 stick of ${name} = ${testGrams} grams`);
            });

            // Test recipe cost calculation with butter
            const testIngredients = [
              { name: 'butter', quantity: 1, measurement: 'stick' },
              { name: 'flour', quantity: 2, measurement: 'cup' },
              { name: 'sugar', quantity: 1, measurement: 'cup' },
            ];

            const costData =
              ingredientCostDB.calculateRecipeCost(testIngredients);
            console.log('Recipe cost test with 1 stick butter:', costData);

            alert(
              `Butter stick test complete!\n1 stick = ${grams}g\n2 sticks = ${grams2}g\nCheck console for full details`
            );
          }}
          sx={{ minWidth: 150 }}
        >
          🧈 Test Butter Stick
        </Button>
        <Button
          variant='outlined'
          color='info'
          onClick={() => {
            console.log('🧪 Testing new baking ingredients...');

            // Test vanilla extract
            const vanillaGrams = ingredientCostDB.convertToGrams(
              1,
              'teaspoon',
              'vanilla extract'
            );
            console.log(`1 teaspoon vanilla extract = ${vanillaGrams} grams`);
            console.log(`Expected: 1 tsp = 1/48 cup = ${240 / 48} = 5g`);

            // Test baking powder
            const bakingPowderGrams = ingredientCostDB.convertToGrams(
              1,
              'teaspoon',
              'baking powder'
            );
            console.log(
              `1 teaspoon baking powder = ${bakingPowderGrams} grams`
            );
            console.log(`Expected: 1 tsp = 1/48 cup = ${200 / 48} = 4.17g`);

            // Test cinnamon
            const cinnamonGrams = ingredientCostDB.convertToGrams(
              1,
              'teaspoon',
              'cinnamon'
            );
            console.log(`1 teaspoon cinnamon = ${cinnamonGrams} grams`);
            console.log(`Expected: 1 tsp = 1/48 cup = ${120 / 48} = 2.5g`);

            // Test recipe with new ingredients
            const testIngredients = [
              { name: 'vanilla extract', quantity: 1, measurement: 'teaspoon' },
              { name: 'baking powder', quantity: 1, measurement: 'teaspoon' },
              { name: 'cinnamon', quantity: 1, measurement: 'teaspoon' },
              { name: 'butter', quantity: 1, measurement: 'stick' },
              { name: 'flour', quantity: 2, measurement: 'cup' },
            ];

            const costData =
              ingredientCostDB.calculateRecipeCost(testIngredients);
            console.log('Recipe cost test with new ingredients:', costData);

            // Test different extract types
            const extractTypes = [
              'vanilla extract',
              'almond extract',
              'lemon extract',
              'mint extract',
              'orange extract',
            ];

            extractTypes.forEach(extract => {
              const grams = ingredientCostDB.convertToGrams(
                1,
                'teaspoon',
                extract
              );
              console.log(`1 teaspoon ${extract} = ${grams} grams`);
            });

            alert(
              `New ingredients test complete!\nVanilla: ${vanillaGrams}g\nBaking powder: ${bakingPowderGrams}g\nCinnamon: ${cinnamonGrams}g\nCheck console for full details`
            );
          }}
          sx={{ minWidth: 150 }}
        >
          🧪 Test New Ingredients
        </Button>
        <Button
          variant='outlined'
          color='warning'
          onClick={() => {
            console.log('🍉 Testing watermelon cost calculation...');

            // Test watermelon conversion
            console.log('Testing watermelon conversion with debug info...');
            const watermelonGrams = ingredientCostDB.convertToGrams(
              4,
              'whole',
              'watermelon'
            );
            console.log(`4 whole watermelons = ${watermelonGrams} grams`);
            console.log(`Expected: 4 × 10,000g = 40,000g`);

            // Test with different measurements
            const watermelonGrams2 = ingredientCostDB.convertToGrams(
              1,
              'whole',
              'watermelon'
            );
            console.log(`1 whole watermelon = ${watermelonGrams2} grams`);

            const watermelonGrams3 = ingredientCostDB.convertToGrams(
              1,
              'piece',
              'watermelon'
            );
            console.log(`1 piece watermelon = ${watermelonGrams3} grams`);

            // Test cost calculation
            const testIngredients = [
              { name: 'watermelon', quantity: 4, measurement: 'whole' },
            ];

            const costData =
              ingredientCostDB.calculateRecipeCost(testIngredients);
            console.log('Watermelon cost test:', costData);

            // Check if watermelon cost exists in database
            const watermelonCost = ingredientCostDB.getCostByName('watermelon');
            if (watermelonCost) {
              console.log('Watermelon cost data:', watermelonCost);
              console.log(`Cost per gram: $${watermelonCost.costPerGram}`);
              console.log(
                `Total cost for 4 watermelons: $${
                  watermelonCost.costPerGram * watermelonGrams
                }`
              );
            } else {
              console.log('No watermelon cost data found in database');
            }

            alert(
              `Watermelon test complete!\n4 watermelons = ${watermelonGrams}g\nCheck console for cost details`
            );
          }}
          sx={{ minWidth: 150 }}
        >
          🍉 Test Watermelon Cost
        </Button>
        {isConnected && (
          <Button
            variant='contained'
            color='primary'
            startIcon={<Storage />}
            onClick={() => completeIngredientDatabase('01400943')}
            disabled={isFetchingCosts}
            sx={{ minWidth: 200 }}
          >
            {isFetchingCosts ? 'Completing Database...' : 'Complete Database'}
          </Button>
        )}
      </Box>

      {/* Ingredient Management */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant='h6'>🔧 Ingredient Management</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {/* Search and Add from Kroger */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    🔍 Search & Add from Kroger
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      placeholder='Search for ingredients...'
                      value={ingredientSearchTerm}
                      onChange={e => setIngredientSearchTerm(e.target.value)}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      variant='contained'
                      onClick={searchIngredients}
                      disabled={searching || !ingredientSearchTerm.trim()}
                      startIcon={
                        searching ? <CircularProgress size={16} /> : <Search />
                      }
                    >
                      Search
                    </Button>
                  </Box>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      <Typography variant='subtitle2' gutterBottom>
                        Search Results ({searchResults.length}):
                      </Typography>
                      {searchResults.map((product, index) => (
                        <Card key={index} sx={{ mb: 1, p: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Box>
                              <Typography variant='body2' fontWeight={500}>
                                {product.brand} {product.description}
                              </Typography>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                Size: {product.size} | Price: $
                                {product.price?.regular || 'N/A'}
                              </Typography>
                            </Box>
                            <Button
                              size='small'
                              variant='outlined'
                              startIcon={<Add />}
                              onClick={() => addIngredientFromKroger(product)}
                            >
                              Add
                            </Button>
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Manual Add */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant='h6'>
                      ✏️ Add Manual Ingredient
                    </Typography>
                    <Button
                      variant={showAddForm ? 'outlined' : 'contained'}
                      onClick={() => setShowAddForm(!showAddForm)}
                      startIcon={showAddForm ? <Cancel /> : <Add />}
                    >
                      {showAddForm ? 'Cancel' : 'Add Manual'}
                    </Button>
                  </Box>

                  {showAddForm && (
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      <TextField
                        label='Ingredient Name'
                        value={manualIngredient.name}
                        onChange={e =>
                          setManualIngredient(prev => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        fullWidth
                      />
                      <TextField
                        label='Cost per Gram ($)'
                        type='number'
                        value={manualIngredient.costPerGram}
                        onChange={e =>
                          setManualIngredient(prev => ({
                            ...prev,
                            costPerGram: parseFloat(e.target.value) || 0,
                          }))
                        }
                        fullWidth
                        inputProps={{ step: 0.000001 }}
                      />
                      <TextField
                        label='Brand (optional)'
                        value={manualIngredient.brand}
                        onChange={e =>
                          setManualIngredient(prev => ({
                            ...prev,
                            brand: e.target.value,
                          }))
                        }
                        fullWidth
                      />
                      <TextField
                        label='Size (optional)'
                        value={manualIngredient.size}
                        onChange={e =>
                          setManualIngredient(prev => ({
                            ...prev,
                            size: e.target.value,
                          }))
                        }
                        fullWidth
                      />
                      <Button
                        variant='contained'
                        onClick={addManualIngredient}
                        startIcon={<Save />}
                        fullWidth
                      >
                        Add to Database
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Data Visualization */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant='h6'>
            📊 Database Contents ({filteredIngredients.length} ingredients)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ingredient</TableCell>
                  <TableCell align='right'>Cost/Gram</TableCell>
                  <TableCell align='right'>Cost/Lb</TableCell>
                  <TableCell align='right'>Cost/Oz</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell align='right'>Last Updated</TableCell>
                  <TableCell align='center'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredIngredients.map((ingredient, index) => (
                  <TableRow key={ingredient.id || index}>
                    <TableCell>
                      <Typography variant='body2' fontWeight={500}>
                        {ingredient.name}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' fontFamily='monospace'>
                        ${ingredient.costPerGram.toFixed(6)}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' fontFamily='monospace'>
                        ${(ingredient.costPerGram * 453.592).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' fontFamily='monospace'>
                        ${(ingredient.costPerGram * 28.3495).toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ingredient.source}
                        color={getSourceColor(ingredient.source)}
                        size='small'
                        icon={<span>{getSourceIcon(ingredient.source)}</span>}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'>
                        {ingredient.brand || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary'>
                        {ingredient.size || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='caption' color='text.secondary'>
                        {new Date(ingredient.lastUpdated).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Button
                        size='small'
                        color='error'
                        startIcon={<Delete />}
                        onClick={() =>
                          removeIngredient(ingredient.id, ingredient.name)
                        }
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Cost Distribution Chart */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant='h6'>📈 Cost Distribution Analysis</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {['kroger', 'manual', 'estimated'].map(source => {
              const sourceIngredients = ingredients.filter(
                ing => ing.source === source
              );
              const avgCost =
                sourceIngredients.length > 0
                  ? sourceIngredients.reduce(
                      (sum, ing) => sum + ing.costPerGram,
                      0
                    ) / sourceIngredients.length
                  : 0;

              return (
                <Grid item xs={12} md={4} key={source}>
                  <Card>
                    <CardContent>
                      <Typography variant='h6' gutterBottom>
                        {getSourceIcon(source)} {source.toUpperCase()} Data
                      </Typography>
                      <Typography variant='h4' color='primary'>
                        {sourceIngredients.length}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        ingredients
                      </Typography>
                      {avgCost > 0 && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant='body2'>
                            Avg: ${avgCost.toFixed(6)}/gram
                          </Typography>
                          <Typography variant='body2'>
                            ${(avgCost * 453.592).toFixed(2)}/lb
                          </Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Database Health */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant='h6'>🔍 Database Health Check</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Data Freshness
                  </Typography>
                  {dbStats?.lastSync ? (
                    <Box>
                      <Typography variant='body2' color='text.secondary'>
                        Last sync: {new Date(dbStats.lastSync).toLocaleString()}
                      </Typography>
                      <LinearProgress
                        variant='determinate'
                        value={Math.min(
                          100,
                          ((Date.now() - new Date(dbStats.lastSync).getTime()) /
                            (24 * 60 * 60 * 1000)) *
                            100
                        )}
                        sx={{ mt: 1 }}
                      />
                      <Typography variant='caption' color='text.secondary'>
                        {Math.round(
                          (Date.now() - new Date(dbStats.lastSync).getTime()) /
                            (60 * 60 * 1000)
                        )}{' '}
                        hours ago
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant='body2' color='error'>
                      No sync data available
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant='h6' gutterBottom>
                    Coverage Analysis
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total ingredients: {dbStats?.totalIngredients || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Kroger coverage:{' '}
                    {Math.round(
                      ((dbStats?.sources?.kroger || 0) /
                        (dbStats?.totalIngredients || 1)) *
                        100
                    )}
                    %
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Manual entries: {dbStats?.sources?.manual || 0}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Estimated entries: {dbStats?.sources?.estimated || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
