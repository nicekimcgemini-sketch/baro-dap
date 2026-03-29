const API = '';
let currentComplaintId = null;
let pollInterval = null;

document.getElementById('complaintForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title   = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  if (!title || !content) return;

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> 접수 중...';

  try {
    const res = await fetch(`${API}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complainant_name: document.getElementById('name').value.trim() || null,
        contact: document.getElementById('contact').value.trim() || null,
        title,
        content,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      let msg = '접수 실패';
      try { msg = JSON.parse(text).detail || msg; } catch (_) { msg = text || `서버 오류 (${res.status})`; }
      throw new Error(msg);
    }
    const data = await res.json();

    currentComplaintId = data.id;

    // AI 결과 박스 표시
    const aiResult = document.getElementById('aiResult');
    aiResult.classList.add('show');
    aiResult.scrollIntoView({ behavior: 'smooth', block: 'start' });

    document.getElementById('resId').textContent = `#${data.id}`;

    // 폴링 시작
    pollInterval = setInterval(pollStatus, 2500);

  } catch (err) {
    showToast(err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '민원 접수하기';
  }
});

async function pollStatus() {
  if (!currentComplaintId) return;
  try {
    const res = await fetch(`${API}/api/complaints/${currentComplaintId}/status`);
    const data = await res.json();

    if (data.status === 'responded') {
      clearInterval(pollInterval);
      const detailRes = await fetch(`${API}/api/complaints/${currentComplaintId}`);
      const detail = await detailRes.json();
      showAIResult(detail);
    }
  } catch (_) {}
}

function showAIResult(data) {
  document.getElementById('aiStatusIcon').textContent = '✅';
  document.getElementById('aiStatusText').textContent = 'AI 분석이 완료되었습니다';
  document.getElementById('aiContent').style.display = 'block';

  document.getElementById('resCategory').textContent   = data.category    || '—';
  document.getElementById('resDepartment').textContent = data.department  || '—';
  document.getElementById('resSummary').textContent    = data.summary     || '—';
  document.getElementById('resResponse').textContent   = data.auto_response || '—';

  // 우선순위 배지
  const p = data.priority || 'normal';
  const labels = { critical: '🔴 긴급', high: '🟠 높음', normal: '🟡 보통', low: '🟢 낮음' };
  document.getElementById('resPriority').innerHTML =
    `<span class="badge badge-${p}">${labels[p] || p}</span>`;

  // 스코어 바 애니메이션
  const u = data.urgency_score || 0;
  const r = data.risk_score    || 0;
  setTimeout(() => {
    document.getElementById('urgencyBar').style.width = u + '%';
    document.getElementById('riskBar').style.width    = r + '%';
    document.getElementById('urgencyVal').textContent = u;
    document.getElementById('riskVal').textContent    = r;
  }, 100);

  document.getElementById('resetArea').style.display = 'block';

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '접수 완료';

  showToast('민원이 정상적으로 접수되었습니다.', 'success');
}

function resetForm() {
  clearInterval(pollInterval);
  currentComplaintId = null;
  document.getElementById('complaintForm').reset();

  const aiResult = document.getElementById('aiResult');
  aiResult.classList.remove('show');
  document.getElementById('aiContent').style.display = 'none';
  document.getElementById('aiStatusIcon').textContent = '⏳';
  document.getElementById('aiStatusText').textContent = 'AI가 민원을 분석 중입니다...';
  document.getElementById('urgencyBar').style.width = '0%';
  document.getElementById('riskBar').style.width    = '0%';
  document.getElementById('resetArea').style.display = 'none';

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = false;
  submitBtn.innerHTML = '민원 접수하기';
}

function showToast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
