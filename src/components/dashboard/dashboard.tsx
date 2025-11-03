import React from 'react';
import {
  Card,
  useTheme,
  Icon,
  Typography,
  CardContent,
  Box,
  Grid,
} from '@mui/material';
import { Book, ListAlt, AddShoppingCart } from '@mui/icons-material';

interface CardDataProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

const cardData: CardDataProps[] = [
  {
    icon: <Book fontSize='large' />,
    title: 'Recipes',
    description: 'Manage and explore your saved recipes.',
    href: '/recipes',
  },
  {
    icon: <ListAlt fontSize='large' />,
    title: 'Saved Grocery Lists',
    description: 'View and edit your saved grocery lists.',
    href: '/saved-grocery-lists',
  },
  {
    icon: <AddShoppingCart fontSize='large' />,
    title: 'Create Grocery List',
    description:
      'Start a new grocery list with your saved recipes. Just drag and drop any saved recipe, and let it generate your grocery list for you.',
    href: '/create-grocery-list',
  },
];

export const ElevatedCard: React.FC<CardDataProps> = ({
  title,
  description,
  icon,
  href,
}) => {
  const theme = useTheme();

  return (
    <a
      href={href}
      style={{
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <Card
        sx={{
          position: 'relative',
          width: '21rem',
          height: '17rem',
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: theme.palette.background.default,
          p: 2,
        }}
      >
        <CardContent>
          <Box
            sx={{
              marginTop: 'auto',
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.background.paper,
              borderRadius: '20%',
              width: '4rem',
              height: '4rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '0.8rem',
            }}
          >
            <Icon sx={{ width: 'unset', height: 'unset', display: 'flex' }}>
              {icon}
            </Icon>
          </Box>
          <Typography
            variant='h6'
            fontWeight={600}
            fontSize='1.5rem'
            marginBottom='0.8rem'
          >
            {title}
          </Typography>
          <Typography sx={{ fontSize: '1.1rem' }} variant='body2'>
            {description}
          </Typography>
        </CardContent>
      </Card>
    </a>
  );
};

export const CardSection: React.FC = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        flexGrow: 1,
        p: 2,
      }}
    >
      <Typography
        variant='h4'
        align='center'
        sx={{
          fontWeight: 'bold',
          marginBottom: 4,
          color: theme.palette.text.primary,
        }}
      >
        Your Dashboard
      </Typography>
      <Grid container spacing={3} justifyContent='center'>
        {cardData.map((card: CardDataProps) => (
          <Grid item key={card.title}>
            <ElevatedCard
              title={card.title}
              description={card.description}
              icon={card.icon}
              href={card.href}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CardSection;
