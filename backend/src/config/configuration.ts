// ============================================================================
// App Configuration — Environment variables
// ============================================================================
export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'granny-secret-key',
    expiration: process.env.JWT_EXPIRATION || '7d',
  },
  ai: {
    serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
  },
});
