
export interface URLCreate {
  original_url: string;
  expires_at?: string | null;
}

export interface URLResponse {
  id: string;
  short_code: string;
  short_url: string;
  original_url: string;
  expires_at: string | null;
}

export interface URLClick {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  clicked_at: string;
}

export interface URLAnalyticsResponse {
  id: string;
  short_code: string;
  original_url: string;
  clicks: URLClick[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

