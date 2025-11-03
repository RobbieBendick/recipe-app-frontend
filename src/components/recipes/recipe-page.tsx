import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  MenuItem,
  Avatar,
} from '@mui/material';
import { RecipeContext } from './recipe-context';
import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Ingredient, MeasurementUnit, Recipe } from '../../schemas/schemas';
import { pluralizeMeasurement } from '../../helpers/helpers';
import { ingredientCostDB } from '../../database/ingredient-costs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { SearchIngredientDialog } from './dialogs/search-ingredient-dialog';

export function RecipePage() {
  const navigate = useNavigate();
  const { recipeId } = useParams<{ recipeId: string }>();
  const { savedRecipes, setSavedRecipes } = useContext(RecipeContext);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteIngredientDialogOpen, setDeleteIngredientDialogOpen] =
    useState(false);
  const [exitEditDialogOpen, setExitEditDialogOpen] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState<number | null>(
    null
  );
  const [searchIngredientDialogOpen, setSearchIngredientDialogOpen] =
    useState(false);
  const [ingredientToSearch, setIngredientToSearch] = useState<{
    ingredient: string;
    quantity: number;
    measurement: string;
  } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIngredients, setEditIngredients] = useState<Ingredient[]>([]);
  const [editImage, setEditImage] = useState<string>('');
  const [costDataVersion, setCostDataVersion] = useState(0);

  const recipeIndex = parseInt(recipeId || '0', 10);
  const recipe = savedRecipes[recipeIndex];

  // Calculate recipe cost based on ingredients
  const calculateRecipeCost = useCallback((recipe: Recipe) => {
    const ingredients = recipe.ingredients.map((ingredient: Ingredient) => ({
      name: ingredient.title,
      quantity: ingredient.quantity,
      measurement: ingredient.measurement as MeasurementUnit,
    }));

    const costData = ingredientCostDB.calculateRecipeCost(ingredients);
    return costData;
  }, []);

  // Recalculate cost data when recipe or costDataVersion changes
  // costDataVersion is used to force recalculation when ingredient pricing data is added
  const costData = useMemo(() => {
    if (!recipe) return null;
    return calculateRecipeCost(recipe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe, costDataVersion, calculateRecipeCost]);

  const handleSearchIngredient = useCallback(
    (item: { ingredient: string; quantity: number; measurement: string }) => {
      setIngredientToSearch(item);
      setSearchIngredientDialogOpen(true);
    },
    []
  );

  const handleIngredientSearchSuccess = useCallback(() => {
    // Force re-calculation of cost data by incrementing version
    setCostDataVersion(prev => prev + 1);
    console.log('✅ Pricing data added, recalculating costs...');
  }, []);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    const updatedRecipes = savedRecipes.filter(
      (_, index) => index !== recipeIndex
    );
    setSavedRecipes(updatedRecipes);
    setDeleteDialogOpen(false);
    navigate('/recipes'); // Navigate back to recipes list after deletion
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    setEditTitle(recipe.title);
    setEditDescription(recipe.description || '');
    setEditIngredients([...recipe.ingredients]);
    setEditImage(recipe.image || '');
  };

  const handleSaveEdit = () => {
    const updatedRecipes = [...savedRecipes];
    updatedRecipes[recipeIndex] = {
      ...recipe,
      title: editTitle,
      description: editDescription,
      ingredients: editIngredients,
      image: editImage,
      lastUpdated: new Date(),
    };
    setSavedRecipes(updatedRecipes);
    setIsEditMode(false);
  };

  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setEditTitle('');
    setEditDescription('');
    setEditIngredients([]);
    setEditImage('');
  }, []);

  const hasUnsavedChanges = useCallback(() => {
    if (!recipe) return false;

    return (
      editTitle !== recipe.title ||
      editDescription !== (recipe.description || '') ||
      JSON.stringify(editIngredients) !== JSON.stringify(recipe.ingredients)
    );
  }, [recipe, editTitle, editDescription, editIngredients]);

  const handleExitEditMode = useCallback(() => {
    if (hasUnsavedChanges()) {
      setExitEditDialogOpen(true);
    } else {
      handleCancelEdit();
    }
  }, [hasUnsavedChanges, handleCancelEdit]);

  const handleExitEditConfirm = () => {
    setExitEditDialogOpen(false);
    handleCancelEdit();
  };

  const handleExitEditSave = () => {
    setExitEditDialogOpen(false);
    handleSaveEdit();
  };

  const handleExitEditCancel = () => {
    setExitEditDialogOpen(false);
  };

  const handleAddIngredient = () => {
    const newIngredient: Ingredient = {
      _id: Date.now(), // Simple ID generation
      title: '',
      quantity: 0,
      measurement: MeasurementUnit.WHOLE,
    };
    setEditIngredients([...editIngredients, newIngredient]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredientToDelete(index);
    setDeleteIngredientDialogOpen(true);
  };

  const handleConfirmDeleteIngredient = () => {
    if (ingredientToDelete !== null) {
      const newIngredients = editIngredients.filter(
        (_, i) => i !== ingredientToDelete
      );
      setEditIngredients(newIngredients);
    }
    setDeleteIngredientDialogOpen(false);
    setIngredientToDelete(null);
  };

  const handleCancelDeleteIngredient = () => {
    setDeleteIngredientDialogOpen(false);
    setIngredientToDelete(null);
  };

  const handleIngredientChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newIngredients = [...editIngredients];
    if (field === 'quantity') {
      newIngredients[index] = {
        ...newIngredients[index],
        [field]: Number(value),
      };
    } else if (field === 'measurement') {
      newIngredients[index] = {
        ...newIngredients[index],
        [field]: value as MeasurementUnit,
      };
    } else {
      newIngredients[index] = { ...newIngredients[index], [field]: value };
    }
    setEditIngredients(newIngredients);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        setEditImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setEditImage('');
  };

  // ESC key listener for exiting edit mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEditMode) {
        handleExitEditMode();
      }
    };

    if (isEditMode) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditMode, handleExitEditMode]);

  if (!recipe) {
    return (
      <Box marginTop='20px' textAlign='center'>
        <Typography variant='h4' color='error'>
          Recipe not found
        </Typography>
        <Button
          variant='contained'
          onClick={() => navigate('/recipes')}
          sx={{ mt: 2 }}
        >
          Back to Recipes
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with back button */}
      <Box marginBottom='20px' mb={3}>
        <Button
          variant='outlined'
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/recipes')}
        >
          Back to Recipes
        </Button>
      </Box>

      {/* Title and action buttons row */}
      <Box
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        marginBottom='30px'
      >
        <Box sx={{ flex: 1 }}>
          {isEditMode ? (
            <TextField
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              variant='outlined'
              size='medium'
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '2rem',
                  fontWeight: 600,
                },
              }}
            />
          ) : (
            <Typography variant='h4' fontWeight={600} color='text.primary'>
              {recipe.title}
            </Typography>
          )}
        </Box>

        <Box display='flex' gap={2}>
          {isEditMode ? (
            <>
              <Button
                variant='contained'
                color='success'
                startIcon={<SaveIcon />}
                onClick={handleSaveEdit}
              >
                Save
              </Button>
              <Button
                variant='outlined'
                startIcon={<CancelIcon />}
                onClick={handleExitEditMode}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant='outlined'
                startIcon={<EditIcon />}
                onClick={handleEditClick}
              >
                Edit
              </Button>
              <Button
                variant='outlined'
                color='error'
                startIcon={<DeleteIcon />}
                onClick={handleDeleteClick}
                sx={{
                  '&:hover': {
                    backgroundColor: 'error.light',
                    color: 'white',
                  },
                }}
              >
                Delete Recipe
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Recipe Info Card */}
        <Grid item xs={12} md={8}>
          <Card elevation={3} sx={{ borderRadius: '16px', mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant='h6'
                  gutterBottom
                  color='text.primary'
                  fontWeight={600}
                >
                  Description
                </Typography>
                {isEditMode ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    placeholder='Enter recipe description...'
                    variant='outlined'
                  />
                ) : (
                  recipe.description && (
                    <Typography variant='body1' sx={{ fontStyle: 'italic' }}>
                      {recipe.description}
                    </Typography>
                  )
                )}
              </Box>

              {/* Image Upload Section */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant='h6'
                  gutterBottom
                  color='text.primary'
                  fontWeight={600}
                >
                  Recipe Image
                </Typography>
                {isEditMode ? (
                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <input
                        accept='image/*'
                        style={{ display: 'none' }}
                        id='edit-image-upload'
                        type='file'
                        onChange={handleImageUpload}
                      />
                      <label htmlFor='edit-image-upload'>
                        <Button
                          variant='outlined'
                          component='span'
                          startIcon={<PhotoCameraIcon />}
                          size='small'
                        >
                          Choose Image
                        </Button>
                      </label>
                      {editImage && (
                        <Button
                          variant='outlined'
                          color='error'
                          startIcon={<DeleteForeverIcon />}
                          size='small'
                          onClick={handleRemoveImage}
                        >
                          Remove Image
                        </Button>
                      )}
                    </Box>

                    {editImage && (
                      <Avatar
                        src={editImage}
                        sx={{
                          width: 200,
                          height: 150,
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: 'divider',
                        }}
                        variant='rounded'
                      />
                    )}
                  </Box>
                ) : (
                  recipe.image && (
                    <Avatar
                      src={recipe.image}
                      sx={{
                        width: 200,
                        height: 150,
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: 'divider',
                      }}
                      variant='rounded'
                    />
                  )
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant='h6' color='text.primary' fontWeight={600}>
                  Ingredients
                </Typography>
                {isEditMode && (
                  <Button
                    variant='outlined'
                    startIcon={<AddIcon />}
                    onClick={handleAddIngredient}
                    size='small'
                  >
                    Add Ingredient
                  </Button>
                )}
              </Box>

              <Grid container spacing={2}>
                {(isEditMode ? editIngredients : recipe.ingredients).map(
                  (ingredient, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      {isEditMode ? (
                        <Card
                          elevation={2}
                          sx={{
                            borderRadius: '16px',
                            position: 'relative',
                            border: '1px solid grey',
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          {/* Header with delete button */}
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                              borderBottom: '1px solid grey',
                              px: 2,
                              py: 0.5,
                            }}
                          >
                            <IconButton
                              onClick={() => handleRemoveIngredient(index)}
                              color='error'
                              size='medium'
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'error.light',
                                  color: 'white',
                                  ml: 'auto',
                                },
                              }}
                            >
                              <DeleteIcon fontSize='small' />
                            </IconButton>
                          </Box>

                          <CardContent sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                              {/* Ingredient Name - Full Width */}
                              <Grid item xs={12}>
                                <TextField
                                  label={
                                    <span>
                                      Ingredient Name{' '}
                                      <span style={{ color: 'red' }}>*</span>
                                    </span>
                                  }
                                  value={ingredient.title}
                                  onChange={e =>
                                    handleIngredientChange(
                                      index,
                                      'title',
                                      e.target.value
                                    )
                                  }
                                  margin='normal'
                                  fullWidth
                                  placeholder='Flour, Sugar, etc.'
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                    },
                                  }}
                                />
                              </Grid>

                              {/* Quantity and Measurement - Side by Side */}
                              <Grid item xs={6}>
                                <TextField
                                  label='Quantity'
                                  type='number'
                                  value={ingredient.quantity}
                                  onChange={e => {
                                    const newValue = Math.max(
                                      0.1,
                                      parseFloat(e.target.value) || 0
                                    );
                                    handleIngredientChange(
                                      index,
                                      'quantity',
                                      newValue
                                    );
                                  }}
                                  margin='normal'
                                  fullWidth
                                  inputProps={{ min: 0.1, step: 0.1 }}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                    },
                                  }}
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  select
                                  label='Measurement'
                                  value={ingredient.measurement}
                                  onChange={e =>
                                    handleIngredientChange(
                                      index,
                                      'measurement',
                                      e.target.value
                                    )
                                  }
                                  margin='normal'
                                  fullWidth
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      borderRadius: '8px',
                                    },
                                  }}
                                >
                                  {Object.values(MeasurementUnit).map(unit => (
                                    <MenuItem key={unit} value={unit}>
                                      {unit}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ) : (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '8px',
                            backgroundColor: 'background.paper',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <Chip
                            label={`${
                              ingredient.quantity
                            } ${pluralizeMeasurement(
                              ingredient.quantity,
                              ingredient.measurement
                            )}`}
                            color='primary'
                            variant='outlined'
                            sx={{ mr: 2, minWidth: '80px' }}
                          />
                          <Typography variant='body1' fontWeight={500}>
                            {ingredient.title}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  )
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recipe Stats Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ borderRadius: '16px' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom color='text.primary'>
                Recipe Info
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant='body2' color='text.secondary'>
                  Total Ingredients
                </Typography>
                <Typography variant='h4' color='primary'>
                  {recipe.ingredients.length}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant='body2' color='text.primary'>
                  Recipe Number
                </Typography>
                <Typography variant='h6' color='text.secondary'>
                  #{recipeIndex + 1}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant='body2' color='text.primary'>
                  Estimated Cost
                </Typography>
                <Typography
                  variant='h4'
                  color={
                    costData && costData.totalCost > 0
                      ? 'success.main'
                      : 'text.secondary'
                  }
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontWeight: 600,
                  }}
                >
                  ${costData ? costData.totalCost.toFixed(2) : '0.00'}
                </Typography>
                {costData && costData.missingIngredients.length > 0 && (
                  <Typography
                    variant='caption'
                    color='warning.dark'
                    sx={{ mt: 0.5, display: 'block' }}
                  >
                    Missing pricing for:{' '}
                    {costData.missingIngredients.join(', ')}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                Created
              </Typography>
              <Typography variant='body2' sx={{ mb: 2 }}>
                {recipe.createdAt
                  ? new Date(recipe.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'Unknown'}
              </Typography>

              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                Last Updated
              </Typography>
              <Typography variant='body2'>
                {recipe.lastUpdated
                  ? new Date(recipe.lastUpdated).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'Never'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Price Breakdown Section */}
      {costData && costData.breakdown.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Card elevation={3} sx={{ borderRadius: '16px' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant='h6'
                gutterBottom
                color='primary'
                fontWeight={600}
              >
                💰 Cost Breakdown
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant='body2' color='text.primary'>
                  Detailed cost analysis for each ingredient
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {costData.breakdown.map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card
                      elevation={1}
                      sx={{
                        borderRadius: '12px',
                        opacity: item.found ? 1 : 0.7,
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant='subtitle2'
                            fontWeight={600}
                            color='text.primary'
                          >
                            {item.ingredient}
                          </Typography>
                          <Typography
                            variant='h6'
                            color={item.found ? 'success.dark' : 'warning.dark'}
                            fontWeight={700}
                          >
                            ${item.totalCost.toFixed(2)}
                          </Typography>
                        </Box>

                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{ mb: 1 }}
                        >
                          {item.quantity}{' '}
                          {pluralizeMeasurement(
                            item.quantity,
                            item.measurement
                          )}
                        </Typography>

                        {item.found ? (
                          <Box>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                            >
                              ${item.costPerGram.toFixed(6)}/gram
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mt: 0.5,
                                mb: 0.5,
                              }}
                            >
                              <Typography variant='caption'>
                                ✅ Price data available
                              </Typography>
                              <IconButton
                                size='small'
                                color='primary'
                                onClick={() => {
                                  handleSearchIngredient({
                                    ingredient: item.ingredient,
                                    quantity: item.quantity,
                                    measurement: item.measurement,
                                  });
                                }}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'primary.main',
                                  padding: '4px',
                                  '&:hover': {
                                    backgroundColor: 'primary.light',
                                    color: 'primary.contrastText',
                                  },
                                }}
                              >
                                <EditIcon sx={{ fontSize: '16px' }} />
                              </IconButton>
                            </Box>
                          </Box>
                        ) : (
                          <Box>
                            <Typography
                              variant='caption'
                              color='warning.dark'
                              sx={{ display: 'block' }}
                            >
                              ⚠️ No pricing data
                            </Typography>
                            <Button
                              size='small'
                              variant='outlined'
                              color='primary'
                              sx={{
                                mt: 1,
                                fontSize: '0.75rem',
                                minWidth: 'auto',
                                py: 0.5,
                                px: 1,
                              }}
                              onClick={() => {
                                handleSearchIngredient({
                                  ingredient: item.ingredient,
                                  quantity: item.quantity,
                                  measurement: item.measurement,
                                });
                              }}
                            >
                              Search Kroger
                            </Button>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Summary */}
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    variant='h6'
                    fontWeight={600}
                    color='text.primary'
                  >
                    Total Recipe Cost
                  </Typography>
                  <Typography
                    variant='h4'
                    fontWeight={700}
                    color='text.primary'
                  >
                    ${costData.totalCost.toFixed(2)}
                  </Typography>
                </Box>

                {costData.missingIngredients.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant='body2' color='warning.dark'>
                      ⚠️ {costData.missingIngredients.length} ingredient(s)
                      missing pricing data
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Delete Recipe Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby='delete-dialog-title'
      >
        <DialogTitle id='delete-dialog-title'>Delete Recipe</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{recipe.title}"? This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color='primary'>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color='error'
            variant='contained'
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Ingredient Confirmation Dialog */}
      <Dialog
        open={deleteIngredientDialogOpen}
        onClose={handleCancelDeleteIngredient}
        aria-labelledby='delete-ingredient-dialog-title'
      >
        <DialogTitle id='delete-ingredient-dialog-title'>
          Delete Ingredient
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this ingredient? This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDeleteIngredient} color='primary'>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteIngredient}
            color='error'
            variant='contained'
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
          <Button onClick={handleExitEditCancel} color='primary'>
            Continue Editing
          </Button>
          <Button onClick={handleExitEditConfirm} color='secondary'>
            Discard Changes
          </Button>
          <Button
            onClick={handleExitEditSave}
            color='primary'
            variant='contained'
            autoFocus
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
    </Box>
  );
}
