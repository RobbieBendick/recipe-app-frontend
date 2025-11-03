import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  IconButton,
  Grid,
} from '@mui/material';
import { useGroceryList } from '../../contexts/grocery-list-context';
import { useNavigate } from 'react-router-dom';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { ingredientCostDB } from '../../database/ingredient-costs';
import { Ingredient } from '../../schemas/schemas';

export function SavedGroceryLists() {
  const { groceryLists, deleteGroceryList } = useGroceryList();
  const navigate = useNavigate();

  const calculateListCost = (items: Ingredient[]) => {
    const ingredients = items.map(item => ({
      name: item.title,
      quantity: item.quantity,
      measurement: item.measurement,
    }));
    return ingredientCostDB.calculateRecipeCost(ingredients);
  };

  const handleDeleteList = (id: string) => {
    if (window.confirm('Are you sure you want to delete this grocery list?')) {
      deleteGroceryList(id);
    }
  };

  const handleEditList = (id: string) => {
    // Navigate to create grocery list with pre-filled data
    navigate(`/create-grocery-list?edit=${id}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom color='text.primary'>
        Saved Grocery Lists
      </Typography>
      <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
        View and manage your saved grocery lists.
      </Typography>

      {groceryLists.length === 0 ? (
        <Card elevation={2}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <RestaurantIcon
              sx={{ fontSize: 64, color: 'primary.main', mb: 2 }}
            />
            <Typography variant='h6' gutterBottom>
              No Saved Grocery Lists
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Create your first grocery list to get started.
            </Typography>
            <Button
              variant='contained'
              size='large'
              onClick={() => navigate('/create-grocery-list')}
            >
              Create Grocery List
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {groceryLists.map(list => {
            const costData = calculateListCost(list.items);
            return (
              <Grid item xs={12} sm={6} md={4} key={list.id}>
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
                  <CardContent
                    sx={{
                      p: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Header */}
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant='h6'
                          fontWeight={600}
                          sx={{ flex: 1 }}
                        >
                          {list.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size='small'
                            onClick={e => {
                              e.stopPropagation();
                              handleEditList(list.id);
                            }}
                            color='primary'
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>
                          <IconButton
                            size='small'
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteList(list.id);
                            }}
                            color='error'
                          >
                            <DeleteIcon fontSize='small' />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography variant='body2' color='text.secondary'>
                        Created: {new Date(list.createdAt).toLocaleDateString()}
                      </Typography>
                      {list.lastUpdated.getTime() !==
                        list.createdAt.getTime() && (
                        <Typography variant='body2' color='text.secondary'>
                          Updated:{' '}
                          {new Date(list.lastUpdated).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>

                    {/* Items Preview */}
                    <Box sx={{ flex: 1, mb: 2 }}>
                      <Typography variant='subtitle2' gutterBottom>
                        Items ({list.items.length})
                      </Typography>
                      <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                        {list.items.slice(0, 5).map((item, index) => (
                          <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <Avatar
                                sx={{
                                  width: 24,
                                  height: 24,
                                  bgcolor: 'primary.light',
                                }}
                              >
                                <RestaurantIcon fontSize='small' />
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                  }}
                                >
                                  <Typography
                                    variant='body2'
                                    noWrap
                                    sx={{ flex: 1 }}
                                  >
                                    {item.title}
                                  </Typography>
                                  <Chip
                                    label={`${item.quantity} ${item.measurement}`}
                                    size='small'
                                    color='primary'
                                    variant='outlined'
                                  />
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                        {list.items.length > 5 && (
                          <ListItem sx={{ py: 0.5, px: 0 }}>
                            <Typography variant='body2' color='text.secondary'>
                              ... and {list.items.length - 5} more items
                            </Typography>
                          </ListItem>
                        )}
                      </List>
                    </Box>

                    {/* Footer with Cost */}
                    <Box
                      sx={{
                        pt: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant='body2' color='text.secondary'>
                        {list.items.length} items
                      </Typography>
                      <Typography
                        variant='body2'
                        sx={{
                          fontWeight: 600,
                          color:
                            costData.totalCost > 0
                              ? 'success.main'
                              : 'text.secondary',
                        }}
                      >
                        ${costData.totalCost.toFixed(2)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
