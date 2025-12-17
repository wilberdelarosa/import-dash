/**
 * Hook for managing multiple user accounts
 */
import { useState, useEffect, useCallback } from 'react';
import { accountStorage, SavedAccount } from '@/lib/accountStorage';
import { useAuth } from '@/context/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';

export function useAccountManager() {
  const { user, signOut, switchAccount } = useAuth();
  const { currentUserRole } = useUserRoles();
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);

  // Load saved accounts on mount and when user changes
  useEffect(() => {
    const accounts = accountStorage.getSavedAccounts();
    setSavedAccounts(accounts);
  }, [user?.email]);

  // Save current account when user logs in
  useEffect(() => {
    if (user?.email) {
      const initials = user.email.substring(0, 2).toUpperCase();
      accountStorage.saveAccount({
        email: user.email,
        avatarInitials: initials,
        role: currentUserRole || undefined,
      });
      setSavedAccounts(accountStorage.getSavedAccounts());
    }
  }, [user?.email, currentUserRole]);

  const addCurrentAccount = useCallback(() => {
    if (user?.email) {
      const initials = user.email.substring(0, 2).toUpperCase();
      accountStorage.saveAccount({
        email: user.email,
        avatarInitials: initials,
        role: currentUserRole || undefined,
      });
      setSavedAccounts(accountStorage.getSavedAccounts());
    }
  }, [user?.email, currentUserRole]);

  const removeAccount = useCallback((email: string) => {
    accountStorage.removeAccount(email);
    setSavedAccounts(accountStorage.getSavedAccounts());
  }, []);

  const switchToAccount = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsSwitching(true);
    try {
      const success = await switchAccount(email, password);
      if (success) {
        accountStorage.updateLastUsed(email);
        setSavedAccounts(accountStorage.getSavedAccounts());
      }
      return success;
    } finally {
      setIsSwitching(false);
    }
  }, [switchAccount]);

  const isCurrentAccount = useCallback((email: string): boolean => {
    return user?.email === email;
  }, [user?.email]);

  const clearAllAccounts = useCallback(() => {
    accountStorage.clearAll();
    setSavedAccounts([]);
  }, []);

  // Get accounts sorted by last used, with current account first
  const sortedAccounts = [...savedAccounts].sort((a, b) => {
    if (isCurrentAccount(a.email)) return -1;
    if (isCurrentAccount(b.email)) return 1;
    return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
  });

  return {
    savedAccounts: sortedAccounts,
    addCurrentAccount,
    removeAccount,
    switchToAccount,
    isCurrentAccount,
    clearAllAccounts,
    isSwitching,
    currentEmail: user?.email,
    signOut,
  };
}
