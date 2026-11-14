let rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api/').trim();

// On Android native Capacitor, if URL is accidentally pointing to localhost, fallback to production backend
if (typeof window !== "undefined" && window.Capacitor?.isNativePlatform && window.Capacitor.isNativePlatform()) {
  if (rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1")) {
    rawUrl = "https://api.gym-newss.kiaantechnology.com/api/";
  }
}

if (!rawUrl.endsWith('/')) {
  rawUrl += '/';
}
if (!rawUrl.endsWith('api/')) {
  rawUrl += 'api/';
}

const BaseUrl = rawUrl;

export default BaseUrl;


