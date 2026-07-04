/** Public site origin (no trailing slash). */
export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://seedanceapi.us"
  );
}

export function getDashboardUrl(): string {
  return `${getAppUrl()}/dashboard`;
}
