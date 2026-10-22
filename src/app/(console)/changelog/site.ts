/** Where customers read the changelog. */
export function siteUrl(): string {
  return (process.env.KONAAR_SITE_URL ?? 'https://konaar.dev').replace(/\/$/, '');
}
