/**
 * PhotoUploader - Componente para subida de fotos/archivos
 * Soporta múltiples imágenes, preview, compresión y subida a Supabase Storage
 */
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  Image,
  X,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadedFile {
  id?: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  file_size: number;
  preview_url?: string;
}

interface PhotoUploaderProps {
  /** Bucket de Supabase Storage (default: 'submissions') */
  bucket?: string;
  /** Prefijo del path en storage (ej: 'submissions/uuid') */
  pathPrefix?: string;
  /** Máximo de archivos permitidos */
  maxFiles?: number;
  /** Tamaño máximo por archivo en bytes (default: 5MB) */
  maxSizeBytes?: number;
  /** Tipos de archivo aceptados */
  accept?: string;
  /** Callback cuando se completan las subidas */
  onUploadComplete?: (files: UploadedFile[]) => void;
  /** Callback cuando hay error */
  onError?: (error: string) => void;
  /** Archivos ya subidos (para edición) */
  existingFiles?: UploadedFile[];
  /** Deshabilitar interacción */
  disabled?: boolean;
  /** Mostrar en modo compacto (para móvil) */
  compact?: boolean;
}

interface FilePreview {
  file: File;
  preview: string;
  uploading: boolean;
  progress: number;
  error?: string;
  uploaded?: UploadedFile;
}

