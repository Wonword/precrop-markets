export type UserRole = "farmer" | "buyer";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          wallet_address: string | null;
          onboarded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          wallet_address?: string | null;
          onboarded?: boolean;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          wallet_address?: string | null;
          onboarded?: boolean;
        };
        Relationships: [];
      };
      farms: {
        Row: {
          id: string;
          user_id: string;
          farm_name: string;
          contact_name: string | null;
          region: string | null;
          state: string | null;
          country: string;
          email: string | null;
          phone: string | null;
          bio: string | null;
          reputation_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          farm_name: string;
          contact_name?: string | null;
          region?: string | null;
          state?: string | null;
          country?: string;
          email?: string | null;
          phone?: string | null;
          bio?: string | null;
        };
        Update: {
          user_id?: string;
          farm_name?: string;
          contact_name?: string | null;
          region?: string | null;
          state?: string | null;
          country?: string;
          email?: string | null;
          phone?: string | null;
          bio?: string | null;
          reputation_score?: number;
        };
        Relationships: [];
      };
      buyer_profiles: {
        Row: {
          id: string;
          company_name: string | null;
          buyer_type: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          country: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_name?: string | null;
          buyer_type?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string;
        };
        Update: {
          id?: string;
          company_name?: string | null;
          buyer_type?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          token_id: number | null;
          farm_id: string | null;
          crop_name: string;
          crop_category: string | null;
          description: string | null;
          grading_standard: string | null;
          quality_standards: Record<string, string> | null;
          quantity_units: number | null;
          unit_type: string | null;
          unit_size_lbs: number | null;
          price_per_unit_usdc: number | null;
          total_value_usdc: number | null;
          harvest_date: string | null;
          delivery_date: string | null;
          delivery_method: string | null;
          delivery_location: string | null;
          dockage: string | null;
          notes: string | null;
          status: "available" | "sold" | "redeemable" | "redeemed";
          placeholder_gradient: string | null;
          contract_address: string | null;
          image_url: string | null;
          minted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          token_id?: number | null;
          farm_id?: string | null;
          crop_name: string;
          crop_category?: string | null;
          description?: string | null;
          grading_standard?: string | null;
          quality_standards?: Record<string, string> | null;
          quantity_units?: number | null;
          unit_type?: string | null;
          unit_size_lbs?: number | null;
          price_per_unit_usdc?: number | null;
          total_value_usdc?: number | null;
          harvest_date?: string | null;
          delivery_date?: string | null;
          delivery_method?: string | null;
          delivery_location?: string | null;
          dockage?: string | null;
          notes?: string | null;
          status?: "available" | "sold" | "redeemable" | "redeemed";
          placeholder_gradient?: string | null;
          contract_address?: string | null;
          image_url?: string | null;
          minted_at?: string | null;
        };
        Update: {
          id?: string;
          token_id?: number | null;
          farm_id?: string | null;
          crop_name?: string;
          crop_category?: string | null;
          description?: string | null;
          grading_standard?: string | null;
          quality_standards?: Record<string, string> | null;
          quantity_units?: number | null;
          unit_type?: string | null;
          unit_size_lbs?: number | null;
          price_per_unit_usdc?: number | null;
          total_value_usdc?: number | null;
          harvest_date?: string | null;
          delivery_date?: string | null;
          delivery_method?: string | null;
          delivery_location?: string | null;
          dockage?: string | null;
          notes?: string | null;
          status?: "available" | "sold" | "redeemable" | "redeemed";
          placeholder_gradient?: string | null;
          contract_address?: string | null;
          image_url?: string | null;
          minted_at?: string | null;
        };
        Relationships: [];
      };
      purchases: {
        Row: {
          id: string;
          contract_id: string;
          buyer_id: string;
          purchased_at: string;
          paid_usdc: number;
          tx_hash: string | null;
          delivery_address: string | null;
          redeemed_at: string | null;
          redeem_tx_hash: string | null;
          created_at: string;
        };
        Insert: {
          contract_id: string;
          buyer_id: string;
          purchased_at?: string;
          paid_usdc: number;
          tx_hash?: string | null;
          delivery_address?: string | null;
          redeemed_at?: string | null;
          redeem_tx_hash?: string | null;
        };
        Update: {
          contract_id?: string;
          buyer_id?: string;
          purchased_at?: string;
          paid_usdc?: number;
          tx_hash?: string | null;
          delivery_address?: string | null;
          redeemed_at?: string | null;
          redeem_tx_hash?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Farm = Database["public"]["Tables"]["farms"]["Row"];
export type BuyerProfile = Database["public"]["Tables"]["buyer_profiles"]["Row"];
export type Contract = Database["public"]["Tables"]["contracts"]["Row"];
export type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
