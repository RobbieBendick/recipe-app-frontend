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
} from '@mui/material';
import { RecipeContext } from './recipe-context';
import { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';

export function RecipePage() {
  const navigate = useNavigate();
  const { recipeId } = useParams<{ recipeId: string }>();
  const { savedRecipes, setSavedRecipes } = useContext(RecipeContext);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const recipeIndex = parseInt(recipeId || '0', 10);
  const recipe = savedRecipes[recipeIndex];

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
    <Box marginTop='20px'>
      {/* Header with back button and delete button */}
      <Box
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        marginBottom='30px'
      >
        <Box display='flex' alignItems='center' gap={2}>
          <Button
            variant='outlined'
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/recipes')}
          >
            Back to Recipes
          </Button>
          <Typography variant='h4' fontWeight={600} color='text.primary'>
            {recipe.title}
          </Typography>
        </Box>

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
      </Box>

      <Grid container spacing={4}>
        {/* Recipe Info Card */}
        <Grid item xs={12} md={8}>
          <Card elevation={3} sx={{ borderRadius: '16px', mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              {recipe.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant='h6'
                    gutterBottom
                    color='text.primary'
                    fontWeight={600}
                  >
                    Description
                  </Typography>
                  <Typography variant='body1' sx={{ fontStyle: 'italic' }}>
                    {recipe.description}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography
                variant='h6'
                gutterBottom
                color='text.primary'
                fontWeight={600}
              >
                Ingredients
              </Typography>
              <Grid container spacing={2}>
                {recipe.ingredients.map((ingredient, index) => (
                  <Grid item xs={12} sm={6} key={index}>
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
                        label={`${ingredient.quantity} ${ingredient.measurement}`}
                        color='primary'
                        variant='outlined'
                        sx={{ mr: 2, minWidth: '80px' }}
                      />
                      <Typography variant='body1' fontWeight={500}>
                        {ingredient.title}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recipe Stats Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ borderRadius: '16px' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom color='primary'>
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
                <Typography variant='body2' color='text.secondary'>
                  Recipe Number
                </Typography>
                <Typography variant='h6'>#{recipeIndex + 1}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                Created
              </Typography>
              <Typography variant='body2'>
                {recipe.createdAt
                  ? new Date(recipe.createdAt).toLocaleDateString('en-US', {
                      year: '2-digit',
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'Unknown'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
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
    </Box>
  );
}
