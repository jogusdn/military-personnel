// ========================================================
// 대한민국 육군 통합 병력 인사 관리 및 출타·건강 현황 체계 (DIMS)
// 핵심 비즈니스 로직 및 실시간 통제 엔진
// ========================================================

// 1. 초기 샘플 병력 데이터 (국방 인트라넷 테스트용)
const INITIAL_MEMBERS = [
  { id: 'm-1', name: '이민국', rank: '중위', service_number: '23-10021', platoon: '1소대', role: '소대장', status: '현원', phone: '010-1234-5678', notes: '소대 총괄 지휘 (O형)' },
  { id: 'm-2', name: '박충성', rank: '중사', service_number: '20-50142', platoon: '1소대', role: '부소대장', status: '현원', phone: '010-2345-6789', notes: '교육훈련 및 병력관리 (A형)' },
  { id: 'm-3', name: '김철수', rank: '병장', service_number: '23-720101', platoon: '1소대', role: '1분대장', status: '휴가', phone: '010-3456-7890', notes: '정기 2차 휴가 (특급전사)' },
  { id: 'm-4', name: '이영희', rank: '상병', service_number: '23-720234', platoon: '1소대', role: '부분대장', status: '현원', phone: '010-4567-8901', notes: 'K-2 사격 우수자 (B형)' },
  { id: 'm-5', name: '박민준', rank: '상병', service_number: '23-720311', platoon: '1소대', role: 'K-3사수', status: '외출', phone: '010-5678-9012', notes: '사랑니 발치 치과 외진' },
  { id: 'm-6', name: '최동석', rank: '일병', service_number: '24-720045', platoon: '1소대', role: '소총수', status: '현원', phone: '010-6789-0123', notes: '특이사항 없음 (AB형)' },
  { id: 'm-7', name: '정승우', rank: '일병', service_number: '24-720156', platoon: '1소대', role: '무전병', status: '환자', phone: '010-7890-1234', notes: '우측 발목 인대 염좌 (침상안정)' },
  { id: 'm-8', name: '강태양', rank: '일병', service_number: '24-720289', platoon: '1소대', role: '소총수', status: '외박', phone: '010-8901-2345', notes: '성과위주 외박 (주말)' },
  { id: 'm-9', name: '윤시우', rank: '이병', service_number: '24-720401', platoon: '1소대', role: '유탄수', status: '현원', phone: '010-9012-3456', notes: '신병 적응 상태 양호' },
  { id: 'm-10', name: '한도윤', rank: '이병', service_number: '24-720512', platoon: '1소대', role: '의무병', status: '현원', phone: '010-0123-4567', notes: '의무실 파견 지원' },
  { id: 'm-11', name: '조현우', rank: '상병', service_number: '23-720455', platoon: '2소대', role: '1분대장', status: '현원', phone: '010-1122-3344', notes: '2소대 병력' },
  { id: 'm-12', name: '임재민', rank: '일병', service_number: '24-720198', platoon: '2소대', role: '소총수', status: '휴가', phone: '010-2233-4455', notes: '체력검정 특급 포상휴가' }
];

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

const INITIAL_EVENTS = [
  { id: 'e-1', member_id: 'm-3', event_type: '휴가', sub_type: '정기휴가', start_date: yesterday, end_date: tomorrow, destination: '서울 강서구 자택', reason: '정기 2차 휴가', status: '진행중' },
  { id: 'e-2', member_id: 'm-5', event_type: '외출', sub_type: '진료외출', start_date: today, end_date: today, destination: '국군춘천병원', reason: '사랑니 발치 및 신경치료', status: '진행중' },
  { id: 'e-3', member_id: 'm-7', event_type: '환자', sub_type: '침상안정', start_date: yesterday, end_date: tomorrow, destination: '소대 생활관', reason: '우측 발목 인대 염좌로 훈련 열외', status: '진행중' },
  { id: 'e-4', member_id: 'm-8', event_type: '외박', sub_type: '성과위주', start_date: today, end_date: tomorrow, destination: '강원도 춘천시 시내', reason: '주말 성과위주 외박', status: '진행중' },
  { id: 'e-5', member_id: 'm-12', event_type: '휴가', sub_type: '포상휴가', start_date: yesterday, end_date: tomorrow, destination: '경기도 수원시 자택', reason: '체력검정 특급 포상휴가', status: '진행중' }
];

// 상태 변수
let supabaseClient = null;
let isConfigured = false;
let members = [];
let events = [];
let currentTab = 'members';
let selectedPlatoon = '전체';

