
-- Drop existing foreign keys if they reference auth.users
DO $$ 
BEGIN
  -- Drop foreign keys that reference auth.users
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'complaints_customer_id_fkey') THEN
    ALTER TABLE complaints DROP CONSTRAINT complaints_customer_id_fkey;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'complaints_assigned_to_fkey') THEN
    ALTER TABLE complaints DROP CONSTRAINT complaints_assigned_to_fkey;
  END IF;
END $$;

-- Add foreign keys referencing profiles table instead
ALTER TABLE complaints
  ADD CONSTRAINT complaints_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE complaints
  ADD CONSTRAINT complaints_assigned_to_fkey 
  FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL;
