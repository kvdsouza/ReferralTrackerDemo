export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          user_type: 'contractor' | 'customer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          user_type: 'contractor' | 'customer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          user_type?: 'contractor' | 'customer'
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          contractor_id: string
          customer_id: string
          created_at: string
          updated_at: string
          estimated_completion: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          contractor_id: string
          customer_id: string
          created_at?: string
          updated_at?: string
          estimated_completion: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          contractor_id?: string
          customer_id?: string
          created_at?: string
          updated_at?: string
          estimated_completion?: string
        }
      }
      referrals: {
        Row: {
          id: string
          code: string
          status: 'active' | 'used' | 'completed'
          customer_id: string
          referred_customer_id: string | null
          reward_status: 'pending' | 'sent'
          reward_transaction_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          status?: 'active' | 'used' | 'completed'
          customer_id: string
          referred_customer_id?: string | null
          reward_status?: 'pending' | 'sent'
          reward_transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          status?: 'active' | 'used' | 'completed'
          customer_id?: string
          referred_customer_id?: string | null
          reward_status?: 'pending' | 'sent'
          reward_transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      referral_codes: {
        Row: {
          id: string
          code: string
          customer_id: string
          reward_type: 'gift_card' | 'direct_payment' | 'service_credit'
          reward_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          customer_id: string
          reward_type: 'gift_card' | 'direct_payment' | 'service_credit'
          reward_amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          customer_id?: string
          reward_type?: 'gift_card' | 'direct_payment' | 'service_credit'
          reward_amount?: number
          created_at?: string
          updated_at?: string
        }
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
  }
}
