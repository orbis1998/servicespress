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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      deliveries: {
        Row: {
          adresse: string | null
          client: string
          created_at: string
          cdf_received: number
          commission_cdf: number
          commission_usd: number
          devise: string
          exchange_rate: number
          frais_livraison: number
          id: string
          livreur_id: string
          mode_paiement: string | null
          observation: string | null
          prix: number
          produit: string
          quantite: number
          statut: string
          total_received_cdf: number
          total_received_usd: number
          usd_received: number
        }
        Insert: {
          adresse?: string | null
          client: string
          created_at?: string
          cdf_received?: number
          commission_cdf?: number
          commission_usd?: number
          devise?: string
          exchange_rate?: number
          frais_livraison?: number
          id?: string
          livreur_id: string
          mode_paiement?: string | null
          observation?: string | null
          prix?: number
          produit: string
          quantite?: number
          statut?: string
          total_received_cdf?: number
          total_received_usd?: number
          usd_received?: number
        }
        Update: {
          adresse?: string | null
          client?: string
          created_at?: string
          cdf_received?: number
          commission_cdf?: number
          commission_usd?: number
          devise?: string
          exchange_rate?: number
          frais_livraison?: number
          id?: string
          livreur_id?: string
          mode_paiement?: string | null
          observation?: string | null
          prix?: number
          produit?: string
          quantite?: number
          statut?: string
          total_received_cdf?: number
          total_received_usd?: number
          usd_received?: number
        }
        Relationships: []
      }
      payrolls: {
        Row: {
          commission_cdf: number | null
          commission_usd: number | null
          created_at: string
          id: string
          livreur_id: string
          periode_debut: string
          periode_fin: string
          total_genere_cdf: number | null
          total_genere_usd: number | null
        }
        Insert: {
          commission_cdf?: number | null
          commission_usd?: number | null
          created_at?: string
          id?: string
          livreur_id: string
          periode_debut: string
          periode_fin: string
          total_genere_cdf?: number | null
          total_genere_usd?: number | null
        }
        Update: {
          commission_cdf?: number | null
          commission_usd?: number | null
          created_at?: string
          id?: string
          livreur_id?: string
          periode_debut?: string
          periode_fin?: string
          total_genere_cdf?: number | null
          total_genere_usd?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          adresse: string | null
          badge_number: string
          created_at: string
          date_integration: string | null
          full_name: string
          id: string
          phone: string | null
          photo_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          badge_number: string
          created_at?: string
          date_integration?: string | null
          full_name: string
          id: string
          phone?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          badge_number?: string
          created_at?: string
          date_integration?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock: {
        Row: {
          commentaire: string | null
          couleur: string | null
          created_at: string
          id: string
          livreur_id: string | null
          produit: string
          quantite: number
          taille: string | null
          updated_at: string
        }
        Insert: {
          commentaire?: string | null
          couleur?: string | null
          created_at?: string
          id?: string
          livreur_id?: string | null
          produit: string
          quantite?: number
          taille?: string | null
          updated_at?: string
        }
        Update: {
          commentaire?: string | null
          couleur?: string | null
          created_at?: string
          id?: string
          livreur_id?: string | null
          produit?: string
          quantite?: number
          taille?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "livreur"
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
      app_role: ["admin", "livreur"],
    },
  },
} as const
