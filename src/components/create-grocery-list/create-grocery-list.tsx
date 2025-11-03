import {
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  IconButton,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useContext, useState } from 'react';
import { RecipeContext } from '../recipes/recipe-context';
import { useGroceryList } from '../../contexts/grocery-list-context';
import { Ingredient, Recipe, MeasurementUnit } from '../../schemas/schemas';
import { ingredientCostDB } from '../../database/ingredient-costs';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';

// Price display component
const PriceDisplay = ({ groceryList }: { groceryList: Ingredient[] }) => {
  const calculateGroceryListCost = () => {
    if (groceryList.length === 0)
      return { totalCost: 0, breakdown: [], missingIngredients: [] };

    const ingredients = groceryList.map((ingredient: Ingredient) => ({
      name: ingredient.title,
      quantity: ingredient.quantity,
      measurement: ingredient.measurement as MeasurementUnit,
    }));

    return ingredientCostDB.calculateRecipeCost(ingredients);
  };

  const costData = calculateGroceryListCost();

  return (
    <Box sx={{ mb: 2 }}>
      {/* Total Cost Display */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          mb: costData.missingIngredients.length > 0 ? 2 : 0,
          backgroundColor: 'primary.light',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'primary.main',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* @ts-expect-error - color is not a valid prop for AttachMoneyIcon */}
          <AttachMoneyIcon color='text.primary' />
          <Typography variant='h6' fontWeight={600} color='text.primary'>
            Total Estimated Cost
          </Typography>
        </Box>
        <Typography
          variant='h5'
          fontWeight={700}
          color='text.primary'
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          ${costData.totalCost.toFixed(2)}
        </Typography>
      </Box>

      {/* Missing Ingredients Display */}
      {costData.missingIngredients.length > 0 && (
        <Box
          sx={{
            p: 2,
            backgroundColor: 'warning.light',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'warning.main',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography
              variant='subtitle1'
              fontWeight={600}
              color='text.primary'
            >
              ⚠️ Missing Price Data
            </Typography>
          </Box>
          <Typography variant='body2' color='text.primary' sx={{ mb: 1 }}>
            The following ingredients don't have pricing data and are not
            included in the total:
          </Typography>
          <Box>
            {costData.missingIngredients.map((ingredient, index) => (
              <Typography
                key={index}
                variant='body2'
                color='text.primary'
                sx={{ mb: 0.5 }}
              >
                • {ingredient}
              </Typography>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export function CreateGroceryList() {
  const { savedRecipes } = useContext(RecipeContext);
  const { addGroceryList } = useGroceryList();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [groceryList, setGroceryList] = useState<Ingredient[]>([]);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [saveListDialogOpen, setSaveListDialogOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [newItem, setNewItem] = useState({
    title: '',
    quantity: 1,
    measurement: MeasurementUnit.CUP,
  });
  const [batchMultiplier, setBatchMultiplier] = useState<{
    [recipeTitle: string]: number;
  }>({});

  // Track which recipes are already in the grocery list
  const getRecipeIngredients = (recipe: Recipe) => {
    return recipe.ingredients.map(
      ingredient => `${ingredient.title}-${ingredient.measurement}`
    );
  };

  const getRecipeCountInGroceryList = (recipe: Recipe) => {
    const recipeIngredients = getRecipeIngredients(recipe);
    const groceryListIngredients = groceryList.map(
      item => `${item.title}-${item.measurement}`
    );

    // Check if all recipe ingredients are in the grocery list
    const allIngredientsPresent = recipeIngredients.every(ingredient =>
      groceryListIngredients.includes(ingredient)
    );

    if (!allIngredientsPresent) {
      return {
        isInList: false,
        batchCount: 0,
        totalIngredients: recipeIngredients.length,
      };
    }

    // Calculate how many complete batches are in the grocery list
    let minBatchCount = Infinity;

    recipe.ingredients.forEach(recipeIngredient => {
      const groceryItem = groceryList.find(
        item =>
          item.title === recipeIngredient.title &&
          item.measurement === recipeIngredient.measurement
      );

      if (groceryItem) {
        const batchCount = Math.floor(
          groceryItem.quantity / recipeIngredient.quantity
        );
        minBatchCount = Math.min(minBatchCount, batchCount);
      }
    });

    return {
      isInList: allIngredientsPresent && minBatchCount > 0,
      batchCount: minBatchCount,
      totalIngredients: recipeIngredients.length,
    };
  };

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    const isSelected = selectedRecipes.some(r => r.title === recipe.title);
    if (isSelected) {
      setSelectedRecipes(prev => prev.filter(r => r.title !== recipe.title));
    } else {
      setSelectedRecipes(prev => [...prev, recipe]);
    }
  };

  const isRecipeSelected = (recipe: Recipe) => {
    return selectedRecipes.some(r => r.title === recipe.title);
  };

  const generateGroceryList = () => {
    // Combine all ingredients from selected recipes with batch multipliers
    const allIngredients = selectedRecipes.flatMap(recipe => {
      const multiplier = batchMultiplier[recipe.title] || 1;
      return recipe.ingredients.map(ingredient => ({
        ...ingredient,
        quantity: ingredient.quantity * multiplier,
      }));
    });

    // Create a map of existing ingredients for easy lookup
    const existingIngredients = new Map();
    groceryList.forEach(ingredient => {
      const key = `${ingredient.title}-${ingredient.measurement}`;
      existingIngredients.set(key, ingredient);
    });

    // Add new ingredients, combining with existing ones
    allIngredients.forEach(ingredient => {
      const key = `${ingredient.title}-${ingredient.measurement}`;
      if (existingIngredients.has(key)) {
        // Add quantities for existing ingredients
        const existing = existingIngredients.get(key);
        existing.quantity += ingredient.quantity;
      } else {
        // Add new ingredient
        existingIngredients.set(key, { ...ingredient });
      }
    });

    // Convert back to array
    const updatedGroceryList = Array.from(existingIngredients.values());
    setGroceryList(updatedGroceryList);

    // Close drawer and reset selection
    setDrawerOpen(false);
    setSelectedRecipes([]);
  };

  const handleDeleteItem = (index: number) => {
    setGroceryList(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (newItem.title.trim()) {
      const newIngredient: Ingredient = {
        _id: Date.now(), // Simple ID generation
        title: newItem.title.trim(),
        quantity: newItem.quantity,
        measurement: newItem.measurement,
      };
      setGroceryList(prev => [...prev, newIngredient]);
      setNewItem({ title: '', quantity: 1, measurement: MeasurementUnit.CUP });
      setAddItemDialogOpen(false);
    }
  };

  const handleCancelAdd = () => {
    setNewItem({ title: '', quantity: 1, measurement: MeasurementUnit.CUP });
    setAddItemDialogOpen(false);
  };

  const handleSaveList = () => {
    if (groceryList.length > 0) {
      const listNameToUse = listName.trim() || new Date().toLocaleString();
      addGroceryList({
        name: listNameToUse,
        items: groceryList,
      });
      setListName('');
      setGroceryList([]);
      setSaveListDialogOpen(false);
    }
  };

  const handleCancelSave = () => {
    setListName('');
    setSaveListDialogOpen(false);
  };

  const handleMultiplierChange = (recipeTitle: string, value: number) => {
    setBatchMultiplier(prev => ({
      ...prev,
      [recipeTitle]: Math.max(1, value),
    }));
  };

  const handleRemoveRecipeBatch = (recipe: Recipe) => {
    const recipeIngredients = recipe.ingredients;
    const updatedGroceryList = [...groceryList];

    // Remove one batch of each ingredient
    recipeIngredients.forEach(recipeIngredient => {
      const groceryItemIndex = updatedGroceryList.findIndex(
        item =>
          item.title === recipeIngredient.title &&
          item.measurement === recipeIngredient.measurement
      );

      if (groceryItemIndex !== -1) {
        const groceryItem = updatedGroceryList[groceryItemIndex];
        const newQuantity = groceryItem.quantity - recipeIngredient.quantity;

        if (newQuantity <= 0) {
          // Remove the item completely if quantity becomes 0 or negative
          updatedGroceryList.splice(groceryItemIndex, 1);
        } else {
          // Update the quantity
          updatedGroceryList[groceryItemIndex] = {
            ...groceryItem,
            quantity: newQuantity,
          };
        }
      }
    });

    setGroceryList(updatedGroceryList);
  };

  const drawerContent = (
    <Box
      sx={{
        width: 400,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant='h6' fontWeight={600}>
            Select Recipes for Grocery List
          </Typography>
          <IconButton onClick={() => toggleDrawer(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          {selectedRecipes.length} recipe
          {selectedRecipes.length !== 1 ? 's' : ''} selected
        </Typography>
      </Box>

      {/* Recipe List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List>
          {savedRecipes.map((recipe, index) => {
            const isSelected = isRecipeSelected(recipe);
            const recipeStatus = getRecipeCountInGroceryList(recipe);
            const currentMultiplier = batchMultiplier[recipe.title] || 1;
            return (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  onClick={() => handleRecipeSelect(recipe)}
                  selected={isSelected}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                    opacity: recipeStatus.isInList ? 0.7 : 1,
                    borderLeft: recipeStatus.isInList ? '4px solid' : 'none',
                    borderLeftColor: recipeStatus.isInList
                      ? 'success.main'
                      : 'transparent',
                  }}
                >
                  <ListItemIcon>
                    {recipe.image ? (
                      <Avatar
                        src={recipe.image}
                        sx={{ width: 40, height: 40 }}
                        variant='rounded'
                      />
                    ) : (
                      <Avatar
                        sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                      >
                        <RestaurantIcon />
                      </Avatar>
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography
                          variant='subtitle1'
                          color='text.primary'
                          flex={1}
                          fontWeight={600}
                        >
                          {recipe.title}
                        </Typography>
                        {recipeStatus.isInList && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Chip
                              label={`${recipeStatus.batchCount}x in list`}
                              size='small'
                              color='success'
                              variant='filled'
                            />
                            <Button
                              size='small'
                              onClick={e => {
                                e.stopPropagation();
                                handleRemoveRecipeBatch(recipe);
                              }}
                              color='error'
                              variant='outlined'
                              sx={{
                                minWidth: 'auto',
                                px: 1,
                                py: 0.5,
                                fontSize: '0.75rem',
                                '&:hover': {
                                  backgroundColor: 'error.light',
                                  color: 'white',
                                },
                              }}
                            >
                              -1
                            </Button>
                          </Box>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant='body2' color='text.primary' noWrap>
                          {recipe.description || 'No description'}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 0.5,
                            mt: 0.5,
                            alignItems: 'center',
                          }}
                        >
                          <Chip
                            label={`${recipe.ingredients.length} ingredients`}
                            size='small'
                            variant='outlined'
                          />

                          {isSelected && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                ml: 1,
                              }}
                            >
                              <IconButton
                                size='small'
                                onClick={e => {
                                  e.stopPropagation();
                                  handleMultiplierChange(
                                    recipe.title,
                                    currentMultiplier - 1
                                  );
                                }}
                                disabled={currentMultiplier <= 1}
                              >
                                <RemoveIcon fontSize='small' />
                              </IconButton>
                              <TextField
                                size='small'
                                value={currentMultiplier}
                                onChange={e => {
                                  const value = parseInt(e.target.value) || 1;
                                  handleMultiplierChange(recipe.title, value);
                                }}
                                inputProps={{
                                  min: 1,
                                  style: { textAlign: 'center', width: '40px' },
                                }}
                                sx={{ width: '60px' }}
                              />
                              <IconButton
                                size='small'
                                onClick={e => {
                                  e.stopPropagation();
                                  handleMultiplierChange(
                                    recipe.title,
                                    currentMultiplier + 1
                                  );
                                }}
                              >
                                <AddIcon fontSize='small' />
                              </IconButton>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                x{currentMultiplier}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer with Generate Button */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          variant='contained'
          fullWidth
          onClick={generateGroceryList}
          disabled={selectedRecipes.length === 0}
          startIcon={<AddIcon />}
          sx={{ mb: 1 }}
        >
          Generate Grocery List ({selectedRecipes.length})
        </Button>
        <Typography
          variant='caption'
          color='text.secondary'
          textAlign='center'
          display='block'
        >
          Selected recipes will be combined into a single grocery list
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom color='text.primary'>
        Create Grocery List
      </Typography>
      <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
        Select recipes to generate a combined grocery list with all ingredients.
      </Typography>

      {/* Grocery List Display */}
      {groceryList.length > 0 ? (
        <Card elevation={3} sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography variant='h5' fontWeight={600}>
                Saved Grocery Lists
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`${groceryList.length} items`}
                  color='primary'
                  variant='outlined'
                />
              </Box>
            </Box>

            {/* Add Buttons */}
            <Box
              sx={{
                mb: 2,
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={() => toggleDrawer(true)}
                  size='small'
                >
                  Add More Recipes
                </Button>
                <Button
                  variant='contained'
                  startIcon={<AddIcon />}
                  onClick={() => setAddItemDialogOpen(true)}
                  size='small'
                  color='secondary'
                >
                  Add Grocery Item
                </Button>
              </Box>
              <Button
                variant='contained'
                size='medium'
                onClick={() => setGroceryList([])}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                Clear
              </Button>
            </Box>

            {/* Total Price Display */}
            <PriceDisplay groceryList={groceryList} />

            {/* Save Button */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant='contained'
                onClick={() => setSaveListDialogOpen(true)}
                size='medium'
                color='success'
                disabled={groceryList.length === 0}
              >
                Save Grocery List
              </Button>
            </Box>
            <List>
              {groceryList.map((ingredient, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemButton sx={{ borderRadius: 2, mb: 1 }}>
                    <ListItemIcon>
                      <Avatar
                        sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}
                      >
                        <RestaurantIcon fontSize='small' />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={ingredient.title}
                      secondary={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mt: 0.5,
                          }}
                        >
                          <Chip
                            label={`${ingredient.quantity} ${ingredient.measurement}`}
                            size='small'
                            color='primary'
                            variant='outlined'
                          />
                          <Chip
                            label={`$${(() => {
                              const costData =
                                ingredientCostDB.calculateRecipeCost([
                                  {
                                    name: ingredient.title,
                                    quantity: ingredient.quantity,
                                    measurement: ingredient.measurement,
                                  },
                                ]);
                              return costData.totalCost.toFixed(2);
                            })()}`}
                            size='small'
                            color='success'
                            variant='filled'
                          />
                        </Box>
                      }
                    />
                    <IconButton
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteItem(index);
                      }}
                      color='error'
                      size='small'
                      sx={{
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'white',
                        },
                      }}
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      ) : (
        <Card elevation={2}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <RestaurantIcon
              sx={{ fontSize: 64, color: 'primary.main', mb: 2 }}
            />
            <Typography variant='h6' gutterBottom>
              Start Building Your Grocery List
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Choose from your saved recipes to create a comprehensive shopping
              list.
            </Typography>
            <Button
              variant='contained'
              size='large'
              onClick={() => toggleDrawer(true)}
              startIcon={<AddIcon />}
              disabled={savedRecipes.length === 0}
            >
              {savedRecipes.length === 0
                ? 'No Recipes Available'
                : 'Select Recipes'}
            </Button>
            {savedRecipes.length === 0 && (
              <Typography
                variant='caption'
                color='text.secondary'
                display='block'
                sx={{ mt: 2 }}
              >
                Add some recipes first to create a grocery list
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      <Drawer
        anchor='left'
        open={drawerOpen}
        onClose={() => toggleDrawer(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'background.paper',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Add Grocery Item Dialog */}
      <Dialog
        open={addItemDialogOpen}
        onClose={handleCancelAdd}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Add Grocery Item</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label='Item Name'
              value={newItem.title}
              onChange={e =>
                setNewItem(prev => ({ ...prev, title: e.target.value }))
              }
              placeholder='e.g., Milk, Bread, Eggs'
              variant='outlined'
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label='Quantity'
                type='number'
                value={newItem.quantity}
                onChange={e =>
                  setNewItem(prev => ({
                    ...prev,
                    quantity: parseFloat(e.target.value) || 1,
                  }))
                }
                inputProps={{ min: 0.1, step: 0.1 }}
                sx={{ flex: 1 }}
              />
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Measurement</InputLabel>
                <Select
                  value={newItem.measurement}
                  onChange={e =>
                    setNewItem(prev => ({
                      ...prev,
                      measurement: e.target.value as MeasurementUnit,
                    }))
                  }
                  label='Measurement'
                >
                  <MenuItem value={MeasurementUnit.CUP}>Cup</MenuItem>
                  <MenuItem value={MeasurementUnit.TABLESPOON}>
                    Tablespoon
                  </MenuItem>
                  <MenuItem value={MeasurementUnit.TEASPOON}>Teaspoon</MenuItem>
                  <MenuItem value={MeasurementUnit.LB}>Pound</MenuItem>
                  <MenuItem value={MeasurementUnit.OZ}>Ounce</MenuItem>
                  <MenuItem value={MeasurementUnit.GRAM}>Gram</MenuItem>
                  <MenuItem value={MeasurementUnit.KILOGRAM}>Kilogram</MenuItem>
                  <MenuItem value={MeasurementUnit.WHOLE}>Whole</MenuItem>
                  <MenuItem value={MeasurementUnit.CAN}>Can</MenuItem>
                  <MenuItem value={MeasurementUnit.BOTTLE}>Bottle</MenuItem>
                  <MenuItem value={MeasurementUnit.STICK}>Stick</MenuItem>
                  <MenuItem value={MeasurementUnit.PINT}>Pint</MenuItem>
                  <MenuItem value={MeasurementUnit.QUART}>Quart</MenuItem>
                  <MenuItem value={MeasurementUnit.GALLON}>Gallon</MenuItem>
                  <MenuItem value={MeasurementUnit.MILLILITER}>
                    Milliliter
                  </MenuItem>
                  <MenuItem value={MeasurementUnit.LITER}>Liter</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAdd}>Cancel</Button>
          <Button
            onClick={handleAddItem}
            variant='contained'
            disabled={!newItem.title.trim()}
          >
            Add Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Grocery List Dialog */}
      <Dialog
        open={saveListDialogOpen}
        onClose={handleCancelSave}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Save Grocery List</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label='List Name (Optional)'
              value={listName}
              onChange={e => setListName(e.target.value)}
              placeholder='e.g., Weekly Shopping, Party Prep, Holiday Dinner'
              variant='outlined'
              helperText={`${groceryList.length} items will be saved. Leave blank to use current date & time.`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSave}>Cancel</Button>
          <Button onClick={handleSaveList} variant='contained'>
            Save List
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
