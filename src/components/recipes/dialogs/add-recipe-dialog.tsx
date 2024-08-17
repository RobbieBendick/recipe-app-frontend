import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Grid,
  Typography,
  Card,
  CardContent,
  IconButton,
  MenuItem,
} from '@mui/material';
import { useContext } from 'react';
import * as yup from 'yup';
import { useFormik, FormikProvider, FieldArray } from 'formik';
import { IRecipe, MeasurementUnit } from '../../../schemas/schemas';
import { RecipeContext } from '../recipe-context';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import IngredientField from '@/components/recipes/ingredient-field/ingredient-field';

export function AddRecipeDialog() {
  const { toggleAddRecipeDialog, isAddRecipeDialogOpen } =
    useContext(RecipeContext);

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
    validationSchema: yup.object({
      title: yup.string().required('Title is required'),
      description: yup.string().optional(),
      ingredients: yup
        .array()
        .of(
          yup.object({
            _id: yup.number().required(),
            title: yup.string().required('Ingredient title is required'),
            quantity: yup.number().required('Quantity is required').positive(),
            measurement: yup
              .mixed<MeasurementUnit>()
              .oneOf(Object.values(MeasurementUnit))
              .required('Measurement unit is required'),
          })
        )
        .min(1, 'At least one ingredient is required'),
    }),
    onSubmit: (values: IRecipe) => {
      console.log('values: ', values);
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
    field: keyof Omit<IRecipe['ingredients'][number], '_id'>,
    value: unknown
  ) => {
    const newIngredients = [...formik.values.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    formik.setFieldValue('ingredients', newIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = formik.values.ingredients.filter(
      (_, i) => i !== index
    );
    formik.setFieldValue('ingredients', newIngredients);
  };

  return (
    <Dialog open={isAddRecipeDialogOpen} onClose={toggleAddRecipeDialog}>
      <DialogTitle>Add a New Recipe</DialogTitle>
      <DialogContent>
        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={2} justifyContent='center'>
              <Grid item xs={12}>
                <TextField
                  label='Recipe Title'
                  name='title'
                  value={formik.values.title}
                  error={formik.touched.title && Boolean(formik.errors.title)}
                  helperText={formik.touched.title && formik.errors.title}
                  onChange={formik.handleChange}
                  autoFocus
                  margin='dense'
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label='Description'
                  name='description'
                  value={formik.values.description}
                  error={
                    formik.touched.description &&
                    Boolean(formik.errors.description)
                  }
                  helperText={
                    formik.touched.description && formik.errors.description
                  }
                  onChange={formik.handleChange}
                  margin='dense'
                  multiline
                  rows={4}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Typography
                  variant='h6'
                  fontWeight={500}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  Ingredients
                  <IconButton
                    onClick={handleAddIngredient}
                    sx={{ marginLeft: 'auto' }}
                  >
                    <AddIcon />
                  </IconButton>
                </Typography>
              </Grid>
              <FieldArray name='ingredients'>
                {() => (
                  <>
                    {formik.values.ingredients.map((ingredient, index) => (
                      <Grid item xs={12} md={6} key={ingredient._id}>
                        <Card
                          sx={{
                            position: 'relative',
                            paddingBlock: 2,
                            flexDirection: 'column',
                            borderRadius: '20px',
                          }}
                        >
                          <IconButton
                            onClick={() => handleRemoveIngredient(index)}
                            color='error'
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                          <CardContent>
                            <Grid container spacing={2}>
                              <IngredientField />
                              <Grid item xs={6}>
                                <TextField
                                  label='Quantity'
                                  type='number'
                                  value={ingredient.quantity}
                                  onChange={e =>
                                    handleIngredientChange(
                                      index,
                                      'quantity',
                                      Number(e.target.value)
                                    )
                                  }
                                  margin='dense'
                                  fullWidth
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
                                  margin='dense'
                                  fullWidth
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
                      </Grid>
                    ))}
                  </>
                )}
              </FieldArray>
            </Grid>
            <DialogActions sx={{ marginTop: '30px', gap: '5px' }}>
              <Button variant='contained' onClick={toggleAddRecipeDialog}>
                Cancel
              </Button>
              <Button variant='contained' type='submit'>
                Save
              </Button>
            </DialogActions>
          </form>
        </FormikProvider>
      </DialogContent>
    </Dialog>
  );
}
