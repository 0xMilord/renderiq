-- Add user_likes table to track individual user likes for gallery items
CREATE TABLE IF NOT EXISTS user_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  gallery_item_id UUID REFERENCES gallery_items(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  UNIQUE (user_id, gallery_item_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS user_likes_user_id_idx ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS user_likes_gallery_item_id_idx ON user_likes(gallery_item_id);
CREATE INDEX IF NOT EXISTS user_likes_user_item_idx ON user_likes(user_id, gallery_item_id);
CREATE INDEX IF NOT EXISTS user_likes_created_at_idx ON user_likes(created_at DESC);



