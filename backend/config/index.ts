import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.error('CRITICAL: JWT_SECRET not set in environment.');
  process.exit(1);
}

export const config = {
  jwt: {
    secret: JWT_SECRET,
    accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || '1d',
    refreshTokenExpiresDays: Number(process.env.REFRESH_TOKEN_EXPIRY_DAYS) || 7,
  },
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
