import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  const [parsedReadings, setParsedReadings] = useState<VoiceParsedReading[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'idle' | 'recording' | 'transcribing' | 'parsing' | 'review' | 'submitting'>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const cleanupStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // strip "data:audio/webm;base64," prefix
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const transcribeAudio = useCallback(async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setStep('transcribing');
    try {
      const audioBase64 = await blobToBase64(blob);
      const { data, error } = await supabase.functions.invoke('voice-transcribe', {
        body: { audioBase64, mimeType },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: 'Error de transcripción', description: data.error, variant: 'destructive' });
        setStep('idle');
        return;
      }

      const text = (data?.transcript || '').trim();
      if (!text) {
        toast({ title: 'Sin audio detectado', description: 'No se detectó voz en la grabación.', variant: 'destructive' });
        setStep('idle');
        return;
      }

      setTranscript(text);
      // Encadenamos parseo automático
      await parseTranscript(text);
    } catch (err) {
      console.error('Transcribe error:', err);
      toast({ title: 'Error al transcribir', description: 'No se pudo enviar el audio. Verifica tu conexión.', variant: 'destructive' });
      setStep('idle');
    } finally {
      setIsTranscribing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const parseTranscript = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? transcript).trim();
    if (!text) {
      toast({ title: 'Sin texto', description: 'No se detectó ningún dictado', variant: 'destructive' });
      return;
    }

    setIsParsing(true);
    setStep('parsing');

    try {
      const { data, error } = await supabase.functions.invoke('voice-parse-updates', {
        body: { transcript: text },
      });

      if (error) throw error;

      if (data?.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        setStep('idle');
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

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({
        title: 'No soportado',
        description: 'Tu navegador no soporta grabación de audio.',
        variant: 'destructive',
      });
      return;
    }

    if (!window.isSecureContext) {
      toast({
        title: 'Conexión no segura',
        description: 'La grabación requiere HTTPS.',
        variant: 'destructive',
      });
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: any) {
      console.error('Mic permission error:', err);
      toast({
        title: 'Permiso de micrófono denegado',
        description: 'Habilita el micrófono en los ajustes del navegador.',
        variant: 'destructive',
      });
      return;
    }

    streamRef.current = stream;

    // Elegir mime type compatible
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];
    const mimeType = candidates.find(c => MediaRecorder.isTypeSupported(c)) || '';

    let recorder: MediaRecorder;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch (err) {
      console.error('MediaRecorder error:', err);
      cleanupStream();
      toast({ title: 'Error', description: 'No se pudo iniciar la grabación.', variant: 'destructive' });
      return;
    }

    audioChunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      const finalMime = recorder.mimeType || mimeType || 'audio/webm';
      const blob = new Blob(audioChunksRef.current, { type: finalMime });
      cleanupStream();
      setIsRecording(false);
      if (blob.size < 1000) {
        toast({ title: 'Grabación muy corta', description: 'Habla unos segundos más.', variant: 'destructive' });
        setStep('idle');
        return;
      }
      await transcribeAudio(blob, finalMime);
    };
    recorder.onerror = (e: any) => {
      console.error('Recorder error:', e);
      toast({ title: 'Error de grabación', description: e?.error?.message || 'Error desconocido', variant: 'destructive' });
      cleanupStream();
      setIsRecording(false);
      setStep('idle');
    };

    mediaRecorderRef.current = recorder;
    recorder.start(250);
    setIsRecording(true);
    setStep('recording');
    setTranscript('');
    setParsedReadings([]);
    setRecordingSeconds(0);
    timerRef.current = window.setInterval(() => {
      setRecordingSeconds(s => s + 1);
    }, 1000);
  }, [toast, cleanupStream, transcribeAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);


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
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="gap-2 flex-1"
              >
                <MicOff className="h-4 w-4" />
                Detener y Transcribir
              </Button>
            )}
          </div>

          {isRecording && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-xs text-red-600 font-medium">Grabando...</span>
                </div>
                <span className="text-xs font-mono tabular-nums text-muted-foreground">
                  {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:
                  {(recordingSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground italic">
                    Dicta las fichas y lecturas. Cuando termines, presiona "Detener y Transcribir".
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {!isRecording && transcript && step === 'idle' && (
            <div className="space-y-2">
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="text-xs font-medium mb-1">Texto transcrito:</p>
                  <p className="text-xs text-foreground">{transcript}</p>
                </CardContent>
              </Card>
              <Button
                onClick={() => parseTranscript()}
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

      {/* Transcribing */}
      {step === 'transcribing' && (
        <div className="flex items-center gap-2 py-4 justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Transcribiendo audio con IA...</span>
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

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {parsedReadings.map((r, i) => (
                <Card
                  key={i}
                  className={`border ${!r.valid ? 'opacity-60 border-destructive/30' : r.anomalia ? 'border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10' : 'border-border'}`}
                >
                  <CardContent className="p-3 space-y-2">
                    {/* Header row */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={r.selected}
                        onCheckedChange={() => toggleReading(i)}
                        disabled={!r.valid || step === 'submitting'}
                      />
                      <span className="font-mono font-bold text-sm text-primary">{r.ficha}</span>
                      <span className="text-xs text-muted-foreground flex-1">{r.nombreEquipo || 'Equipo no encontrado'}</span>
                      {/* Status badge */}
                      {!r.valid ? (
                        <Badge variant="destructive" className="text-[10px] px-1.5 shrink-0">
                          <X className="h-3 w-3 mr-0.5" />
                          {r.error}
                        </Badge>
                      ) : r.anomalia === 'error_lectura_menor' ? (
                        <Badge variant="destructive" className="text-[10px] px-1.5 shrink-0">
                          <AlertTriangle className="h-3 w-3 mr-0.5" />
                          Lectura menor
                        </Badge>
                      ) : r.anomalia === 'incremento_sospechoso' ? (
                        <Badge className="text-[10px] px-1.5 bg-amber-500 shrink-0">
                          <AlertTriangle className="h-3 w-3 mr-0.5" />
                          Sospechoso
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 text-green-600 border-green-300 shrink-0">
                          <Check className="h-3 w-3 mr-0.5" />
                          OK
                        </Badge>
                      )}
                    </div>

                    {/* Detail row */}
                    <div className="grid grid-cols-3 gap-3 text-xs pl-6">
                      <div>
                        <span className="text-muted-foreground block">Anterior</span>
                        <span className="font-medium">{r.lecturaAnterior != null ? r.lecturaAnterior.toLocaleString() : '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Nueva lectura</span>
                        {r.valid ? (
                          <Input
                            type="number"
                            value={r.editedLectura ?? r.lectura}
                            onChange={(e) => updateLectura(i, Number(e.target.value))}
                            className="h-7 w-full text-xs p-1 mt-0.5"
                            disabled={step === 'submitting'}
                          />
                        ) : (
                          <span className="font-medium">{r.lectura.toLocaleString()}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Incremento</span>
                        {r.incremento !== null ? (
                          <span className={`font-medium ${r.incremento < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {r.incremento > 0 ? '+' : ''}{r.incremento.toLocaleString()}
                          </span>
                        ) : <span>-</span>}
                      </div>
                    </div>

                    {/* Confidence */}
                    <div className="pl-6">
                      <span className="text-[10px] text-muted-foreground">
                        Confianza: {r.confidence === 'high' ? '🟢 Alta' : r.confidence === 'medium' ? '🟡 Media' : '🔴 Baja'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
