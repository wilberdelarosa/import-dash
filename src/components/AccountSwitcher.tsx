/**
 * AccountSwitcher - Multi-account management with saved credentials
 * Features:
 * - Switch between saved accounts without re-entering password
 * - Add new accounts via inline modal
 * - Secure password storage with encryption
 */
import { useState, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  LogOut,
  Check,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  Wrench,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Role display configuration
const roleConfig: Record<AppRole, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  admin: {
    label: 'Administrador',
    icon: ShieldCheck,
    color: 'text-primary',
    bgColor: 'bg-primary/20'
  },
  supervisor: {
    label: 'Supervisor',
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/20'
  },
  mechanic: {
    label: 'Mecánico',
    icon: Wrench,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/20'
  },
  user: {
    label: 'Usuario',
    icon: User,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  }
};

// Encryption key (in production use environment variable)
const STORAGE_KEY = 'import_dash_saved_accounts';


interface SavedAccount {
  email: string;
  encryptedPassword: string;
  lastUsed: number;
  role?: AppRole; // Store the role with the account
}

// Simple encryption for local storage (obfuscation, not cryptographically secure)
const encryptPassword = (password: string): string => {
  return btoa(password.split('').reverse().join(''));
};

const decryptPassword = (encrypted: string): string => {
  try {
    return atob(encrypted).split('').reverse().join('');
  } catch {
    return '';
  }
};

