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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
