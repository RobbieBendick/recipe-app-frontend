import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import {
  RecipeParser,
  ParsedRecipe,
  ParsedIngredient,
} from '../../../helpers/recipe-parser';
import { MeasurementUnit } from '../../../schemas/schemas';
import { UrlRecipeParser } from '../../../services/url-recipe-parser';

interface ParseRecipeDialogProps {
  open: boolean;
  onClose: () => void;
  onRecipeParsed: (recipe: {
    title: string;
    description: string;
    ingredients: Array<{
      _id: number;
      title: string;
      quantity: number;
      measurement: MeasurementUnit;
    }>;
    instructions: string[];
  }) => void;
}

// Constants
const QUANTITY_PATTERN = /^[\d\s/½¼¾⅓⅔⅛⅜⅝⅞]+/;
const BULLET_PATTERN = /^[-•*▢]\s*/;

/**
 * Extracts descriptive ingredient name by removing quantity and measurement from text
 */
const extractDescriptiveName = (
  originalText: string,
  measurement: string
): string => {
  let name = originalText.trim();

  // Remove quantity pattern (handles fractions and Unicode fractions)
  name = name.replace(QUANTITY_PATTERN, '').trim();

  // Remove measurement (handle singular and plural)
  const measurementLower = measurement.toLowerCase();
  const singularMeasurement = measurementLower.replace(/s$/, '');

  // Try both singular and plural forms
  const measurementPatterns = [
    new RegExp(`^${measurementLower}\\s+`, 'i'),
    new RegExp(`^${singularMeasurement}\\s+`, 'i'),
    new RegExp(`^${measurementLower}\\b`, 'i'),
    new RegExp(`^${singularMeasurement}\\b`, 'i'),
  ];

  for (const pattern of measurementPatterns) {
    name = name.replace(pattern, '').trim();
    if (name.length < originalText.length) break; // If we removed something, stop
  }

  return name.trim();
};

/**
 * Parses a single ingredient line and extracts quantity, measurement, and descriptive name
 */
const parseIngredientLine = (ingredientText: string): ParsedIngredient => {
  // Clean up the ingredient text (remove bullet points, dashes, etc.)
  const cleanIngredient = ingredientText.replace(BULLET_PATTERN, '').trim();

  // Try to parse using RecipeParser first
  const parsedIngredient = RecipeParser.parseIngredient(cleanIngredient);

  if (parsedIngredient) {
    // Extract descriptive name by removing quantity and measurement
    const descriptiveName = extractDescriptiveName(
      cleanIngredient,
      parsedIngredient.measurement
    );

    // If we successfully extracted a descriptive name, use it
    if (descriptiveName && descriptiveName.length > 0) {
      return {
        quantity: parsedIngredient.quantity,
        measurement: parsedIngredient.measurement,
        name: descriptiveName,
      };
    }

    // Otherwise use the parsed ingredient as-is
    return parsedIngredient;
  }

  // Fallback: try to extract quantity manually
  const quantityMatch = cleanIngredient.match(QUANTITY_PATTERN);
  if (quantityMatch) {
    const afterQuantity = cleanIngredient.replace(QUANTITY_PATTERN, '').trim();

    return {
      quantity: 1,
      measurement: 'whole',
      name: afterQuantity || cleanIngredient,
    };
  }

  // Final fallback: return as whole item
  return {
    quantity: 1,
    measurement: 'whole',
    name: cleanIngredient,
  };
};

/**
 * Converts URL parse result to ParsedRecipe format
 */
const convertToParsedRecipe = (
  result: Awaited<ReturnType<typeof UrlRecipeParser.parseRecipeFromUrl>>
): ParsedRecipe | null => {
  if (!result.success) return null;

  return {
    description: result.description || '',
    ingredients: (result.ingredients || []).map(parseIngredientLine),
    instructions: result.instructions || [],
  };
};

