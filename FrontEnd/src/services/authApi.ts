/**
 * Sign-in against the campus API.
 *
 * `POST /api/auth/login` → `{ token, user: { _id, email } }`. The token is a
 * JWT the caller stores via `setAuthToken`; this module only validates and
 * returns it, so the auth flow stays out of the components.
 */

import { ApiError, apiRequest, isRecord } from './apiClient';

export interface AuthUser {
  _id: string;
  email: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

function isAuthUser(value: unknown): value is AuthUser {
  return (
    isRecord(value) &&
    typeof value._id === 'string' &&
    typeof value.email === 'string'
  );
}

function isLoginResult(value: unknown): value is LoginResult {
  return (
    isRecord(value) &&
    typeof value.token === 'string' &&
    value.token !== '' &&
    isAuthUser(value.user)
  );
}

/** Throws `ApiError` (status 401 for bad credentials, 0 for network/shape). */
export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  const body = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (!isLoginResult(body)) {
    throw new ApiError(502, 'The login response did not match the expected shape.');
  }

  return body;
}