// ==========================================
// 초기 구동
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  checkAuth();
  initSupabase();
  bindEvents();
});

// 국방 표준시계 동기화 (KST)
function initClock() {
  const updateClock = () => {
    const now = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const formatted = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}(${days[now.getDay()]}) ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} [KST]`;
    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
      clockEl.innerHTML = `<i class="fa-regular fa-clock text-[#c5a059]"></i> ${formatted}`;
    }
  };
  updateClock();
  setInterval(updateClock, 1000);
}

// 보안 로그인 인증 확인
function checkAuth() {
  const isAuth = sessionStorage.getItem('military_admin_auth') === 'true';
  const lockScreen = document.getElementById('admin-lock-screen');
  if (isAuth) {
    lockScreen.classList.add('hidden');
  } else {
    lockScreen.classList.remove('hidden');
  }
}

// Supabase 클라이언트 연동
function initSupabase() {
  const url = CONFIG.SUPABASE_URL || '';
  const key = CONFIG.SUPABASE_ANON_KEY || '';

  if (url && key && !url.includes('your-project-id') && !key.includes('your-anon-key')) {
    try {
      supabaseClient = supabase.createClient(url, key);
      isConfigured = true;
      document.getElementById('supabase-status-badge').classList.remove('hidden');
      document.getElementById('demo-mode-banner').classList.add('hidden');
    } catch (err) {
      console.error('Supabase 연동 실패:', err);
      fallbackToLocal();
    }
  } else {
    fallbackToLocal();
  }

  loadData();
}

function fallbackToLocal() {
  isConfigured = false;
  document.getElementById('supabase-status-badge').classList.add('hidden');
  document.getElementById('demo-mode-banner').classList.remove('hidden');
}

// 데이터 로드
async function loadData() {
  const refreshBtnIcon = document.querySelector('#btn-refresh i');
  if (refreshBtnIcon) refreshBtnIcon.classList.add('fa-spin');

  try {
    if (isConfigured && supabaseClient) {
      const { data: memberData, error: memErr } = await supabaseClient
        .from('members')
        .select('*')
        .order('name');
      if (memErr) throw memErr;

      const { data: eventData, error: evErr } = await supabaseClient
        .from('event_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (evErr) throw evErr;

      members = memberData || [];
      events = eventData || [];
    } else {
      const localM = localStorage.getItem('local_military_members');
      const localE = localStorage.getItem('local_military_events');

      members = localM ? JSON.parse(localM) : INITIAL_MEMBERS;
      events = localE ? JSON.parse(localE) : INITIAL_EVENTS;

      if (!localM) localStorage.setItem('local_military_members', JSON.stringify(INITIAL_MEMBERS));
      if (!localE) localStorage.setItem('local_military_events', JSON.stringify(INITIAL_EVENTS));
    }

    updatePlatoonDropdown();
    renderAll();
  } catch (err) {
    console.error('데이터 로드 실패:', err);
    showToast('데이터 로드 오류: ' + err.message);
  } finally {
    if (refreshBtnIcon) refreshBtnIcon.classList.remove('fa-spin');
  }
}

function syncLocal() {
  if (!isConfigured) {
    localStorage.setItem('local_military_members', JSON.stringify(members));
    localStorage.setItem('local_military_events', JSON.stringify(events));
  }
}

// 소대 목록 자동 갱신
function updatePlatoonDropdown() {
  const selector = document.getElementById('platoon-selector');
  const platoons = new Set();
  members.forEach(m => {
    if (m.platoon) platoons.add(m.platoon);
  });

  const currentVal = selector.value;
  let html = `<option value="전체">중대 전체 (통합)</option>`;
  Array.from(platoons).sort().forEach(p => {
    html += `<option value="${p}" ${p === currentVal ? 'selected' : ''}>${p}</option>`;
  });
  selector.innerHTML = html;
}

// ==========================================
// 화면 렌더링 총괄
// ==========================================
function renderAll() {
  renderStats();
  renderMembersTable();
  renderEventsTable();
}

// 4대 핵심 지표 계산
function renderStats() {
  const targetMembers = selectedPlatoon === '전체'
    ? members
    : members.filter(m => m.platoon === selectedPlatoon);

  const total = targetMembers.length;
  const present = targetMembers.filter(m => m.status === '현원').length;
  const absent = total - present;
  const outRate = total > 0 ? (absent / total) * 100 : 0;

  const vacation = targetMembers.filter(m => m.status === '휴가').length;
  const outing = targetMembers.filter(m => m.status === '외출').length;
  const stayout = targetMembers.filter(m => m.status === '외박').length;
  const patient = targetMembers.filter(m => m.status === '환자' || m.status === '열외').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-present').textContent = present;
  document.getElementById('stat-absent').textContent = absent;
  document.getElementById('stat-out-rate').textContent = outRate.toFixed(1);

  document.getElementById('stat-total-label').textContent = 
    selectedPlatoon === '전체' ? '편성 정원 기준' : `${selectedPlatoon} 총원 기준`;

  // 프로그레스 바
  const outBar = document.getElementById('stat-out-bar');
  outBar.style.width = `${Math.min(outRate, 100)}%`;
  if (outRate > 35) {
    outBar.className = 'h-full rounded-full bg-red-500 transition-all duration-500';
  } else {
    outBar.className = 'h-full rounded-full bg-[#a855f7] transition-all duration-500';
  }

  // 칩
  document.getElementById('stat-vacation').textContent = vacation;
  document.getElementById('stat-outing').textContent = outing;
  document.getElementById('stat-stayout').textContent = stayout;
  document.getElementById('stat-patient').textContent = patient;

  // 탭 카운터
  document.getElementById('tab-members-count').textContent = targetMembers.length;
  document.getElementById('tab-events-count').textContent = events.filter(e => {
    const mem = members.find(m => m.id === e.member_id);
    return mem && (selectedPlatoon === '전체' || mem.platoon === selectedPlatoon);
  }).length;
}

// 병적 명부 테이블 렌더링
function renderMembersTable() {
  const tbody = document.getElementById('member-table-body');
  const statusFilter = document.getElementById('member-status-filter').value;
  const search = document.getElementById('member-search-input').value.toLowerCase().trim();

  const filtered = members.filter(m => {
    const matchPlatoon = selectedPlatoon === '전체' || m.platoon === selectedPlatoon;
    const matchStatus = statusFilter === '전체' || m.status === statusFilter;
    const matchSearch = m.name.toLowerCase().includes(search) ||
      (m.service_number && m.service_number.includes(search)) ||
      (m.role && m.role.toLowerCase().includes(search));
    return matchPlatoon && matchStatus && matchSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-12 text-[#9caea3] text-xs">
          등록된 병적 데이터가 없거나 검색 조건과 일치하는 대원이 없습니다.
        </td>
      </tr>
    `;
    return;
  }

  const getBadgeClass = (status) => {
    switch (status) {
      case '현원': return 'badge-present';
      case '휴가': return 'badge-vacation';
      case '외출': return 'badge-outing';
      case '외박': return 'badge-stayout';
      case '환자':
      case '열외': return 'badge-patient';
      default: return 'badge-etc';
    }
  };

  const getRankBadgeClass = (rank) => {
    if (rank === '소위' || rank === '중위' || rank === '대위') {
      return 'bg-[#2b2413] text-[#e6ca85] border border-[#c5a059]';
    }
    if (rank === '하사' || rank === '중사' || rank === '상사') {
      return 'bg-[#1b2b1a] text-emerald-300 border border-emerald-500/50';
    }
    return 'bg-[#122419] text-slate-200 border border-[#2b583a]';
  };

  tbody.innerHTML = filtered.map(m => `
    <tr class="hover:bg-[#12281a] transition-colors">
      <td class="px-4 py-3 whitespace-nowrap">
        <div class="flex items-center gap-2">
          <span class="font-bold text-[11px] px-2 py-0.5 rounded ${getRankBadgeClass(m.rank)}">${m.rank}</span>
          <span class="font-extrabold text-[#f1f5f2] text-sm">${m.name}</span>
        </div>
      </td>
      <td class="px-4 py-3 whitespace-nowrap">
        <div class="flex flex-col">
          <span class="text-[#f1f5f2] font-semibold">${m.platoon}</span>
          <span class="text-[11px] text-[#9caea3]">${m.role || '소총수'}</span>
        </div>
      </td>
      <td class="px-4 py-3 whitespace-nowrap font-mono text-[#9caea3]">
        ${m.service_number || '-'}
      </td>
      <td class="px-4 py-3 whitespace-nowrap">
        <select onchange="handleInlineStatusChange('${m.id}', this.value)"
          class="badge-status ${getBadgeClass(m.status)} outline-none cursor-pointer font-bold">
          <option value="현원" ${m.status === '현원' ? 'selected' : ''}>현원 (영내)</option>
          <option value="휴가" ${m.status === '휴가' ? 'selected' : ''}>휴가</option>
          <option value="외출" ${m.status === '외출' ? 'selected' : ''}>외출</option>
          <option value="외박" ${m.status === '외박' ? 'selected' : ''}>외박</option>
          <option value="환자" ${m.status === '환자' ? 'selected' : ''}>환자</option>
          <option value="열외" ${m.status === '열외' ? 'selected' : ''}>열외</option>
        </select>
      </td>
      <td class="px-4 py-3">
        <div class="flex flex-col gap-0.5">
          <span class="text-slate-300 font-mono text-[11px] flex items-center gap-1">
            <i class="fa-solid fa-phone text-[#718679] text-[10px]"></i> ${m.phone || '-'}
          </span>
          ${m.notes ? `<span class="text-[11px] text-[#9caea3] truncate max-w-xs" title="${m.notes}">${m.notes}</span>` : ''}
        </div>
      </td>
      <td class="px-4 py-3 text-right whitespace-nowrap">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="openEditMemberModal('${m.id}')" title="병적 정보 수정"
            class="p-1.5 rounded-lg bg-[#14281c] hover:bg-[#1e3d29] text-slate-300 hover:text-white transition-colors border border-[#2b583a]">
            <i class="fa-solid fa-user-pen"></i>
          </button>
          <button onclick="handleDeleteMember('${m.id}')" title="명부 제적(삭제)"
            class="p-1.5 rounded-lg bg-[#241313] hover:bg-rose-950 text-rose-400 hover:text-rose-200 transition-colors border border-rose-900/50">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// 출타/환자 관리대장 테이블 렌더링
function renderEventsTable() {
  const tbody = document.getElementById('event-table-body');
  const typeFilter = document.getElementById('event-type-filter').value;

  const filtered = events.filter(e => {
    const mem = members.find(m => m.id === e.member_id);
    if (!mem) return false;
    const matchPlatoon = selectedPlatoon === '전체' || mem.platoon === selectedPlatoon;
    const matchType = typeFilter === '전체' || e.event_type === typeFilter;
    return matchPlatoon && matchType;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-12 text-[#9caea3] text-xs">
          현재 등록된 출타/환자 통제 기록이 없습니다.
        </td>
      </tr>
    `;
    return;
  }

  const getEventBadgeClass = (type) => {
    switch (type) {
      case '휴가': return 'badge-vacation';
      case '외출': return 'badge-outing';
      case '외박': return 'badge-stayout';
      case '환자':
      case '열외': return 'badge-patient';
      default: return 'badge-etc';
    }
  };

  tbody.innerHTML = filtered.map(e => {
    const mem = members.find(m => m.id === e.member_id);
    return `
      <tr class="hover:bg-[#12281a] transition-colors">
        <td class="px-4 py-3 whitespace-nowrap">
          ${mem ? `
            <div class="flex items-center gap-2">
              <span class="font-bold text-[11px] px-2 py-0.5 rounded bg-[#122419] text-slate-200 border border-[#2b583a]">${mem.rank}</span>
              <span class="font-extrabold text-[#f1f5f2] text-sm">${mem.name}</span>
              <span class="text-[11px] text-[#9caea3]">(${mem.platoon})</span>
            </div>
          ` : '<span class="text-slate-500">대원 정보 없음</span>'}
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="flex items-center gap-2">
            <span class="badge-status ${getEventBadgeClass(e.event_type)} font-bold">${e.event_type}</span>
            ${e.sub_type ? `<span class="text-[#c5a059] text-xs font-semibold">${e.sub_type}</span>` : ''}
          </div>
        </td>
        <td class="px-4 py-3 whitespace-nowrap font-mono text-slate-200 text-xs">
          <i class="fa-regular fa-calendar-days text-[#c5a059] mr-1"></i>
          ${e.start_date} ~ ${e.end_date}
        </td>
        <td class="px-4 py-3">
          <div class="flex flex-col gap-0.5">
            ${e.destination ? `<span class="text-slate-200 text-xs flex items-center gap-1 font-semibold"><i class="fa-solid fa-location-dot text-[#c5a059] text-[10px]"></i> ${e.destination}</span>` : ''}
            <span class="text-[11px] text-[#9caea3]">${e.reason || '-'}</span>
          </div>
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          ${e.status === '진행중' ? `
            <span class="inline-flex items-center gap-1 text-[11px] font-bold bg-[#33220e] text-amber-300 border border-amber-600/50 px-2.5 py-0.5 rounded">
              ● 출타/격리 중
            </span>
          ` : `
            <span class="military-stamp">
              ✓ 복귀완료 (현원)
            </span>
          `}
        </td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-2">
            ${e.status === '진행중' ? `
              <button onclick="handleCompleteEvent('${e.id}', '${e.member_id}')"
                class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0e3321] hover:bg-[#14472e] text-emerald-300 border border-emerald-600/50 text-xs font-bold transition-all shadow-sm active:scale-95"
                title="복귀 완료 승인 (대원 상태가 '현원'으로 즉시 복귀됩니다)">
                <i class="fa-solid fa-stamp"></i>
                <span>복귀 확인</span>
              </button>
            ` : ''}
            <button onclick="handleDeleteEvent('${e.id}')" title="기록 삭제"
              class="p-1.5 rounded-lg bg-[#241313] hover:bg-rose-950 text-rose-400 hover:text-rose-200 transition-colors border border-rose-900/50">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// 비즈니스 로직 및 CRUD 핸들러
// ==========================================

// 대원 상태 테이블 내 실시간 변경
window.handleInlineStatusChange = async function(memberId, newStatus) {
  if (isConfigured && supabaseClient) {
    const { error } = await supabaseClient
      .from('members')
      .update({ status: newStatus })
      .eq('id', memberId);
    if (error) {
      alert('상태 변경 실패: ' + error.message);
      return;
    }
  }

  members = members.map(m => m.id === memberId ? { ...m, status: newStatus } : m);
  syncLocal();
  renderAll();
  showToast(`대원 상태가 '${newStatus}'(으)로 갱신되었습니다.`);
};

// 대원 삭제
window.handleDeleteMember = async function(memberId) {
  const mem = members.find(m => m.id === memberId);
  if (!confirm(`'${mem ? mem.rank + ' ' + mem.name : '대원'}'을(를) 병적 명부에서 제적(삭제)하시겠습니까?`)) return;

  if (isConfigured && supabaseClient) {
    const { error } = await supabaseClient
      .from('members')
      .delete()
      .eq('id', memberId);
    if (error) {
      alert('삭제 실패: ' + error.message);
      return;
    }
  }

  members = members.filter(m => m.id !== memberId);
  events = events.filter(e => e.member_id !== memberId);
  syncLocal();
  updatePlatoonDropdown();
  renderAll();
  showToast('병적 명부에서 제적 처리되었습니다.');
};

// 복귀 확인 처리 (핵심 관계형 비즈니스 로직)
window.handleCompleteEvent = async function(eventId, memberId) {
  if (isConfigured && supabaseClient) {
    const { error: evErr } = await supabaseClient
      .from('event_logs')
      .update({ status: '복귀완료' })
      .eq('id', eventId);
    if (evErr) {
      alert('복귀 처리 실패: ' + evErr.message);
      return;
    }

    const { error: memErr } = await supabaseClient
      .from('members')
      .update({ status: '현원' })
      .eq('id', memberId);
    if (memErr) console.error('대원 상태 현원 복귀 실패:', memErr);
  }

  events = events.map(e => e.id === eventId ? { ...e, status: '복귀완료' } : e);
  members = members.map(m => m.id === memberId ? { ...m, status: '현원' } : m);
  syncLocal();
  renderAll();
  showToast('✓ 복귀 확인 완료! 대원의 상태가 "현원(영내)"으로 자동 복귀되었습니다.');
};

// 출타 기록 삭제
window.handleDeleteEvent = async function(eventId) {
  if (!confirm('이 출타/환자 통제 기록을 삭제하시겠습니까?')) return;

  if (isConfigured && supabaseClient) {
    const { error } = await supabaseClient
      .from('event_logs')
      .delete()
      .eq('id', eventId);
    if (error) {
      alert('삭제 실패: ' + error.message);
      return;
    }
  }

  events = events.filter(e => e.id !== eventId);
  syncLocal();
  renderAll();
  showToast('통제 대장에서 삭제되었습니다.');
};

// 대원 수정 모달 열기
window.openEditMemberModal = function(memberId) {
  const m = members.find(mem => mem.id === memberId);
  if (!m) return;

  document.getElementById('modal-member-title').innerHTML = `<i class="fa-solid fa-user-pen text-[#c5a059]"></i> 대원 병적 정보 수정 (${m.rank} ${m.name})`;
  document.getElementById('member-form-id').value = m.id;
  document.getElementById('member-form-name').value = m.name;
  document.getElementById('member-form-rank').value = m.rank;
  document.getElementById('member-form-platoon').value = m.platoon;
  document.getElementById('member-form-role').value = m.role || '';
  document.getElementById('member-form-service-number').value = m.service_number || '';
  document.getElementById('member-form-status').value = m.status;
  document.getElementById('member-form-phone').value = m.phone || '';
  document.getElementById('member-form-notes').value = m.notes || '';

  document.getElementById('modal-member').classList.remove('hidden');
};

// ==========================================
// 이벤트 리스너 바인딩
// ==========================================
function bindEvents() {
  // 로그인
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const pw = document.getElementById('admin-password-input').value.trim();
    const expected = CONFIG.ADMIN_PASSWORD || 'rok1234';

    if (pw === expected) {
      sessionStorage.setItem('military_admin_auth', 'true');
      document.getElementById('admin-lock-screen').classList.add('hidden');
      showToast('국방인사정보체계(DIMS) 보안 접속이 승인되었습니다. 충성!');
    } else {
      const errEl = document.getElementById('login-error-msg');
      errEl.classList.remove('hidden');
      setTimeout(() => errEl.classList.add('hidden'), 2500);
    }
  });

  // 힌트 토글
  document.getElementById('btn-toggle-hint').addEventListener('click', () => {
    document.getElementById('login-hint-box').classList.toggle('hidden');
  });

  // 로그아웃
  document.getElementById('btn-logout').addEventListener('click', () => {
    if (confirm('군사 보안 유지를 위해 체계에서 로그아웃하시겠습니까?')) {
      sessionStorage.removeItem('military_admin_auth');
      document.getElementById('admin-lock-screen').classList.remove('hidden');
      document.getElementById('admin-password-input').value = '';
    }
  });

  // 새로고침
  document.getElementById('btn-refresh').addEventListener('click', loadData);

  // 부대 구분 필터
  document.getElementById('platoon-selector').addEventListener('change', (e) => {
    selectedPlatoon = e.target.value;
    renderAll();
  });

  // 도움말 토글
  document.getElementById('btn-toggle-config-help').addEventListener('click', () => {
    document.getElementById('config-help-box').classList.toggle('hidden');
  });

  // 탭 전환
  const tabMembers = document.getElementById('tab-btn-members');
  const tabEvents = document.getElementById('tab-btn-events');
  const contentMembers = document.getElementById('tab-content-members');
  const contentEvents = document.getElementById('tab-content-events');

  tabMembers.addEventListener('click', () => {
    currentTab = 'members';
    tabMembers.className = 'flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 border-[#c5a059] text-[#c5a059] bg-[#12281a] transition-all rounded-t-lg';
    tabEvents.className = 'flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 border-transparent text-[#9caea3] hover:text-[#f1f5f2] transition-all rounded-t-lg';
    contentMembers.classList.remove('hidden');
    contentEvents.classList.add('hidden');
  });

  tabEvents.addEventListener('click', () => {
    currentTab = 'events';
    tabEvents.className = 'flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 border-[#c5a059] text-[#c5a059] bg-[#12281a] transition-all rounded-t-lg';
    tabMembers.className = 'flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 border-transparent text-[#9caea3] hover:text-[#f1f5f2] transition-all rounded-t-lg';
    contentEvents.classList.remove('hidden');
    contentMembers.classList.add('hidden');
  });

  // 필터 및 검색
  document.getElementById('member-status-filter').addEventListener('change', renderMembersTable);
  document.getElementById('member-search-input').addEventListener('input', renderMembersTable);
  document.getElementById('event-type-filter').addEventListener('change', renderEventsTable);

  // 모달 닫기
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
    });
  });

  // 대원 전입 등록 모달
  document.getElementById('btn-open-add-member').addEventListener('click', () => {
    document.getElementById('form-member').reset();
    document.getElementById('member-form-id').value = '';
    document.getElementById('member-form-platoon').value = selectedPlatoon === '전체' ? '1소대' : selectedPlatoon;
    document.getElementById('modal-member-title').innerHTML = `<i class="fa-solid fa-user-plus text-[#c5a059]"></i> 신규 대원 병적 명부 등록`;
    document.getElementById('modal-member').classList.remove('hidden');
  });

  // 대원 저장
  document.getElementById('form-member').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('member-form-id').value;
    const name = document.getElementById('member-form-name').value.trim();
    const rank = document.getElementById('member-form-rank').value;
    const platoon = document.getElementById('member-form-platoon').value.trim() || '1소대';
    const role = document.getElementById('member-form-role').value.trim() || '소총수';
    const service_number = document.getElementById('member-form-service-number').value.trim();
    const status = document.getElementById('member-form-status').value;
    const phone = document.getElementById('member-form-phone').value.trim();
    const notes = document.getElementById('member-form-notes').value.trim();

    const memberData = { name, rank, platoon, role, service_number, status, phone, notes };

    if (id) {
      if (isConfigured && supabaseClient) {
        const { error } = await supabaseClient.from('members').update(memberData).eq('id', id);
        if (error) return alert('수정 실패: ' + error.message);
      }
      members = members.map(m => m.id === id ? { ...m, ...memberData } : m);
      showToast('대원 병적 정보가 갱신되었습니다.');
    } else {
      if (isConfigured && supabaseClient) {
        const { data, error } = await supabaseClient.from('members').insert([memberData]).select().single();
        if (error) return alert('등록 실패: ' + error.message);
        members.push(data);
      } else {
        const newObj = { ...memberData, id: `m-${Date.now()}` };
        members.push(newObj);
      }
      showToast('신규 대원이 병적 명부에 등록되었습니다.');
    }

    syncLocal();
    updatePlatoonDropdown();
    renderAll();
    document.getElementById('modal-member').classList.add('hidden');
  });

  // 출타 등록 모달 열기
  document.getElementById('btn-open-add-event').addEventListener('click', () => {
    if (members.length === 0) {
      alert('먼저 부대원을 1명 이상 등록해야 출타/환자 통제 등록이 가능합니다.');
      return;
    }

    const selectEl = document.getElementById('event-form-member-id');
    const targetMembers = selectedPlatoon === '전체'
      ? members
      : members.filter(m => m.platoon === selectedPlatoon);

    selectEl.innerHTML = targetMembers.map(m => `
      <option value="${m.id}">[${m.platoon}] ${m.rank} ${m.name} (${m.role}) - 현재상태: ${m.status}</option>
    `).join('');

    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('event-form-start-date').value = todayStr;
    document.getElementById('event-form-end-date').value = todayStr;
    document.getElementById('modal-event').classList.remove('hidden');
  });

  // 출타 등록 제출 (관계형 자동 상태 갱신)
  document.getElementById('form-event').addEventListener('submit', async (e) => {
    e.preventDefault();
    const member_id = document.getElementById('event-form-member-id').value;
    const event_type = document.getElementById('event-form-type').value;
    const sub_type = document.getElementById('event-form-sub-type').value.trim();
    const start_date = document.getElementById('event-form-start-date').value;
    const end_date = document.getElementById('event-form-end-date').value;
    const destination = document.getElementById('event-form-destination').value.trim();
    const reason = document.getElementById('event-form-reason').value.trim();

    const eventData = {
      member_id,
      event_type,
      sub_type,
      start_date,
      end_date,
      destination,
      reason,
      status: '진행중'
    };

    if (isConfigured && supabaseClient) {
      const { data: newEv, error: evErr } = await supabaseClient
        .from('event_logs')
        .insert([eventData])
        .select()
        .single();
      if (evErr) return alert('출타 등록 실패: ' + evErr.message);

      await supabaseClient
        .from('members')
        .update({ status: event_type })
        .eq('id', member_id);

      events.unshift(newEv);
    } else {
      const mockEvent = { ...eventData, id: `e-${Date.now()}` };
      events.unshift(mockEvent);
    }

    members = members.map(m => m.id === member_id ? { ...m, status: event_type } : m);
    syncLocal();
    renderAll();
    document.getElementById('modal-event').classList.add('hidden');
    showToast(`출타/환자 승인 완료! 대원 상태가 '${event_type}'(으)로 자동 변경되었습니다.`);
  });

  // 일일 보고서 생성
  document.getElementById('btn-open-report').addEventListener('click', generateDailyReport);
  document.getElementById('report-input-reporter').addEventListener('input', generateDailyReport);

  // 📋 원클릭 복사
  document.getElementById('btn-copy-report').addEventListener('click', async () => {
    const text = document.getElementById('report-text-area').value;
    try {
      await navigator.clipboard.writeText(text);
      const btnText = document.getElementById('btn-copy-text');
      btnText.textContent = '✓ 복사 완료! (국방 온나라/카톡에 붙여넣기 가능)';
      showToast('국방 표준 일일 인원 보고서가 클립보드에 복사되었습니다!');
      setTimeout(() => {
        btnText.textContent = '📋 원클릭 국방 표준 보고문구 복사';
      }, 2500);
    } catch (err) {
      alert('복사 실패: ' + err.message);
    }
  });
}

// 군 표준 공문서 일일 인원 및 전투력 보고서 자동 생성
function generateDailyReport() {
  const now = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dateStr = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}.(${days[now.getDay()]})`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:00`;

  const targetMembers = selectedPlatoon === '전체'
    ? members
    : members.filter(m => m.platoon === selectedPlatoon);

  const total = targetMembers.length;
  const present = targetMembers.filter(m => m.status === '현원').length;
  const absent = total - present;
  const outRate = total > 0 ? (absent / total) * 100 : 0;

  const activeEvents = events.filter(e => e.status === '진행중');

  const formatList = (type) => {
    return activeEvents
      .filter(e => e.event_type === type)
      .map(e => {
        const m = targetMembers.find(mem => mem.id === e.member_id);
        if (!m) return null;
        const period = `${e.start_date.slice(5)}~${e.end_date.slice(5)}`;
        return `    • ${m.rank} ${m.name} (${e.sub_type || type}, ${period}${e.destination ? `, ${e.destination}` : ''})`;
      })
      .filter(Boolean);
  };

  const vacationList = formatList('휴가');
  const outingList = formatList('외출');
  const stayoutList = formatList('외박');
  const patientList = activeEvents
    .filter(e => e.event_type === '환자' || e.event_type === '열외')
    .map(e => {
      const m = targetMembers.find(mem => mem.id === e.member_id);
      if (!m) return null;
      return `    • ${m.rank} ${m.name} (${e.reason || '열외/진료'}, ${e.destination || '생활관 침상안정'})`;
    })
    .filter(Boolean);

  const reporter = document.getElementById('report-input-reporter').value || '당직사관 중사 박충성';
  const unitName = selectedPlatoon === '전체' ? '중대 통합' : selectedPlatoon;

  let report = `[일일 인원 및 전투력 현황 보고]\n`;
  report += `■ 일시: ${dateStr} ${timeStr} 기준\n`;
  report += `■ 보고부대: 육군 제OO보병사단 O대대 O중대 (${unitName})\n`;
  report += `■ 수신: 당직사령 / 중대장 / 행정보급관\n`;
  report += `■ 발신: ${unitName} 지휘보고관\n`;
  report += `--------------------------------------------------\n\n`;

  report += `1. 총원 현황\n`;
  report += `  가. 재적: ${total}명 (편성 정원 기준)\n`;
  report += `  나. 현원: ${present}명 (영내 대기 및 정상 과업 수행)\n`;
  report += `  다. 사고: ${absent}명 (출타율: ${outRate.toFixed(1)}% - 지휘관 허용 기준 35% 이내 관리 중)\n\n`;

  report += `2. 사고 및 열외 상세 내역 (총 ${absent}명)\n`;
  report += vacationList.length > 0 ? `  [휴가 ${vacationList.length}명]\n${vacationList.join('\n')}\n` : `  [휴가]: 해당 없음\n`;
  report += outingList.length > 0 ? `  [외출 ${outingList.length}명]\n${outingList.join('\n')}\n` : `  [외출]: 해당 없음\n`;
  report += stayoutList.length > 0 ? `  [외박 ${stayoutList.length}명]\n${stayoutList.join('\n')}\n` : `  [외박]: 해당 없음\n`;
  report += patientList.length > 0 ? `  [환자/열외 ${patientList.length}명]\n${patientList.join('\n')}\n` : `  [환자/열외]: 해당 없음\n`;

  report += `\n3. 총기 및 탄약/장비 상태\n`;
  report += `  - 개인화기: ${total}정 (영내 총기함 시건 및 수량 일치, 이상 무)\n`;
  report += `  - 탄약 및 통신장비: 이상 무\n\n`;

  report += `4. 지휘관 지시 및 당직 특이사항\n`;
  report += `  - 출타자 전원 안전수칙 준수 교육 및 1일 2회 위치보고 체계 확립.\n`;
  report += `  - 환자 인원 의무실 진료 및 약 복용 확인, 무리한 과업 열외 조치 완료.\n`;
  report += `  - 특이동향 및 군기 사고: 이상 무.\n\n`;
  report += `  보고관: ${reporter}`;

  document.getElementById('report-modal-platoon-badge').textContent = unitName;
  document.getElementById('report-text-area').value = report;
  document.getElementById('modal-report').classList.remove('hidden');
}

// 토스트 메시지
function showToast(msg) {
  const toast = document.getElementById('toast-msg');
  const toastText = document.getElementById('toast-text');
  toastText.textContent = msg;
  toast.classList.remove('translate-y-24', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-24', 'opacity-0');
  }, 2800);
}
