export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      configuraciones_sistema: {
        Row: {
          alerta_critica: number
          alerta_preventiva: number
          correo_notificaciones: string | null
          correo_soporte: string | null
          created_at: string | null
          id: number
          modo_oscuro_automatico: boolean
          notificar_dispositivo: boolean
          notificar_email: boolean
          notificar_whatsapp: boolean
          permitir_importaciones: boolean
          telefono_whatsapp: string | null
          updated_at: string | null
        }
        Insert: {
          alerta_critica?: number
          alerta_preventiva?: number
          correo_notificaciones?: string | null
          correo_soporte?: string | null
          created_at?: string | null
          id?: number
          modo_oscuro_automatico?: boolean
          notificar_dispositivo?: boolean
          notificar_email?: boolean
          notificar_whatsapp?: boolean
          permitir_importaciones?: boolean
          telefono_whatsapp?: string | null
          updated_at?: string | null
        }
        Update: {
          alerta_critica?: number
          alerta_preventiva?: number
          correo_notificaciones?: string | null
          correo_soporte?: string | null
          created_at?: string | null
          id?: number
          modo_oscuro_automatico?: boolean
          notificar_dispositivo?: boolean
          notificar_email?: boolean
          notificar_whatsapp?: boolean
          permitir_importaciones?: boolean
          telefono_whatsapp?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      equipos: {
        Row: {
          activo: boolean
          categoria: string
          created_at: string | null
          ficha: string
          id: number
          marca: string
          modelo: string
          motivo_inactividad: string | null
          nombre: string
          numero_serie: string
          placa: string
        }
        Insert: {
          activo?: boolean
          categoria: string
          created_at?: string | null
          ficha: string
          id?: number
          marca: string
          modelo: string
          motivo_inactividad?: string | null
          nombre: string
          numero_serie: string
          placa: string
        }
        Update: {
          activo?: boolean
          categoria?: string
          created_at?: string | null
          ficha?: string
          id?: number
          marca?: string
          modelo?: string
          motivo_inactividad?: string | null
          nombre?: string
          numero_serie?: string
          placa?: string
        }
        Relationships: []
      }
      historial_eventos: {
        Row: {
          created_at: string
          datos_antes: Json | null
          datos_despues: Json | null
          descripcion: string
          ficha_equipo: string | null
          id: number
          metadata: Json | null
          modulo: string
          nivel_importancia: string
          nombre_equipo: string | null
          tipo_evento: string
          usuario_responsable: string
        }
        Insert: {
          created_at?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          descripcion: string
          ficha_equipo?: string | null
          id?: number
          metadata?: Json | null
          modulo: string
          nivel_importancia?: string
          nombre_equipo?: string | null
          tipo_evento: string
          usuario_responsable?: string
        }
        Update: {
          created_at?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          descripcion?: string
          ficha_equipo?: string | null
          id?: number
          metadata?: Json | null
          modulo?: string
          nivel_importancia?: string
          nombre_equipo?: string | null
          tipo_evento?: string
          usuario_responsable?: string
        }
        Relationships: []
      }
      inventarios: {
        Row: {
          activo: boolean
          cantidad: number
          categoria_equipo: string
          codigo_identificacion: string
          created_at: string | null
          empresa_suplidora: string
          id: number
          marcas_compatibles: string[] | null
          modelos_compatibles: string[] | null
          movimientos: Json | null
          nombre: string
          tipo: string
        }
        Insert: {
          activo?: boolean
          cantidad?: number
          categoria_equipo: string
          codigo_identificacion: string
          created_at?: string | null
          empresa_suplidora: string
          id?: number
          marcas_compatibles?: string[] | null
          modelos_compatibles?: string[] | null
          movimientos?: Json | null
          nombre: string
          tipo: string
        }
        Update: {
          activo?: boolean
          cantidad?: number
          categoria_equipo?: string
          codigo_identificacion?: string
          created_at?: string | null
          empresa_suplidora?: string
          id?: number
          marcas_compatibles?: string[] | null
          modelos_compatibles?: string[] | null
          movimientos?: Json | null
          nombre?: string
          tipo?: string
        }
        Relationships: []
      }
      mantenimientos_programados: {
        Row: {
          activo: boolean
          created_at: string | null
          fecha_ultima_actualizacion: string
          fecha_ultimo_mantenimiento: string | null
          ficha: string
          frecuencia: number
          horas_km_actuales: number
          horas_km_restante: number
          horas_km_ultimo_mantenimiento: number
          id: number
          nombre_equipo: string
          proximo_mantenimiento: number
          tipo_mantenimiento: string
        }
        Insert: {
          activo?: boolean
          created_at?: string | null
          fecha_ultima_actualizacion?: string
          fecha_ultimo_mantenimiento?: string | null
          ficha: string
          frecuencia: number
          horas_km_actuales?: number
          horas_km_restante: number
          horas_km_ultimo_mantenimiento?: number
          id?: number
          nombre_equipo: string
          proximo_mantenimiento: number
          tipo_mantenimiento: string
        }
        Update: {
          activo?: boolean
          created_at?: string | null
          fecha_ultima_actualizacion?: string
          fecha_ultimo_mantenimiento?: string | null
          ficha?: string
          frecuencia?: number
          horas_km_actuales?: number
          horas_km_restante?: number
          horas_km_ultimo_mantenimiento?: number
          id?: number
          nombre_equipo?: string
          proximo_mantenimiento?: number
          tipo_mantenimiento?: string
        }
        Relationships: []
      }
      notificaciones: {
        Row: {
          accion_url: string | null
          created_at: string
          ficha_equipo: string | null
          id: number
          leida: boolean
          mensaje: string
          metadata: Json | null
          nivel: string
          nombre_equipo: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          accion_url?: string | null
          created_at?: string
          ficha_equipo?: string | null
          id?: number
          leida?: boolean
          mensaje: string
          metadata?: Json | null
          nivel?: string
          nombre_equipo?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          accion_url?: string | null
          created_at?: string
          ficha_equipo?: string | null
          id?: number
          leida?: boolean
          mensaje?: string
          metadata?: Json | null
          nivel?: string
          nombre_equipo?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      notificaciones_salientes: {
        Row: {
          canal: string
          contenido: string
          created_at: string | null
          destinatario: string
          enviado_en: string
          id: number
          notificacion_id: number | null
        }
        Insert: {
          canal: string
          contenido: string
          created_at?: string | null
          destinatario: string
          enviado_en?: string
          id?: number
          notificacion_id?: number | null
        }
        Update: {
          canal?: string
          contenido?: string
          created_at?: string | null
          destinatario?: string
          enviado_en?: string
          id?: number
          notificacion_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_salientes_notificacion_id_fkey"
            columns: ["notificacion_id"]
            isOneToOne: false
            referencedRelation: "notificaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generar_notificaciones_mantenimientos: { Args: never; Returns: undefined }
      generar_notificaciones_stock_bajo: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
