-- Add uploaded image fields to renders table
ALTER TABLE renders ADD COLUMN uploaded_image_url TEXT;
ALTER TABLE renders ADD COLUMN uploaded_image_key TEXT;
ALTER TABLE renders ADD COLUMN uploaded_image_id UUID REFERENCES file_storage(id);

-- Add comments for clarity
COMMENT ON COLUMN renders.uploaded_image_url IS 'URL of the original uploaded image used as input';
COMMENT ON COLUMN renders.uploaded_image_key IS 'Storage key of the original uploaded image';
COMMENT ON COLUMN renders.uploaded_image_id IS 'Reference to file_storage record for uploaded image metadata';