export const ParseRecipeDialog: React.FC<ParseRecipeDialogProps> = ({
  open,
  onClose,
  onRecipeParsed,
}) => {
  const [recipeTitle, setRecipeTitle] = useState('');
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recipeUrl, setRecipeUrl] = useState('');
  const [isUrlParsing, setIsUrlParsing] = useState(false);

  const handleUrlParse = useCallback(async () => {
    const url = recipeUrl.trim();
    if (!url) {
      setError('Please enter a recipe URL');
      return;
    }

    setIsUrlParsing(true);
    setError(null);

    try {
      const result = await UrlRecipeParser.parseRecipeFromUrl(url);

      if (!result.success) {
        setError(result.error || 'Failed to parse recipe from URL');
        return;
      }

      const parsed = convertToParsedRecipe(result);
      if (!parsed) {
        setError('Failed to parse recipe data');
        return;
      }

      setParsedRecipe(parsed);

      // Set the title if available
      if (result.title) {
        setRecipeTitle(result.title);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to parse recipe from URL. Please check the URL and try again.';
      setError(errorMessage);
      console.error('URL parsing error:', err);
    } finally {
      setIsUrlParsing(false);
    }
  }, [recipeUrl]);

  const handleCreateRecipe = useCallback(() => {
    if (!parsedRecipe) return;

    // Convert parsed ingredients to the format expected by the recipe system
    const ingredients = parsedRecipe.ingredients.map((ingredient, index) => ({
      _id: index,
      title: ingredient.name,
      quantity: ingredient.quantity,
      measurement: ingredient.measurement as MeasurementUnit,
    }));

    onRecipeParsed({
      title: recipeTitle.trim() || 'Untitled Recipe',
      description: parsedRecipe.description || '',
      ingredients,
      instructions: parsedRecipe.instructions,
    });

    // Reset form
    setRecipeTitle('');
    setParsedRecipe(null);
    setError(null);
    setRecipeUrl('');
    onClose();
  }, [parsedRecipe, recipeTitle, onRecipeParsed, onClose]);

  const handleClear = useCallback(() => {
    setRecipeTitle('');
    setRecipeUrl('');
    setParsedRecipe(null);
    setError(null);
  }, []);

  /**
   * Checks if ingredient name already contains quantity and measurement
   */
  const hasQuantityAndMeasurement = useCallback(
    (name: string, quantity: number, measurement: string): boolean => {
      const nameLower = name.toLowerCase().trim();
      const quantityStr = quantity.toString();
      const measurementStr = measurement.toLowerCase();

      return (
        nameLower.startsWith(quantityStr) &&
        (nameLower.includes(` ${measurementStr}`) ||
          nameLower.includes(`${measurementStr} `))
      );
    },
    []
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <Typography variant='h6'>Parse Recipe</Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            Enter a recipe URL and the parser will automatically extract
            ingredients, measurements, and instructions.
          </Typography>

          <TextField
            fullWidth
            label='Recipe URL'
            value={recipeUrl}
            onChange={e => setRecipeUrl(e.target.value)}
            placeholder='https://example.com/recipe'
            variant='outlined'
            sx={{ mb: 3 }}
          />

          <Box display='flex' gap={1} sx={{ mb: 2 }}>
            <Button
              variant='contained'
              onClick={handleUrlParse}
              disabled={!recipeUrl.trim() || isUrlParsing}
              startIcon={isUrlParsing ? <CircularProgress size={16} /> : null}
              sx={{ flex: 1 }}
            >
              {isUrlParsing ? 'Fetching...' : 'Parse Recipe'}
            </Button>
            <Button variant='outlined' onClick={handleClear}>
              Clear
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {parsedRecipe && (
          <Box>
            <Typography variant='h6' gutterBottom>
              Parsed Recipe
            </Typography>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant='subtitle1'>{recipeTitle}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {parsedRecipe.description && (
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 2 }}
                  >
                    {parsedRecipe.description}
                  </Typography>
                )}

                <Typography variant='subtitle2' gutterBottom>
                  Ingredients ({parsedRecipe.ingredients.length})
                </Typography>
                <List dense>
                  {parsedRecipe.ingredients.map((ingredient, index) => {
                    const showChip = !hasQuantityAndMeasurement(
                      ingredient.name,
                      ingredient.quantity,
                      ingredient.measurement
                    );

                    return (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={
                            <Box display='flex' alignItems='center' gap={1}>
                              {showChip && (
                                <Chip
                                  label={`${ingredient.quantity} ${ingredient.measurement}`}
                                  size='small'
                                  color='primary'
                                  variant='outlined'
                                />
                              )}
                              <Typography variant='body2'>
                                {ingredient.name}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>

                {parsedRecipe.instructions.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant='subtitle2' gutterBottom>
                      Instructions ({parsedRecipe.instructions.length})
                    </Typography>
                    <List dense>
                      {parsedRecipe.instructions.map((instruction, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={
                              <Typography variant='body2'>
                                {index + 1}. {instruction}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {parsedRecipe && (
          <Button
            variant='contained'
            onClick={handleCreateRecipe}
            color='primary'
          >
            Create Recipe
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
