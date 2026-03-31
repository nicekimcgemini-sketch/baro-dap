-- baro-dap 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- gen_random_uuid() 사용을 위한 확장
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. staff (담당자) 테이블
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text NOT NULL,
  role text NOT NULL CHECK (role IN ('counselor', 'admin')),
  email text UNIQUE NOT NULL,
  specialties text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. complaints (민원) 테이블
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  customer_name text NOT NULL,
  customer_contact text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority int CHECK (priority BETWEEN 1 AND 5),
  category text,
  ai_response text,
  ai_analysis jsonb,
  assigned_staff_id uuid REFERENCES staff(id),
  final_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. RLS (Row Level Security) 설정
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- complaints: 누구나 INSERT 가능 (고객 민원 접수)
CREATE POLICY "complaints_insert_public" ON complaints
  FOR INSERT WITH CHECK (true);

-- complaints: 인증된 사용자만 SELECT/UPDATE 가능
CREATE POLICY "complaints_select_auth" ON complaints
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "complaints_update_auth" ON complaints
  FOR UPDATE USING (auth.role() = 'authenticated');

-- staff: 인증된 사용자만 접근 가능
CREATE POLICY "staff_all_auth" ON staff
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5. 샘플 담당자 데이터
INSERT INTO staff (name, department, role, email, specialties) VALUES
  ('김민준', 'IT', 'counselor', 'minjun@company.com', ARRAY['IT', '시스템', '네트워크']),
  ('이서연', '현업', 'counselor', 'seoyeon@company.com', ARRAY['민원', '행정', '시설']),
  ('박지호', '현업', 'admin', 'jiho@company.com', ARRAY['민원', '행정']),
  ('최하은', 'IT', 'counselor', 'haeun@company.com', ARRAY['IT', '소프트웨어'])
ON CONFLICT (email) DO NOTHING;
