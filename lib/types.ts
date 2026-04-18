// L6: compile-time enum for report status — keeps route files in sync with DB constraint
export type ReportStatus = "available" | "pending" | "tracing" | "paid" | "failed";
export type ReportTier = "free" | "quick" | "deep";

export interface Hop {
  address: string;
  value: number;
  token: string;
  timestamp: number;
  riskFlags?: string[];
}

export interface Report {
  id: string;
  address: string;
  chain: string;
  hops: Hop[];
  riskScore: number;
  risk_flags?: string[];
  summary?: string;
  status: ReportStatus;
  created_at: string;
  user_id?: string | null;
  view_token?: string;
  discount_applied?: boolean;
}
