import { Redis } from "@upstash/redis";

const redisUrl = import.meta.env.VITE_REDIS_REST_URL;
const redisToken = import.meta.env.VITE_REDIS_REST_TOKEN;

// Only instantiate Redis if URL and Token are explicitly provided to prevent crashing
export const redis =
  redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

if (!redis && import.meta.env.PROD) {
  console.warn(
    "Upstash Redis REST URL or Token is missing. Caching will be skipped.",
  );
}
