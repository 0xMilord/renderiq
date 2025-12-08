-- Make ambassador code nullable until approved
-- The code is only generated when an ambassador is approved

ALTER TABLE ambassadors 
ALTER COLUMN code DROP NOT NULL;

