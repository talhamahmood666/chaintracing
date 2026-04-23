-- To create a coupon:
-- INSERT INTO coupons (code, discount_type, discount_value, max_uses, expires_at)
-- VALUES ('INFLUENCER50', 'percent', 50, 100, '2026-12-31 23:59:59+00');

CREATE TABLE coupons (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text UNIQUE NOT NULL,
  discount_type  text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  max_uses       integer,
  uses           integer NOT NULL DEFAULT 0,
  expires_at     timestamptz,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE coupon_redemptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id),
  email       text,
  report_id   uuid REFERENCES reports(id),
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX coupon_one_per_user
  ON coupon_redemptions (coupon_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX coupon_one_per_email
  ON coupon_redemptions (coupon_id, lower(email))
  WHERE user_id IS NULL AND email IS NOT NULL;

ALTER TABLE reports ADD COLUMN coupon_code text;
