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
  created_by_staff_id uuid REFERENCES staff(id),
  final_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2-1. created_by_staff_id 컬럼 추가 (기존 DB에 없는 경우 실행)
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS created_by_staff_id uuid REFERENCES staff(id);

-- 1-1. staff 테이블에 phone 컬럼 추가 (기존 DB에 없는 경우 실행)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone text;

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
INSERT INTO staff (name, department, role, email, phone, specialties) VALUES
  ('김민준', 'IT',  'counselor', 'minjun@company.com',   '010-1234-5601', ARRAY['IT', '시스템', '네트워크']),
  ('이서연', '현업', 'counselor', 'seoyeon@company.com',  '010-1234-5602', ARRAY['민원', '행정', '시설']),
  ('박지호', '현업', 'admin',     'jiho@company.com',     '010-1234-5603', ARRAY['민원', '행정']),
  ('최하은', 'IT',  'counselor', 'haeun@company.com',    '010-1234-5604', ARRAY['IT', '소프트웨어'])
ON CONFLICT (email) DO NOTHING;

-- 6. 추가 샘플 담당자 15명
INSERT INTO staff (name, department, role, email, phone, specialties) VALUES
  ('정수현', '현업', 'counselor', 'suhyun.jung@company.com',   '010-2100-0101', ARRAY['결제/청구', '이중청구', '오청구']),
  ('한지우', '현업', 'counselor', 'jiwoo.han@company.com',     '010-2100-0102', ARRAY['카드발급/해지', '연회비', '갱신']),
  ('오민서', '현업', 'counselor', 'minseo.oh@company.com',     '010-2100-0103', ARRAY['분실/도난/부정사용', '보상처리', '카드정지']),
  ('윤채원', '현업', 'counselor', 'chaewon.yoon@company.com',  '010-2100-0104', ARRAY['포인트/혜택', '마이샵', '소비쿠폰']),
  ('임도현', '현업', 'counselor', 'dohyun.lim@company.com',    '010-2100-0105', ARRAY['한도/승인', '한도조정', '한도차단']),
  ('강나연', '현업', 'admin',     'nayeon.kang@company.com',   '010-2100-0106', ARRAY['민원관리', '금융소비자보호', '분쟁조정']),
  ('신예준', '현업', 'counselor', 'yejun.shin@company.com',    '010-2100-0107', ARRAY['할부거래', '할부취소', '청약철회']),
  ('배소연', '현업', 'counselor', 'soyeon.bae@company.com',    '010-2100-0108', ARRAY['개인정보', '명의도용', '정보유출']),
  ('조현우', 'IT',  'counselor', 'hyunwoo.jo@company.com',    '010-2100-0109', ARRAY['앱/온라인', '신한SOL', '간편결제']),
  ('류지민', 'IT',  'counselor', 'jimin.ryu@company.com',     '010-2100-0110', ARRAY['시스템장애', '결제오류', '서버']),
  ('황다은', 'IT',  'counselor', 'daeun.hwang@company.com',   '010-2100-0111', ARRAY['보안', '해킹', '위조/변조']),
  ('문성호', 'IT',  'admin',     'sungho.moon@company.com',   '010-2100-0112', ARRAY['IT인프라', '데이터베이스', '시스템관리']),
  ('송아름', 'IT',  'counselor', 'areum.song@company.com',    '010-2100-0113', ARRAY['앱개발', '모바일', 'API']),
  ('전민호', '현업', 'counselor', 'minho.jeon@company.com',    '010-2100-0114', ARRAY['세금납부', '국세', '과태료']),
  ('노유진', '현업', 'counselor', 'yujin.noh@company.com',     '010-2100-0115', ARRAY['해외이용', '환율', '해외결제']))
ON CONFLICT (email) DO NOTHING;
