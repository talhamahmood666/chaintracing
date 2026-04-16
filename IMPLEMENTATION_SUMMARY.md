# Intent Selector Implementation Summary

## Overview
Added user intent selection before free scan to segment users and tailor the experience based on their goals.

## Changes Made

### 1. New Component: `components/IntentSelector.tsx`
- Created radio button selector with 3 intent options:
  - "curious" - Just exploring how it works
  - "lost_money" - Lost money, need to understand where it went
  - "law_enforcement" - Reporting to law enforcement, need documentation
- Each option includes descriptive text to help users choose
- Visual design: Blue border when selected, hover states
- Required field: Trace button disabled until intent selected

### 2. Updated: `app/page.tsx`
- Added IntentSelector import
- Added intent state management
- Integrated selector UI in form (between address input and trace button)
- Disabled trace button until intent selected: `disabled={loading || !address.trim() || !intent}`
- Shows amber warning box for law_enforcement intent directing to Deep Trace
- Passed intent to /api/trace in request body: `{ address, chain, intent }`

### 3. Updated: `app/api/trace/route.ts`
- Added intent parameter to request body type
- Reads intent from request
- Returns intent in response JSON for checkout passthrough
- Full hops still returned (analytics tracking, no hop limiting implemented yet)

### 4. Database Migration: `supabase/migrations/009_add_intent_to_reports.sql`
- Adds `intent` column to reports table (text type)
- Creates index on intent for analytics queries

## User Flow
1. User enters address and selects chain
2. User selects intent from 3 radio options (required)
3. Button enables only after intent selected
4. User clicks "Trace" → intent sent to API
5. For law_enforcement: Warning shown recommending Deep Trace
6. Normal trace results shown based on tier
7. Intent saved when user checks out (via /api/checkout)

## Intent Tracking for Analytics
- Intent captured at trace start for all users
- Intent stored in reports table on checkout
- Enables segmenting conversion rates by intent:
  - Compare curious vs lost_money vs law_enforcement conversion rates
  - Optimize pricing/messaging per segment
  - Identify which segments need more nurturing

## Not Yet Implemented
- Different hop limits per intent (all get same free tier currently)
- Different messaging per intent (same FOMO shown to all)
- Intent-specific pricing (same tiers for everyone)

These can be added later once we have analytics data on actual intent patterns.

## UI Screenshots
Intent selector shows 3 radio buttons with clear descriptions.
Button disabled with message "Please select your intent" until selection made.
Law enforcement warning shows as amber box directing to Deep Trace.

## Next Steps
1. Deploy migration: `supabase db push`
2. Test with sample addresses and verify intent captures in reports table
3. Monitor analytics to see intent distribution
4. Adjust FOMO messaging per intent segment based on conversion data