const getSavedAccounts = (): SavedAccount[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveAccount = (email: string, password: string, role?: AppRole) => {
  const accounts = getSavedAccounts().filter(a => a.email !== email);
  accounts.unshift({
    email,
    encryptedPassword: encryptPassword(password),
    lastUsed: Date.now(),
    role
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts.slice(0, 5))); // Max 5 accounts
};

const removeAccount = (email: string) => {
  const accounts = getSavedAccounts().filter(a => a.email !== email);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
};

const updateLastUsed = (email: string, role?: AppRole) => {
  const accounts = getSavedAccounts();
  const account = accounts.find(a => a.email === email);
  if (account) {
    account.lastUsed = Date.now();
    if (role) account.role = role; // Update role when switching
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }
};

interface AccountSwitcherProps {

  children: React.ReactNode;
}

export function AccountSwitcher({ children }: AccountSwitcherProps) {
  const { user, switchAccount, signOut } = useAuth();
  const { toast } = useToast();
  const { currentUserRole } = useUserRoles();

  // Save accounts in state to trigger re-renders when updated
  const [accounts, setAccounts] = useState<SavedAccount[]>(() => getSavedAccounts());
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Update role for current user when it changes
  // This ensures role is saved for when this account is used later
  const updateCurrentUserRole = useCallback(() => {
    if (user?.email && currentUserRole) {
      const savedAccounts = getSavedAccounts();
      const accountToUpdate = savedAccounts.find(a => a.email === user.email);
      if (accountToUpdate && accountToUpdate.role !== currentUserRole) {
        accountToUpdate.role = currentUserRole;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedAccounts));
        setAccounts([...savedAccounts]);
      }
    }
  }, [user?.email, currentUserRole]);

  // Run effect to update role when it becomes available
  // Using a separate effect to avoid infinite loops
  useMemo(() => {
    updateCurrentUserRole();
  }, [updateCurrentUserRole]);


  // Using refs to avoid re-renders while typing (fixes glitch)
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Stable key for modal to prevent re-mounting
  const modalKey = useMemo(() => 'add-account-modal', []);

  // Other accounts (not current user)
  const otherAccounts = useMemo(() => {
    return accounts.filter(a => a.email !== user?.email);
  }, [accounts, user?.email]);

  const refreshAccounts = useCallback(() => {
    setAccounts(getSavedAccounts());
  }, []);

  const handleSwitchToSaved = async (account: SavedAccount) => {
    const password = decryptPassword(account.encryptedPassword);
    if (!password) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo recuperar la contraseña guardada'
      });
      removeAccount(account.email);
      refreshAccounts();
      return;
    }

    setIsLoading(account.email);
    try {
      const success = await switchAccount(account.email, password);
      if (success) {
        // Note: role will be updated on next render when useUserRoles refreshes
        updateLastUsed(account.email, account.role);
        refreshAccounts();
        toast({
          title: 'Cuenta cambiada',
          description: `Ahora usando: ${account.email}`
        });
        setIsOpen(false);

        // Navigate to role-specific home page
        const roleHome = account.role === 'mechanic'
          ? '/mechanic'
          : account.role === 'supervisor'
            ? '/supervisor'
            : '/';
        window.location.href = roleHome;
      } else {

        toast({
          variant: 'destructive',
          title: 'Error al cambiar cuenta',
          description: 'Credenciales inválidas. La cuenta será eliminada.'
        });
        removeAccount(account.email);
        refreshAccounts();
      }
    } finally {
      setIsLoading(null);
    }
  };


  const handleDeleteAccount = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    removeAccount(email);
    refreshAccounts();
    toast({
      title: 'Cuenta eliminada',
      description: 'Las credenciales guardadas fueron borradas'
    });
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailRef.current?.value?.trim();
    const password = passwordRef.current?.value;

    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Email y contraseña son requeridos'
      });
      return;
    }

    setIsLoading('adding');
    try {
      const success = await switchAccount(email, password);
      if (success) {
        // Save without role initially - role will be fetched by useUserRoles
        // We'll update the role when the user switches back
        saveAccount(email, password, undefined);
        refreshAccounts();
        toast({
          title: 'Cuenta agregada',
          description: `Sesión iniciada como: ${email}`
        });
        setShowAddModal(false);
        setIsOpen(false);
        // Reset form
        if (emailRef.current) emailRef.current.value = '';
        if (passwordRef.current) passwordRef.current.value = '';
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Credenciales inválidas'
        });
      }
    } finally {
      setIsLoading(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
  };

  const openAddModal = () => {
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    // Reset form values
    if (emailRef.current) emailRef.current.value = '';
    if (passwordRef.current) passwordRef.current.value = '';
    setShowPassword(false);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer">
            {children}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80" align="end">
          <DropdownMenuLabel className="font-normal p-3">
            <div className="flex items-start gap-3">
              <Avatar className={cn("h-10 w-10 border-2", currentUserRole && roleConfig[currentUserRole]?.bgColor)}>
                <AvatarFallback className={cn("text-sm font-bold", currentUserRole && roleConfig[currentUserRole]?.bgColor, currentUserRole && roleConfig[currentUserRole]?.color)}>
                  {user?.email?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Cuenta actual</p>
                <p className="text-sm font-medium break-all leading-tight">
                  {user?.email}
                </p>
                {currentUserRole && roleConfig[currentUserRole] && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "w-fit gap-1 text-xs mt-1",
                      roleConfig[currentUserRole].bgColor,
                      roleConfig[currentUserRole].color
                    )}
                  >
                    {(() => {
                      const RoleIcon = roleConfig[currentUserRole].icon;
                      return <RoleIcon className="h-3 w-3" />;
                    })()}
                    {roleConfig[currentUserRole].label}
                  </Badge>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />


          {/* Saved accounts */}
          {otherAccounts.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-3">
                Cuentas guardadas
              </DropdownMenuLabel>
              {otherAccounts.map((account) => {
                const accountRole = account.role || 'user';
                const accountRoleConfig = roleConfig[accountRole];
                const RoleIcon = accountRoleConfig?.icon || User;

                return (
                  <DropdownMenuItem
                    key={account.email}
                    className="cursor-pointer group px-3 py-2"
                    disabled={isLoading === account.email}
                    onClick={() => handleSwitchToSaved(account)}
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Avatar className={cn("h-8 w-8 shrink-0", accountRoleConfig?.bgColor)}>
                        <AvatarFallback className={cn("text-xs", accountRoleConfig?.bgColor, accountRoleConfig?.color)}>
                          {account.email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="text-sm break-all leading-tight">{account.email}</span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "w-fit gap-1 text-[10px] px-1.5 py-0",
                            accountRoleConfig?.bgColor,
                            accountRoleConfig?.color
                          )}
                        >
                          <RoleIcon className="h-2.5 w-2.5" />
                          {accountRoleConfig?.label || 'Usuario'}
                        </Badge>
                      </div>
                      {isLoading === account.email ? (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <Check className="h-4 w-4 opacity-0 group-hover:opacity-100 text-green-500" />
                          <button
                            onClick={(e) => handleDeleteAccount(e, account.email)}
                            className="opacity-0 group-hover:opacity-100 hover:text-destructive p-0.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />

            </>
          )}

          {/* Add account */}
          <DropdownMenuItem className="cursor-pointer" onClick={openAddModal}>
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar otra cuenta
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Account Modal - NO AI ICON, uses refs to avoid glitches */}
      <Dialog key={modalKey} open={showAddModal} onOpenChange={(open) => !open && closeAddModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Agregar cuenta
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                ref={emailRef}
                type="email"
                placeholder="ejemplo@correo.com"
                autoComplete="email"
                disabled={isLoading === 'adding'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading === 'adding'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              La contraseña se guardará de forma segura para futuros cambios de cuenta.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeAddModal}
                disabled={isLoading === 'adding'}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading === 'adding'}>
                {isLoading === 'adding' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
