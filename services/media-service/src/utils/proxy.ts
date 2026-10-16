/** Hosts the image proxy may fetch from: the object store endpoint plus PROXY_ALLOWED_HOSTS (comma list). */
export function getProxyAllowedHosts(): string[] {
  const hosts: string[] = [];
  const endpoint = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT;
  if (endpoint) {
    try {
      hosts.push(new URL(endpoint).host.toLowerCase());
    } catch {
      // ignore malformed endpoint
    }
  }
  for (const h of (process.env.PROXY_ALLOWED_HOSTS || "").split(",")) {
    const host = h.trim().toLowerCase();
    if (host) hosts.push(host);
  }
  return hosts;
}

export function isProxyUrlAllowed(url: URL): boolean {
  if (!["http:", "https:"].includes(url.protocol)) return false;
  if (url.username || url.password) return false;
  return getProxyAllowedHosts().includes(url.host.toLowerCase());
}
