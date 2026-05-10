export type UserRole = "admin" | "employee";
export type SupplierStatus = "in_progress" | "approved" | "not_approved";
export type FormStage = "form_1" | "form_2" | "form_3" | "stage_1" | "stage_2" | "stage_3" | "stage_4" | "stage_5" | "done";
export type TaskStatus = "open" | "in_progress" | "completed";
export type StageNumber = "stage_1" | "stage_2" | "stage_3" | "stage_4" | "stage_5";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  totp_enabled: boolean;
  last_active_at: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  reference_code: string;
  email: string;
  contact_name: string | null;
  phone: string | null;
  company_name: string | null;
  business_number: string | null;
  company_location: string | null;
  factory_address: string | null;
  product_type: string | null;
  production_quantity: string | null;
  country: string | null;
  current_stage: FormStage;
  status: SupplierStatus;
  rejection_reason: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  approved_at: string | null;
  quality_rating: string | null;
  reliability_score: string | null;
  pricing_tier: string | null;
  communication: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  supplier_id: string;
  stage: StageNumber;
  status: TaskStatus;
  claimed_by: string | null;
  claimed_at: string | null;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: number;
  evaluation_field_1: string;
  evaluation_field_2: string;
  evaluation_field_3: string;
  evaluation_field_4: string;
  stage_1_name: string;
  stage_2_name: string;
  stage_3_name: string;
  stage_4_name: string;
  stage_5_name: string;
}
