import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    AlertCircle,
    FileSearch,
    FileCheck,
    ShoppingCart,
    Truck,
    Package,
    Wrench,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Calendar,
    HelpCircle
} from 'lucide-react';
import type { TicketStatus, TicketPriority, TicketProblemType } from '@/types/tickets';
import { TICKET_STATUS_CONFIG, TICKET_PRIORITY_CONFIG, TICKET_PROBLEM_TYPE_CONFIG } from '@/types/tickets';

const StatusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    AlertCircle,
    FileSearch,
    FileCheck,
    ShoppingCart,
    Truck,
    Package,
    Wrench,
    CheckCircle,
    XCircle,
};

const ProblemIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    AlertTriangle,
    Package,
    Calendar,
    Wrench,
    HelpCircle,
};

interface TicketStatusBadgeProps {
    status: TicketStatus;
    size?: 'sm' | 'md';
    showIcon?: boolean;
}

export function TicketStatusBadge({ status, size = 'md', showIcon = true }: TicketStatusBadgeProps) {
    const config = TICKET_STATUS_CONFIG[status];
    const Icon = StatusIcons[config.icon];

    return (
        <Badge
            variant="outline"
            className={cn(
                'font-medium border-0',
                config.bgColor,
                config.color,
                size === 'sm' ? 'text-[10px] px-1.5 py-0 h-5' : 'text-xs px-2 py-0.5'
            )}
        >
            {showIcon && Icon && <Icon className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
            {config.label}
        </Badge>
    );
}

interface TicketPriorityBadgeProps {
    priority: TicketPriority;
    size?: 'sm' | 'md';
}

export function TicketPriorityBadge({ priority, size = 'md' }: TicketPriorityBadgeProps) {
    const config = TICKET_PRIORITY_CONFIG[priority];

    return (
        <Badge
            variant="outline"
            className={cn(
                'font-medium border-0',
                config.bgColor,
                config.color,
                size === 'sm' ? 'text-[10px] px-1.5 py-0 h-5' : 'text-xs px-2 py-0.5'
            )}
        >
            {config.label}
        </Badge>
    );
}

interface TicketTypeBadgeProps {
    type: TicketProblemType;
    size?: 'sm' | 'md';
    showIcon?: boolean;
}

export function TicketTypeBadge({ type, size = 'md', showIcon = false }: TicketTypeBadgeProps) {
    const config = TICKET_PROBLEM_TYPE_CONFIG[type];
    const Icon = ProblemIcons[config.icon];

    return (
        <Badge
            variant="secondary"
            className={cn(
                'font-medium',
                size === 'sm' ? 'text-[10px] px-1.5 py-0 h-5' : 'text-xs px-2 py-0.5'
            )}
        >
            {showIcon && Icon && <Icon className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
            {config.label}
        </Badge>
    );
}
