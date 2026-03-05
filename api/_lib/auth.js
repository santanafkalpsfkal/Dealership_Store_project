import jwt from 'jsonwebtoken';

const JWT_EXP = '7d';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Falta la variable JWT_SECRET');
  }
  return secret;
}

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    getSecret(),
    { expiresIn: JWT_EXP }
  );
}

export function verifyAuthToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}
