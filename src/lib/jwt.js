import jwt from 'jsonwebtoken';

const SECRET = process.env.MOBILE_JWT_SECRET || process.env.NEXTAUTH_SECRET;

export function signAccessToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, SECRET, { expiresIn });
}

export function verifyAccessToken(token) {
  try { return jwt.verify(token, SECRET); }
  catch { return null; }
}
