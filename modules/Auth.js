/* eslint-disable no-var */
/* eslint-disable no-underscore-dangle */
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const PRIV_KEY = process.env.PRIVATE_KEY;

export const genPassword = (password) => {
  const salt = crypto
    .randomBytes(32)
    .toString('hex');

  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
    .toString('hex');

  return {
    salt,
    hash,
  };
};

export const validPassword = (password, hash, salt) => {
  const hashVerify = crypto
    .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
    .toString('hex');
  return hash === hashVerify;
};

export const issueJwt = (user) => {
  const { _id } = user;
  const expiresIn = '1d';
  const payload = {
    sub: _id,
    iat: Date.now(),
  };

  const signedToken = jwt.sign(
    payload,
    PRIV_KEY,
    {
      expiresIn,
      algorithm: 'RS256',
    },
  );

  return {
    token: `Bearer ${signedToken}`,
    expires: expiresIn,
  };
};
