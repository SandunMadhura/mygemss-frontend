import { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { apiFetchAuth } from '../lib/api';

/**
 * Automatically syncs the Clerk user to our MongoDB on login.
 * Place this hook inside a component wrapped by <ClerkProvider>.
 */
export function useUserSync() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const sync = async () => {
      try {
        const token = await getToken();
        await apiFetchAuth('/users/sync', token, {
          method: 'POST',
          body: JSON.stringify({
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.imageUrl,
          }),
        });
      } catch (err) {
        console.error('User sync failed:', err.message);
      }
    };

    sync();
  }, [isSignedIn, isLoaded, user]);
}
