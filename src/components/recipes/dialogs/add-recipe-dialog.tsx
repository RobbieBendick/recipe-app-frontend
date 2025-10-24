import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Typography,
  MenuItem,
  Box,
  Avatar,
} from '@mui/material';
import { useContext, useState } from 'react';
import { useFormik, FormikProvider, FieldArray } from 'formik';
import * as Yup from 'yup';
import { Recipe, MeasurementUnit } from '@/schemas/schemas';
import { RecipeContext } from '../recipe-context';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

export function AddRecipeDialog() {
  const { toggleAddRecipeDialog, isAddRecipeDialogOpen } =
    useContext(RecipeContext);

  const { savedRecipes, setSavedRecipes } = useContext(RecipeContext);

  const [deleteIngredientDialogOpen, setDeleteIngredientDialogOpen] =
    useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState<number | null>(
    null
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const validationSchema = Yup.object({
    title: Yup.string()
      .required('Recipe title is required')
      .min(1, 'Recipe title must be at least 1 character'),
    description: Yup.string(), // Optional field
    ingredients: Yup.array()
      .of(
        Yup.object({
          _id: Yup.number().required(),
          title: Yup.string().required('Ingredient name is required'),
          quantity: Yup.number().min(0.1, 'Quantity must be at least 0.1'),
          measurement: Yup.string().required(),
        })
      )
      .min(1, 'At least one ingredient is required'),
  });

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      ingredients: [
        {
          _id: Date.now(),
          title: '',
          quantity: 1,
          measurement: MeasurementUnit.CUP,
        },
      ],
    },
    validationSchema,
    onSubmit: (values: Recipe) => {
      const now = new Date();
      const recipeWithTimestamp = {
        ...values,
        createdAt: now,
        lastUpdated: now,
      };
      setSavedRecipes([...savedRecipes, recipeWithTimestamp]);
      formik.resetForm();
      toggleAddRecipeDialog();
    },
  });

  const handleAddIngredient = () => {
    formik.setFieldValue('ingredients', [
      ...formik.values.ingredients,
      {
        _id: Date.now(),
        title: '',
        quantity: 1,
        measurement: MeasurementUnit.CUP,
      },
    ]);
  };

  const handleIngredientChange = (
    index: number,
    field: keyof Omit<Recipe['ingredients'][number], '_id'>,
    value: unknown
  ) => {
    const newIngredients = [...formik.values.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    formik.setFieldValue('ingredients', newIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredientToDelete(index);
    setDeleteIngredientDialogOpen(true);
  };

  const handleConfirmDeleteIngredient = () => {
    if (ingredientToDelete !== null && formik.values.ingredients.length > 1) {
      const newIngredients = formik.values.ingredients.filter(
        (_, i) => i !== ingredientToDelete
      );
      formik.setFieldValue('ingredients', newIngredients);
    }
    setDeleteIngredientDialogOpen(false);
    setIngredientToDelete(null);
  };

  const handleCancelDeleteIngredient = () => {
    setDeleteIngredientDialogOpen(false);
    setIngredientToDelete(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        setImagePreview(result);
        formik.setFieldValue('image', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    formik.setFieldValue('image', '');
  };

  return (
    <>
      <Dialog open={isAddRecipeDialogOpen} onClose={toggleAddRecipeDialog}>
        <DialogTitle>Add a New Recipe</DialogTitle>
        <DialogContent>
          <FormikProvider value={formik}>
            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={2} justifyContent='center'>
                <Grid item xs={12}>
                  <TextField
                    label={
                      <span>
                        Recipe Title <span style={{ color: 'red' }}>*</span>
                      </span>
                    }
                    name='title'
                    value={formik.values.title}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.title && Boolean(formik.errors.title)}
                    helperText={formik.touched.title && formik.errors.title}
                    autoFocus
                    margin='dense'
                    fullWidth
                    placeholder='Enter a recipe title...'
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label='Description'
                    name='description'
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    margin='dense'
                    multiline
                    rows={4}
                    fullWidth
                  />
                </Grid>

                {/* Image Upload Section */}
                <Grid item xs={12}>
                  <Typography variant='subtitle1' gutterBottom>
                    Recipe Image (Optional)
                  </Typography>
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
                      id='image-upload'
                      type='file'
                      onChange={handleImageUpload}
                    />
                    <label htmlFor='image-upload'>
                      <Button
                        variant='outlined'
                        component='span'
                        startIcon={<PhotoCameraIcon />}
                        size='small'
                      >
                        Choose Image
                      </Button>
                    </label>
                    {imagePreview && (
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

                  {imagePreview && (
                    <Box sx={{ mb: 2 }}>
                      <Avatar
                        src={imagePreview}
                        sx={{
                          width: 200,
                          height: 150,
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: 'divider',
                        }}
                        variant='rounded'
                      />
                    </Box>
                  )}
                </Grid>
                <Grid
                  container
                  spacing={2}
                  marginBlock={2}
                  ml={0.5}
                  justifyContent='space-between'
                  alignItems='center'
                >
                  <Grid item xs={6}>
                    <Typography
                      textAlign='left'
                      fontWeight={400}
                      fontSize='1.2rem'
                    >
                      Ingredients
                    </Typography>
                  </Grid>
                  <Grid item xs={6} textAlign='right'>
                    <Button
                      variant='outlined'
                      color='primary'
                      startIcon={<AddIcon />}
                      onClick={handleAddIngredient}
                    >
                      Add Ingredient
                    </Button>
                  </Grid>
                </Grid>

                <FieldArray name='ingredients'>
                  {() => (
                    <>
                      {formik.errors.ingredients &&
                        typeof formik.errors.ingredients === 'string' && (
                          <Typography
                            color='error'
                            variant='body2'
                            sx={{ mb: 1 }}
                          >
                            {formik.errors.ingredients}
                          </Typography>
                        )}
                      <Grid
                        ml={0}
                        container
                        spacing={2}
                        justifyContent='flex-start'
                      >
                        {formik.values.ingredients.map((ingredient, index) => (
                          <Grid item xs={12} sm={6} key={ingredient._id}>
                            <Card
                              elevation={4}
                              sx={{
                                borderRadius: '16px',
                                position: 'relative',
                                border: '1px solid grey',
                                transition: 'all 0.2s ease-in-out',
                              }}
                            >
                              {/* Header with ingredient number and delete button */}
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
                                          <span style={{ color: 'red' }}>
                                            *
                                          </span>
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
                                      onBlur={formik.handleBlur}
                                      error={
                                        formik.touched.ingredients?.[index]
                                          ?.title &&
                                        Boolean(
                                          formik.errors.ingredients?.[index] &&
                                            typeof formik.errors.ingredients[
                                              index
                                            ] === 'object' &&
                                            'title' in
                                              formik.errors.ingredients[
                                                index
                                              ] &&
                                            formik.errors.ingredients[index]
                                              .title
                                        )
                                      }
                                      helperText={
                                        formik.touched.ingredients?.[index]
                                          ?.title &&
                                        formik.errors.ingredients?.[index] &&
                                        typeof formik.errors.ingredients[
                                          index
                                        ] === 'object' &&
                                        'title' in
                                          formik.errors.ingredients[index] &&
                                        formik.errors.ingredients[index].title
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
                                      onBlur={formik.handleBlur}
                                      error={
                                        formik.touched.ingredients?.[index]
                                          ?.quantity &&
                                        Boolean(
                                          formik.errors.ingredients?.[index] &&
                                            typeof formik.errors.ingredients[
                                              index
                                            ] === 'object' &&
                                            'quantity' in
                                              formik.errors.ingredients[
                                                index
                                              ] &&
                                            formik.errors.ingredients[index]
                                              .quantity
                                        )
                                      }
                                      helperText={
                                        formik.touched.ingredients?.[index]
                                          ?.quantity &&
                                        formik.errors.ingredients?.[index] &&
                                        typeof formik.errors.ingredients[
                                          index
                                        ] === 'object' &&
                                        'quantity' in
                                          formik.errors.ingredients[index] &&
                                        formik.errors.ingredients[index]
                                          .quantity
                                      }
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
                                          e.target.value as MeasurementUnit
                                        )
                                      }
                                      onBlur={formik.handleBlur}
                                      error={
                                        formik.touched.ingredients?.[index]
                                          ?.measurement &&
                                        Boolean(
                                          formik.errors.ingredients?.[index] &&
                                            typeof formik.errors.ingredients[
                                              index
                                            ] === 'object' &&
                                            'measurement' in
                                              formik.errors.ingredients[
                                                index
                                              ] &&
                                            formik.errors.ingredients[index]
                                              .measurement
                                        )
                                      }
                                      helperText={
                                        formik.touched.ingredients?.[index]
                                          ?.measurement &&
                                        formik.errors.ingredients?.[index] &&
                                        typeof formik.errors.ingredients[
                                          index
                                        ] === 'object' &&
                                        'measurement' in
                                          formik.errors.ingredients[index] &&
                                        formik.errors.ingredients[index]
                                          .measurement
                                      }
                                      margin='normal'
                                      fullWidth
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          borderRadius: '8px',
                                        },
                                      }}
                                    >
                                      {Object.values(MeasurementUnit).map(
                                        unit => (
                                          <MenuItem key={unit} value={unit}>
                                            {unit}
                                          </MenuItem>
                                        )
                                      )}
                                    </TextField>
                                  </Grid>
                                </Grid>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}
                </FieldArray>
              </Grid>
              {(() => {
                const missingRequirements = [];

                // Check if title is missing
                if (!formik.values.title.trim()) {
                  missingRequirements.push('Recipe title');
                }

                // Check if there are no ingredients at all
                if (formik.values.ingredients.length === 0) {
                  missingRequirements.push('At least 1 ingredient');
                }

                // Check if any ingredient is incomplete (has name but missing other fields)
                const hasIncompleteIngredient = formik.values.ingredients.some(
                  ingredient =>
                    ingredient.title.trim() === '' ||
                    ingredient.quantity <= 0 ||
                    !ingredient.measurement
                );

                // Check if any ingredient is partially filled (has some fields but not all)
                if (hasIncompleteIngredient) {
                  missingRequirements.push(
                    'Each ingredient must be fully filled out'
                  );
                }

                // Only show requirements if something is missing
                if (missingRequirements.length > 0) {
                  return (
                    <Box
                      sx={{
                        marginTop: '20px',
                        marginBottom: '10px',
                        textAlign: 'left',
                      }}
                    >
                      <Typography
                        variant='body2'
                        color='error'
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        Required
                      </Typography>
                      {missingRequirements.map((requirement, index) => (
                        <Typography
                          key={index}
                          variant='body2'
                          color='error'
                          sx={{ ml: 0, fontStyle: 'italic' }}
                        >
                          • {requirement}
                        </Typography>
                      ))}
                    </Box>
                  );
                }

                return null;
              })()}
              <DialogActions sx={{ marginTop: '30px', gap: '5px' }}>
                <Button variant='contained' onClick={toggleAddRecipeDialog}>
                  Cancel
                </Button>
                <Button
                  variant='contained'
                  type='submit'
                  disabled={!formik.isValid || !formik.dirty}
                >
                  Save
                </Button>
              </DialogActions>
            </form>
          </FormikProvider>
        </DialogContent>
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
    </>
  );
}
