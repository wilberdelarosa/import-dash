CREATE OR REPLACE FUNCTION public.normalizar_calculo_mantenimiento()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF COALESCE(NEW.frecuencia,0) > 0 AND COALESCE(NEW.horas_km_ultimo_mantenimiento,0) > 0 THEN
    NEW.proximo_mantenimiento := NEW.horas_km_ultimo_mantenimiento + NEW.frecuencia;
  END IF;
  NEW.horas_km_restante := NEW.proximo_mantenimiento - NEW.horas_km_actuales;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalizar_calculo_mantenimiento ON public.mantenimientos_programados;
CREATE TRIGGER trg_normalizar_calculo_mantenimiento
BEFORE INSERT OR UPDATE ON public.mantenimientos_programados
FOR EACH ROW EXECUTE FUNCTION public.normalizar_calculo_mantenimiento();