export function PhotoUploader({
  bucket = 'submissions',
  pathPrefix = '',
  maxFiles = 5,
  maxSizeBytes = 5 * 1024 * 1024, // 5MB
  accept = 'image/*',
  onUploadComplete,
  onError,
  existingFiles = [],
  disabled = false,
  compact = false,
}: PhotoUploaderProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(existingFiles);
  const [isUploading, setIsUploading] = useState(false);

  const totalFiles = previews.length + uploadedFiles.length;
  const canAddMore = totalFiles < maxFiles;

  // Comprimir imagen antes de subir
  const compressImage = useCallback(async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Limitar a 1920px de ancho máximo
        const maxWidth = 1920;
        const maxHeight = 1920;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => resolve(blob || file),
          'image/jpeg',
          0.85 // Calidad 85%
        );
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Manejar selección de archivos
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPreviews: FilePreview[] = [];
    const remainingSlots = maxFiles - totalFiles;
    
    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      
      // Validar tamaño
      if (file.size > maxSizeBytes) {
        toast({
          title: 'Archivo muy grande',
          description: `${file.name} excede el límite de ${Math.round(maxSizeBytes / 1024 / 1024)}MB`,
          variant: 'destructive',
        });
        continue;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Tipo no válido',
          description: 'Solo se permiten imágenes',
          variant: 'destructive',
        });
        continue;
      }

      newPreviews.push({
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        progress: 0,
      });
    }

    if (newPreviews.length > 0) {
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  }, [maxFiles, totalFiles, maxSizeBytes, toast]);

  // Subir un archivo a Storage
  const uploadFile = useCallback(async (preview: FilePreview, index: number): Promise<UploadedFile | null> => {
    try {
      // Actualizar estado a "subiendo"
      setPreviews(prev => prev.map((p, i) => 
        i === index ? { ...p, uploading: true, progress: 10 } : p
      ));

      // Comprimir imagen
      const compressed = await compressImage(preview.file);
      
      setPreviews(prev => prev.map((p, i) => 
        i === index ? { ...p, progress: 30 } : p
      ));

      // Generar nombre único
      const ext = preview.file.name.split('.').pop() || 'jpg';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const storagePath = pathPrefix ? `${pathPrefix}/${filename}` : filename;

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, compressed, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (error) throw error;

      setPreviews(prev => prev.map((p, i) => 
        i === index ? { ...p, progress: 100, uploading: false } : p
      ));

      const uploaded: UploadedFile = {
        storage_path: data.path,
        filename: preview.file.name,
        mime_type: 'image/jpeg',
        file_size: compressed.size,
        preview_url: preview.preview,
      };

      return uploaded;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setPreviews(prev => prev.map((p, i) => 
        i === index ? { ...p, uploading: false, error: errorMessage } : p
      ));
      return null;
    }
  }, [bucket, pathPrefix, compressImage]);

  // Subir todos los archivos pendientes
  const uploadAll = useCallback(async () => {
    if (previews.length === 0 || isUploading) return;

    setIsUploading(true);
    const results: UploadedFile[] = [];

    for (let i = 0; i < previews.length; i++) {
      if (previews[i].uploaded) {
        results.push(previews[i].uploaded!);
        continue;
      }

      const uploaded = await uploadFile(previews[i], i);
      if (uploaded) {
        results.push(uploaded);
      }
    }

    // Limpiar previews exitosos y mover a uploadedFiles
    const newUploaded = [...uploadedFiles, ...results];
    setUploadedFiles(newUploaded);
    setPreviews(prev => prev.filter(p => p.error));
    setIsUploading(false);

    if (results.length > 0) {
      onUploadComplete?.(newUploaded);
      toast({
        title: 'Fotos subidas',
        description: `${results.length} foto(s) subida(s) correctamente`,
      });
    }

    if (results.length < previews.length) {
      const failed = previews.length - results.length;
      onError?.(`${failed} archivo(s) fallaron al subir`);
    }
  }, [previews, uploadedFiles, isUploading, uploadFile, onUploadComplete, onError, toast]);

  // Eliminar preview
  const removePreview = useCallback((index: number) => {
    setPreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].preview);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  }, []);

  // Eliminar archivo subido
  const removeUploaded = useCallback(async (index: number) => {
    const file = uploadedFiles[index];
    
    // Intentar eliminar de storage
    try {
      await supabase.storage.from(bucket).remove([file.storage_path]);
    } catch (err) {
      console.warn('Error removing file from storage:', err);
    }

    const newUploaded = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newUploaded);
    onUploadComplete?.(newUploaded);
  }, [uploadedFiles, bucket, onUploadComplete]);

  // Abrir selector de archivos
  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  // Abrir cámara (móvil)
  const openCamera = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.capture = 'environment';
      inputRef.current.click();
      // Reset después
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.removeAttribute('capture');
        }
      }, 100);
    }
  }, []);

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled || !canAddMore}
      />

      {/* Botones de acción */}
      {canAddMore && !disabled && (
        <div className={cn('flex gap-2', compact && 'gap-1.5')}>
          <Button
            type="button"
            variant="outline"
            size={compact ? 'sm' : 'default'}
            onClick={openCamera}
            className={cn('flex-1 gap-2', compact && 'gap-1.5 h-9')}
          >
            <Camera className={cn('h-4 w-4', compact && 'h-3.5 w-3.5')} />
            <span className={compact ? 'text-xs' : ''}>Cámara</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size={compact ? 'sm' : 'default'}
            onClick={openFilePicker}
            className={cn('flex-1 gap-2', compact && 'gap-1.5 h-9')}
          >
            <Image className={cn('h-4 w-4', compact && 'h-3.5 w-3.5')} />
            <span className={compact ? 'text-xs' : ''}>Galería</span>
          </Button>
        </div>
      )}

      {/* Contador */}
      <p className={cn('text-xs text-muted-foreground text-center', compact && 'text-[10px]')}>
        {totalFiles} / {maxFiles} fotos
      </p>

      {/* Grid de previews y archivos subidos */}
      {(previews.length > 0 || uploadedFiles.length > 0) && (
        <div className={cn('grid grid-cols-3 gap-2', compact && 'gap-1.5')}>
          {/* Archivos ya subidos */}
          {uploadedFiles.map((file, index) => (
            <div
              key={`uploaded-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted"
            >
              <img
                src={file.preview_url || `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${file.storage_path}`}
                alt={file.filename}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeUploaded(index)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* Previews pendientes */}
          {previews.map((preview, index) => (
            <div
              key={`preview-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted"
            >
              <img
                src={preview.preview}
                alt={preview.file.name}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay de progreso */}
              {preview.uploading && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 p-2">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <Progress value={preview.progress} className="h-1.5 w-full" />
                </div>
              )}

              {/* Overlay de error */}
              {preview.error && (
                <div className="absolute inset-0 bg-destructive/50 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              )}

              {/* Botón eliminar */}
              {!preview.uploading && !disabled && (
                <button
                  type="button"
                  onClick={() => removePreview(index)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botón de subir */}
      {previews.length > 0 && previews.some(p => !p.uploaded && !p.error) && (
        <Button
          type="button"
          onClick={uploadAll}
          disabled={isUploading || disabled}
          className={cn('w-full gap-2', compact && 'h-9')}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Subir {previews.filter(p => !p.uploaded).length} foto(s)
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default PhotoUploader;
