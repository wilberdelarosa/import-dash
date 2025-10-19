import { useState, useEffect } from 'react';
import { DatabaseData } from '@/types/equipment';

const STORAGE_KEY = 'equipment-management-data';

const defaultData: DatabaseData = {
  equipos: [],
  inventarios: [],
  mantenimientosProgramados: [],
  mantenimientosRealizados: [],
  actualizacionesHorasKm: [],
};

export function useLocalStorage() {
  const [data, setData] = useState<DatabaseData>(defaultData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored);
        setData({
          equipos: parsedData.equipos ?? [],
          inventarios: parsedData.inventarios ?? [],
          mantenimientosProgramados: parsedData.mantenimientosProgramados ?? [],
          mantenimientosRealizados: parsedData.mantenimientosRealizados ?? [],
          actualizacionesHorasKm: parsedData.actualizacionesHorasKm ?? [],
        });
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveData = (newData: DatabaseData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setData(newData);
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `equipos-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          saveData({
            equipos: importedData.equipos ?? [],
            inventarios: importedData.inventarios ?? [],
            mantenimientosProgramados: importedData.mantenimientosProgramados ?? [],
            mantenimientosRealizados: importedData.mantenimientosRealizados ?? [],
            actualizacionesHorasKm: importedData.actualizacionesHorasKm ?? [],
          });
          resolve();
        } catch (error) {
          reject(new Error('Archivo JSON inválido'));
        }
      };
      reader.onerror = () => reject(new Error('Error leyendo el archivo'));
      reader.readAsText(file);
    });
  };

  const loadSampleData = async () => {
    try {
      const response = await fetch('/sample-data.json');
      const sampleData = await response.json();
      saveData(sampleData);
    } catch (error) {
      console.error('Error loading sample data:', error);
    }
  };

  return {
    data,
    loading,
    saveData,
    exportData,
    importData,
    loadSampleData
  };
}