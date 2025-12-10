/**
 * Badge de usuario que muestra nombre, email y rol
 */
import { useAuth } from '@/context/AuthContext';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, User, Eye, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserBadgeProps {
  compact?: boolean;
  className?: string;
}

// Configuración de roles
const roleConfig: Record<AppRole, { label: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string }> = {
  admin: {
    label: 'Administrador',
    icon: ShieldCheck,
    color: 'text-primary',
    bgColor: 'bg-primary/20',
    borderColor: 'border-primary/40'
  },
  supervisor: {
    label: 'Supervisor',
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/40'
  },
  mechanic: {
    label: 'Mecánico',
    icon: Wrench,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/40'
  },
  user: {
    label: 'Usuario',
    icon: User,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    borderColor: 'border-border'
  }
};

export function UserBadge({ compact = false, className }: UserBadgeProps) {
  const { user } = useAuth();
  const { currentUserRole, loading } = useUserRoles();

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Skeleton className="h-8 w-8 rounded-full" />
        {!compact && <Skeleton className="h-4 w-24" />}
      </div>
    );
  }

  if (!user) return null;

  const email = user.email || 'Usuario';
  const initials = email.substring(0, 2).toUpperCase();
  const role = currentUserRole || 'user';
  const config = roleConfig[role];
  const RoleIcon = config.icon;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Avatar className={cn("h-8 w-8 border-2", config.borderColor)}>
          <AvatarFallback className={cn("text-xs font-bold", config.bgColor, config.color)}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <Badge 
          variant={role === 'admin' ? "default" : "secondary"} 
          className={cn(
            "gap-1 text-xs",
            role === 'admin' && "bg-primary/90",
            role === 'supervisor' && "bg-blue-600 text-white",
            role === 'mechanic' && "bg-amber-600 text-white"
          )}
        >
          <RoleIcon className="h-3 w-3" />
          {config.label}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg border bg-card/50",
      role === 'admin' && "border-primary/30 bg-primary/5",
      role === 'supervisor' && "border-blue-500/30 bg-blue-500/5",
      role === 'mechanic' && "border-amber-500/30 bg-amber-500/5",
      role === 'user' && "border-border",
      className
    )}>
      <Avatar className={cn("h-9 w-9 border-2", config.borderColor)}>
        <AvatarFallback className={cn("text-sm font-bold", config.bgColor, config.color)}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium truncate max-w-[150px]" title={email}>
          {email}
        </span>
        <Badge 
          variant={role === 'admin' ? "default" : "secondary"} 
          className={cn(
            "w-fit gap-1 text-[10px] px-1.5 py-0",
            role === 'admin' && "bg-primary/90",
            role === 'supervisor' && "bg-blue-600 text-white",
            role === 'mechanic' && "bg-amber-600 text-white"
          )}
        >
          <RoleIcon className="h-2.5 w-2.5" />
          {config.label}
        </Badge>
      </div>
    </div>
  );
}
