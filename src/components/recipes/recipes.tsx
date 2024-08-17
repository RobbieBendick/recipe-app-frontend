import { Add } from '@mui/icons-material';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { AddRecipeDialog } from './dialogs/add-recipe-dialog';
import { useContext } from 'react';
import { RecipeContext } from './recipe-context';

export function Recipes() {
  const theme = useTheme();
  const { toggleAddRecipeDialog } = useContext(RecipeContext);
  return (
    <Box marginTop='20px'>
      <Button
        onClick={() => {
          toggleAddRecipeDialog();
        }}
        sx={{
          display: 'flex',
          marginLeft: 'auto',
        }}
        variant='contained'
        startIcon={<Add />}
      >
        Add Recipe
      </Button>
      <Typography
        fontWeight={600}
        textAlign='center'
        color={theme.palette.text.primary}
        variant='h4'
      >
        Your Recipes
      </Typography>
      <AddRecipeDialog />
    </Box>
  );
}
