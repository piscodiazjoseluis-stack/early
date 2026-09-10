/* eslint-disable @typescript-eslint/no-redundant-type-constituents */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      ai_feedback: {
        Row: {
          comment: string | null
          created_at: string
          feedback: Database['public']['Enums']['ai_feedback_type']
          id: string
          recommendation_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          feedback: Database['public']['Enums']['ai_feedback_type']
          id?: string
          recommendation_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          feedback?: Database['public']['Enums']['ai_feedback_type']
          id?: string
          recommendation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ai_feedback_recommendation_id_fkey'
            columns: ['recommendation_id']
            isOneToOne: false
            referencedRelation: 'ai_recommendations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ai_feedback_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      ai_recommendations: {
        Row: {
          confidence: number
          created_at: string
          deterministic_inputs: Json
          evidence: Json
          expires_at: string | null
          generated_by: string
          id: string
          model_name: string | null
          model_provider: string | null
          scope: Database['public']['Enums']['ai_scope_type']
          suggested_action: string
          summary: string
          target_date: string | null
          team_id: string | null
          title: string
          warnings: Json
        }
        Insert: {
          confidence: number
          created_at?: string
          deterministic_inputs?: Json
          evidence?: Json
          expires_at?: string | null
          generated_by: string
          id?: string
          model_name?: string | null
          model_provider?: string | null
          scope: Database['public']['Enums']['ai_scope_type']
          suggested_action: string
          summary: string
          target_date?: string | null
          team_id?: string | null
          title: string
          warnings?: Json
        }
        Update: {
          confidence?: number
          created_at?: string
          deterministic_inputs?: Json
          evidence?: Json
          expires_at?: string | null
          generated_by?: string
          id?: string
          model_name?: string | null
          model_provider?: string | null
          scope?: Database['public']['Enums']['ai_scope_type']
          suggested_action?: string
          summary?: string
          target_date?: string | null
          team_id?: string | null
          title?: string
          warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'ai_recommendations_generated_by_fkey'
            columns: ['generated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ai_recommendations_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          entity_id: string | null
          entity_schema: string
          entity_table: string
          id: number
          new_data: Json | null
          occurred_at: string
          old_data: Json | null
          request_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          entity_id?: string | null
          entity_schema?: string
          entity_table: string
          id?: never
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          request_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          entity_id?: string | null
          entity_schema?: string
          entity_table?: string
          id?: never
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_user_id_fkey'
            columns: ['actor_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      client_error_events: {
        Row: {
          id: number
          message: string
          metadata: Json
          occurred_at: string
          release: string | null
          route: string
          source: string
          user_id: string | null
        }
        Insert: {
          id?: number
          message: string
          metadata?: Json
          occurred_at?: string
          release?: string | null
          route: string
          source: string
          user_id?: string | null
        }
        Update: {
          id?: number
          message?: string
          metadata?: Json
          occurred_at?: string
          release?: string | null
          route?: string
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'client_error_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      availability_periods: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          ends_on: string
          id: string
          reason_summary: string | null
          starts_on: string
          type: Database['public']['Enums']['availability_type']
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          ends_on: string
          id?: string
          reason_summary?: string | null
          starts_on: string
          type: Database['public']['Enums']['availability_type']
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          ends_on?: string
          id?: string
          reason_summary?: string | null
          starts_on?: string
          type?: Database['public']['Enums']['availability_type']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'availability_periods_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'availability_periods_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          title: string
          type: Database['public']['Enums']['blocked_date_type']
          updated_at: string
        }
        Insert: {
          blocked_date: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          title: string
          type: Database['public']['Enums']['blocked_date_type']
          updated_at?: string
        }
        Update: {
          blocked_date?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          title?: string
          type?: Database['public']['Enums']['blocked_date_type']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'blocked_dates_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      early_friday_periods: {
        Row: {
          cancellation_deadline_interval: string
          created_at: string
          created_by: string | null
          default_end_time: string
          default_start_time: string
          ends_on: string
          id: string
          is_active: boolean
          name: string
          request_deadline_interval: string
          starts_on: string
          updated_at: string
        }
        Insert: {
          cancellation_deadline_interval?: string
          created_at?: string
          created_by?: string | null
          default_end_time?: string
          default_start_time?: string
          ends_on: string
          id?: string
          is_active?: boolean
          name: string
          request_deadline_interval?: string
          starts_on: string
          updated_at?: string
        }
        Update: {
          cancellation_deadline_interval?: string
          created_at?: string
          created_by?: string | null
          default_end_time?: string
          default_start_time?: string
          ends_on?: string
          id?: string
          is_active?: boolean
          name?: string
          request_deadline_interval?: string
          starts_on?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'early_friday_periods_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      early_friday_requests: {
        Row: {
          cancellation_reason: string | null
          created_at: string
          current_approval_level: Database['public']['Enums']['approval_level']
          deleted_at: string | null
          final_decided_at: string | null
          id: string
          period_id: string
          priority_explanation: Json
          reason: string | null
          requested_date: string
          requested_end_time: string
          requested_start_time: string
          requester_user_id: string
          rotation_priority: number | null
          status: Database['public']['Enums']['request_status']
          submitted_at: string | null
          team_id: string
          updated_at: string
          usage_confirmed_at: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          created_at?: string
          current_approval_level?: Database['public']['Enums']['approval_level']
          deleted_at?: string | null
          final_decided_at?: string | null
          id?: string
          period_id: string
          priority_explanation?: Json
          reason?: string | null
          requested_date: string
          requested_end_time: string
          requested_start_time: string
          requester_user_id: string
          rotation_priority?: number | null
          status?: Database['public']['Enums']['request_status']
          submitted_at?: string | null
          team_id: string
          updated_at?: string
          usage_confirmed_at?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          created_at?: string
          current_approval_level?: Database['public']['Enums']['approval_level']
          deleted_at?: string | null
          final_decided_at?: string | null
          id?: string
          period_id?: string
          priority_explanation?: Json
          reason?: string | null
          requested_date?: string
          requested_end_time?: string
          requested_start_time?: string
          requester_user_id?: string
          rotation_priority?: number | null
          status?: Database['public']['Enums']['request_status']
          submitted_at?: string | null
          team_id?: string
          updated_at?: string
          usage_confirmed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'early_friday_requests_period_id_fkey'
            columns: ['period_id']
            isOneToOne: false
            referencedRelation: 'early_friday_periods'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'early_friday_requests_requester_user_id_fkey'
            columns: ['requester_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'early_friday_requests_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      exception_types: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          requires_evidence: boolean
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          name: string
          requires_evidence?: boolean
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          requires_evidence?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          request_id: string | null
          title: string
          type: Database['public']['Enums']['notification_type']
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          request_id?: string | null
          title: string
          type: Database['public']['Enums']['notification_type']
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          request_id?: string | null
          title?: string
          type?: Database['public']['Enums']['notification_type']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'early_friday_requests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          employee_code: string | null
          full_name: string
          id: string
          is_active: boolean
          job_title: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          employee_code?: string | null
          full_name: string
          id: string
          is_active?: boolean
          job_title: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          employee_code?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      request_approvals: {
        Row: {
          approver_user_id: string
          comment: string | null
          created_at: string
          decided_at: string
          decision: Database['public']['Enums']['approval_decision']
          id: string
          level: Database['public']['Enums']['approval_level']
          metadata: Json
          reason_code: string | null
          request_id: string
          requester_user_id: string
        }
        Insert: {
          approver_user_id: string
          comment?: string | null
          created_at?: string
          decided_at?: string
          decision: Database['public']['Enums']['approval_decision']
          id?: string
          level: Database['public']['Enums']['approval_level']
          metadata?: Json
          reason_code?: string | null
          request_id: string
          requester_user_id: string
        }
        Update: {
          approver_user_id?: string
          comment?: string | null
          created_at?: string
          decided_at?: string
          decision?: Database['public']['Enums']['approval_decision']
          id?: string
          level?: Database['public']['Enums']['approval_level']
          metadata?: Json
          reason_code?: string | null
          request_id?: string
          requester_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'request_approvals_approver_user_id_fkey'
            columns: ['approver_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'request_approvals_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'early_friday_requests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'request_approvals_requester_user_id_fkey'
            columns: ['requester_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      request_exceptions: {
        Row: {
          authorized_by: string
          created_at: string
          evidence_path: string | null
          exception_type_id: string
          id: string
          justification: string
          request_id: string
          violated_rule: string
        }
        Insert: {
          authorized_by: string
          created_at?: string
          evidence_path?: string | null
          exception_type_id: string
          id?: string
          justification: string
          request_id: string
          violated_rule: string
        }
        Update: {
          authorized_by?: string
          created_at?: string
          evidence_path?: string | null
          exception_type_id?: string
          id?: string
          justification?: string
          request_id?: string
          violated_rule?: string
        }
        Relationships: [
          {
            foreignKeyName: 'request_exceptions_authorized_by_fkey'
            columns: ['authorized_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'request_exceptions_exception_type_id_fkey'
            columns: ['exception_type_id']
            isOneToOne: false
            referencedRelation: 'exception_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'request_exceptions_request_id_fkey'
            columns: ['request_id']
            isOneToOne: false
            referencedRelation: 'early_friday_requests'
            referencedColumns: ['id']
          },
        ]
      }
      roles: {
        Row: {
          code: Database['public']['Enums']['app_role']
          created_at: string
          description: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          code: Database['public']['Enums']['app_role']
          created_at?: string
          description: string
          display_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          code?: Database['public']['Enums']['app_role']
          created_at?: string
          description?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rotation_history: {
        Row: {
          benefit_date: string
          confirmed_at: string
          confirmed_by: string
          created_at: string
          id: string
          notes: string | null
          request_id: string
          team_id: string
          usage: Database['public']['Enums']['usage_status']
          user_id: string
        }
        Insert: {
          benefit_date: string
          confirmed_at?: string
          confirmed_by: string
          created_at?: string
          id?: string
          notes?: string | null
          request_id: string
          team_id: string
          usage: Database['public']['Enums']['usage_status']
          user_id: string
        }
        Update: {
          benefit_date?: string
          confirmed_at?: string
          confirmed_by?: string
          created_at?: string
          id?: string
          notes?: string | null
          request_id?: string
          team_id?: string
          usage?: Database['public']['Enums']['usage_status']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rotation_history_confirmed_by_fkey'
            columns: ['confirmed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rotation_history_request_id_fkey'
            columns: ['request_id']
            isOneToOne: true
            referencedRelation: 'early_friday_requests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rotation_history_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rotation_history_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description: string
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          description?: string
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'system_settings_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      team_members: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          is_eligible: boolean
          participates_in_rotation: boolean
          team_id: string
          updated_at: string
          user_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_eligible?: boolean
          participates_in_rotation?: boolean
          team_id: string
          updated_at?: string
          user_id: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_eligible?: boolean
          participates_in_rotation?: boolean
          team_id?: string
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'team_members_assigned_by_fkey'
            columns: ['assigned_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_members_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      teams: {
        Row: {
          code: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          leader_user_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          leader_user_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          leader_user_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'teams_leader_user_id_fkey'
            columns: ['leader_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role_id: string
          user_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role_id: string
          user_id: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_roles_assigned_by_fkey'
            columns: ['assigned_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_roles_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_roles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      request_analytics: {
        Row: {
          approved_requests: number | null
          average_approval_hours: number | null
          expired_requests: number | null
          month: string | null
          rejected_requests: number | null
          team_id: string | null
          total_requests: number | null
          used_benefits: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'early_friday_requests_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      team_rotation_summary: {
        Row: {
          full_name: string | null
          last_used_date: string | null
          team_id: string | null
          total_not_used: number | null
          total_used: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'team_members_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      approve_cancellation: { Args: { target_request: string }; Returns: Json }
      approve_request_as_portfolio: {
        Args: { target_request: string }
        Returns: Json
      }
      approve_request_as_team_leader: {
        Args: { target_request: string }
        Returns: Json
      }
      assign_or_move_team_member: {
        Args: {
          eligible?: boolean
          joins_rotation?: boolean
          target_team: string
          target_user: string
        }
        Returns: Database['public']['Tables']['team_members']['Row']
      }
      assign_team_leader: {
        Args: { target_team: string; target_user: string }
        Returns: Database['public']['Tables']['teams']['Row']
      }
      calculate_rotation_priority: {
        Args: { target_date: string; target_user: string }
        Returns: Json
      }
      configure_team_member: {
        Args: {
          eligible: boolean
          joins_rotation: boolean
          target_membership: string
        }
        Returns: Database['public']['Tables']['team_members']['Row']
      }
      confirm_early_friday_usage: {
        Args: {
          target_request: string
          usage_notes?: string
          usage_value: Database['public']['Enums']['usage_status']
        }
        Returns: Json
      }
      create_early_friday_departure_request: {
        Args: {
          departure_time: string
          request_reason?: string
          target_date: string
        }
        Returns: Json
      }
      create_early_friday_request: {
        Args: {
          end_time: string
          request_reason?: string
          start_time: string
          target_date: string
        }
        Returns: Json
      }
      create_request_exception: {
        Args: {
          target_evidence_path?: string
          target_exception_type: string
          target_justification: string
          target_request: string
          target_rule: string
        }
        Returns: Json
      }
      get_request_form_context: {
        Args: { departure_time: string; target_date: string }
        Returns: Json
      }
      get_user_eligibility: {
        Args: { target_date: string; target_user: string }
        Returns: Json
      }
      get_my_request_tracking: {
        Args: { target_request?: string }
        Returns: {
          approvals: Json
          portfolio_manager_name: string
          request_id: string
          team_leader_name: string
        }[]
      }
      get_my_team_weekly_assignment: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      reject_request: {
        Args: {
          rejection_comment: string
          rejection_reason: string
          target_request: string
        }
        Returns: Json
      }
      report_client_error: {
        Args: {
          app_release?: string
          error_message: string
          error_metadata?: Json
          error_route: string
          error_source: string
        }
        Returns: Json
      }
      request_cancellation: {
        Args: { cancellation_reason: string; target_request: string }
        Returns: Json
      }
      resubmit_returned_request: {
        Args: {
          end_time: string
          request_reason?: string
          start_time: string
          target_date: string
          target_request: string
        }
        Returns: Json
      }
      resubmit_returned_departure_request: {
        Args: {
          departure_time: string
          request_reason?: string
          target_date: string
          target_request: string
        }
        Returns: Json
      }
      return_request_for_correction: {
        Args: {
          return_comment: string
          return_reason: string
          target_request: string
        }
        Returns: Json
      }
    }
    Enums: {
      ai_feedback_type: 'USEFUL' | 'NOT_USEFUL' | 'APPLIED' | 'REJECTED' | 'MODIFIED'
      ai_scope_type: 'TEAM' | 'GLOBAL'
      app_role: 'COLLABORATOR' | 'TEAM_LEADER' | 'PORTFOLIO_MANAGER' | 'ADMIN'
      approval_decision:
        | 'APPROVED'
        | 'REJECTED'
        | 'RETURNED_FOR_CORRECTION'
        | 'CANCELLATION_REQUESTED'
        | 'CANCELLATION_APPROVED'
      approval_level: 'NONE' | 'TEAM_LEADER' | 'PORTFOLIO' | 'COMPLETED'
      availability_type:
        'VACATION' | 'MEDICAL_LEAVE' | 'LEAVE' | 'ABSENCE' | 'OPERATIONAL_RESTRICTION' | 'OPT_OUT'
      blocked_date_type:
        | 'HOLIDAY'
        | 'CRITICAL_DELIVERABLE'
        | 'MONTH_END'
        | 'CORPORATE_EVENT'
        | 'OPERATIONAL_RESTRICTION'
      notification_type:
        | 'REQUEST_CREATED'
        | 'REQUEST_UPDATED'
        | 'APPROVAL_REQUIRED'
        | 'REQUEST_APPROVED'
        | 'REQUEST_REJECTED'
        | 'REQUEST_RETURNED'
        | 'CANCELLATION'
        | 'USAGE_CONFIRMATION'
        | 'SYSTEM'
      request_status:
        | 'DRAFT'
        | 'PENDING_TEAM_LEADER'
        | 'RETURNED_FOR_CORRECTION'
        | 'APPROVED_BY_TEAM_LEADER'
        | 'PENDING_PORTFOLIO'
        | 'REJECTED_BY_TEAM_LEADER'
        | 'REJECTED_BY_PORTFOLIO'
        | 'FINAL_APPROVED'
        | 'CANCELLATION_REQUESTED'
        | 'CANCELLED'
        | 'USED'
        | 'NOT_USED'
        | 'EXPIRED'
      usage_status: 'USED' | 'NOT_USED'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_feedback_type: ['USEFUL', 'NOT_USEFUL', 'APPLIED', 'REJECTED', 'MODIFIED'],
      ai_scope_type: ['TEAM', 'GLOBAL'],
      app_role: ['COLLABORATOR', 'TEAM_LEADER', 'PORTFOLIO_MANAGER', 'ADMIN'],
      approval_decision: [
        'APPROVED',
        'REJECTED',
        'RETURNED_FOR_CORRECTION',
        'CANCELLATION_REQUESTED',
        'CANCELLATION_APPROVED',
      ],
      approval_level: ['NONE', 'TEAM_LEADER', 'PORTFOLIO', 'COMPLETED'],
      availability_type: [
        'VACATION',
        'MEDICAL_LEAVE',
        'LEAVE',
        'ABSENCE',
        'OPERATIONAL_RESTRICTION',
        'OPT_OUT',
      ],
      blocked_date_type: [
        'HOLIDAY',
        'CRITICAL_DELIVERABLE',
        'MONTH_END',
        'CORPORATE_EVENT',
        'OPERATIONAL_RESTRICTION',
      ],
      notification_type: [
        'REQUEST_CREATED',
        'REQUEST_UPDATED',
        'APPROVAL_REQUIRED',
        'REQUEST_APPROVED',
        'REQUEST_REJECTED',
        'REQUEST_RETURNED',
        'CANCELLATION',
        'USAGE_CONFIRMATION',
        'SYSTEM',
      ],
      request_status: [
        'DRAFT',
        'PENDING_TEAM_LEADER',
        'RETURNED_FOR_CORRECTION',
        'APPROVED_BY_TEAM_LEADER',
        'PENDING_PORTFOLIO',
        'REJECTED_BY_TEAM_LEADER',
        'REJECTED_BY_PORTFOLIO',
        'FINAL_APPROVED',
        'CANCELLATION_REQUESTED',
        'CANCELLED',
        'USED',
        'NOT_USED',
        'EXPIRED',
      ],
      usage_status: ['USED', 'NOT_USED'],
    },
  },
} as const
