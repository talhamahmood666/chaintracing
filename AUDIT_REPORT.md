# ChainTracing Production Audit, 2026-04-25

## Executive Summary

ChainTracing is an operational crypto forensics SaaS with a moderately mature codebase, but has **three critical findings that threaten payment integrity and user privacy**, plus several high-severity security gaps that must be addressed before scaling traffic. The most serious risk is an unprotected coupon validation endpoint that enables enumeration attacks and the validate-coupon route entirely lacks rate limiting. A hardcoded admin email in production code creates a single point of failure for a critical intake pipeline. The blur-overlay free-tier teaser is DOM-bypassable. Plisio webhook idempotency is correct, but the cron ingestion endpoint's auth model is weak. No data loss risk is imminent, but payment flow has gaps around failed-payment recovery and tab-closed-mid-payment scenarios.

**Top 3 risks ranked:**
1. **CRITICAL (Payment Integrity):** validate-coupon endpoint has no rate limiting and no authentication—enables coupon enumeration, bypass testing, and DoS.
2. **CRITICAL (Data Security):** Hardcoded admin email in production (`talhamahmood666@gmail.com` hardcoded in route.ts)—single point of failure; operator email changes force redeploy.
3. **HIGH (User Privacy):** Free-tier transcript blur overlay is DOM-bypassable via browser DevTools—users can inspect HTML and remove `blur-sm` class to view full AI narrative before payment.

---

## Findings by Severity

### CRITICAL (data loss, security breach, payment failure, legal exposure)

#### 1. Missing Rate Limiting on Coupon Validation Endpoint
**Location:** `app/api/validate-coupon/route.ts` (entire file)

**What's wrong:**
- No rate limiting applied via `rateLimit()` call (compare to `/checkout`, `/trace`, `/share` which all apply limits).
- Any attacker can brute-force valid coupon codes by crafting requests with sequential code guesses.
- No authentication required—endpoint is public GET.
- Endpoint returns `valid: true` + `discount_type` + `discount_value` for valid codes, leaking coupon details.

**User impact:**
- Attackers enumerate all active coupons and discount values (e.g., CRYPTOPAK50 becomes CRYPTOPAK51, CRYPTOPAK49, etc.).
- Attackers discover coupon validity windows without invoking checkout.
- Attackers may craft spoofed discount values to manipulate checkout flow downstream.

**Reproduction steps:**
1. Open browser console.
2. Loop: `for (let i = 0; i < 100; i++) { fetch(`/api/validate-coupon?code=CRYPTOPAK${i}`).then(r => r.json()).then(d => console.log(d)); }`
3. Server reveals all valid coupon codes and their discount values.

---

#### 2. Hardcoded Admin Email in Production Code
**Location:** `app/api/services-intake/route.ts:170`

**What's wrong:**
```typescript
to: "talhamahmood666@gmail.com",
```
Admin email is hardcoded and sent directly from service intake handler. If operator's email changes (e.g., account compromise, team restructure), requires code redeploy. Creates single point of failure—if email is incorrect, all incoming case intakes silently fail to notify operator.

**User impact:**
- Service intake notifications (new Bronze/Silver/Gold cases) may not reach operator if email config drifts.
- No fallback, retry, or admin-configurable email—tightly coupled to one person's email address.

**Reproduction steps:**
1. Submit a service intake case at `/services`.
2. If operator's email is down/compromised, notification never arrives—operator unaware of pending cases.
3. To fix: requires code change + redeploy.

---

#### 3. Free-Tier AI Narrative Teaser is DOM-Bypassable
**Location:** `app/report/[id]/report-view.tsx:287-299`

**What's wrong:**
```tsx
<p className="text-sm leading-relaxed blur-sm select-none" style={{ color: 'var(--text-secondary)' }}>
  {report.ai_narrative.split('. ').slice(1).join('. ')}
</p>
```
AI narrative for free-tier reports is blurred with CSS `blur-sm` class. User can:
- Right-click → Inspect → Remove `blur-sm` class from DOM.
- See full AI narrative without payment.

**User impact:**
- Free users bypass the paywall and view paid content (Deep Trace tier AI narrative).
- Revenue loss: users see full analysis teaser and decide not to pay.

**Reproduction steps:**
1. Run a free trace.
2. Scroll to "Analyst Summary" teaser section.
3. Right-click → Inspect Element.
4. Remove `blur-sm` from the `<p>` tag.
5. Full AI narrative is visible without payment.

---

### HIGH (broken UX, lost revenue, easy abuse)

#### 4. Validate-Coupon Endpoint Missing Authentication / Public Enumeration
**Location:** `app/api/validate-coupon/route.ts:4-45`

