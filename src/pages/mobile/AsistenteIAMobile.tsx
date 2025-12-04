/**
 * Asistente IA Móvil - Chat Premium
 * 
 * Características:
 * - Chat interface optimizado para mobile
 * - Glassmorphism y gradientes premium
 * - Badge de modelo activo
 * - Sheet de contexto del sistema
 * - Export de conversación
 * - Acciones en mensajes (copiar, exportar tabla)
 * - Entrada de texto sticky con animaciones
 * - Scroll automático a mensajes nuevos
 */

import { useState, useRef, useEffect } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sparkles,
    Send,
    Loader2,
    RefreshCw,
    UserRound,
    ChevronDown,
    Info,
    Download,
    Copy,
    MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ChatMessage } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';

interface ContextSection {
    title: string;
    items: string[];
}

interface ChatContextSummary {
    summary: string;
    sections: ContextSection[];
    lastUpdatedLabel: string;
}

interface AsistenteIAMobileProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (message: string) => void;
    onClearChat: () => void;
    activeModel?: string | null;
    context?: ChatContextSummary;
    onExportConversation?: () => void;
}

const quickPrompts = [
    '¿Cuántos equipos tengo activos?',
    'Mostrar mantenimientos vencidos',
    'Resumen del inventario',
    'Próximos mantenimientos',
];

