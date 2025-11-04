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
  alpha,
  keyframes,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import { SearchIngredientDialog } from '../recipes/dialogs/search-ingredient-dialog';
import { pluralizeMeasurement } from '../../helpers/helpers';

// Animation keyframes
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled Components
const ModernCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 3,
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
  transition: 'all 0.3s ease',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  '&:hover': {
    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.12)}`,
    transform: 'translateY(-2px)',
  },
  animation: `${fadeInUp} 0.5s ease-out`,
}));

const PriceCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(
    theme.palette.primary.main,
    0.1
  )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: alpha(theme.palette.primary.main, 0.4),
    boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
}));

const WarningBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  background: `linear-gradient(135deg, ${alpha(
    theme.palette.warning.main,
    0.1
  )} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
  animation: `${fadeInUp} 0.5s ease-out`,
}));

const ModernListItem = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  marginBottom: theme.spacing(1),
  transition: 'all 0.3s ease',
  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'translateX(4px)',
    borderColor: alpha(theme.palette.primary.main, 0.3),
    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
  },
}));

const PrimaryButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1.25, 3),
  transition: 'all 0.3s ease',
  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

const EmptyStateCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 3,
  padding: theme.spacing(6),
  textAlign: 'center',
  background: `linear-gradient(135deg, ${alpha(
    theme.palette.background.paper,
    0.8
  )} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
  border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
  transition: 'all 0.3s ease',
  animation: `${fadeInUp} 0.5s ease-out`,
  '&:hover': {
    borderColor: alpha(theme.palette.primary.main, 0.5),
    background: `linear-gradient(135deg, ${alpha(
      theme.palette.background.paper,
      0.9
    )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
  },
}));

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
      <PriceCard>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: theme =>
                `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.2
                )} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
            }}
          >
            <AttachMoneyIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          </Box>
          <Box>
            <Typography
              variant='body2'
              color='text.primary'
              sx={{ mb: 0.5, fontWeight: 500 }}
            >
              Total Estimated Cost
            </Typography>
            <Typography variant='h4' fontWeight={700} color='primary.main'>
              ${costData.totalCost.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </PriceCard>

      {/* Missing Ingredients Display */}
      {costData.missingIngredients.length > 0 && (
        <WarningBox>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Typography
              variant='subtitle1'
              fontWeight={600}
              color='warning.dark'
            >
              ⚠️ Missing Price Data
            </Typography>
          </Box>
          <Typography variant='body2' color='text.primary' sx={{ mb: 1.5 }}>
            The following ingredients don't have pricing data and are not
            included in the total:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {costData.missingIngredients.map((ingredient, index) => (
              <Chip
                key={index}
                label={ingredient}
                size='small'
                sx={{
                  backgroundColor: theme =>
                    alpha(theme.palette.warning.main, 0.1),
                  color: 'warning.dark',
                  border: theme =>
                    `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                }}
              />
            ))}
          </Box>
        </WarningBox>
      )}
    </Box>
  );
};

const STORAGE_KEY = 'createGroceryListState';

interface PersistedState {
  selectedRecipes: Recipe[];
  groceryList: Ingredient[];
  batchMultiplier: { [recipeTitle: string]: number };
  listName: string;
}

