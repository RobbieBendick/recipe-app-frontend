import React, { useContext, useState } from 'react';
import { Autocomplete, TextField, Grid, ListItem } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './ingredient-field.css';
import { IngredientContext } from '@/components/recipes/ingredient/context/ingredient-context';

const IngredientField = () => {
  const [inputValue, setInputValue] = useState('');
  const { ingredients } = useContext(IngredientContext);
  const [ingredientOptions, setIngredientOptions] = useState(
    Object.entries(ingredients)
  );

  const filteredOptions = [
    ...ingredientOptions
      .filter(([ingredient]) =>
        ingredient.toLowerCase().includes(inputValue.toLowerCase())
      )
      .map(([ingredient]) => ingredient)
      .sort(),
  ];

  const handleOptionSelect = (
    event: React.SyntheticEvent,
    value: string | null
  ) => {
    if (value) {
      setInputValue(value);
    }
  };

  return (
    <Grid item xs={12}>
      <Autocomplete
        sx={{ cursor: 'pointer' }}
        freeSolo
        options={filteredOptions}
        inputValue={inputValue}
        onInputChange={(_, value) => setInputValue(value)}
        onChange={handleOptionSelect}
        renderOption={(props, option) => {
          const iconName =
            ingredients[option as keyof typeof ingredients] || 'question';
          return (
            <ListItem
              {...props}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <FontAwesomeIcon
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                icon={iconName as any}
                style={{ marginRight: 8 }}
              />
              {option}
            </ListItem>
          );
        }}
        renderInput={params => (
          <TextField
            sx={{ cursor: 'pointer' }}
            {...params}
            label='Ingredient Name'
            margin='dense'
            fullWidth
          />
        )}
      />
    </Grid>
  );
};

export default IngredientField;
