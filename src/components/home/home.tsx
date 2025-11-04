import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
  keyframes,
} from '@mui/material';
import {
  ShoppingCart,
  MenuBook,
  PriceCheck,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '@/schemas/route-paths';

// Animation keyframes
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
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

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
`;

const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export function Home() {
  const theme = useTheme();
  const navigate = useNavigate();

  const features = [
    {
      icon: <ShoppingCart sx={{ fontSize: 48 }} />,
      title: 'Create Shopping Lists',
      description:
        'Build and manage your grocery lists with ease. Add items manually or automatically from your favorite recipes.',
      action: 'Create List',
      href: ROUTE_PATHS.createGroceryList,
    },
    {
      icon: <MenuBook sx={{ fontSize: 48 }} />,
      title: 'Add Recipes to Lists',
      description:
        'Import recipes from URLs or add your own. Easily add recipe ingredients to your shopping lists with one click.',
      action: 'Browse Recipes',
      href: ROUTE_PATHS.recipes,
    },
    {
      icon: <PriceCheck sx={{ fontSize: 48 }} />,
      title: 'Real-Time Kroger Prices',
      description:
        'Get up-to-date pricing data directly from Kroger. Our price checker ensures you always have the latest information.',
      action: 'View Lists',
      href: ROUTE_PATHS.savedGroceryLists,
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '90vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          animation: `${rotate} 20s linear infinite`,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '20%',
          right: '-10%',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${alpha(
            theme.palette.primary.main,
            0.08
          )} 0%, transparent 70%)`,
          borderRadius: '50%',
          animation: `${pulse} 4s ease-in-out infinite`,
          pointerEvents: 'none',
        },
      }}
    >
      {/* Hero Section */}
      <Container maxWidth='lg' sx={{ py: { xs: 6, md: 10 } }}>
        <Box
          sx={{
            textAlign: 'center',
            mb: { xs: 6, md: 10 },
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            backgroundColor:
              theme.palette.mode === 'light'
                ? alpha(theme.palette.background.default, 0.8)
                : alpha(theme.palette.background.default, 0.5),
          }}
        >
          <Typography
            variant='h1'
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem' },
              fontWeight: 700,
              mb: 2,
              background: `linear-gradient(135deg, ${
                theme.palette.primary.main
              } 0%, ${
                theme.palette.primary.dark || theme.palette.primary.main
              } 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
              animation: `${fadeInUp} 0.8s ease-out`,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100px',
                height: '4px',
                background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
                borderRadius: '2px',
                animation: `${fadeIn} 1s ease-out 0.5s both`,
              },
            }}
          >
            Recipe Shopper
          </Typography>
          <Typography
            variant='h5'
            sx={{
              fontSize: { xs: '1.1rem', md: '1.5rem' },
              color: 'text.secondary',
              mb: 4,
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.6,
              animation: `${fadeInUp} 0.8s ease-out 0.2s both`,
            }}
          >
            Simplify your grocery shopping with smart lists, recipe integration,
            and real-time price tracking from Kroger.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
              animation: `${fadeInUp} 0.8s ease-out 0.4s both`,
            }}
          >
            <Button
              variant='contained'
              size='large'
              endIcon={<ArrowForward />}
              onClick={() => navigate(ROUTE_PATHS.createGroceryList)}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                textTransform: 'none',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${
                  theme.palette.primary.main
                } 0%, ${
                  theme.palette.primary.dark || theme.palette.primary.main
                } 100%)`,
                backgroundSize: '200% 200%',
                animation: `${gradientShift} 3s ease infinite`,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 0,
                  height: 0,
                  borderRadius: '50%',
                  background: alpha(theme.palette.common.white, 0.3),
                  transform: 'translate(-50%, -50%)',
                  transition: 'width 0.6s, height 0.6s',
                },
                '&:hover': {
                  transform: 'translateY(-2px) scale(1.05)',
                  boxShadow: `0 8px 24px ${alpha(
                    theme.palette.primary.main,
                    0.4
                  )}`,
                  '&::before': {
                    width: '300px',
                    height: '300px',
                  },
                  '& .MuiButton-endIcon': {
                    transform: 'translateX(4px)',
                  },
                },
                '& .MuiButton-endIcon': {
                  transition: 'transform 0.3s ease',
                },
              }}
            >
              Get Started
            </Button>
            <Button
              variant='outlined'
              size='large'
              onClick={() => navigate(ROUTE_PATHS.recipes)}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                textTransform: 'none',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                position: 'relative',
                borderWidth: 2,
                '&:hover': {
                  transform: 'translateY(-2px) scale(1.05)',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  borderWidth: 2,
                  boxShadow: `0 4px 12px ${alpha(
                    theme.palette.primary.main,
                    0.2
                  )}`,
                },
              }}
            >
              Browse Recipes
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease-in-out',
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  animation: `${scaleIn} 0.6s ease-out ${
                    0.6 + index * 0.1
                  }s both`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(90deg, transparent, ${alpha(
                      theme.palette.primary.main,
                      0.1
                    )}, transparent)`,
                    transition: 'left 0.5s ease',
                  },
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: `0 12px 32px ${alpha(
                      theme.palette.primary.main,
                      0.25
                    )}`,
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                    '&::before': {
                      left: '100%',
                    },
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 4 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      mb: 3,
                      color: 'primary.main',
                      animation: `${float} 3s ease-in-out infinite`,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant='h5'
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      textAlign: 'center',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant='body1'
                    sx={{
                      color: 'text.secondary',
                      mb: 3,
                      textAlign: 'center',
                      lineHeight: 1.7,
                    }}
                  >
                    {feature.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant='outlined'
                      endIcon={<ArrowForward />}
                      onClick={() => navigate(feature.href)}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                      }}
                    >
                      {feature.action}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Call to Action Section */}
        <Box
          sx={{
            mt: { xs: 8, md: 12 },
            textAlign: 'center',
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            backgroundSize: '200% 200%',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            position: 'relative',
            overflow: 'hidden',
            animation: `${fadeInUp} 0.8s ease-out 1s both`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: `radial-gradient(circle, ${alpha(
                theme.palette.primary.main,
                0.1
              )} 0%, transparent 70%)`,
              animation: `${pulse} 4s ease-in-out infinite`,
              pointerEvents: 'none',
            },
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.4),
              boxShadow: `0 8px 24px ${alpha(
                theme.palette.primary.main,
                0.15
              )}`,
            },
          }}
        >
          <Typography
            variant='h4'
            sx={{
              fontWeight: 600,
              mb: 2,
              color: 'text.primary',
            }}
          >
            Ready to streamline your shopping?
          </Typography>
          <Typography
            variant='body1'
            sx={{
              color: 'text.secondary',
              mb: 4,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Start creating your first grocery list or explore our recipe
            collection to get started.
          </Typography>
          <Button
            variant='contained'
            size='large'
            endIcon={<ArrowForward />}
            onClick={() => navigate(ROUTE_PATHS.createGroceryList)}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            Create Your First List
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
