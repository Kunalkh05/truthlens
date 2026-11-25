import dns from "node:dns/promises";
import net from "node:net";

export class SsrcSecurityError extends Error {
  constructor(message: string, public readonly code: string = "SSRF_BLOCKED") {
    super(message);
    this.name = "SsrcSecurityError";
  }
}

/**
 * Checks whether an IPv4 or IPv6 address belongs to private, loopback, link-local,
 * cloud metadata, or reserved ranges.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4) return true;

    // Loopback: 127.0.0.0/8
    if (parts[0] === 127) return true;
    // Current network ("this"): 0.0.0.0/8
    if (parts[0] === 0) return true;
    // RFC 1918 Private: 10.0.0.0/8
    if (parts[0] === 10) return true;
    // RFC 1918 Private: 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // RFC 1918 Private: 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // Carrier-grade NAT: 100.64.0.0/10
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    // Link-local & Cloud Metadata (AWS/GCP 169.254.169.254): 169.254.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true;
    // Broadcast / Multicast: 224.0.0.0/4 and 255.255.255.255
    if (parts[0] >= 224) return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    // IPv6 Loopback
    if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;
    // IPv6 Unspecified
    if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;
    // Unique local address (fc00::/7)
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    // Link-local unicast (fe80::/10)
    if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
    // IPv4-mapped IPv6 address (::ffff:192.0.2.128)
    if (normalized.startsWith("::ffff:")) {
      const ipv4Part = normalized.replace("::ffff:", "");
      return isPrivateOrReservedIp(ipv4Part);
    }
    return false;
  }

  return true;
}

/**
 * Validates target URL against SSRF vulnerabilities:
 * - Scheme must be http or https
 * - Host must not resolve to private or internal addresses
 * - Port must be standard 80 or 443
 */
export async function validateSafeUrl(rawUrl: string): Promise<URL> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new SsrcSecurityError("Invalid URL format", "INVALID_URL");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new SsrcSecurityError("Only HTTP and HTTPS protocols are allowed", "UNSUPPORTED_PROTOCOL");
  }

  if (parsedUrl.port && parsedUrl.port !== "80" && parsedUrl.port !== "443") {
    throw new SsrcSecurityError("Non-standard ports are prohibited", "NON_STANDARD_PORT");
  }

  const hostname = parsedUrl.hostname;

  // Direct IP check
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new SsrcSecurityError(`Access to private IP address ${hostname} is blocked`, "PRIVATE_IP_BLOCKED");
    }
    return parsedUrl;
  }

  // Domain DNS resolution check
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new SsrcSecurityError(`Host could not be resolved: ${hostname}`, "DNS_RESOLUTION_FAILED");
    }

    for (const record of addresses) {
      if (isPrivateOrReservedIp(record.address)) {
        throw new SsrcSecurityError(
          `Domain ${hostname} resolves to prohibited internal address ${record.address}`,
          "SSRF_DOMAIN_POINTS_TO_PRIVATE_IP"
        );
      }
    }
  } catch (err) {
    if (err instanceof SsrcSecurityError) throw err;
    throw new SsrcSecurityError(`DNS lookup failed for ${hostname}`, "DNS_LOOKUP_ERROR");
  }

  return parsedUrl;
}

/**
 * Safe HTTP fetch wrapper with:
 * - SSRF pre-check
 * - Redirect validation (no redirection to internal IP)
 * - Size limit (max 5MB)
 * - Timeout (10 seconds)
 */
export async function fetchWithSsrfProtection(
  targetUrl: string,
  maxSizeBytes: number = 5 * 1024 * 1024,
  timeoutMs: number = 10000
): Promise<{ text: string; status: number; contentType: string; finalUrl: string }> {
  let currentUrl = targetUrl;
  let redirectCount = 0;
  const maxRedirects = 3;

  while (redirectCount <= maxRedirects) {
    const safeUrl = await validateSafeUrl(currentUrl);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(safeUrl.toString(), {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "TruthLens-Verifier/1.0 (+https://truthlens.ai/bot)",
          "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        },
        redirect: "manual", // Handle manually to validate each hop against SSRF
      });

      clearTimeout(timer);

      // Handle redirect
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new SsrcSecurityError("Redirect location header missing", "INVALID_REDIRECT");
        }
        currentUrl = new URL(location, currentUrl).toString();
        redirectCount++;
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP fetch failed with status ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      const contentLengthHeader = response.headers.get("content-length");
      if (contentLengthHeader && parseInt(contentLengthHeader, 10) > maxSizeBytes) {
        throw new SsrcSecurityError("Remote content exceeds maximum allowed size", "CONTENT_TOO_LARGE");
      }

      // Stream read with size enforcement
      const reader = response.body?.getReader();
      if (!reader) {
        const text = await response.text();
        return { text: text.slice(0, maxSizeBytes), status: response.status, contentType, finalUrl: currentUrl };
      }

      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.length;
          if (totalBytes > maxSizeBytes) {
            reader.cancel();
            throw new SsrcSecurityError("Response exceeded maximum byte limit during download", "CONTENT_OVERFLOW");
          }
          chunks.push(value);
        }
      }

      const buffer = Buffer.concat(chunks);
      const text = buffer.toString("utf-8");

      return {
        text,
        status: response.status,
        contentType,
        finalUrl: currentUrl,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof SsrcSecurityError) throw err;
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Fetch error: ${errorMsg}`);
    }
  }

  throw new SsrcSecurityError("Too many redirects", "MAX_REDIRECTS_EXCEEDED");
}

/**
 * Strips script tags, style tags, and isolates text to prevent Prompt Injection
 * when remote webpage text is ingested into analysis pipelines.
 */
export function sanitizeUntrustedContent(rawHtml: string): string {
  // Strip script, style, iframe, object, embed
  let cleaned = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ");

  // Strip remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Collapse whitespaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Guard against direct prompt injection strings
  cleaned = cleaned
    .replace(/ignore (previous|all) instructions/gi, "[REDACTED_PROMPT_INJECTION_PATTERN]")
    .replace(/system prompt/gi, "[REDACTED_PROMPT_KEYWORD]")
    .replace(/you are now an ai that/gi, "[REDACTED_ROLE_HIJACK]");

  return cleaned.slice(0, 15000); // Max 15k chars for clean excerpts
}
