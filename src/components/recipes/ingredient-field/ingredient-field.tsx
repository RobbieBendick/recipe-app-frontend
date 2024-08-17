import React, { useState } from 'react';
import { Autocomplete, TextField, Grid } from '@mui/material';
import './ingredient-field.css';

const ingredients = ['Apple', 'Banana', 'Orange', 'Grapes', 'Pineapple'];

const IngredientField = () => {
  const [inputValue, setInputValue] = useState('');

  const handleIngredientChange = (
    event: React.SyntheticEvent,
    value: string
  ) => {
    setInputValue(value);
  };

  const filteredOptions = ingredients.filter(ingredient =>
    ingredient.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Grid item xs={12}>
      <Autocomplete
        sx={{
          cursor: 'pointer',
        }}
        freeSolo
        options={filteredOptions}
        inputValue={inputValue}
        onInputChange={handleIngredientChange}
        renderInput={params => (
          <TextField
            sx={{
              cursor: 'pointer',
            }}
            {...params}
            label='Ingredient Title'
            margin='dense'
            fullWidth
          />
        )}
      />
    </Grid>
  );
};

export default IngredientField;
