/**
 * useUserProfile Hook
 *
 * Fetches a user's profile from the backend /api/users/:id endpoint.
 * Also provides an updateProfile function for PATCH requests.
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api';

export function useUserProfile(userId) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setUser(data.data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /**
   * Update first_name / last_name / phone
   * Returns { success: true, user } or { success: false, error }
   */
  const updateProfile = async (fields) => {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      setUser(data.data.user);
      return { success: true, user: data.data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return { user, loading, error, refetch: fetchUser, updateProfile };
}
