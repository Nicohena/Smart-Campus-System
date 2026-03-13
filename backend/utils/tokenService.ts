import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';

export const signAccessToken = (payload: object): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessTokenExpires as any,
  });
};

export const generateRefreshToken = () => {
  const token = crypto.randomBytes(48).toString('hex');
  const expires = new Date();
  expires.setDate(expires.getDate() + config.jwt.refreshTokenExpiresDays);
  return { token, expires };
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, config.jwt.secret);
};
