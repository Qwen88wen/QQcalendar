-- Salary group migration
-- 1) add default salary group for customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS salary_group_default TEXT NOT NULL DEFAULT 'TongHuat'
  CHECK (salary_group_default IN ('TongHuat', 'AhSeng'));

-- 2) add salary group snapshot for diaries
ALTER TABLE diaries
  ADD COLUMN IF NOT EXISTS salary_group TEXT
  CHECK (salary_group IN ('TongHuat', 'AhSeng'));

-- 3) initialize all existing customers to TongHuat
UPDATE customers
SET salary_group_default = 'TongHuat'
WHERE salary_group_default IS NULL OR salary_group_default = '';

-- 4) backfill existing diaries using current customer default (fallback TongHuat)
UPDATE diaries d
SET salary_group = COALESCE(c.salary_group_default, 'TongHuat')
FROM customers c
WHERE d.salary_group IS NULL
  AND d.customer_id = c.id;

UPDATE diaries
SET salary_group = 'TongHuat'
WHERE salary_group IS NULL OR salary_group = '';
