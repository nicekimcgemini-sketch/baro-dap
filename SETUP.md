# Baro-Dap 설치 및 실행 가이드

## 사전 준비

- Python 3.11+
- PostgreSQL 14+
- Node.js 18+ (MCP 서버용)
- Anthropic API Key

## 1단계 — 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 아래 값을 채워넣으세요:

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
GITHUB_TOKEN=ghp_...          # 선택사항 (고위험 민원 이슈 자동 등록)
GITHUB_REPO=your_org/baro-dap # 선택사항
```

## 2단계 — PostgreSQL DB 생성

```bash
psql -U postgres -d postgres -f database/schema.sql
```

## 3단계 — Python 패키지 설치

```bash
pip install -r requirements.txt
```

## 4단계 — MCP 서버 설치 (Node.js)

```bash
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-github
```

## 5단계 — 서버 실행

```bash
# baro-dap/ 폴더에서 실행
python -m backend.main
```

서버가 시작되면:
- 민원 접수 : http://localhost:8000
- 관리자    : http://localhost:8000/admin
- API 문서  : http://localhost:8000/docs

## 프로젝트 구조

```
baro-dap/
├── backend/
│   ├── main.py                  # FastAPI 앱 진입점
│   ├── config.py                # 환경변수 설정
│   ├── models/
│   │   └── complaint.py         # Pydantic 모델
│   ├── routes/
│   │   ├── complaints.py        # 민원 접수 API
│   │   └── admin.py             # 관리자 API
│   └── services/
│       ├── claude_service.py    # Claude AI 처리
│       ├── mcp_postgres.py      # MCP PostgreSQL 연동
│       └── mcp_github.py        # MCP GitHub 연동
├── frontend/
│   ├── index.html               # 민원 접수 페이지
│   ├── admin.html               # 관리자 대시보드
│   ├── css/style.css
│   └── js/
│       ├── main.js
│       └── admin.js
├── database/
│   └── schema.sql               # DB 스키마
├── .env.example
└── requirements.txt
```

## 주요 기능

| 기능 | 설명 |
|------|------|
| 민원 접수 | 민원인이 제목/내용 입력 후 접수 |
| AI 자동 분류 | Claude가 유형/부서/담당자 자동 배정 |
| 긴급도/위험도 스코어링 | 0~100 점수로 우선순위 자동 결정 |
| 1분 요약 | 핵심 이슈, 사실관계, 감정 분리 요약 |
| 답변 자동 생성 | 규정 기반 맞춤형 답변 초안 생성 |
| 고위험 이슈 알림 | 위험도 60+ 민원은 GitHub 이슈 자동 등록 |
| 관리자 대시보드 | 민원 현황 모니터링 및 최종 처리 |
