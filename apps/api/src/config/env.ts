import dotenv from 'dotenv'

dotenv.config()

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001'),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtAccessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
  jwtRefreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
  apiPrefix: '/api',
}