**What's wrong:**
- GET endpoint returns coupon details (discount_type, discount_value) without any user context.
- Can be called by anonymous users—no `requireUser()` or auth check.
- Enables enumeration of all coupons + their discounts (escalates CRITICAL #1).

**User impact:**
- Attackers map full coupon portfolio: valid codes, discount amounts, expiry dates.
- Competitors can reverse-engineer discount strategy.
- Users can test arbitrary coupon codes to discover inactive ones and deduce product pricing strategy.

---

#### 5. Admin Routes Missing Consistent Auth Pattern
**Location:** `app/api/admin/contact-resolve/route.ts:9-10`

**What's wrong:**
```typescript
const admin = await isAdminUser();
if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
```
Uses `isAdminUser()` which internally catches exceptions and returns false. Compare this to other admin routes like `/admin/report-action/route.ts` which uses inline `getUser()` + manual admin check. Inconsistent patterns are prone to mistakes (one route might forget the check).

**User impact:**
- Future developers might copy-paste without the auth check.
- Harder to audit which routes are protected.

**Recommended pattern:** all admin routes should use `await requireAdmin()` which throws 404 on non-admin (not 403, to avoid leaking route existence).

---

#### 6. Cron Ingest Endpoint Auth Uses Environment Variable as Bearer Token
**Location:** `app/api/cron/ingest/route.ts:12-19`

**What's wrong:**
```typescript
const secret = process.env.CRON_SECRET;
if (auth !== `Bearer ${secret}`) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```
Auth relies on environment variable `CRON_SECRET` being a random, unique string. If this env var is not set or is weak, endpoint is unprotected. No rate limiting on cron endpoint—if secret leaks, attacker can spam expensive ingest operations.

**User impact:**
- If `CRON_SECRET` is weak or missing, anyone can trigger OFAC/CryptoScamDB ingestion.
- Ingest scripts run with `maxDuration = 300` (5 min)—resource exhaustion attack possible.

---

#### 7. Payment Flow Does Not Handle Failed Webhook Gracefully
**Location:** `app/api/webhook/route.ts:97-142` (idempotency logic is correct, but no recovery for `failed` status)

**What's wrong:**
Webhook handler only processes `status === "completed"`. What if Plisio sends `status: "failed"`? Current code ignores it—report stays in "pending" forever. User payment fails but report never transitions to "failed" status.

**User impact:**
- User sees "Payment processing…" indefinitely if payment fails.
- No clear error message about payment failure.
- Operator unaware of failed payments until user complains.

**Recommendation:** Add handler for `status === "failed"`:
```typescript
else if (status === "failed" && orderId) {
  await db.from("reports").update({ status: "failed" }).eq("id", orderId);
  logger.warn("Payment failed by Plisio", { orderId, txnId });
}
```

---

#### 8. Tab Closed Mid-Payment (Vercel 10s Timeout Risk)
**Location:** `app/api/checkout/route.ts:312-366`

**What's wrong:**
Deep tier background trace (`continueTrace`) runs fire-and-forget in 28-second window. If Vercel function times out at 10s (maxDuration=30 but some traces hit 10s limit earlier), background task orphans. Report stuck in "tracing" status forever.

**User impact:**
- User closes browser tab after clicking "Pay" (before checkout completes).
- Background trace fails silently.
- Report remains in "tracing" indefinitely.
- Even if payment succeeds later, report never transitions to "pending".

---

### MEDIUM (inconsistencies, hygiene, future scaling)

#### 9. Tier-Based Hop Limits Not Enforced Server-Side for Free Traces
**Location:** `app/api/trace/route.ts:82-95`

**What's wrong:**
Free tier limits are enforced by `resolvedHopLimit` (anon=2, user=5), but this is only used in the single API call. The tracer functions (`traceEvm`, `traceSolana`, etc.) accept `maxDepth` parameter. If frontend sends a crafted request with `maxHops=50`, the server honors it.

However, `/api/trace` is the only entry point for free traces, so this is mitigated. But the tracer functions lack server-side tier validation—if another caller invokes them directly (admin debug endpoint), they could bypass limits.

**User impact:**
- Low risk for now (no other callers), but fragile.
- If admin endpoints evolve to use tracer functions, limits must be re-validated.

**Recommendation:** Add tier validation in tracer functions or enforce at route level only.

---

#### 10. Unhandled Promise in Coupon Redemption (Non-Fatal but Logs Warn)
**Location:** `app/api/checkout/route.ts:437-450`

**What's wrong:**
```typescript
if (coupon) {
  try {
    await db.from("coupon_redemptions").insert({...});
    await db.from("coupons").update({ uses: coupon.uses + 1 }).eq("id", coupon.id);
  } catch (e) {
    logger.warn("Coupon redemption record failed (non-fatal)", e, { couponCode, reportId: report.id });
  }
}
```
If coupon_redemptions insert fails (e.g., duplicate email+coupon already redeemed), error is logged but checkout still succeeds. User is charged, but coupon is not recorded as redeemed. On next checkout, user can apply same coupon again if the per-email index has a race condition.

**User impact:**
- Coupon can be reused by same email if database race condition occurs during redemption insert.
- Minimal risk (per-email unique index should prevent this), but not bulletproof.

---

#### 11. Missing Env Var RESEND_API_KEY Causes Silent Email Failures
**Location:** `app/api/services-intake/route.ts:124-125`

**What's wrong:**
```typescript
const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";

if (apiKey) {
  const resend = new Resend(apiKey);
  // send emails
}
```
If `RESEND_API_KEY` is not set, email notifications are silently skipped. Operator never receives case intake, user receives no confirmation. No error is logged.

**User impact:**
- Cases submitted to services intake are silently lost if Resend is not configured.
- Operator unaware.

---

#### 12. `any` Type Used for Report Data
**Location:** `app/report/[id]/report-view.tsx:14`

**What's wrong:**
```typescript
interface Props {
  report: any;
  ...
}
```
`report` is `any`. Report structure is not type-safe. Accessing `report.hops`, `report.riskScore`, etc. could silently fail if schema changes.

**User impact:**
- Low immediate risk, but fragile for refactoring.

---

#### 13. Plisio Payment Data Hardcodes USDT_TRX Currency
**Location:** `app/api/checkout/route.ts:392`

**What's wrong:**
```typescript
currency: "USDT_TRX",
```
Only one currency option hardcoded. If operator wants to accept BTC, ETH, or other currencies, requires code change + redeploy. No database config for currencies.

**User impact:**
- Inflexible payment options.
- Future multi-currency support requires code change.

---

#### 14. Statistics Endpoint Returns Hardcoded Baseline Values
**Location:** `app/api/stats/route.ts:13-15`

**What's wrong:**
```typescript
const BASE = { scans: 150, flagged: 4700, community: 273 };
return NextResponse.json({
  scans: (scans ?? 0) + BASE.scans,
```
Hardcoded baseline stats inflates numbers for marketing. If database is reset, numbers are artificially boosted. No way to update or audit these baselines without code change.

**User impact:**
- Stats are misleading (not real usage metrics).
- Difficult to track true metrics over time.

---

### LOW (style, minor)

#### 15. Console.log Used for Trace Debugging (Verbose, but Not Leaking Secrets)
**Location:** `app/api/trace/route.ts:86, 90` + many in `lib/tracer.ts`

**What's wrong:**
Extensive `console.log` statements throughout tracer for debugging. While none appear to log secrets, they clutter production logs.

**User impact:**
- Noisy production logs (low priority).

---

#### 16. BFS Log Stored in Memory Only (Fire-and-Forget Deep Trace)
**Location:** `app/api/checkout/route.ts:320-366`

**What's wrong:**
If deep trace background job fails, `bfsLog` is lost. No way to debug why a trace failed or inspect BFS decisions post-mortem.

**User impact:**
- Operator cannot debug failed traces without access to logs.

---

## What's Working Well

1. **Webhook Idempotency is Bulletproof:** Plisio webhook handler correctly uses `in("status", ["pending", "tracing"])` to ensure duplicate webhooks don't overwrite paid reports. HMAC-SHA1 signature verification with timing-safe comparison is correct and prevents replay attacks.

2. **Admin Audit Logging:** Admin actions (`admin_free_report`, `admin_actions` table) are logged systematically, providing good operational transparency. Non-fatal audit failures (e.g., admin_actions insert fails) are logged as warnings, not errors.

3. **Rate Limiting Fail-Open:** Upstash Redis rate limiting is configured to fail-open—if Redis is unreachable, requests are allowed rather than breaking the app. This is production-safe.

4. **Coupon Per-User/Per-Email Uniqueness Index:** Coupon redemptions use partial unique indexes (`coupon_one_per_user`, `coupon_one_per_email`) to prevent double-redemption. Concurrent checkout requests on same user fall back to full price, not error.

5. **First-Report Discount Atomic Index:** `reports_one_discount_per_user` partial unique index makes first-report discount claim atomic. Retry logic on conflict is clean.

6. **View Token Randomness:** Report view tokens are generated via `randomBytes(16).toString("hex")` (128 bits entropy), which is cryptographically strong and not guessable.

7. **CORS/Origin Checking:** All public API routes call `checkOrigin(request)` first, which appears to validate origin headers against whitelist.

---

## Recommended Fix Order

1. **Protect `/api/validate-coupon` with rate limiting** (5 req/hour per IP, matching coupon semantics).
2. **Move admin email to environment variable** (`OPERATOR_EMAIL` in .env), remove hardcoded email from code.
3. **Replace CSS blur teaser with server-side truncation** (send only first sentence to client, full AI narrative stays server-side until payment).
4. **Add webhook handler for `status: "failed"` payment** (mark report as failed, log clearly).
5. **Fix Vercel timeout risk on deep trace**: use async background job service (e.g., Vercel Cron + DB polling) instead of fire-and-forget.
6. **Add auth check to `/api/validate-coupon`** or make it POST-only and require user context.
7. **Standardize admin auth pattern**: use `requireAdmin()` consistently across all admin routes (throws 404, not 403).
8. **Add rate limiting to `/api/cron/ingest`** (1 req per hour per secret).
9. **Type-safe Report interface** (replace `any` with proper type).
10. **Configure Plisio currency as environment variable** (support multi-currency in future).
11. **Extract hardcoded stats baseline to database** (allow operator to adjust without redeploy).
12. **Add BFS log persistence** (store in database on trace failure for debugging).

---

**Audit completed:** 2026-04-25  
**Auditor:** Claude Sonnet 4.6 (READ-ONLY forensic review)
