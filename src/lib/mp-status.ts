export type MpConnectionSnapshot = {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_at?: unknown;
  mp_user_id?: unknown;
};

export type MpStatus = {
  connected: boolean;
  flagOutOfSync: boolean;
  needsAttention: boolean;
  expiresAt: string | null;
  accountId: string | null;
  checkedAt: string;
};

export function deriveMpStatus(
  profileConnected: boolean,
  connection: MpConnectionSnapshot | null,
  now = Date.now(),
): MpStatus {
  const accessToken =
    typeof connection?.access_token === "string" && connection.access_token.trim()
      ? connection.access_token
      : null;
  const refreshToken =
    typeof connection?.refresh_token === "string" && connection.refresh_token.trim()
      ? connection.refresh_token
      : null;
  const expiresAt =
    typeof connection?.expires_at === "string" && connection.expires_at.trim()
      ? connection.expires_at
      : null;
  const expiration = expiresAt ? new Date(expiresAt).getTime() : null;
  const expired = expiration !== null && Number.isFinite(expiration) && expiration <= now + 60_000;

  return {
    connected: !!accessToken,
    flagOutOfSync: profileConnected !== !!accessToken,
    needsAttention: !!accessToken && expired && !refreshToken,
    expiresAt,
    accountId:
      typeof connection?.mp_user_id === "string" && connection.mp_user_id.trim()
        ? connection.mp_user_id
        : null,
    checkedAt: new Date(now).toISOString(),
  };
}
