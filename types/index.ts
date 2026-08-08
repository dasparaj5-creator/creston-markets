export type UserRole = "client" | "admin";
export type KycStatus = "pending" | "approved" | "rejected";
export type KycDocumentType =
  | "personal_id"
  | "aadhar_card"
  | "license"
  | "passport"
  | "pan_card"
  | "voter_id"
  | "bank_statement";
export type KycDocumentSide = "front" | "back";
export type RequestStatus = "pending" | "approved" | "rejected";
export type SnapshotSource = "mt5_api" | "reconciliation";
export type ReferralBonusStatus = "pending" | "paid";
export type TicketStatus = "open" | "in_progress" | "resolved";
export type AnnouncementTarget = "all" | "specific_user";

export interface Plan {
  id: string;
  name: "Bronze" | "Silver" | "Gold" | string;
  min_deposit: number;
  description: string | null;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  country: string | null;
  referral_code: string;
  referred_by: string | null;
  role: UserRole;
  kyc_status: KycStatus;
  kyc_document_url: string | null;
  plan_id: string | null;
  plan_activated_at: string | null;
  account_active_since: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KycDocument {
  id: string;
  user_id: string;
  document_type: KycDocumentType;
  side: KycDocumentSide;
  file_path: string;
  uploaded_at: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  plan_id: string | null;
  amount: number;
  currency: string;
  status: RequestStatus;
  payment_reference: string | null;
  is_first_deposit: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string | null;
  payment_method: string | null;
  status: RequestStatus;
  processed_by: string | null;
  processed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface PortfolioSnapshot {
  id: string;
  user_id: string;
  balance: number;
  pnl_total: number;
  pnl_today: number;
  pnl_this_month: number;
  return_percent: number;
  snapshot_date: string;
  source: SnapshotSource;
  updated_by: string | null;
  created_at: string;
}

export interface ReferralBonus {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  trigger_type: "account_maturity";
  bonus_amount: number;
  status: ReferralBonusStatus;
  eligible_after: string;
  paid_at: string | null;
  created_at: string;
}

export interface ReferralConfigRow {
  id: string;
  bonus_amount: number;
  bonus_currency: string;
  maturity_days: number;
  updated_by: string | null;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  target: AnnouncementTarget;
  target_user_id: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: TicketStatus;
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
}
