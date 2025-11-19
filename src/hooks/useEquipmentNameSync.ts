/**
 * Hook para sincronizar nombres de equipos
 * 
 * ALTERNATIVA AL TRIGGER SQL
 * Este hook sincroniza manualmente el nombre_equipo en mantenimientos_programados
 * cuando se actualiza el nombre en equipos.
 * 
 * Usa este hook mientras no tengamos el trigger SQL configurado.
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useEquipmentNameSync() {
  /**
   * Sincroniza el nombre de un equipo en todos sus mantenimientos
   * @param ficha - Ficha del equipo (AC-XXX)
   * @param newName - Nuevo nombre del equipo
   * @returns true si se sincronizó correctamente
   */
  const syncEquipmentName = useCallback(async (ficha: string, newName: string) => {
    try {
      // Actualizar todos los mantenimientos de este equipo
      const { error } = await supabase
        .from('mantenimientos_programados')
        .update({ nombre_equipo: newName })
        .eq('ficha', ficha);

      if (error) {
        console.error('Error sincronizando nombre:', error);
        return false;
      }

      console.log(`✅ Sincronizado nombre para ${ficha}: ${newName}`);
      return true;
    } catch (error) {
      console.error('Error en sincronización:', error);
      return false;
    }
  }, []);

  return { syncEquipmentName };
}
