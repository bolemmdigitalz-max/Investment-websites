import { useState, useEffect, useCallback } from 'react';
import axios from "axios";

const TOKEN_KEY = 'token';

/**
 * Decode the payload of a JWT (the middle, base64url-encoded part).
 * Returns null when the token is malformed.
 */
export function getPayload(jwt) {
  try {
    const base64 = jwt.split(".")[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (e) {
    return null;
  }
}

/**
 * A token is considered expired when it is malformed or when its `exp`
 * claim (in seconds since the epoch) lies in the past.
 */
export function isExpired(jwt) {
  const payload = getPayload(jwt);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 <= Date.now();
}

function readStoredToken() {
  const userToken = localStorage.getItem(TOKEN_KEY);
  if (!userToken) return null;
  if (isExpired(userToken)) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
  return userToken;
}

function useToken() {
  const [token, setToken] = useState(readStoredToken);
  const [isAdmin, setIsAdmin] = useState(false);

  const saveToken = useCallback((userToken) => {
    localStorage.setItem(TOKEN_KEY, userToken);
    setToken(userToken);
  }, []);

  const removeToken = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setIsAdmin(false);
  }, []);

  // Validate the stored token against the server whenever it changes.
  // The backend attaches a fresh `access_token` when the current one is
  // about to expire, so we store that one instead.
  useEffect(() => {
    if (!token) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    const headers = { Authorization: 'Bearer ' + token };

    axios.post("/api/validate", null, { headers })
      .then((response) => {
        if (cancelled) return;
        const refreshed = response.data && response.data.access_token;
        if (refreshed && refreshed !== token) saveToken(refreshed);
      })
      .catch((error) => {
        if (cancelled) return;
        // Only discard the token when the server explicitly rejects it;
        // a network hiccup should not log the user out.
        if (error.response && [401, 403, 422].includes(error.response.status)) {
          removeToken();
        }
      });

    axios.get("/api/admin/verify", { headers })
      .then((response) => {
        if (!cancelled) setIsAdmin(Boolean(response.data && response.data.isAdmin));
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });

    return () => { cancelled = true; };
  }, [token, saveToken, removeToken]);

  return {
    setToken: saveToken,
    token,
    isAdmin,
    removeToken
  }
}

export default useToken;
