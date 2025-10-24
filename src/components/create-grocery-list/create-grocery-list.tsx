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
} from '@mui/material';
import { useContext, useState } from 'react';
import { RecipeContext } from '../recipes/recipe-context';
import { Ingredient, Recipe } from '../../schemas/schemas';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

export function CreateGroceryList() {
  const { savedRecipes } = useContext(RecipeContext);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [groceryList, setGroceryList] = useState<Ingredient[]>([]);

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
    // Combine all ingredients from selected recipes
    const allIngredients = selectedRecipes.flatMap(
      recipe => recipe.ingredients
    );

    // Group ingredients by name and sum quantities
    const ingredientMap = new Map();
    allIngredients.forEach(ingredient => {
      const key = `${ingredient.title}-${ingredient.measurement}`;
      if (ingredientMap.has(key)) {
        ingredientMap.get(key).quantity += ingredient.quantity;
      } else {
        ingredientMap.set(key, { ...ingredient });
      }
    });

    const newGroceryList = Array.from(ingredientMap.values());
    setGroceryList(newGroceryList);

    // Close drawer and reset selection
    setDrawerOpen(false);
    setSelectedRecipes([]);
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
                    primary={recipe.title}
                    secondary={
                      <Box>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          noWrap
                        >
                          {recipe.description || 'No description'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          <Chip
                            label={`${recipe.ingredients.length} ingredients`}
                            size='small'
                            variant='outlined'
                          />
                          {recipe.lastUpdated && (
                            <Chip
                              label='Updated'
                              size='small'
                              color='secondary'
                              variant='outlined'
                            />
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
                Your Grocery List
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`${groceryList.length} items`}
                  color='primary'
                  variant='outlined'
                />
                <Button
                  size='small'
                  onClick={() => setGroceryList([])}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  Clear
                </Button>
              </Box>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Button
                variant='outlined'
                startIcon={<AddIcon />}
                onClick={() => toggleDrawer(true)}
                size='small'
              >
                Add More Recipes
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
                        </Box>
                      }
                    />
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
    </Box>
  );
}
