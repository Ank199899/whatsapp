// Development configuration for full-stack application
export const config = {
  // API Base URL - Development server
  apiBaseUrl: process.env.NODE_ENV === 'development' ? '' : 'http://localhost:3000',

  // All features enabled in development mode
  features: {
    whatsappIntegration: true, // Enabled - backend server available
    realTimeSync: true, // Enabled - backend server available
    mediaUpload: true, // Enabled - backend server available
    qrCodeGeneration: true, // Enabled - backend server available
    contactManagement: true, // Full functionality with backend
    templateManagement: true, // Full functionality with backend
    campaignPlanning: true, // Full functionality with backend
    analytics: true, // Full functionality with backend
  },

  // Development environment
  environment: {
    isVercel: false,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    deploymentOnly: false, // Full server deployment
  },

  // Development validation
  validateEnvironment() {
    // Always allow development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🔥 Running in development mode with all features enabled');
      return true;
    }

    // Check if running on localhost in production
    const isLocalDeployment = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname.includes('192.168.'));

    if (!isLocalDeployment && typeof window !== 'undefined') {
      console.warn('⚠️ This application is configured for local development.');
      console.warn('🌐 Visit: http://localhost:5173 (dev) or http://localhost:3000 (prod)');
    }

    return true; // Always allow in development
  }
};

// Helper function to check if a feature is available
export const isFeatureAvailable = (feature: keyof typeof config.features): boolean => {
  return config.features[feature];
};

// Helper function to get appropriate API endpoint
export const getApiUrl = (endpoint: string): string => {
  return `${config.apiBaseUrl}/api${endpoint}`;
};
