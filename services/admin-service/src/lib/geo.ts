import crypto from "crypto";

export interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: string;
  longitude: string;
}

// Popular locations in Malaysia & SEA with exact lat/lng
export const KNOWN_REGIONAL_COORDINATES: Record<string, { lat: string; lng: string; city: string; country: string; countryCode: string }> = {
  "Selangor": { lat: "3.0738", lng: "101.5183", city: "Shah Alam", country: "Malaysia", countryCode: "MY" },
  "Kuala Lumpur": { lat: "3.1390", lng: "101.6869", city: "Kuala Lumpur", country: "Malaysia", countryCode: "MY" },
  "Johor": { lat: "1.4927", lng: "103.7414", city: "Johor Bahru", country: "Malaysia", countryCode: "MY" },
  "Penang": { lat: "5.4141", lng: "100.3288", city: "George Town", country: "Malaysia", countryCode: "MY" },
  "Perak": { lat: "4.5921", lng: "101.0901", city: "Ipoh", country: "Malaysia", countryCode: "MY" },
  "Melaka": { lat: "2.1896", lng: "102.2501", city: "Melaka", country: "Malaysia", countryCode: "MY" },
  "Negeri Sembilan": { lat: "2.7258", lng: "101.9424", city: "Seremban", country: "Malaysia", countryCode: "MY" },
  "Pahang": { lat: "3.8077", lng: "103.3260", city: "Kuantan", country: "Malaysia", countryCode: "MY" },
  "Kedah": { lat: "6.1184", lng: "100.3685", city: "Alor Setar", country: "Malaysia", countryCode: "MY" },
  "Sabah": { lat: "5.9804", lng: "116.0735", city: "Kota Kinabalu", country: "Malaysia", countryCode: "MY" },
  "Sarawak": { lat: "1.5533", lng: "110.3592", city: "Kuching", country: "Malaysia", countryCode: "MY" },
  "Terengganu": { lat: "5.3117", lng: "103.1324", city: "Kuala Terengganu", country: "Malaysia", countryCode: "MY" },
  "Kelantan": { lat: "6.1254", lng: "102.2381", city: "Kota Bharu", country: "Malaysia", countryCode: "MY" },
  "Singapore": { lat: "1.3521", lng: "103.8198", city: "Singapore", country: "Singapore", countryCode: "SG" },
  "Jakarta": { lat: "-6.2088", lng: "106.8456", city: "Jakarta", country: "Indonesia", countryCode: "ID" },
};

const DEV_LOCATIONS = [
  "Kuala Lumpur",
  "Selangor",
  "Johor",
  "Penang",
  "Selangor",
  "Perak",
  "Kuala Lumpur",
  "Melaka",
  "Singapore",
  "Sabah",
  "Kuala Lumpur",
  "Selangor",
];

export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    const firstPart = parts[0];
    if (firstPart) return firstPart.trim();
  }
  return headers.get("cf-connecting-ip") || headers.get("x-real-ip") || "127.0.0.1";
}

export function hashIp(ip: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return crypto.createHash("sha256").update(`${ip}-${today}-fotokita-salt`).digest("hex").slice(0, 16);
}

export function resolveGeoLocation(headers: Headers, sessionId?: string): GeoLocation {
  // 1. Check Cloudflare Headers
  const cfCountry = headers.get("cf-ipcountry");
  const cfRegion = headers.get("cf-region");
  const cfCity = headers.get("cf-ipcity");
  const cfLat = headers.get("cf-iplatitude");
  const cfLng = headers.get("cf-iplongitude");

  const klCoords = KNOWN_REGIONAL_COORDINATES["Kuala Lumpur"]!;

  if (cfCountry && cfCountry !== "XX") {
    const regionName = cfRegion || "Kuala Lumpur";
    const cityName = cfCity || regionName;
    const coords = KNOWN_REGIONAL_COORDINATES[regionName] || {
      lat: cfLat || klCoords.lat,
      lng: cfLng || klCoords.lng,
      city: cityName,
      country: cfCountry === "MY" ? "Malaysia" : cfCountry,
      countryCode: cfCountry,
    };

    return {
      country: cfCountry === "MY" ? "Malaysia" : cfCountry === "SG" ? "Singapore" : cfCountry,
      countryCode: cfCountry,
      region: regionName,
      city: cityName,
      latitude: cfLat || coords.lat,
      longitude: cfLng || coords.lng,
    };
  }

  // 2. In Local Development or Non-Cloudflare environments:
  // Deterministically map session_id to realistic regional locations for testing/demo
  const seed = (sessionId || "default-session")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const locationKey = DEV_LOCATIONS[seed % DEV_LOCATIONS.length] || "Kuala Lumpur";
  const loc = KNOWN_REGIONAL_COORDINATES[locationKey] || klCoords;

  return {
    country: loc.country,
    countryCode: loc.countryCode,
    region: locationKey,
    city: loc.city,
    latitude: loc.lat,
    longitude: loc.lng,
  };
}
