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
  alpha,
  keyframes,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useGroceryList } from '../../contexts/grocery-list-context';
import { useNavigate } from 'react-router-dom';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { ingredientCostDB } from '../../database/ingredient-costs';
import { Ingredient } from '../../schemas/schemas';

// Animation keyframes
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

// Styled Components
const ModernCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: theme.shape.borderRadius * 3,
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
  transition: 'all 0.3s ease',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  overflow: 'hidden',
  cursor: 'pointer',
  animation: `${scaleIn} 0.5s ease-out`,
  '&:hover': {
    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
    transform: 'translateY(-4px)',
    borderColor: alpha(theme.palette.primary.main, 0.3),
  },
}));

const EmptyStateCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 3,
  padding: theme.spacing(6),
  textAlign: 'center',
  background: `linear-gradient(135deg, ${alpha(
    theme.palette.background.paper,
    0.8
  )} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
  border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
  transition: 'all 0.3s ease',
  animation: `${fadeInUp} 0.5s ease-out`,
  '&:hover': {
    borderColor: alpha(theme.palette.primary.main, 0.5),
    background: `linear-gradient(135deg, ${alpha(
      theme.palette.background.paper,
      0.9
    )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
  },
}));

const PrimaryButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1.25, 3),
  transition: 'all 0.3s ease',
  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

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
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ mb: 4, animation: `${fadeInUp} 0.5s ease-out` }}>
        <Typography
          variant='h3'
          gutterBottom
          color='text.primary'
          fontWeight={700}
          sx={{ mb: 1 }}
        >
          Saved Grocery Lists
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          View and manage your saved grocery lists.
        </Typography>
      </Box>

      {groceryLists.length === 0 ? (
        <EmptyStateCard>
          <Box
            sx={{
              p: 3,
              borderRadius: '50%',
              background: theme =>
                `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.1
                )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              display: 'inline-flex',
              mb: 3,
            }}
          >
            <RestaurantIcon sx={{ fontSize: 64, color: 'primary.main' }} />
          </Box>
          <Typography variant='h5' gutterBottom fontWeight={700}>
            No Saved Grocery Lists
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ mb: 4 }}>
            Create your first grocery list to get started.
          </Typography>
          <PrimaryButton
            variant='contained'
            size='large'
            onClick={() => navigate('/create-grocery-list')}
            sx={{ px: 4, py: 1.5 }}
          >
            Create Grocery List
          </PrimaryButton>
        </EmptyStateCard>
      ) : (
        <Grid container spacing={3}>
          {groceryLists.map((list, index) => {
            const costData = calculateListCost(list.items);
            return (
              <Grid item xs={12} sm={6} md={4} key={list.id}>
                <ModernCard
                  sx={{
                    animation: `${scaleIn} 0.5s ease-out ${index * 0.1}s both`,
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
                    <Box
                      sx={{
                        mb: 2,
                        pb: 2,
                        borderBottom: theme =>
                          `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1.5,
                        }}
                      >
                        <Typography
                          variant='h6'
                          fontWeight={700}
                          sx={{ flex: 1 }}
                          color='text.primary'
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
                            sx={{
                              color: 'primary.main',
                              transition: 'all 0.3s ease',
                              border: theme =>
                                `1px solid ${alpha(
                                  theme.palette.primary.main,
                                  0.3
                                )}`,
                              '&:hover': {
                                backgroundColor: 'primary.main',
                                color: 'white',
                                transform: 'scale(1.1)',
                              },
                            }}
                            title='Edit List'
                          >
                            <EditIcon fontSize='small' />
                          </IconButton>
                          <IconButton
                            size='small'
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteList(list.id);
                            }}
                            sx={{
                              color: 'error.main',
                              transition: 'all 0.3s ease',
                              border: theme =>
                                `1px solid ${alpha(
                                  theme.palette.error.main,
                                  0.3
                                )}`,
                              '&:hover': {
                                backgroundColor: 'error.main',
                                color: 'white',
                                transform: 'scale(1.1)',
                              },
                            }}
                            title='Delete List'
                          >
                            <DeleteIcon fontSize='small' />
                          </IconButton>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                        }}
                      >
                        <Typography variant='caption' color='text.secondary'>
                          Created:{' '}
                          {new Date(list.createdAt).toLocaleDateString()}
                        </Typography>
                        {list.lastUpdated.getTime() !==
                          list.createdAt.getTime() && (
                          <Typography variant='caption' color='text.secondary'>
                            Updated:{' '}
                            {new Date(list.lastUpdated).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Items Preview */}
                    <Box sx={{ flex: 1, mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        gutterBottom
                        fontWeight={600}
                        color='text.primary'
                        sx={{ mb: 1.5 }}
                      >
                        Items ({list.items.length})
                      </Typography>
                      <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                        {list.items.slice(0, 5).map((item, itemIndex) => (
                          <ListItem
                            key={itemIndex}
                            sx={{
                              py: 0.75,
                              px: 1,
                              mb: 0.5,
                              borderRadius: 1,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: theme =>
                                  alpha(theme.palette.primary.main, 0.05),
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <Avatar
                                sx={{
                                  width: 28,
                                  height: 28,
                                  background: theme =>
                                    `linear-gradient(135deg, ${
                                      theme.palette.primary.main
                                    } 0%, ${
                                      theme.palette.primary.dark ||
                                      theme.palette.primary.main
                                    } 100%)`,
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
                                    sx={{ flex: 1, fontWeight: 500 }}
                                    color='text.primary'
                                  >
                                    {item.title}
                                  </Typography>
                                  <Chip
                                    label={`${item.quantity} ${item.measurement}`}
                                    size='small'
                                    sx={{
                                      backgroundColor: theme =>
                                        alpha(theme.palette.primary.main, 0.1),
                                      color: 'primary.main',
                                      fontWeight: 600,
                                      border: theme =>
                                        `1px solid ${alpha(
                                          theme.palette.primary.main,
                                          0.3
                                        )}`,
                                    }}
                                  />
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                        {list.items.length > 5 && (
                          <ListItem sx={{ py: 0.5, px: 1 }}>
                            <Typography
                              variant='body2'
                              color='text.secondary'
                              fontStyle='italic'
                            >
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
                        borderTop: theme =>
                          `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: theme =>
                          costData.totalCost > 0
                            ? `linear-gradient(135deg, ${alpha(
                                theme.palette.success.main,
                                0.05
                              )} 0%, transparent 100%)`
                            : 'transparent',
                        borderRadius: 1,
                        px: 1,
                        py: 1.5,
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <AttachMoneyIcon
                          sx={{
                            fontSize: 20,
                            color:
                              costData.totalCost > 0
                                ? 'success.main'
                                : 'text.secondary',
                          }}
                        />
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          fontWeight={500}
                        >
                          {list.items.length} items
                        </Typography>
                      </Box>
                      <Typography
                        variant='h6'
                        sx={{
                          fontWeight: 700,
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
                </ModernCard>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
