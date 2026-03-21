const API = '';
let currentComplaint = null;

async function loadAll() {
  await Promise.all([loadStats(), loadComplaints()]);
}

async function loadStats() {
  try {
    const res = await fetch(`${API}/api/admin/stats`);
    const d   = await res.json();
    document.getElementById('statTotal').textContent      = d.total      ?? '—';
    document.getElementById('statPending').textContent    = d.pending    ?? '—';
    document.getElementById('statProcessing').textContent = d.processing ?? '—';
    document.getElementById('statResponded').textContent  = d.responded  ?? '—';
    document.getElementById('statCritical').textContent   = d.critical   ?? '—';
    document.getElementById('statAvgRisk').textContent    = d.avg_risk   ?? '—';
  } catch (_) {}
}

async function loadComplaints() {
  const status = document.getElementById('filterStatus').value;
  const url    = status ? `${API}/api/admin/complaints?status=${status}` : `${API}/api/admin/complaints`;
  const tbody  = document.getElementById('complaintsTbody');

  try {
    const res  = await fetch(url);
    const data = await res.json();
    const rows = data.complaints || [];

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:2rem;">민원이 없습니다</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(r => `
      <tr onclick="openDetail(${r.id})">
        <td style="color:var(--cyan)">#${r.id}</td>
        <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"
            title="${escHtml(r.title)}">${escHtml(r.title)}</td>
        <td>${r.category || '—'}</td>
        <td>${r.department || '—'}</td>
        <td>${priorityBadge(r.priority)}</td>
        <td>${scoreBar(r.urgency_score, 'urgency')}</td>
        <td>${scoreBar(r.risk_score, 'risk')}</td>
        <td>${statusBadge(r.status)}</td>
        <td style="color:var(--text-muted); font-size:0.82rem;">${formatDate(r.created_at)}</td>
      </tr>
    `).join('');
  } catch (_) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--danger); padding:2rem;">데이터 로드 실패</td></tr>';
  }
}

async function openDetail(id) {
  try {
    const res  = await fetch(`${API}/api/complaints/${id}`);
    const data = await res.json();
    currentComplaint = data;

    document.getElementById('modalTitle').textContent    = `#${data.id} ${data.title}`;
    document.getElementById('mCategory').textContent     = data.category    || '—';
    document.getElementById('mDepartment').textContent   = data.department  || '—';
    document.getElementById('mContent').textContent      = data.content     || '—';
    document.getElementById('mSummary').textContent      = data.summary     || '—';
    document.getElementById('mFacts').textContent        = data.facts       || '—';
    document.getElementById('mEmotions').textContent     = data.emotions    || '—';
    document.getElementById('mResponse').textContent     = data.auto_response || '—';
    document.getElementById('mFinalResponse').value      = data.final_response || data.auto_response || '';

    const u = data.urgency_score || 0;
    const r = data.risk_score    || 0;
    setTimeout(() => {
      document.getElementById('mUrgencyBar').style.width = u + '%';
      document.getElementById('mRiskBar').style.width    = r + '%';
      document.getElementById('mUrgencyVal').textContent = u;
      document.getElementById('mRiskVal').textContent    = r;
    }, 50);

    document.getElementById('detailModal').classList.add('show');
  } catch (_) {
    showToast('민원 정보 로드 실패', 'error');
  }
}

function closeModal() {
  document.getElementById('detailModal').classList.remove('show');
  document.getElementById('mUrgencyBar').style.width = '0%';
  document.getElementById('mRiskBar').style.width    = '0%';
  currentComplaint = null;
}

async function submitResponse(status) {
  if (!currentComplaint) return;
  const finalResponse = document.getElementById('mFinalResponse').value.trim();

  try {
    const res = await fetch(`${API}/api/admin/complaints/${currentComplaint.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, final_response: finalResponse }),
    });
    if (!res.ok) throw new Error('업데이트 실패');
    showToast('처리가 완료되었습니다.', 'success');
    closeModal();
    loadAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function regenerateResponse() {
  if (!currentComplaint) return;
  const btn = document.getElementById('regenBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> 재생성 중...';

  try {
    const res  = await fetch(`${API}/api/admin/complaints/${currentComplaint.id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    document.getElementById('mResponse').textContent     = data.auto_response;
    document.getElementById('mFinalResponse').value      = data.auto_response;
    showToast('답변이 재생성되었습니다.', 'success');
  } catch (_) {
    showToast('재생성 실패', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🤖 답변 재생성';
  }
}

// ── 유틸 ──
function priorityBadge(p) {
  const labels = { critical: '🔴 긴급', high: '🟠 높음', normal: '🟡 보통', low: '🟢 낮음' };
  return `<span class="badge badge-${p || 'normal'}">${labels[p] || p || '—'}</span>`;
}
function statusBadge(s) {
  const labels = { pending: '대기', processing: '처리중', responded: '답변완료', closed: '종결' };
  return `<span class="badge badge-${s}">${labels[s] || s}</span>`;
}
function scoreBar(v, type) {
  const val = v || 0;
  return `<div style="display:flex; align-items:center; gap:0.4rem;">
    <div style="width:60px; height:5px; background:var(--bg-secondary); border-radius:3px; overflow:hidden;">
      <div style="width:${val}%; height:100%; background:${type === 'risk' ? 'var(--danger)' : 'var(--warning)'}; border-radius:3px;"></div>
    </div>
    <span style="font-size:0.8rem; color:var(--text-muted);">${val}</span>
  </div>`;
}
function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function escHtml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function showToast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// 모달 외부 클릭 시 닫기
document.getElementById('detailModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// 초기 로드
loadAll();
// 30초마다 자동 갱신
setInterval(loadAll, 30000);
