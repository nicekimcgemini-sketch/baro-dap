-- 신한카드 baro-dap 샘플 담당자 15명 추가
-- Supabase SQL Editor에서 실행하세요

-- phone 컬럼이 없는 경우 먼저 추가
ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone text;

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
  ('노유진', '현업', 'counselor', 'yujin.noh@company.com',     '010-2100-0115', ARRAY['해외이용', '환율', '해외결제'])
ON CONFLICT (email) DO NOTHING;
