/**
 * Badge de usuario que muestra nombre, email y rol
 */
import { useAuth } from '@/context/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserBadgeProps {
  compact?: boolean;
  className?: string;
}

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
  const isAdmin = currentUserRole === 'admin';

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Avatar className="h-8 w-8 border-2 border-primary/20">
          <AvatarFallback className={cn(
            "text-xs font-bold",
            isAdmin ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <Badge 
          variant={isAdmin ? "default" : "secondary"} 
          className={cn(
            "gap-1 text-xs",
            isAdmin ? "bg-primary/90" : ""
          )}
        >
          {isAdmin ? <ShieldCheck className="h-3 w-3" /> : <User className="h-3 w-3" />}
          {isAdmin ? 'Admin' : 'Usuario'}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg border bg-card/50",
      isAdmin ? "border-primary/30 bg-primary/5" : "border-border",
      className
    )}>
      <Avatar className={cn(
        "h-9 w-9 border-2",
        isAdmin ? "border-primary/40" : "border-border"
      )}>
        <AvatarFallback className={cn(
          "text-sm font-bold",
          isAdmin ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        )}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium truncate max-w-[150px]" title={email}>
          {email}
        </span>
        <Badge 
          variant={isAdmin ? "default" : "secondary"} 
          className={cn(
            "w-fit gap-1 text-[10px] px-1.5 py-0",
            isAdmin ? "bg-primary/90" : ""
          )}
        >
          {isAdmin ? <ShieldCheck className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
          {isAdmin ? 'Administrador' : 'Usuario'}
        </Badge>
      </div>
    </div>
  );
}
