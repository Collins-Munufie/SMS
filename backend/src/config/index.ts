import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'sms_ghana_super_secret_jwt_key_2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'sms_ghana_super_secret_refresh_jwt_key_2026',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
