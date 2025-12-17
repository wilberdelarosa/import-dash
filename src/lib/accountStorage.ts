/**
 * Storage service for saved accounts
 * Security: Passwords are NOT stored. Only email, initials, role, and last used date.
 */

export interface SavedAccount {
  email: string;
  avatarInitials: string;
  role?: string;
  lastUsed: string; // ISO date string
}

const STORAGE_KEY = 'alito-saved-accounts';

export const accountStorage = {
  getSavedAccounts: (): SavedAccount[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as SavedAccount[];
    } catch {
      return [];
    }
  },

  saveAccount: (account: Omit<SavedAccount, 'lastUsed'>): void => {
    try {
      const accounts = accountStorage.getSavedAccounts();
      const existingIndex = accounts.findIndex(a => a.email === account.email);
      
      const newAccount: SavedAccount = {
        ...account,
        lastUsed: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        // Update existing account
        accounts[existingIndex] = newAccount;
      } else {
        // Add new account
        accounts.push(newAccount);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch (error) {
      console.error('Error saving account:', error);
    }
  },

  removeAccount: (email: string): void => {
    try {
      const accounts = accountStorage.getSavedAccounts();
      const filtered = accounts.filter(a => a.email !== email);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing account:', error);
    }
  },

  updateLastUsed: (email: string): void => {
    try {
      const accounts = accountStorage.getSavedAccounts();
      const account = accounts.find(a => a.email === email);
      if (account) {
        account.lastUsed = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
      }
    } catch (error) {
      console.error('Error updating last used:', error);
    }
  },

  clearAll: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing accounts:', error);
    }
  },
};
