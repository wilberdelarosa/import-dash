/**
 * Account Switcher Component
 * Allows switching between multiple saved accounts
 * Responsive: Sheet on mobile, Popover on desktop
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAccountManager } from '@/hooks/useAccountManager';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Check,
  ChevronDown,
  LogOut,
  Plus,
  Trash2,
  User,
  ShieldCheck,
  Wrench,
  Eye,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AccountSwitcherProps {
  children: React.ReactNode;
  className?: string;
}

const roleConfig = {
  admin: { label: 'Admin', icon: ShieldCheck, color: 'bg-primary/90 text-primary-foreground' },
  supervisor: { label: 'Supervisor', icon: Eye, color: 'bg-blue-600 text-white' },
  mechanic: { label: 'Mecánico', icon: Wrench, color: 'bg-amber-600 text-white' },
  user: { label: 'Usuario', icon: User, color: 'bg-muted text-muted-foreground' },
};

export function AccountSwitcher({ children, className }: AccountSwitcherProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [open, setOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  const {
    savedAccounts,
    removeAccount,
    switchToAccount,
    isCurrentAccount,
    isSwitching,
    signOut,
  } = useAccountManager();

  const handleSwitchAccount = (email: string) => {
    if (isCurrentAccount(email)) return;
    setSelectedEmail(email);
    setPassword('');
    setPasswordDialogOpen(true);
  };

  const handleConfirmSwitch = async () => {
    if (!selectedEmail || !password) return;

    const success = await switchToAccount(selectedEmail, password);
    if (success) {
      setPasswordDialogOpen(false);
      setOpen(false);
      toast({
        title: 'Cuenta cambiada',
        description: `Has iniciado sesión como ${selectedEmail}`,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Contraseña incorrecta',
        variant: 'destructive',
      });
    }
    setPassword('');
  };

  const handleAddAccount = async () => {
    await signOut();
    setOpen(false);
    navigate('/auth');
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate('/auth');
  };

  const handleRemoveAccount = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentAccount(email)) {
      toast({
        title: 'No se puede eliminar',
        description: 'No puedes eliminar la cuenta activa',
        variant: 'destructive',
      });
      return;
    }
    removeAccount(email);
    toast({
      title: 'Cuenta eliminada',
      description: `${email} ha sido removida de la lista`,
    });
  };

  const AccountsList = () => (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <h3 className="font-semibold text-sm text-foreground">Mis Cuentas</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {savedAccounts.length} cuenta{savedAccounts.length !== 1 ? 's' : ''} guardada{savedAccounts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Accounts List */}
      <div className="py-2 max-h-[300px] overflow-y-auto">
        {savedAccounts.map((account) => {
          const isCurrent = isCurrentAccount(account.email);
          const role = account.role as keyof typeof roleConfig || 'user';
          const config = roleConfig[role] || roleConfig.user;
          const RoleIcon = config.icon;

          return (
            <div
              key={account.email}
              onClick={() => handleSwitchAccount(account.email)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors group",
                isCurrent 
                  ? "bg-primary/5 cursor-default" 
                  : "hover:bg-muted/50 active:bg-muted"
              )}
            >
              <Avatar className={cn(
                "h-9 w-9 border-2 transition-all",
                isCurrent ? "border-primary/50 ring-2 ring-primary/20" : "border-border"
              )}>
                <AvatarFallback className={cn(
                  "text-xs font-bold",
                  isCurrent ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {account.avatarInitials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium truncate",
                    isCurrent && "text-primary"
                  )}>
                    {account.email}
                  </span>
                  {isCurrent && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
                <Badge className={cn("text-[10px] px-1.5 py-0 gap-0.5 mt-0.5", config.color)}>
                  <RoleIcon className="h-2.5 w-2.5" />
                  {config.label}
                </Badge>
              </div>

              {!isCurrent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => handleRemoveAccount(account.email, e)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="border-t border-border/50 p-2 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 text-sm font-medium hover:bg-primary/10"
          onClick={handleAddAccount}
        >
          <div className="rounded-lg p-1.5 bg-primary/10">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          Agregar otra cuenta
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleSignOut}
        >
          <div className="rounded-lg p-1.5 bg-destructive/10">
            <LogOut className="h-4 w-4" />
          </div>
          Cerrar sesión
        </Button>
      </div>
    </div>
  );

  const PasswordDialog = () => (
    <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Cambiar de cuenta
          </DialogTitle>
          <DialogDescription>
            Ingresa la contraseña para <span className="font-medium text-foreground">{selectedEmail}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmSwitch()}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
              disabled={isSwitching}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSwitch}
              disabled={!password || isSwitching}
            >
              {isSwitching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cambiando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Mobile: Use Sheet
  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <div className={cn("cursor-pointer", className)}>
              {children}
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-[1.5rem] p-0">
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />
            <SheetHeader className="sr-only">
              <SheetTitle>Cambiar de cuenta</SheetTitle>
            </SheetHeader>
            <AccountsList />
          </SheetContent>
        </Sheet>
        <PasswordDialog />
      </>
    );
  }

  // Desktop: Use Popover
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className={cn("cursor-pointer", className)}>
            {children}
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0" 
          align="start" 
          sideOffset={8}
        >
          <AccountsList />
        </PopoverContent>
      </Popover>
      <PasswordDialog />
    </>
  );
}
