-- Add new customer fields to complaints table
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS customer_address text,
ADD COLUMN IF NOT EXISTS contract_account_number text,
ADD COLUMN IF NOT EXISTS business_partner_number text;