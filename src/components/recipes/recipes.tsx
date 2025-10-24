import {
  Box,
  Typography,
  useTheme,
  Grid,
  Card,
  CardContent,
  Button,
  CardActionArea,
} from '@mui/material';
import { RecipeContext } from './recipe-context';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddRecipeDialog } from './dialogs/add-recipe-dialog';

export function Recipes() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { toggleAddRecipeDialog, savedRecipes } = useContext(RecipeContext);

  const handleRecipeClick = (recipeIndex: number) => {
    navigate(`/recipe/${recipeIndex}`);
  };

  return (
    <Box marginTop='20px'>
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        position='relative'
      >
        <Typography
          fontWeight={600}
          color={theme.palette.text.primary}
          variant='h4'
        >
          Your Recipes
        </Typography>
        <Button
          variant='contained'
          color='primary'
          onClick={toggleAddRecipeDialog}
          sx={{
            position: 'absolute',
            right: 0,
          }}
        >
          Add Recipe
        </Button>
      </Box>

      <Grid container spacing={3} justifyContent='center' marginTop='20px'>
        {savedRecipes.map((recipe, index) => (
          <Grid item key={index} xs={12} sm={6} md={4}>
            <Card
              elevation={3}
              sx={{
                height: '100%',
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  elevation: 6,
                  transform: 'translateY(-4px)',
                  borderColor: 'primary.main',
                },
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              <CardActionArea
                onClick={() => handleRecipeClick(index)}
                sx={{ height: '100%' }}
              >
                <CardContent
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Recipe Header */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant='h5'
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                        color: 'primary.main',
                        lineHeight: 1.2,
                      }}
                    >
                      {recipe.title}
                    </Typography>

                    {recipe.description && (
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{
                          mb: 2,
                          fontStyle: 'italic',
                          lineHeight: 1.4,
                        }}
                      >
                        {recipe.description}
                      </Typography>
                    )}
                  </Box>

                  {/* Ingredients Section */}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant='subtitle1'
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 1.5,
                      }}
                    >
                      Ingredients:
                    </Typography>

                    <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {recipe.ingredients.map((ingredient, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 0.5,
                            p: 0.5,
                            borderRadius: '4px',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <Typography
                            variant='body2'
                            sx={{
                              ml: 1,
                              color: 'text.secondary',
                              fontSize: '0.875rem',
                            }}
                          >
                            • {ingredient.quantity} {ingredient.measurement}{' '}
                            <span
                              style={{
                                fontWeight: 500,
                                color: theme.palette.text.primary,
                              }}
                            >
                              {ingredient.title}
                            </span>
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Recipe Footer */}
                  <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant='caption' color='text.secondary'>
                      {recipe.ingredients.length} ingredient
                      {recipe.ingredients.length !== 1 ? 's' : ''}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Recipe #{index + 1}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}

        {/* "Add New Recipe" Box (Always Last) */}
        <Grid item xs={12} sm={6} md={4}></Grid>
      </Grid>

      <AddRecipeDialog />
    </Box>
  );
}
