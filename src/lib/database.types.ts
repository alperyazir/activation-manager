// Şema ile hizalı tipler. Supabase ayaktayken
//   npx supabase gen types typescript --local > src/lib/database.types.ts
// ile yeniden üretilebilir.

export type CodeStatus = 'active' | 'used' | 'passive' | 'expired'
export type RegistrationStatus = 'pending' | 'completed'

export interface Grade {
  id: string
  name: string
  sort_order: number
  active: boolean
  created_at: string
}

export interface Language {
  id: string
  name: string
  sort_order: number
  active: boolean
  created_at: string
}

export interface CodeBatch {
  id: string
  label: string | null
  quantity: number
  expires_at: string | null
  source: 'generated' | 'imported'
  created_by: string | null
  created_at: string
}

export interface ActivationCode {
  id: string
  code: string
  status: CodeStatus
  expires_at: string | null
  batch_id: string | null
  created_by: string | null
  created_at: string
  used_at: string | null
}

export interface StudentRegistration {
  id: string
  code_id: string
  first_name: string
  last_name: string
  grade_id: string
  language_id: string
  status: RegistrationStatus
  registered_at: string
  completed_at: string | null
}

export interface AdminAuditLog {
  id: string
  admin_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  detail: Record<string, unknown>
  created_at: string
}

// Minimal Database şekli (supabase-js generic'i için)
export interface Database {
  public: {
    Tables: {
      grades: { Row: Grade; Insert: Partial<Grade>; Update: Partial<Grade> }
      languages: { Row: Language; Insert: Partial<Language>; Update: Partial<Language> }
      code_batches: { Row: CodeBatch; Insert: Partial<CodeBatch>; Update: Partial<CodeBatch> }
      activation_codes: {
        Row: ActivationCode
        Insert: Partial<ActivationCode>
        Update: Partial<ActivationCode>
      }
      student_registrations: {
        Row: StudentRegistration
        Insert: Partial<StudentRegistration>
        Update: Partial<StudentRegistration>
      }
      admin_audit_log: {
        Row: AdminAuditLog
        Insert: Partial<AdminAuditLog>
        Update: Partial<AdminAuditLog>
      }
      admins: {
        Row: { user_id: string; full_name: string; active: boolean; created_at: string }
        Insert: { user_id: string; full_name: string; active?: boolean }
        Update: Partial<{ full_name: string; active: boolean }>
      }
    }
    Views: Record<string, never>
    Functions: {
      check_code: {
        Args: { p_code: string }
        Returns: { valid: boolean; reason: string }
      }
      redeem_code: {
        Args: {
          p_code: string
          p_first_name: string
          p_last_name: string
          p_grade_id: string
          p_language_id: string
        }
        Returns: { success: boolean; reason: string; registration_id?: string }
      }
      generate_codes: {
        Args: { p_count: number; p_expires_at: string | null; p_label: string | null }
        Returns: string
      }
      bulk_import_codes: {
        Args: { p_codes: string[]; p_expires_at: string | null; p_label: string | null }
        Returns: { batch_id: string; imported: number; skipped: number }
      }
      set_code_status: {
        Args: { p_code_id: string; p_status: CodeStatus }
        Returns: undefined
      }
      add_activation_code: {
        Args: { p_code: string; p_expires_at: string | null }
        Returns: { success: boolean; reason: string; code?: string }
      }
      list_admins: {
        Args: Record<string, never>
        Returns: Array<{
          user_id: string
          full_name: string
          email: string
          active: boolean
          created_at: string
        }>
      }
      set_admin_active: {
        Args: { p_user_id: string; p_active: boolean }
        Returns: undefined
      }
      delete_registration: {
        Args: { p_id: string }
        Returns: undefined
      }
      purge_registrations_older_than: {
        Args: { p_days: number }
        Returns: number
      }
    }
    Enums: {
      code_status: CodeStatus
      registration_status: RegistrationStatus
    }
  }
}
