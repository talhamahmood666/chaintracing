import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/config";

const dsn = env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
