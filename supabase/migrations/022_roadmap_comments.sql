CREATE TABLE roadmap_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id),
  author_name text,
  content     text NOT NULL CHECK (length(content) BETWEEN 1 AND 1000),
  category    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  approved    boolean NOT NULL DEFAULT false
);

CREATE INDEX roadmap_comments_approved_idx ON roadmap_comments (approved, created_at DESC);
