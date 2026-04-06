import base64, os

os.makedirs('report', exist_ok=True)

imgs = {}
for k, path in {
    'login': 'screenshots/01_login.png',
    'dashboard': 'screenshots/02_dashboard.png',
    'counsel_list': 'screenshots/03_counsel_list.png',
    'counsel_detail': 'screenshots/04_counsel_detail.png',
    'admin_dashboard': 'screenshots/05_admin_dashboard.png',
    'admin_staff': 'screenshots/06_admin_staff.png',
}.items():
    with open(path, 'rb') as f:
        imgs[k] = 'data:image/png;base64,' + base64.b64encode(f.read()).decode()

html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>바로답(baro-dap) 프로젝트 진행 보고서</title>
<style>
  @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap");
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: "Noto Sans KR", sans-serif; background: #f8f8f8; color: #222; }}

  .cover {{
    background: linear-gradient(135deg, #00c6a7 0%, #e0457b 100%);
    color: white; padding: 80px 60px; min-height: 100vh;
    display: flex; flex-direction: column; justify-content: center;
  }}
  .cover .badge {{ display: inline-block; background: rgba(255,255,255,0.2); border-radius: 20px; padding: 6px 18px; font-size: 13px; margin-bottom: 24px; }}
  .cover h1 {{ font-size: 48px; font-weight: 900; line-height: 1.2; margin-bottom: 16px; }}
  .cover p {{ font-size: 18px; opacity: 0.9; max-width: 600px; line-height: 1.7; margin-bottom: 40px; }}
  .cover .meta {{ display: flex; gap: 40px; flex-wrap: wrap; }}
  .cover .meta div {{ font-size: 14px; opacity: 0.8; }}
  .cover .meta div strong {{ display: block; font-size: 16px; opacity: 1; margin-bottom: 4px; }}
  .tag-row {{ display: flex; gap: 10px; flex-wrap: wrap; margin-top: 32px; }}
  .tag {{ background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.4); border-radius: 20px; padding: 5px 14px; font-size: 13px; }}

  .page {{ background: white; padding: 60px; min-height: 100vh; page-break-before: always; border-bottom: 1px solid #eee; }}
  .page-num {{ font-size: 12px; color: #aaa; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }}
  .page-title {{ font-size: 30px; font-weight: 900; color: #111; margin-bottom: 6px; }}
  .page-subtitle {{ font-size: 15px; color: #888; margin-bottom: 36px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0; }}

  .screenshot {{ width: 100%; border-radius: 12px; border: 1px solid #e8e8e8; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin: 20px 0; }}

  .comment-box {{ background: #f9f5ff; border-left: 4px solid #8b5cf6; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 16px 0; }}
  .comment-box .label {{ font-size: 11px; font-weight: 700; color: #8b5cf6; letter-spacing: 1px; margin-bottom: 8px; }}
  .comment-box p {{ font-size: 14px; color: #444; line-height: 1.7; }}

  .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }}
  .info-card {{ border: 1px solid #f0f0f0; border-radius: 10px; padding: 18px; background: #fafafa; }}
  .info-card .label {{ font-size: 11px; font-weight: 700; color: #aaa; letter-spacing: 1px; margin-bottom: 8px; }}
  .info-card ul {{ padding-left: 16px; }}
  .info-card li {{ font-size: 13px; color: #555; line-height: 1.9; }}

  .stat-row {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }}
  .stat-card {{ background: linear-gradient(135deg, #f0fdf8, #fff); border: 1px solid #d1fae5; border-radius: 10px; padding: 16px; text-align: center; }}
  .stat-card .num {{ font-size: 28px; font-weight: 900; color: #059669; }}
  .stat-card .desc {{ font-size: 12px; color: #888; margin-top: 4px; }}

  .todo-section {{ background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 24px 28px; margin: 24px 0; }}
  .todo-section h3 {{ font-size: 16px; font-weight: 700; color: #92400e; margin-bottom: 16px; }}
  .todo-item {{ display: flex; align-items: flex-start; gap: 12px; padding: 14px 0; border-bottom: 1px solid #fde68a; }}
  .todo-item:last-child {{ border-bottom: none; }}
  .todo-dot {{ width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #00c6a7, #e0457b); color: white; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }}
  .todo-item .content strong {{ display: block; font-size: 14px; color: #222; margin-bottom: 5px; }}
  .todo-item .content p {{ font-size: 13px; color: #666; line-height: 1.7; }}

  h3.section-title {{ font-size: 17px; font-weight: 700; color: #333; margin: 28px 0 12px; display: flex; align-items: center; gap: 10px; }}
  h3.section-title::before {{ content: ""; display: inline-block; width: 4px; height: 18px; background: linear-gradient(180deg, #00c6a7, #e0457b); border-radius: 2px; }}

  .green-box {{ background: #f0fdf8; border: 1px solid #6ee7b7; border-radius: 10px; padding: 20px 24px; }}
  .green-box .label {{ font-size: 11px; font-weight: 700; color: #059669; letter-spacing: 1px; margin-bottom: 8px; }}
  .green-box p {{ font-size: 14px; color: #065f46; line-height: 1.7; }}

  @media print {{
    .page {{ page-break-before: always; }}
    .cover {{ page-break-after: always; min-height: auto; padding: 60px; }}
  }}
</style>
</head>
<body>

<!-- 표지 -->
<div class="cover">
  <div class="badge">🦜 AI COMPLAINT MANAGEMENT SYSTEM</div>
  <h1>바로답(baro-dap)<br>프로젝트 진행 보고서</h1>
  <p>AI 기반 민원 자동 분류·분석·답변 생성 시스템<br>현황 및 향후 계획</p>
  <div class="meta">
    <div><strong>보고일</strong>2026년 4월 6일</div>
    <div><strong>개발 상태</strong>MVP 완료 · 운영 전환 준비중</div>
    <div><strong>기술 스택</strong>Next.js 14 · Supabase · Claude AI · Gemini AI</div>
  </div>
  <div class="tag-row">
    <span class="tag">TypeScript</span>
    <span class="tag">Tailwind CSS</span>
    <span class="tag">Supabase Auth</span>
    <span class="tag">Anthropic Claude</span>
    <span class="tag">Google Gemini</span>
    <span class="tag">신한카드 FAQ 자동 연동</span>
  </div>
</div>

<!-- PAGE 01: 프로젝트 개요 -->
<div class="page">
  <div class="page-num">PAGE 01</div>
  <div class="page-title">프로젝트 개요 및 시스템 구조</div>
  <div class="page-subtitle">바로답은 고객 민원을 AI가 자동 분류·분석하고 답변 초안을 생성하여 상담원 업무 효율을 높이는 내부 업무 시스템입니다.</div>

  <div class="info-grid">
    <div class="info-card">
      <div class="label">🎯 개발 목표</div>
      <ul>
        <li>민원 접수 즉시 AI 자동 분류 (긴급도·카테고리·담당부서)</li>
        <li>Claude AI + Gemini AI 이중 엔진 답변 초안 자동 생성</li>
        <li>소비자보호법 기반 법적 민감도 자동 감지</li>
        <li>신한카드 FAQ 실시간 연동으로 답변 정확도 유지</li>
      </ul>
    </div>
    <div class="info-card">
      <div class="label">🗂 주요 화면 구성</div>
      <ul>
        <li>로그인 — Supabase Auth 인증</li>
        <li>개인 대시보드 — 민원 등록·조회·멀티필터·차트</li>
        <li>민원 목록 — 전체 민원 상태/긴급도 필터</li>
        <li>민원 상세 — AI 분석 결과 및 최종 답변 작성</li>
        <li>관리자 대시보드 — 통계 및 현황 차트</li>
        <li>담당자 관리 — 상담원 목록 및 프로필 수정</li>
      </ul>
    </div>
    <div class="info-card">
      <div class="label">⚙️ 기술 스택</div>
      <ul>
        <li>Frontend: Next.js 14 · TypeScript · Tailwind CSS</li>
        <li>Backend: Supabase (PostgreSQL + Auth + Storage)</li>
        <li>AI: Anthropic Claude · Google Gemini</li>
        <li>크론: 신한카드 FAQ 자동 갱신 스케줄러</li>
      </ul>
    </div>
    <div class="info-card">
      <div class="label">📌 현재 진행 상태</div>
      <ul>
        <li>MVP 개발 완료 (로컬 서버 구동 가능)</li>
        <li>담당자 전원 Auth 계정 등록 완료</li>
        <li>테스트 데이터 14건 입력 완료</li>
        <li>현재 처리 완료율 43%</li>
      </ul>
    </div>
  </div>

  <div class="comment-box">
    <div class="label">📝 COMMENT</div>
    <p>AI 분석 엔진은 Claude AI를 주력으로, Gemini AI를 보조로 활용하는 이중 구조로 설계되어 단일 AI 장애 시에도 서비스 연속성을 확보합니다. 신한카드 공식 FAQ는 크론 스케줄러를 통해 자동 갱신되므로 최신 정보 기반의 답변 품질을 지속적으로 유지합니다.</p>
  </div>
</div>

<!-- PAGE 02: 로그인 + 대시보드 -->
<div class="page">
  <div class="page-num">PAGE 02</div>
  <div class="page-title">화면 1·2 — 로그인 &amp; 개인 대시보드</div>
  <div class="page-subtitle">상담원/관리자 인증 및 개인 민원 현황 관리</div>

  <h3 class="section-title">화면 1 — 로그인 페이지 (/login)</h3>
  <img src="{imgs['login']}" class="screenshot" alt="로그인 화면" style="max-height:380px;object-fit:contain;background:#fff8fb;">
  <div class="comment-box">
    <div class="label">📝 COMMENT</div>
    <p>Supabase Authentication 기반 이메일/비밀번호 로그인. 상담원과 관리자가 동일 로그인 화면을 사용하며, 사용자 권한(role)에 따라 접근 가능한 메뉴가 자동 분리됩니다. 에메랄드→핑크 그라데이션 브랜드 컬러가 일관성 있게 적용되어 있으며, 현재 담당자 전원의 Auth 계정 등록이 완료된 상태입니다.</p>
  </div>

  <h3 class="section-title">화면 2 — 개인 대시보드 (/dashboard)</h3>
  <img src="{imgs['dashboard']}" class="screenshot" alt="개인 대시보드">
  <div class="comment-box">
    <div class="label">📝 COMMENT</div>
    <p>상담원 본인의 민원 현황을 한눈에 파악할 수 있는 개인 워크스페이스. 총 민원·미처리·처리중·완료·답변완료율 5개 KPI 카드, 요청자 Top5, 일별 접수 추이(7일), 긴급도 분포, 카테고리별 현황 차트를 실시간으로 제공합니다. 다중 필터(상태·담당자·카테고리·긴급도·날짜)와 인라인 수정 기능을 지원합니다.</p>
  </div>
</div>

<!-- PAGE 03: 민원 목록 + 상세 -->
<div class="page">
  <div class="page-num">PAGE 03</div>
  <div class="page-title">화면 3·4 — 민원 목록 &amp; 민원 상세(AI 분석)</div>
  <div class="page-subtitle">전체 민원 조회 및 AI 분석 결과 확인·처리</div>

  <h3 class="section-title">화면 3 — 민원 목록 (/counsel)</h3>
  <img src="{imgs['counsel_list']}" class="screenshot" alt="민원 목록">
  <div class="comment-box">
    <div class="label">📝 COMMENT</div>
    <p>상담원 전체가 공유하는 민원 리스트. 상태(전체·접수·처리중·완료·종료)와 긴급도(😡😤😒🙂😁 5단계)를 동시에 필터링할 수 있습니다. URL searchParams 기반 필터링으로 특정 조건의 화면을 북마크·공유하는 것이 가능합니다. 현재 총 14건이 등록되어 있습니다.</p>
  </div>

  <h3 class="section-title">화면 4 — 민원 상세 / AI 분석 결과 (/counsel/[id])</h3>
  <img src="{imgs['counsel_detail']}" class="screenshot" alt="민원 상세">
  <div class="comment-box">
    <div class="label">📝 COMMENT</div>
    <p>시스템의 핵심 화면. 좌측에 민원 내용과 상태 전환 버튼, 우측에 AI 분석 결과(긴급도·카테고리·법적 민감도·관련 담당자·AI 답변 초안)가 2열로 배치됩니다. 상담원이 AI 초안을 검토·수정 후 「답변 저장 및 완료 처리」를 클릭하면 민원이 완료 상태로 전환됩니다. 신한카드 공식 FAQ 기반의 구체적인 답변이 자동 생성되며, 재분석 버튼으로 오분류를 즉시 보정할 수 있습니다.</p>
  </div>
</div>

<!-- PAGE 04: 관리자 화면 -->
<div class="page">
  <div class="page-num">PAGE 04</div>
  <div class="page-title">화면 5·6 — 관리자 대시보드 &amp; 담당자 관리</div>
  <div class="page-subtitle">전체 민원 통계 모니터링 및 담당자 현황 관리 (관리자 권한)</div>

  <h3 class="section-title">화면 5 — 관리자 대시보드 (/admin)</h3>
  <img src="{imgs['admin_dashboard']}" class="screenshot" alt="관리자 대시보드">
  <div class="comment-box">
    <div class="label">📝 COMMENT</div>
    <p>관리자가 전체 민원 현황을 모니터링하는 화면. 총 민원 14건·처리 완료율 43%·처리중 1건·미처리 7건의 통계 카드와 긴급도별·카테고리별 가로 바 차트, 최근 민원 5건 목록을 제공합니다. 서버 컴포넌트로 구성되어 초기 로딩이 빠르며, DB 실시간 반영으로 항상 최신 데이터를 표시합니다.</p>
  </div>

  <h3 class="section-title">화면 6 — 담당자 관리 (/admin/staff)</h3>
  <img src="{imgs['admin_staff']}" class="screenshot" alt="담당자 관리">
  <div class="comment-box">
    <div class="label">📝 COMMENT</div>
    <p>이름 검색·분야 검색·부서/역할/활성 필터로 담당자를 빠르게 조회할 수 있습니다. 각 담당자의 전문분야 태그를 기반으로 AI가 민원 상세 화면에서 관련 담당자를 자동 추천합니다. 프로필 수정 팝업과 비밀번호 초기화 기능으로 관리자가 계정을 직접 관리할 수 있습니다.</p>
  </div>
</div>

<!-- PAGE 05: 향후 계획 -->
<div class="page">
  <div class="page-num">PAGE 05</div>
  <div class="page-title">향후 계획 (To-Do)</div>
  <div class="page-subtitle">MVP 완료 이후 추진할 고도화 과제 및 운영 전환 계획</div>

  <div class="todo-section">
    <h3>🗓 우선 추진 과제</h3>

    <div class="todo-item">
      <div class="todo-dot">1</div>
      <div class="content">
        <strong>담당자 테이블 → 신한카드 임직원 DB 연동</strong>
        <p>현재 담당자 정보는 시스템 내 별도 테이블로 관리되고 있습니다. 추후 신한카드 사내 임직원 테이블과 연동하여 인사이동·신규 입사·퇴직 발생 시 자동으로 동기화되도록 개선할 예정입니다. 이를 통해 수동 관리 부담을 제거하고 담당자 데이터 정합성을 확보합니다.</p>
      </div>
    </div>

    <div class="todo-item">
      <div class="todo-dot">2</div>
      <div class="content">
        <strong>기존 인포누리 누적 답변 데이터 학습 후 AI 참고 데이터로 활용</strong>
        <p>인포누리에 누적된 과거 민원 답변 이력을 AI 참고 문서로 활용하여 답변 품질을 대폭 향상시킬 계획입니다. RAG(검색 증강 생성) 방식으로 구현하여 유사 과거 사례를 자동 검색·참조하는 구조로 발전시킵니다.</p>
      </div>
    </div>

    <div class="todo-item">
      <div class="todo-dot">3</div>
      <div class="content">
        <strong>민원 처리 이력(히스토리) 추적 기능 고도화</strong>
        <p>민원 상태 변경·답변 수정·담당자 변경 등 모든 처리 과정을 타임라인으로 기록하여 감사 추적과 품질 관리에 활용합니다.</p>
      </div>
    </div>

    <div class="todo-item">
      <div class="todo-dot">4</div>
      <div class="content">
        <strong>미처리 민원 자동 알림 기능</strong>
        <p>일정 시간 이상 미처리된 민원에 대해 담당자 및 관리자에게 자동 알림(이메일 또는 내부 푸시)을 발송합니다.</p>
      </div>
    </div>

    <div class="todo-item">
      <div class="todo-dot">5</div>
      <div class="content">
        <strong>대시보드 고급 시각화 및 모바일 최적화</strong>
        <p>전용 차트 라이브러리 도입으로 기간별 트렌드 분석 등 고급 시각화를 제공하고, 모바일 반응형 UI를 개선합니다.</p>
      </div>
    </div>
  </div>

  <div class="stat-row" style="margin-top:32px;">
    <div class="stat-card">
      <div class="num">14</div>
      <div class="desc">총 민원 (현재)</div>
    </div>
    <div class="stat-card">
      <div class="num">43%</div>
      <div class="desc">처리 완료율</div>
    </div>
    <div class="stat-card">
      <div class="num">2</div>
      <div class="desc">AI 엔진 수</div>
    </div>
    <div class="stat-card">
      <div class="num">MVP</div>
      <div class="desc">현재 개발 단계</div>
    </div>
  </div>

  <div class="green-box" style="margin-top:24px;">
    <div class="label">📋 종합 의견</div>
    <p>바로답 시스템은 MVP 단계를 완료하여 핵심 기능(민원 접수·AI 분석·답변 생성·관리자 통계)이 모두 정상 동작하는 상태입니다. <strong>신한카드 임직원 DB 연동</strong>과 <strong>인포누리 누적 데이터 학습</strong>이 완료되면 실 운영 환경으로의 전환이 가능할 것으로 판단됩니다.</p>
  </div>
</div>

</body>
</html>"""

with open('report/baro-dap-report.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('완료: report/baro-dap-report.html')
