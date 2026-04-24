CREATE TABLE contact_submissions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  email      text NOT NULL CHECK (length(email) BETWEEN 3 AND 200),
  subject    text CHECK (length(subject) <= 200),
  message    text NOT NULL CHECK (length(message) BETWEEN 1 AND 5000),
  user_id    uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved   boolean NOT NULL DEFAULT false
);

CREATE INDEX contact_submissions_resolved_idx ON contact_submissions (resolved, created_at DESC);
