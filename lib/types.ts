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
  status: string;
  created_at: string;
  user_id?: string | null;
  view_token?: string;
}
