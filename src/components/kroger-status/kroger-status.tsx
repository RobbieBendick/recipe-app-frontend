import React from 'react';
import { Box, Chip, Alert, Button, CircularProgress } from '@mui/material';
import { CheckCircle, Error, Warning, Refresh } from '@mui/icons-material';
import { useKroger } from '../../contexts/kroger-context';

export const KrogerStatus: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    isFetchingCosts,
    connectionError,
    testConnection,
    clearError,
  } = useKroger();

  const getStatusIcon = () => {
    if (isConnecting || isFetchingCosts) return <CircularProgress size={16} />;
    if (isConnected) return <CheckCircle color='success' />;
    if (connectionError) return <Error color='error' />;
    return <Warning color='warning' />;
  };

  const getStatusColor = () => {
    if (isConnecting || isFetchingCosts) return 'default';
    if (isConnected) return 'success';
    if (connectionError) return 'error';
    return 'warning';
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting to Kroger API...';
    if (isFetchingCosts) return 'Fetching ingredient costs...';
    if (isConnected) return 'Kroger API Connected';
    if (connectionError) return 'Kroger API Error';
    return 'Kroger API Status Unknown';
  };

  const handleRetry = () => {
    clearError();
    testConnection();
  };

  return (
    <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
      {connectionError ? (
        <Alert
          severity='error'
          action={
            <Button
              color='inherit'
              size='small'
              onClick={handleRetry}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          }
          sx={{ maxWidth: 400 }}
        >
          <strong>Kroger API Error:</strong> {connectionError}
        </Alert>
      ) : (
        <Chip
          icon={getStatusIcon()}
          label={getStatusText()}
          color={getStatusColor()}
          variant={isConnected ? 'filled' : 'outlined'}
          sx={{
            backgroundColor: isConnected ? 'success.light' : 'transparent',
            color: isConnected ? 'success.contrastText' : 'inherit',
          }}
        />
      )}
    </Box>
  );
};
