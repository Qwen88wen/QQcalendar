-- 创建日记表
CREATE TABLE IF NOT EXISTS diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  mood VARCHAR(50),
  weather VARCHAR(50),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以加速按用户和日期查询
CREATE INDEX idx_diaries_user_id ON diaries(user_id);
CREATE INDEX idx_diaries_date ON diaries(date);
CREATE INDEX idx_diaries_user_date ON diaries(user_id, date);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_diaries_updated_at
  BEFORE UPDATE ON diaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略 (RLS)
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看自己的日记
CREATE POLICY "Users can view own diaries"
  ON diaries FOR SELECT
  USING (auth.uid() = user_id);

-- 创建策略：用户只能插入自己的日记
CREATE POLICY "Users can insert own diaries"
  ON diaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 创建策略：用户只能更新自己的日记
CREATE POLICY "Users can update own diaries"
  ON diaries FOR UPDATE
  USING (auth.uid() = user_id);

-- 创建策略：用户只能删除自己的日记
CREATE POLICY "Users can delete own diaries"
  ON diaries FOR DELETE
  USING (auth.uid() = user_id);
