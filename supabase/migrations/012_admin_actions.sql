-- Admin audit log: records every admin action (refund, mark-paid, etc.)
CREATE TABLE IF NOT EXISTS admin_actions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id),
  action_type   text NOT NULL,   -- e.g. 'refund', 'mark_paid'
  target_type   text NOT NULL,   -- e.g. 'report'
  target_id     text NOT NULL,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_actions_admin_idx ON admin_actions (admin_user_id);
CREATE INDEX admin_actions_target_idx ON admin_actions (target_type, target_id);
CREATE INDEX admin_actions_created_idx ON admin_actions (created_at DESC);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON admin_actions
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
