-- ========================================
-- QQcalendar 数据库设置脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ========================================

-- 1. 删除旧表（如果存在）
DROP TABLE IF EXISTS diary_remarks CASCADE;
DROP TABLE IF EXISTS diaries CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. 创建 profiles 表
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer'))
);

-- 3. 创建 diaries 表
CREATE TABLE diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_name TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN ('complete', 'incomplete')),
  customer TEXT,
  remark TEXT,
  worker TEXT,
  vehicle TEXT,
  flower_type INT4 DEFAULT 1 CHECK (flower_type BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建 diary_remarks 表
CREATE TABLE diary_remarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_diaries_updated_at
  BEFORE UPDATE ON diaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. 关闭 RLS（允许所有操作）
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE diaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE diary_remarks DISABLE ROW LEVEL SECURITY;

-- 7. 启用实时同步
ALTER PUBLICATION supabase_realtime ADD TABLE diaries;
ALTER PUBLICATION supabase_realtime ADD TABLE diary_remarks;

-- 8. 插入默认用户
INSERT INTO profiles (id, role) VALUES
  ('user-qqrou', 'editor'),
  ('user-qqfang', 'editor'),
  ('user-qqwen', 'editor')
ON CONFLICT (id) DO NOTHING;

-- 9. 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_diaries_user_id ON diaries(user_id);
CREATE INDEX IF NOT EXISTS idx_diaries_created_at ON diaries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diary_remarks_diary_id ON diary_remarks(diary_id);

-- 完成！
SELECT 'Database setup complete!' as message;