export function CreateGroceryList() {
  const { savedRecipes } = useContext(RecipeContext);
  const { addGroceryList, getGroceryList, updateGroceryList } =
    useGroceryList();
  const location = useLocation();
  const navigate = useNavigate();

  // Check for edit parameter in URL
  const searchParams = new URLSearchParams(location.search);
  const editId = searchParams.get('edit');

  // Load persisted state from localStorage or edit mode
  const loadInitialState = (): PersistedState => {
    // If editing, load from saved grocery list
    if (editId) {
      const savedList = getGroceryList(editId);
      if (savedList) {
        return {
          selectedRecipes: [], // Recipes aren't saved in grocery list
          groceryList: savedList.items,
          batchMultiplier: {},
          listName: savedList.name,
        };
      }
    }

    // Otherwise, try to load from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading create grocery list state:', error);
    }

    return {
      selectedRecipes: [],
      groceryList: [],
      batchMultiplier: {},
      listName: '',
    };
  };

  const initialState = loadInitialState();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>(
    initialState.selectedRecipes
  );
  const [groceryList, setGroceryList] = useState<Ingredient[]>(
    initialState.groceryList
  );
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [saveListDialogOpen, setSaveListDialogOpen] = useState(false);
  const [listName, setListName] = useState(initialState.listName);
  const [newItem, setNewItem] = useState({
    title: '',
    quantity: 1,
    measurement: MeasurementUnit.CUP,
  });
  const [batchMultiplier, setBatchMultiplier] = useState<{
    [recipeTitle: string]: number;
  }>(initialState.batchMultiplier);
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editItem, setEditItem] = useState({
    title: '',
    quantity: 1,
    measurement: MeasurementUnit.CUP,
  });
  const [searchIngredientDialogOpen, setSearchIngredientDialogOpen] =
    useState(false);
  const [ingredientToSearch, setIngredientToSearch] = useState<{
    ingredient: string;
    quantity: number;
    measurement: string;
  } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [exitEditDialogOpen, setExitEditDialogOpen] = useState(false);
  const [originalListState, setOriginalListState] = useState<{
    listName: string;
    groceryList: Ingredient[];
  } | null>(null);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    // Don't persist if we're in edit mode (we'll save when user explicitly saves)
    if (editId) return;

    try {
      const stateToPersist: PersistedState = {
        selectedRecipes,
        groceryList,
        batchMultiplier,
        listName,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch (error) {
      console.error('Error saving create grocery list state:', error);
    }
  }, [selectedRecipes, groceryList, batchMultiplier, listName, editId]);

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

  const handleEditItem = (index: number) => {
    const item = groceryList[index];
    setEditingItemIndex(index);
    setEditItem({
      title: item.title,
      quantity: item.quantity,
      measurement: item.measurement,
    });
    setEditItemDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingItemIndex !== null) {
      setGroceryList(prev =>
        prev.map((item, index) =>
          index === editingItemIndex
            ? {
                ...item,
                title: editItem.title.trim(),
                quantity: editItem.quantity,
                measurement: editItem.measurement,
              }
            : item
        )
      );
      setEditItemDialogOpen(false);
      setEditingItemIndex(null);
      setEditItem({ title: '', quantity: 1, measurement: MeasurementUnit.CUP });
    }
  };

  const handleCancelEdit = () => {
    setEditItemDialogOpen(false);
    setEditingItemIndex(null);
    setEditItem({ title: '', quantity: 1, measurement: MeasurementUnit.CUP });
  };

  const handleSearchIngredient = (ingredient: Ingredient) => {
    setIngredientToSearch({
      ingredient: ingredient.title,
      quantity: ingredient.quantity,
      measurement: ingredient.measurement,
    });
    setSearchIngredientDialogOpen(true);
  };

  const handleIngredientSearchSuccess = () => {
    setSearchIngredientDialogOpen(false);
    setIngredientToSearch(null);
    // Force re-render by updating a version counter or just let it naturally update
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

  // Check for unsaved changes when in edit mode
  const hasUnsavedChanges = useCallback(() => {
    if (!editId || !isEditMode || !originalListState) return false;

    return (
      listName !== originalListState.listName ||
      JSON.stringify(groceryList) !==
        JSON.stringify(originalListState.groceryList)
    );
  }, [editId, isEditMode, originalListState, listName, groceryList]);

  // Handle exiting edit mode with confirmation
  const handleExitEditMode = useCallback(() => {
    if (hasUnsavedChanges()) {
      setExitEditDialogOpen(true);
    } else {
      // No changes, exit edit mode directly
      setIsEditMode(false);
      setOriginalListState(null);
    }
  }, [hasUnsavedChanges]);

  // Handle exit edit confirmation - discard changes
  const handleExitEditConfirm = () => {
    setExitEditDialogOpen(false);
    // Restore original state
    if (originalListState) {
      setListName(originalListState.listName);
      setGroceryList(originalListState.groceryList);
    }
    setIsEditMode(false);
    setOriginalListState(null);
  };

  // Handle exit edit with save
  const handleExitEditSave = () => {
    setExitEditDialogOpen(false);
    // Save the changes
    handleSaveList();
    setIsEditMode(false);
    setOriginalListState(null);
  };

  // Handle exit edit cancel
  const handleExitEditCancel = () => {
    setExitEditDialogOpen(false);
  };

  const handleSaveList = () => {
    if (groceryList.length > 0) {
      const listNameToUse = listName.trim() || new Date().toLocaleString();

      // Extract recipe titles from selected recipes
      const recipeTitles = selectedRecipes.map(recipe => recipe.title);

      if (editId) {
        // Update existing list
        updateGroceryList(editId, {
          name: listNameToUse,
          items: groceryList,
          recipeTitles: recipeTitles.length > 0 ? recipeTitles : undefined,
        });
        // Navigate back to saved lists
        navigate('/saved-grocery-lists');
      } else {
        // Create new list
        addGroceryList({
          name: listNameToUse,
          items: groceryList,
          recipeTitles: recipeTitles.length > 0 ? recipeTitles : undefined,
        });
        // Navigate to saved lists to see the newly created list
        navigate('/saved-grocery-lists');
      }

      // Clear persisted state
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Error clearing persisted state:', error);
      }

      setListName('');
      setGroceryList([]);
      setSelectedRecipes([]);
      setBatchMultiplier({});
      setSaveListDialogOpen(false);
    }
  };

  const handleCancelSave = () => {
    setListName('');
    setSaveListDialogOpen(false);
  };

  const handleClearList = () => {
    setGroceryList([]);
    setSelectedRecipes([]);
    setBatchMultiplier({});
    setListName('');

    // Clear persisted state
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing persisted state:', error);
    }
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
      <Box
        sx={{
          p: 3,
          borderBottom: theme =>
            `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          background: theme =>
            `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.05
            )} 0%, transparent 100%)`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography variant='h6' fontWeight={700} color='text.primary'>
            Select Recipes
          </Typography>
          <IconButton
            onClick={() => toggleDrawer(false)}
            sx={{
              '&:hover': {
                backgroundColor: theme => alpha(theme.palette.error.main, 0.1),
                color: 'error.main',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant='body2' color='text.secondary'>
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
                    borderRadius: 2,
                    mb: 1,
                    mx: 1,
                    transition: 'all 0.3s ease',
                    border: theme =>
                      `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    '&.Mui-selected': {
                      backgroundColor: theme =>
                        alpha(theme.palette.primary.main, 0.1),
                      borderColor: theme => theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: theme =>
                          alpha(theme.palette.primary.main, 0.15),
                      },
                    },
                    opacity: recipeStatus.isInList ? 0.7 : 1,
                    borderLeft: recipeStatus.isInList ? '4px solid' : 'none',
                    borderLeftColor: recipeStatus.isInList
                      ? 'success.main'
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: theme =>
                        alpha(theme.palette.primary.main, 0.05),
                      transform: 'translateX(4px)',
                      borderColor: theme =>
                        alpha(theme.palette.primary.main, 0.3),
                    },
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
                                variant='outlined'
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
      <Box
        sx={{
          p: 3,
          borderTop: theme => `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          background: theme =>
            `linear-gradient(135deg, transparent 0%, ${alpha(
              theme.palette.primary.main,
              0.02
            )} 100%)`,
        }}
      >
        <PrimaryButton
          variant='contained'
          fullWidth
          onClick={generateGroceryList}
          disabled={selectedRecipes.length === 0}
          startIcon={<AddIcon />}
          sx={{ mb: 1.5 }}
        >
          Generate Grocery List ({selectedRecipes.length})
        </PrimaryButton>
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
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', mx: 'auto' }}>
      {/* Grocery List Display */}
      {groceryList.length > 0 ? (
        <ModernCard sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
                pb: 2,
                borderBottom: `1px solid var(--light-green-low-alpha)`,
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              {isEditMode || !editId ? (
                <TextField
                  value={listName}
                  onChange={e => setListName(e.target.value)}
                  placeholder={
                    editId ? 'Edit Grocery List Name' : 'Grocery List Name'
                  }
                  variant='outlined'
                  sx={{
                    flex: 1,
                    minWidth: { xs: '100%', sm: '300px' },
                    '& .MuiOutlinedInput-root': {
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: 'text.primary',
                      transition: 'all 0.2s ease',
                      '& fieldset': {
                        borderColor: 'var(--light-green-low-alpha)',
                        borderWidth: '2px',
                      },
                      '&:hover fieldset': {
                        borderColor: 'var(--light-green-medium-alpha)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'var(--light-green)',
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiInputBase-input': {
                      cursor: 'text',
                      padding: '14px 14px',
                      '&::placeholder': {
                        opacity: 0.6,
                        color: 'text.secondary',
                      },
                    },
                  }}
                />
              ) : (
                <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: '300px' } }}>
                  <Typography
                    variant='h5'
                    fontWeight={700}
                    color='text.primary'
                    sx={{ fontSize: '1.5rem' }}
                  >
                    {listName}
                  </Typography>
                </Box>
              )}
              {editId && !isEditMode && (
                <Button
                  variant='contained'
                  startIcon={<EditIcon />}
                  onClick={() => {
                    // Store original state when entering edit mode
                    setOriginalListState({
                      listName,
                      groceryList: [...groceryList],
                    });
                    setIsEditMode(true);
                  }}
                  sx={{
                    borderRadius: theme => theme.shape.borderRadius * 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    padding: theme => theme.spacing(1, 2.5),
                  }}
                >
                  Edit
                </Button>
              )}
              {editId && isEditMode && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant='contained'
                    color='success'
                    onClick={() => setSaveListDialogOpen(true)}
                    disabled={groceryList.length === 0}
                    sx={{
                      borderRadius: theme => theme.shape.borderRadius * 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      padding: theme => theme.spacing(1, 2.5),
                    }}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant='outlined'
                    onClick={handleExitEditMode}
                    sx={{
                      borderRadius: theme => theme.shape.borderRadius * 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      padding: theme => theme.spacing(1, 2.5),
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
              <Chip
                label={`${groceryList.length} items`}
                color='primary'
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              />
            </Box>

            {/* Add Buttons */}
            {(isEditMode || !editId) && (
              <Box
                sx={{
                  mb: 3,
                  display: 'flex',
                  gap: 1.5,
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <PrimaryButton
                    variant='contained'
                    startIcon={<AddIcon />}
                    onClick={() => toggleDrawer(true)}
                    size='medium'
                  >
                    Add More Recipes
                  </PrimaryButton>
                  <PrimaryButton
                    variant='contained'
                    startIcon={<AddIcon />}
                    onClick={() => setAddItemDialogOpen(true)}
                    size='medium'
                    color='secondary'
                  >
                    Add Grocery Item
                  </PrimaryButton>
                </Box>
                <Button
                  variant='outlined'
                  size='medium'
                  onClick={handleClearList}
                  sx={{
                    minWidth: 'auto',
                    px: 3,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: theme => alpha(theme.palette.error.main, 0.5),
                    color: 'error.main',
                    '&:hover': {
                      borderColor: 'error.main',
                      backgroundColor: theme =>
                        alpha(theme.palette.error.main, 0.1),
                    },
                  }}
                >
                  Clear
                </Button>
              </Box>
            )}

            {/* Total Price Display */}
            <PriceDisplay groceryList={groceryList} />

            {/* Save Button */}
            {!editId && (
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <PrimaryButton
                  variant='contained'
                  onClick={() => setSaveListDialogOpen(true)}
                  size='large'
                  color='success'
                  disabled={groceryList.length === 0}
                  sx={{
                    boxShadow: theme =>
                      `0 2px 8px ${alpha(theme.palette.success.main, 0.3)}`,
                    '&:hover': {
                      boxShadow: theme =>
                        `0 4px 16px ${alpha(theme.palette.success.main, 0.4)}`,
                    },
                  }}
                >
                  Save Grocery List
                </PrimaryButton>
              </Box>
            )}
            <List sx={{ px: 0 }}>
              {groceryList.map((ingredient, index) => (
                <ListItem
                  key={index}
                  sx={{
                    px: 0,
                    animation: `${fadeInUp} 0.3s ease-out ${
                      index * 0.05
                    }s both`,
                  }}
                >
                  <ModernListItem>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          background: theme =>
                            `linear-gradient(135deg, ${
                              theme.palette.primary.main
                            } 0%, ${
                              theme.palette.primary.dark ||
                              theme.palette.primary.main
                            } 100%)`,
                        }}
                      >
                        <RestaurantIcon fontSize='small' />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant='subtitle1'
                          fontWeight={600}
                          color='text.primary'
                        >
                          {ingredient.title}
                        </Typography>
                      }
                      secondary={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mt: 1,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Chip
                            label={`${
                              ingredient.quantity
                            } ${pluralizeMeasurement(
                              ingredient.quantity,
                              ingredient.measurement
                            )}`}
                            size='small'
                            sx={{
                              backgroundColor: theme =>
                                alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              fontWeight: 600,
                              border: theme =>
                                `1px solid ${alpha(
                                  theme.palette.primary.main,
                                  0.3
                                )}`,
                            }}
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
                            sx={{
                              backgroundColor: theme =>
                                alpha(theme.palette.success.main, 0.2),
                              color: 'success.dark',
                              fontWeight: 700,
                              border: theme =>
                                `1px solid ${alpha(
                                  theme.palette.success.main,
                                  0.4
                                )}`,
                            }}
                          />
                        </Box>
                      }
                    />
                    {(isEditMode || !editId) && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          onClick={e => {
                            e.stopPropagation();
                            handleSearchIngredient(ingredient);
                          }}
                          size='small'
                          sx={{
                            color: 'primary.main',
                            transition: 'all 0.3s ease',
                            border: theme =>
                              `1px solid ${alpha(
                                theme.palette.primary.main,
                                0.3
                              )}`,
                            '&:hover': {
                              backgroundColor: 'primary.main',
                              color: 'white',
                              transform: 'scale(1.1)',
                            },
                          }}
                          title='Search Kroger Prices'
                        >
                          <SearchIcon fontSize='small' />
                        </IconButton>
                        <IconButton
                          onClick={e => {
                            e.stopPropagation();
                            handleEditItem(index);
                          }}
                          size='small'
                          sx={{
                            color: 'primary.main',
                            transition: 'all 0.3s ease',
                            border: theme =>
                              `1px solid ${alpha(
                                theme.palette.primary.main,
                                0.3
                              )}`,
                            '&:hover': {
                              backgroundColor: 'primary.main',
                              color: 'white',
                              transform: 'scale(1.1)',
                            },
                          }}
                          title='Edit Quantity'
                        >
                          <EditIcon fontSize='small' />
                        </IconButton>
                        <IconButton
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteItem(index);
                          }}
                          size='small'
                          sx={{
                            color: 'error.main',
                            transition: 'all 0.3s ease',
                            border: theme =>
                              `1px solid ${alpha(
                                theme.palette.error.main,
                                0.3
                              )}`,
                            '&:hover': {
                              backgroundColor: 'error.main',
                              color: 'white',
                              transform: 'scale(1.1)',
                            },
                          }}
                          title='Delete Item'
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </Box>
                    )}
                  </ModernListItem>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </ModernCard>
      ) : (
        <EmptyStateCard>
          <Box
            sx={{
              p: 3,
              borderRadius: '50%',
              background: theme =>
                `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.1
                )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              display: 'inline-flex',
              mb: 3,
            }}
          >
            <RestaurantIcon sx={{ fontSize: 64, color: 'primary.main' }} />
          </Box>
          <Typography variant='h5' gutterBottom fontWeight={700}>
            {editId && isEditMode
              ? 'Start Adding Items'
              : 'Start Building Your Grocery List'}
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
            {editId && isEditMode
              ? 'Add items manually or select from your saved recipes to build your shopping list.'
              : 'Add items manually or select from your saved recipes to create a comprehensive shopping list.'}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <PrimaryButton
              variant='contained'
              size='large'
              onClick={() => toggleDrawer(true)}
              startIcon={<AddIcon />}
              disabled={savedRecipes.length === 0}
              sx={{ px: 4, py: 1.5 }}
            >
              {savedRecipes.length === 0
                ? 'No Recipes Available'
                : 'Select Recipes'}
            </PrimaryButton>
            <PrimaryButton
              variant='outlined'
              size='large'
              onClick={() => setAddItemDialogOpen(true)}
              startIcon={<AddIcon />}
              sx={{ px: 4, py: 1.5 }}
            >
              Add Grocery Item
            </PrimaryButton>
          </Box>
        </EmptyStateCard>
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
                  <MenuItem value={MeasurementUnit.ROLL}>Roll</MenuItem>
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
        <DialogTitle>
          {editId ? 'Save Changes' : 'Save Grocery List'}
        </DialogTitle>
        <DialogContent>
          {editId ? (
            <Typography variant='body1' sx={{ mt: 1 }}>
              Are you sure you want to save your changes to this grocery list?
            </Typography>
          ) : (
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSave}>Cancel</Button>
          <Button onClick={handleSaveList} variant='contained'>
            {editId ? 'Save Changes' : 'Save List'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog
        open={editItemDialogOpen}
        onClose={handleCancelEdit}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Edit Grocery Item</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label='Item Name'
              value={editItem.title}
              onChange={e =>
                setEditItem(prev => ({ ...prev, title: e.target.value }))
              }
              variant='outlined'
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label='Quantity'
                type='number'
                value={editItem.quantity}
                onChange={e =>
                  setEditItem(prev => ({
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
                  value={editItem.measurement}
                  onChange={e =>
                    setEditItem(prev => ({
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
                  <MenuItem value={MeasurementUnit.ROLL}>Roll</MenuItem>
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
          <Button onClick={handleCancelEdit}>Cancel</Button>
          <Button
            onClick={handleSaveEdit}
            variant='contained'
            disabled={!editItem.title.trim()}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Search Ingredient Dialog */}
      {ingredientToSearch && (
        <SearchIngredientDialog
          open={searchIngredientDialogOpen}
          onClose={() => {
            setSearchIngredientDialogOpen(false);
            setIngredientToSearch(null);
          }}
          ingredient={ingredientToSearch}
          onSuccess={handleIngredientSearchSuccess}
        />
      )}

      {/* Exit Edit Mode Confirmation Dialog */}
      <Dialog
        open={exitEditDialogOpen}
        onClose={handleExitEditCancel}
        aria-labelledby='exit-edit-dialog-title'
      >
        <DialogTitle id='exit-edit-dialog-title'>Unsaved Changes</DialogTitle>
        <DialogContent>
          <Typography>
            You have unsaved changes. What would you like to do?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleExitEditCancel} variant='outlined'>
            Cancel
          </Button>
          <Button
            onClick={handleExitEditConfirm}
            variant='outlined'
            color='error'
          >
            Discard Changes
          </Button>
          <Button
            onClick={handleExitEditSave}
            variant='contained'
            color='primary'
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
