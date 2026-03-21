-- Baro-Dap 민원 자동 처리 시스템
-- Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 민원 테이블
CREATE TABLE IF NOT EXISTS complaints (
    id              SERIAL PRIMARY KEY,
    uuid            UUID DEFAULT uuid_generate_v4() UNIQUE,
    complainant_name VARCHAR(100),
    contact         VARCHAR(100),
    title           VARCHAR(200) NOT NULL,
    content         TEXT NOT NULL,

    -- AI 자동 분류 결과
    category        VARCHAR(100),           -- 민원 유형
    department      VARCHAR(100),           -- 담당 부서
    assigned_to     VARCHAR(100),           -- 담당자
    urgency_score   INTEGER DEFAULT 0,      -- 긴급도 (0~100)
    risk_score      INTEGER DEFAULT 0,      -- 위험도 (0~100)
    priority        VARCHAR(20) DEFAULT 'normal', -- low/normal/high/critical

    -- AI 처리 결과
    summary         TEXT,                   -- 자동 요약
    facts           TEXT,                   -- 사실관계 추출
    emotions        TEXT,                   -- 감정 분석
    auto_response   TEXT,                   -- 자동 생성 답변
    "references"    TEXT,                   -- 관련 법령/FAQ 인용

    -- 처리 상태
    status          VARCHAR(20) DEFAULT 'pending', -- pending/processing/responded/closed
    final_response  TEXT,                   -- 담당자 최종 답변
    processed_at    TIMESTAMP,
    closed_at       TIMESTAMP,

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 민원 처리 로그 테이블
CREATE TABLE IF NOT EXISTS complaint_logs (
    id              SERIAL PRIMARY KEY,
    complaint_id    INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    action          VARCHAR(100) NOT NULL,
    description     TEXT,
    actor           VARCHAR(100) DEFAULT 'system',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 부서/담당자 테이블
CREATE TABLE IF NOT EXISTS departments (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    keywords        TEXT[],                 -- 분류 키워드
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 부서 데이터
INSERT INTO departments (name, description, keywords) VALUES
    ('금융상품팀', '예금, 적금, 대출 관련 민원', ARRAY['예금', '적금', '대출', '이자', '금리', '만기']),
    ('카드서비스팀', '신용카드, 체크카드 관련 민원', ARRAY['카드', '결제', '연회비', '포인트', '할부']),
    ('디지털뱅킹팀', '인터넷뱅킹, 앱 관련 민원', ARRAY['앱', '인터넷뱅킹', '오류', '비밀번호', '인증']),
    ('고객서비스팀', '일반 고객 서비스 민원', ARRAY['계좌', '이체', '수수료', '서비스', '불편']),
    ('컴플라이언스팀', '법적 분쟁, 금감원 민원', ARRAY['소송', '금감원', '불법', '피해', '배상'])
ON CONFLICT (name) DO NOTHING;

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 설정
DROP TRIGGER IF EXISTS update_complaints_updated_at ON complaints;
CREATE TRIGGER update_complaints_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(department);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
