/**
 * PRSS Analytics beacon.
 *
 * Sends one pageview to the collector and nothing else: no cookies, no storage,
 * no identifier of any kind. Country, device and time are derived server-side
 * from the request the browser was going to send anyway.
 *
 * The site key and host are injected into the page at build time; without them
 * this is inert, so a site without analytics enabled ships no tracking at all.
 */

interface AnalyticsConfig {
  key: string;
  host: string;
}

const getConfig = (): AnalyticsConfig | null => {
  const config = (window as any).PRSSAnalytics;
  if (!config?.key || !config?.host) return null;
  return config as AnalyticsConfig;
};

const isOptedOut = () =>
  (navigator as any).doNotTrack === "1" ||
  (window as any).doNotTrack === "1" ||
  (navigator as any).globalPrivacyControl === true;

/** A preview build or a local run should never land in someone's numbers. */
const isLocal = () =>
  location.protocol === "file:" ||
  /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

export function trackPageview() {
  const config = getConfig();

  if (!config || isOptedOut() || isLocal()) return;

  const payload = JSON.stringify({
    k: config.key,
    p: location.pathname,
    r: document.referrer || "",
  });

  try {
    // A text/plain beacon is a "simple request": no preflight, no extra round trip.
    const blob = new Blob([payload], { type: "text/plain" });

    if (!navigator.sendBeacon?.(`${config.host}/e`, blob)) {
      fetch(`${config.host}/e`, { method: "POST", body: payload, keepalive: true });
    }
  } catch {
    /* analytics must never break a page */
  }
}

export function initAnalytics() {
  if (!getConfig()) return;

  if (document.visibilityState === "prerender") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") trackPageview();
    }, { once: true });
    return;
  }

  trackPageview();
}