export function AsistenteIAMobile({
    messages,
    isLoading,
    onSendMessage,
    onClearChat,
    activeModel,
    context,
    onExportConversation,
}: AsistenteIAMobileProps) {
    const { toast } = useToast();
    const [input, setInput] = useState('');
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [contextSheetOpen, setContextSheetOpen] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        onSendMessage(input.trim());
        setInput('');
    };

    const handleQuickPrompt = (prompt: string) => {
        if (isLoading) return;
        onSendMessage(prompt);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleCopyMessage = async (content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            toast({
                title: "Copiado",
                description: "Mensaje copiado al portapapeles",
            });
        } catch (err) {
            toast({
                title: "Error",
                description: "No se pudo copiar el mensaje",
                variant: "destructive",
            });
        }
    };

    const handleExport = () => {
        if (onExportConversation) {
            onExportConversation();
        }
    };

    return (
        <>
            <MobileLayout
                title="Asistente IA"
                showBottomNav={true}
                headerActions={
                    <div className="flex items-center gap-2">
                        {activeModel && (
                            <Badge variant="outline" className="text-[0.65rem] px-2 py-0.5 h-6 border-primary/30 text-primary bg-primary/5">
                                {activeModel.split('-').slice(0, 2).join('-')}
                            </Badge>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setContextSheetOpen(true)} className="gap-2">
                                    <Info className="h-4 w-4" />
                                    Ver contexto
                                </DropdownMenuItem>
                                {onExportConversation && messages.length > 0 && (
                                    <DropdownMenuItem onClick={handleExport} className="gap-2">
                                        <Download className="h-4 w-4" />
                                        Exportar conversación
                                    </DropdownMenuItem>
                                )}
                                {messages.length > 0 && (
                                    <DropdownMenuItem onClick={onClearChat} className="gap-2 text-destructive focus:text-destructive">
                                        <RefreshCw className="h-4 w-4" />
                                        Limpiar chat
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                }
            >
                {/* Main container with proper height for mobile */}
                <div className="flex flex-col h-[calc(100dvh-7.5rem)] -mx-4 -mt-2">
                    <ScrollArea
                        ref={scrollAreaRef}
                        className="flex-1 px-3 pt-2"
                        onScroll={(e) => {
                            const target = e.target as HTMLDivElement;
                            const atBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
                            setShowScrollButton(!atBottom);
                        }}
                    >
                        <div className="space-y-3 pb-2">
                            {messages.length === 0 && (
                                <MobileCard variant="glass" className="p-4 text-center border-primary/20 shadow-premium relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl" />
                                    <div className="relative">
                                        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gradient-premium flex items-center justify-center shadow-lg shadow-primary/30">
                                            <Sparkles className="h-6 w-6 text-primary-foreground" />
                                        </div>
                                        <h2 className="text-lg font-bold text-foreground/90 mb-1">
                                            ¡Hola! Soy tu Asistente IA
                                        </h2>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Ayuda con equipos, mantenimientos e inventario.
                                        </p>
                                    </div>
                                </MobileCard>
                            )}

                            {messages.length === 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-semibold text-muted-foreground px-1 uppercase tracking-wider">
                                        Consultas rápidas
                                    </p>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {quickPrompts.map((prompt, idx) => (
                                            <Button
                                                key={idx}
                                                variant="outline"
                                                className="h-auto p-2 text-[11px] text-left justify-start whitespace-normal bg-card/50 backdrop-blur-sm hover:bg-primary/5 hover:border-primary/30 transition-all active:scale-95"
                                                onClick={() => handleQuickPrompt(prompt)}
                                                disabled={isLoading}
                                            >
                                                {prompt}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((message, index) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        'flex gap-3 animate-in slide-in-from-bottom-4 fade-in fill-mode-backwards',
                                        message.role === 'user' && 'flex-row-reverse'
                                    )}
                                    style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}
                                >
                                    <Avatar className={cn(
                                        "h-8 w-8 flex-shrink-0",
                                        message.role === 'assistant' && "bg-gradient-premium"
                                    )}>
                                        <AvatarFallback className={cn(
                                            message.role === 'assistant' ? "bg-transparent text-primary-foreground" : "bg-primary/10 text-primary"
                                        )}>
                                            {message.role === 'assistant' ? (
                                                <Sparkles className="h-4 w-4" />
                                            ) : (
                                                <UserRound className="h-4 w-4" />
                                            )}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className={cn(
                                        "flex-1 max-w-[85%]",
                                        message.role === 'user' && "flex justify-end"
                                    )}>
                                        <div className="relative group">
                                            <MobileCard
                                                variant={message.role === 'assistant' ? 'glass' : 'compact'}
                                                className={cn(
                                                    "p-3",
                                                    message.role === 'user'
                                                        ? "bg-primary text-primary-foreground border-0 shadow-lg shadow-primary/20"
                                                        : "border-border/50"
                                                )}
                                            >
                                                {message.role === 'assistant' ? (
                                                    <MarkdownRenderer content={message.content} />
                                                ) : (
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                        {message.content}
                                                    </p>
                                                )}
                                            </MobileCard>

                                            {message.role === 'assistant' && (
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-2 top-0">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
                                                        onClick={() => handleCopyMessage(message.content)}
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <p className={cn(
                                            "text-[0.65rem] text-muted-foreground mt-1 px-1",
                                            message.role === 'user' && "text-right"
                                        )}>
                                            {new Date(message.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3 animate-in slide-in-from-bottom-4 fade-in">
                                    <Avatar className="h-8 w-8 flex-shrink-0 bg-gradient-premium">
                                        <AvatarFallback className="bg-transparent text-primary-foreground">
                                            <Sparkles className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <MobileCard variant="glass" className="p-3 border-border/50">
                                        <div className="flex items-center gap-1">
                                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
                                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }} />
                                        </div>
                                    </MobileCard>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {showScrollButton && messages.length > 0 && (
                        <Button
                            size="icon"
                            className="absolute bottom-24 right-6 h-10 w-10 rounded-full shadow-lg shadow-primary/30 bg-primary hover:bg-primary/90 z-10 animate-in zoom-in-95 fade-in"
                            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            <ChevronDown className="h-5 w-5" />
                        </Button>
                    )}

                    <div className="sticky bottom-0 left-0 right-0 glass-panel border-t-0 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] p-4 pb-safe">
                        <div className="flex gap-2 items-end">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Escribe tu pregunta..."
                                className="min-h-[44px] max-h-32 resize-none bg-muted/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/50 rounded-xl"
                                disabled={isLoading}
                            />
                            <Button
                                size="icon"
                                className={cn(
                                    "h-11 w-11 rounded-xl flex-shrink-0 transition-all duration-300",
                                    input.trim() && !isLoading
                                        ? "bg-gradient-premium shadow-glow-primary hover:scale-105 active:scale-95"
                                        : "bg-muted"
                                )}
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </MobileLayout>

            <Sheet open={contextSheetOpen} onOpenChange={setContextSheetOpen}>
                <SheetContent side="bottom" className="h-[80vh] rounded-t-[2rem] border-t-0 bg-background/95 backdrop-blur-xl">
                    <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />
                    <SheetHeader className="mt-4">
                        <SheetTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Estado del Conocimiento
                        </SheetTitle>
                        <SheetDescription>
                            Contexto sincronizado con datos en tiempo real
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(80vh-140px)] pb-4">
                        {context ? (
                            <>
                                <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3.5 py-2 text-xs backdrop-blur-sm">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                                    <span className="text-muted-foreground">Última actualización:</span>
                                    <span className="font-semibold text-foreground">{context.lastUpdatedLabel}</span>
                                </div>

                                {context.sections.map((section) => (
                                    <MobileCard key={section.title} variant="glass" className="p-4">
                                        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
                                            <div className="h-1 w-1 rounded-full bg-primary" />
                                            {section.title}
                                        </h3>
                                        <ul className="space-y-2 pl-3">
                                            {section.items.map((item, index) => (
                                                <li key={`${section.title}-${index}`} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                                                    <span className="leading-relaxed">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </MobileCard>
                                ))}
                            </>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay información de contexto disponible
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
