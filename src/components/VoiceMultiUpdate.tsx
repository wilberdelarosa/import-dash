import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mic, MicOff, Loader2, AlertTriangle, Check, X, Send, Volume2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceParsedReading {
  ficha: string;
  lectura: number;
  confidence: string;
  valid: boolean;
  error: string | null;
  mantenimientoId: number | null;
  nombreEquipo: string | null;
  lecturaAnterior: number | null;
  incremento: number | null;
  anomalia: string | null;
  selected: boolean;
  editedLectura?: number;
}

interface VoiceMultiUpdateProps {
  onUpdateBatch: (updates: Array<{
    mantenimientoId: number;
    lectura: number;
    ficha: string;
  }>) => Promise<void>;
  isReadOnly?: boolean;
}

export function VoiceMultiUpdate({ onUpdateBatch, isReadOnly }: VoiceMultiUpdateProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [parsedReadings, setParsedReadings] = useState<VoiceParsedReading[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'idle' | 'recording' | 'parsing' | 'review' | 'submitting'>('idle');
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: 'No soportado',
        description: 'Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.',
        variant: 'destructive',
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';
    recognition.maxAlternatives = 1;

    let finalText = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalText.trim());
      setLiveTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        toast({
          title: 'Error de voz',
          description: `Error: ${event.error}`,
          variant: 'destructive',
        });
      }
    };

    recognition.onend = () => {
      // Auto-restart if still recording
      if (recognitionRef.current && isRecording) {
        try { recognition.start(); } catch { /* ignore */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setStep('recording');
    setTranscript('');
    setLiveTranscript('');
    setParsedReadings([]);
  }, [toast, isRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setLiveTranscript('');
  }, []);

  const parseTranscript = useCallback(async () => {
    if (!transcript.trim()) {
      toast({ title: 'Sin texto', description: 'No se detectó ningún dictado', variant: 'destructive' });
      return;
    }

    setIsParsing(true);
    setStep('parsing');

    try {
      const { data, error } = await supabase.functions.invoke('voice-parse-updates', {
        body: { transcript },
      });

      if (error) throw error;

      if (data?.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        setStep('recording');
        return;
      }

      const readings: VoiceParsedReading[] = (data?.readings || []).map((r: any) => ({
        ...r,
        selected: r.valid && r.anomalia !== 'error_lectura_menor',
        editedLectura: r.lectura,
      }));

      setParsedReadings(readings);
      setStep('review');
    } catch (err) {
      console.error('Parse error:', err);
      toast({ title: 'Error al procesar', description: 'No se pudo analizar el texto', variant: 'destructive' });
      setStep('idle');
    } finally {
      setIsParsing(false);
    }
  }, [transcript, toast]);

  const handleSubmit = useCallback(async () => {
    const toUpdate = parsedReadings.filter(r => r.selected && r.valid && r.mantenimientoId);
    if (toUpdate.length === 0) {
      toast({ title: 'Sin selección', description: 'Selecciona al menos un equipo', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    setStep('submitting');

    try {
      await onUpdateBatch(
        toUpdate.map(r => ({
          mantenimientoId: r.mantenimientoId!,
          lectura: r.editedLectura ?? r.lectura,
          ficha: r.ficha,
        }))
      );

      toast({
        title: `✅ ${toUpdate.length} lecturas actualizadas`,
        description: 'Todas las lecturas se registraron correctamente',
      });

      // Reset
      setStep('idle');
      setTranscript('');
      setParsedReadings([]);
    } catch {
      toast({ title: 'Error', description: 'Error al guardar las lecturas', variant: 'destructive' });
      setStep('review');
    } finally {
      setIsSubmitting(false);
    }
  }, [parsedReadings, onUpdateBatch, toast]);

  const toggleReading = (index: number) => {
    setParsedReadings(prev =>
      prev.map((r, i) => i === index ? { ...r, selected: !r.selected } : r)
    );
  };

  const updateLectura = (index: number, value: number) => {
    setParsedReadings(prev =>
      prev.map((r, i) => i === index ? { ...r, editedLectura: value } : r)
    );
  };

  const validCount = parsedReadings.filter(r => r.valid).length;
  const selectedCount = parsedReadings.filter(r => r.selected).length;
  const anomalyCount = parsedReadings.filter(r => r.anomalia).length;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-primary" />
          Dictado por Voz Multi-Ficha
        </h4>
        <p className="text-xs text-muted-foreground">
          Dicta las fichas y lecturas. Ej: "Ficha AC-003, 1250 horas. Ficha AC-007, 3400 horas."
        </p>
      </div>

      {/* Recording Controls */}
      {(step === 'idle' || step === 'recording') && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="gap-2 flex-1"
                disabled={isReadOnly}
                variant="default"
              >
                <Mic className="h-4 w-4" />
                Iniciar Dictado
              </Button>
            ) : (
              <>
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="gap-2 flex-1"
                >
                  <MicOff className="h-4 w-4" />
                  Detener
                </Button>
                <Button
                  onClick={() => { stopRecording(); parseTranscript(); }}
                  variant="secondary"
                  className="gap-2"
                  disabled={!transcript.trim()}
                >
                  <Send className="h-4 w-4" />
                  Procesar
                </Button>
              </>
            )}
          </div>

          {isRecording && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-xs text-red-600 font-medium">Grabando...</span>
              </div>
              {(transcript || liveTranscript) && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <p className="text-xs text-foreground whitespace-pre-wrap">
                      {transcript}
                      {liveTranscript && (
                        <span className="text-muted-foreground italic"> {liveTranscript}</span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!isRecording && transcript && (
            <div className="space-y-2">
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="text-xs font-medium mb-1">Texto capturado:</p>
                  <p className="text-xs text-foreground">{transcript}</p>
                </CardContent>
              </Card>
              <Button
                onClick={parseTranscript}
                className="w-full gap-2"
                size="sm"
              >
                <Send className="h-4 w-4" />
                Procesar Dictado
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Parsing */}
      {step === 'parsing' && (
        <div className="flex items-center gap-2 py-4 justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Analizando dictado con IA...</span>
        </div>
      )}

      {/* Review */}
      {(step === 'review' || step === 'submitting') && parsedReadings.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{parsedReadings.length} detectados</Badge>
            <Badge variant={validCount === parsedReadings.length ? 'default' : 'outline'}>
              {validCount} válidos
            </Badge>
            {anomalyCount > 0 && (
              <Badge variant="destructive">{anomalyCount} anomalías</Badge>
            )}
            <Badge variant="outline">{selectedCount} seleccionados</Badge>
          </div>

          <ScrollArea className="max-h-[300px]">
            <div className="rounded-md border">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 h-7"></TableHead>
                    <TableHead className="h-7">Ficha</TableHead>
                    <TableHead className="h-7">Equipo</TableHead>
                    <TableHead className="h-7 text-right">Anterior</TableHead>
                    <TableHead className="h-7 text-right">Nueva</TableHead>
                    <TableHead className="h-7 text-right">Δ</TableHead>
                    <TableHead className="h-7">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedReadings.map((r, i) => (
                    <TableRow key={i} className={!r.valid ? 'opacity-50' : r.anomalia ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
                      <TableCell className="py-1">
                        <Checkbox
                          checked={r.selected}
                          onCheckedChange={() => toggleReading(i)}
                          disabled={!r.valid || step === 'submitting'}
                        />
                      </TableCell>
                      <TableCell className="py-1 font-mono font-medium">{r.ficha}</TableCell>
                      <TableCell className="py-1 truncate max-w-[120px]">{r.nombreEquipo || '-'}</TableCell>
                      <TableCell className="py-1 text-right">{r.lecturaAnterior ?? '-'}</TableCell>
                      <TableCell className="py-1 text-right">
                        {r.valid ? (
                          <Input
                            type="number"
                            value={r.editedLectura ?? r.lectura}
                            onChange={(e) => updateLectura(i, Number(e.target.value))}
                            className="h-6 w-20 text-xs text-right p-1"
                            disabled={step === 'submitting'}
                          />
                        ) : (
                          r.lectura
                        )}
                      </TableCell>
                      <TableCell className="py-1 text-right">
                        {r.incremento !== null ? (
                          <span className={r.incremento < 0 ? 'text-red-600' : 'text-green-600'}>
                            {r.incremento > 0 ? '+' : ''}{r.incremento}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="py-1">
                        {!r.valid ? (
                          <Badge variant="destructive" className="text-[10px] px-1">
                            <X className="h-3 w-3 mr-0.5" />
                            {r.error}
                          </Badge>
                        ) : r.anomalia === 'error_lectura_menor' ? (
                          <Badge variant="destructive" className="text-[10px] px-1">
                            <AlertTriangle className="h-3 w-3 mr-0.5" />
                            Lectura menor
                          </Badge>
                        ) : r.anomalia === 'incremento_sospechoso' ? (
                          <Badge className="text-[10px] px-1 bg-amber-500">
                            <AlertTriangle className="h-3 w-3 mr-0.5" />
                            Sospechoso
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1 text-green-600 border-green-300">
                            <Check className="h-3 w-3 mr-0.5" />
                            OK
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={selectedCount === 0 || isSubmitting || isReadOnly}
              className="flex-1 gap-2"
              size="sm"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                <><Check className="h-4 w-4" /> Confirmar {selectedCount} lecturas</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setStep('idle'); setParsedReadings([]); setTranscript(''); }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
