import { createRemoteJWKSet, jwtVerify } from 'jose';
import 'dotenv/config';

const JWKS_URL = process.env.VITE_NEON_AUTH_URL + '/.well-known/jwks.json';
const jwks = createRemoteJWKSet(new URL(JWKS_URL));

/**
 * Verifies the Neon Auth JWT passed as a Bearer token.
 * The JWT's `sub` claim is the user ID from neon_auth.user.
 */
export async function session(c, next) {
  const header = c.req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return c.json({ error: 'Not authenticated' }, 401);

  try {
    const { payload } = await jwtVerify(token, jwks);
    c.set('user', { id: payload.sub, email: payload.email });
    await next();
  } catch (err) {
    return c.json({ error: 'Session expired' }, 401);
  }
}
