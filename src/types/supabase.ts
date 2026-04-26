export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Enums: {
      user_role:        'admin' | 'manager' | 'agent';
      deal_status:      'draft' | 'active' | 'negotiation' | 'closed' | 'cancelled';
      lead_status:      'new' | 'contacted' | 'interested' | 'visit_scheduled' | 'converted' | 'lost';
      property_status:  'available' | 'reserved' | 'sold' | 'off_market';
      payment_status:   'pending' | 'paid' | 'overdue' | 'cancelled';
      risk_level:       'low' | 'medium' | 'high' | 'critical';
      task_priority:    'low' | 'medium' | 'high' | 'urgent';
      task_status:      'pending' | 'in_progress' | 'done' | 'cancelled';
      activity_type:    'call' | 'whatsapp' | 'email' | 'visit' | 'meeting' | 'note' | 'status_change';
      deal_type:        'sale' | 'rental' | 'resale';
      client_type:      'buyer' | 'seller' | 'tenant' | 'investor';
      lead_source:      'facebook' | 'instagram' | 'referral' | 'walk_in' | 'website' | 'phone' | 'whatsapp' | 'other';
      expense_category: 'rent' | 'salaries' | 'marketing' | 'utilities' | 'travel' | 'equipment' | 'software' | 'other';
      alert_severity:   'low' | 'medium' | 'critical';
    };
    Tables: {
      agencies: {
        Row: {
          id: string; name: string; slug: string; plan: string;
          plan_started_at: string; plan_expires_at: string | null;
          max_agents: number; max_deals_mtd: number; max_properties: number; max_leads_mtd: number;
          feature_ai: boolean; feature_api_access: boolean;
          stripe_customer_id: string | null; billing_email: string | null;
          is_active: boolean; is_suspended: boolean; suspension_reason: string | null;
          trial_ends_at: string | null; owner_id: string | null;
          country: string; currency: string; timezone: string;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['agencies']['Row']> & { name: string; slug: string };
        Update: Partial<Database['public']['Tables']['agencies']['Row']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string; agency_id: string | null; full_name: string;
          phone: string | null; email: string | null;
          role: Database['public']['Enums']['user_role'];
          is_active: boolean; avatar_url: string | null; hired_at: string | null;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; full_name: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string; agency_id: string; full_name: string;
          phone: string | null; phone_alt: string | null; email: string | null;
          nationality: string | null; id_number: string | null;
          type: Database['public']['Enums']['client_type'];
          source: Database['public']['Enums']['lead_source'] | null;
          notes: string | null; deleted_at: string | null;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['clients']['Row']> & { agency_id: string; full_name: string };
        Update: Partial<Database['public']['Tables']['clients']['Row']>;
        Relationships: [];
      };
      developers: {
        Row: {
          id: string; agency_id: string; name: string;
          country: string | null; website: string | null;
          phone: string | null; email: string | null;
          rating: number | null; notes: string | null;
          is_active: boolean; deleted_at: string | null; created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['developers']['Row']> & { agency_id: string; name: string };
        Update: Partial<Database['public']['Tables']['developers']['Row']>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string; agency_id: string; developer_id: string | null;
          name: string; city: string | null; location: string | null; address: string | null;
          description: string | null; amenities: Json; images: Json;
          status: string; launch_date: string | null; completion_date: string | null;
          deleted_at: string | null; created_at: string; updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['projects']['Row']> & { agency_id: string; name: string };
        Update: Partial<Database['public']['Tables']['projects']['Row']>;
        Relationships: [];
      };
      properties: {
        Row: {
          id: string; agency_id: string; project_id: string;
          reference_code: string | null; type: string;
          floor: number | null; rooms: string | null; area_sqm: number | null;
          list_price: number; status: Database['public']['Enums']['property_status'];
          features: Json; images: Json; notes: string | null;
          deleted_at: string | null; created_at: string; updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['properties']['Row']> & { agency_id: string; project_id: string; type: string; list_price: number };
        Update: Partial<Database['public']['Tables']['properties']['Row']>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string; agency_id: string; client_id: string;
          assigned_agent: string | null; project_id: string | null;
          status: Database['public']['Enums']['lead_status'];
          source: Database['public']['Enums']['lead_source'] | null;
          budget_min: number | null; budget_max: number | null;
          cached_score: number; score_tier: string;
          lost_reason: string | null; notes: string | null;
          last_activity: string; utm_source: string | null;
          deleted_at: string | null; created_at: string; updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['leads']['Row']> & { agency_id: string; client_id: string };
        Update: Partial<Database['public']['Tables']['leads']['Row']>;
        Relationships: [];
      };
      deals: {
        Row: {
          id: string; agency_id: string; lead_id: string | null;
          client_id: string; property_id: string; agent_id: string;
          deal_type: Database['public']['Enums']['deal_type'];
          status: Database['public']['Enums']['deal_status'];
          agreed_price: number; contract_date: string | null; closing_date: string | null;
          notes: string | null; next_action: string | null; next_action_due: string | null;
          risk_level: Database['public']['Enums']['risk_level'];
          at_risk_since: string | null;
          total_payments_scheduled: number; total_payments_received: number;
          activated_at: string | null; negotiation_started_at: string | null;
          commission_generated: boolean; cancellation_reason: string | null;
          total_refunded: number; is_current: boolean;
          deleted_at: string | null; created_at: string; updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['deals']['Row']> & {
          agency_id: string; client_id: string; property_id: string;
          agent_id: string; agreed_price: number;
        };
        Update: Partial<Database['public']['Tables']['deals']['Row']>;
        Relationships: [];
      };
      deal_payments: {
        Row: {
          id: string; deal_id: string; amount: number; due_date: string;
          paid_date: string | null; status: Database['public']['Enums']['payment_status'];
          payment_method: string | null; reference_no: string | null;
          notes: string | null; created_by: string | null;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['deal_payments']['Row']> & { deal_id: string; amount: number; due_date: string };
        Update: Partial<Database['public']['Tables']['deal_payments']['Row']>;
        Relationships: [];
      };
      activities: {
        Row: {
          id: string; agency_id: string;
          lead_id: string | null; deal_id: string | null;
          type: Database['public']['Enums']['activity_type'];
          notes: string; created_by: string;
          deleted_at: string | null; created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['activities']['Row']> & {
          agency_id: string; type: Database['public']['Enums']['activity_type'];
          notes: string; created_by: string;
        };
        Update: Partial<Database['public']['Tables']['activities']['Row']>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string; agency_id: string; assigned_to: string; created_by: string;
          lead_id: string | null; deal_id: string | null;
          title: string; description: string | null;
          priority: Database['public']['Enums']['task_priority'];
          status: Database['public']['Enums']['task_status'];
          due_date: string | null; done_at: string | null; is_automated: boolean;
          created_at: string; updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['tasks']['Row']> & {
          agency_id: string; assigned_to: string; created_by: string; title: string;
        };
        Update: Partial<Database['public']['Tables']['tasks']['Row']>;
        Relationships: [];
      };
      commission_agreements: {
        Row: {
          id: string; agency_id: string; deal_id: string; agent_id: string;
          agreed_amount: number; currency: string;
          approved_by: string | null; approved_at: string | null;
          notes: string | null; created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['commission_agreements']['Row']> & {
          agency_id: string; deal_id: string; agent_id: string; agreed_amount: number;
        };
        Update: Partial<Database['public']['Tables']['commission_agreements']['Row']>;
        Relationships: [];
      };
      commission_payments: {
        Row: {
          id: string; agency_id: string; commission_agreement_id: string;
          agent_id: string; amount_paid: number; payment_date: string;
          payment_method: string | null; reference_no: string | null;
          created_by: string; notes: string | null; created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['commission_payments']['Row']> & {
          agency_id: string; commission_agreement_id: string; agent_id: string;
          amount_paid: number; created_by: string;
        };
        Update: Partial<Database['public']['Tables']['commission_payments']['Row']>;
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string; agency_id: string;
          category: Database['public']['Enums']['expense_category'];
          amount: number; expense_date: string; description: string;
          paid_by: string | null; receipt_url: string | null;
          notes: string | null; created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['expenses']['Row']> & {
          agency_id: string; category: Database['public']['Enums']['expense_category'];
          amount: number; description: string;
        };
        Update: Partial<Database['public']['Tables']['expenses']['Row']>;
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string; agency_id: string;
          severity: Database['public']['Enums']['alert_severity'];
          entity_type: string; entity_id: string | null;
          message: string; action_required: boolean;
          is_resolved: boolean; resolved_by: string | null;
          resolved_at: string | null; resolution_note: string | null;
          dedup_key: string | null; event_time: string; created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['alerts']['Row']> & {
          agency_id: string; severity: Database['public']['Enums']['alert_severity'];
          entity_type: string; message: string;
        };
        Update: Partial<Database['public']['Tables']['alerts']['Row']>;
        Relationships: [];
      };
      agent_kpi_snapshots: {
        Row: {
          id: string; agency_id: string; agent_id: string;
          snapshot_date: string; total_leads: number; converted_leads: number;
          total_deals: number; active_deals: number; closed_deals: number;
          close_rate_pct: number; total_revenue: number;
          commission_earned: number; commission_outstanding: number;
          avg_deal_size: number; overdue_payments: number;
          performance_score: number; rank: number | null; created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['agent_kpi_snapshots']['Row']> & {
          agency_id: string; agent_id: string;
        };
        Update: Partial<Database['public']['Tables']['agent_kpi_snapshots']['Row']>;
        Relationships: [];
      };
    };
    Views: {
      vw_deal_pipeline: {
        Row: {
          id: string; agency_id: string; status: string; risk_level: string;
          agreed_price: number; total_payments_received: number; total_payments_scheduled: number;
          balance_remaining: number; payment_pct: number;
          next_action: string | null; next_action_due: string | null;
          at_risk_since: string | null; activated_at: string | null;
          commission_generated: boolean; created_at: string; updated_at: string;
          agent_id: string; client_id: string; property_id: string;
          client_name: string; client_phone: string | null;
          agent_name: string; property_type: string; reference_code: string | null;
          project_name: string; project_city: string | null;
          is_high_risk: boolean; is_overdue_action: boolean;
          overdue_payment_count: number; pending_payment_count: number;
        };
      };
      vw_commission_balance: {
        Row: {
          agreement_id: string; agency_id: string; deal_id: string; agent_id: string;
          agent_name: string; agreed_amount: number; total_paid: number;
          outstanding_balance: number; payment_status: string; paid_pct: number;
        };
      };
      vw_agent_performance: {
        Row: {
          agent_id: string; agent_name: string; agency_id: string;
          total_deals: number; closed_deals: number; active_deals: number;
          total_revenue: number; commission_earned: number; commission_outstanding: number;
          total_leads: number; converted_leads: number; lead_conversion_rate: number;
        };
      };
    };
    Functions: {};
  };
}
