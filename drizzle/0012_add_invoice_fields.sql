-- Add invoice and receipt fields to payment_orders table
ALTER TABLE payment_orders
ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS receipt_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS payment_orders_invoice_number_idx ON payment_orders(invoice_number);
CREATE INDEX IF NOT EXISTS payment_orders_user_id_status_idx ON payment_orders(user_id, status);
CREATE INDEX IF NOT EXISTS payment_orders_created_at_idx ON payment_orders(created_at DESC);

-- Create invoices table for better invoice management
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  payment_order_id UUID REFERENCES payment_orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  pdf_url TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Create indexes for invoices
CREATE INDEX IF NOT EXISTS invoices_invoice_number_idx ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_payment_order_id_idx ON invoices(payment_order_id);
CREATE INDEX IF NOT EXISTS invoices_created_at_idx ON invoices(created_at DESC);

-- Function to generate invoice number (format: INV-YYYYMMDD-XXXXX)
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  date_prefix TEXT;
  sequence_num INTEGER;
  invoice_num TEXT;
BEGIN
  date_prefix := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 13) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || date_prefix || '-%';
  
  invoice_num := 'INV-' || date_prefix || '-' || LPAD(sequence_num::TEXT, 5, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;


