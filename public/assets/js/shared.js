/* shared.js - routing, helpers, daily log, TV board, and session restore */

function wireLogo() {
    document.querySelectorAll('.logo-img').forEach(el => { el.src = LOGO; });
}

let tvInterval = null;
let clockInterval = null;

// ==========================================
// HASH-BASED ROUTING (supports back/forward/refresh)
// ==========================================
// Define which pages strictly require the user to be logged in
const protectedPages = ['page-patient', 'page-nurse', 'page-doctor', 'page-admin'];

function showPage(id) {
    // 1. ROUTE GUARD: Intercept unauthorized access
    if (protectedPages.includes(id)) {
        // If there is no active user session, kick them back to home
        if (!currentUser) {
            console.warn("Access Denied: Please log in first.");
            id = 'page-home';
        } 
        // Extra Security: Prevent a logged-in Nurse from manually typing #page-doctor
        else if (id !== `page-${currentUser.role}`) {
            console.warn("Access Denied: Unauthorized role.");
            id = `page-${currentUser.role}`;
        }
    }

    // 2. Standard URL Hash Updating
    if (window.location.hash !== '#' + id) {
        history.pushState(null, '', '#' + id);
    }
    
    // 3. UI Toggling
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
    localStorage.setItem('ucims-page', id); // fallback for role-based redirection

    if (id !== 'page-tv-queue') {
        if (tvInterval) clearInterval(tvInterval);
        if (clockInterval) clearInterval(clockInterval);
    }
}

// Listen to browser back/forward buttons
window.addEventListener('popstate', function() {
    let hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash)) {
        // Only navigate if the page exists and user is allowed (session check will happen in restoreSession)
        showPage(hash);
        // Re-initialize role-specific navigation based on currentUser
        if (currentUser) {
            if (currentUser.role === 'patient') patNav(localStorage.getItem('ucims-pat-nav') || 'visit');
            else if (currentUser.role === 'nurse') nurseNav(localStorage.getItem('ucims-nurse-nav') || 'queue');
            else if (currentUser.role === 'doctor') docNav(localStorage.getItem('ucims-doc-nav') || 'consult');
            else if (currentUser.role === 'admin') adminNav(localStorage.getItem('ucims-admin-nav') || 'accounts');
        }
    } else {
        showPage('page-home');
    }
});

// ==========================================
// RESTORE SESSION FROM BACKEND AFTER REFRESH
// ==========================================
async function restoreSession() {
    try {
        let res = await fetch('/api/auth/check', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        let data = await res.json();
        if (data.status === 'success') {
            currentUser = data.user;
            // Ensure integer ID
            currentUser.id = parseInt(currentUser.id);
            wireLogo();
            const roleLabels = {
                patient: 'Patient Portal',
                nurse: 'Nurse Interface',
                doctor: 'Doctor Interface',
                admin: 'Admin Interface'
            };
            ['patient', 'nurse', 'doctor', 'admin'].forEach(r => {
                const n = document.getElementById(`${r}-tb-name`);
                const rl = document.getElementById(`${r}-tb-role`);
                const av = document.getElementById(`${r}-tb-av`);
                if (n) n.textContent = currentUser.name;
                if (rl) rl.textContent = roleLabels[r] || r;
                if (av) av.textContent = currentUser.name[0].toUpperCase();
            });
            // CRITICAL: Load queue/dailyLog BEFORE showing any page
            await syncLoad();
            await fetchAllPatients();
            if (currentUser.role === 'admin') await fetchAllStaff();
            
            // Determine target page from hash or role
            let hash = window.location.hash.substring(1);
            let targetPage = `page-${currentUser.role}`;
            if (hash && document.getElementById(hash)) targetPage = hash;
            showPage(targetPage);
            
            if (currentUser.role === 'patient') patNav(localStorage.getItem('ucims-pat-nav') || 'visit');
            else if (currentUser.role === 'nurse') nurseNav(localStorage.getItem('ucims-nurse-nav') || 'queue');
            else if (currentUser.role === 'doctor') docNav(localStorage.getItem('ucims-doc-nav') || 'consult');
            else if (currentUser.role === 'admin') adminNav(localStorage.getItem('ucims-admin-nav') || 'accounts');
        } else {
            let hash = window.location.hash.substring(1);
            if (hash === 'page-login' || hash === 'page-signup') showPage(hash);
            else showPage('page-home');
        }
    } catch(e) {
        console.error("Session restore error", e);
        showPage('page-home');
    }
}

// ==========================================
// MODAL HELPERS
// ==========================================
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function toast(msg, type = 'success') {
    document.getElementById('_toast')?.remove();
    const t = document.createElement('div');
    t.id = '_toast';
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transition = 'opacity .3s';
        setTimeout(() => t.remove(), 300);
    }, 3000);
}

// ==========================================
// STATUS BADGE GENERATOR
// ==========================================
function statusBadge(status) {
    const map = {
        'waiting': '<span class="badge b-yellow"><i class="bi bi-hourglass-split"></i> Waiting</span>',
        'triaged': '<span class="badge b-blue"><i class="bi bi-clipboard-check"></i> Triaged</span>',
        'with-doctor': '<span class="badge b-blue"><i class="bi bi-person-badge"></i> With Doctor</span>',
        'examined': '<span class="badge b-green"><i class="bi bi-check2-circle"></i> Examined</span>',
        'done': '<span class="badge b-green"><i class="bi bi-check-circle-fill"></i> Done</span>',
        'cancelled': '<span class="badge b-gray"><i class="bi bi-x-circle"></i> Cancelled</span>'
    };
    return map[status] || `<span class="badge b-gray">${status}</span>`;
}

// ==========================================
// FORM VALUE HELPERS
// ==========================================
function val(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

function setVal(id, v) {
    const el = document.getElementById(id);
    if (el) el.value = v;
}

// ==========================================
// DATE/TIME FUNCTIONS (Asia/Manila)
// ==========================================
function nowTime() {
    return new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Manila',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function todayStr() {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
}

// ==========================================
// DAILY PATIENT LOG (Master List)
// ==========================================
function renderDailyLog(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
        <div class="page-header">
            <h1>Daily Patient Log</h1>
            <p>Comprehensive master list of all completed clinic visits.</p>
        </div>
        <div class="card">
            <div class="search-bar" style="margin-bottom: 16px;">
                <input type="text" id="log-search" class="search-input" placeholder="Search by name, ID, or date..." oninput="filterLogTable()">
                <button class="btn btn-outline" onclick="window.print()"><i class="bi bi-printer"></i> Print Log</button>
            </div>
            <div id="log-table-container"></div>
        </div>
    `;
    filterLogTable();
}

function filterLogTable() {
    const q = (document.getElementById('log-search')?.value || '').toLowerCase();
    let filtered = [...dailyLog];
    if (q) {
        filtered = filtered.filter(l =>
            (l.name && l.name.toLowerCase().includes(q)) ||
            (l.patientId && String(l.patientId).toLowerCase().includes(q)) ||
            (l.date && l.date.includes(q))
        );
    }
    filtered.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + (a.timeIn || '00:00'));
        const dateB = new Date(b.date + ' ' + (b.timeIn || '00:00'));
        return dateB - dateA;
    });
    const container = document.getElementById('log-table-container');
    if (container) container.innerHTML = generateLogTableHTML(filtered);
}

function generateLogTableHTML(list) {
    if (!list.length) return `<div class="empty-state"><p>No log records found.</p></div>`;
    return `
    <div class="table-wrap">
        <table class="log-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>ID</th>
                    <th>Patient Name</th>
                    <th>Age/Sex</th>
                    <th>College/Yr</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Purpose of Visit</th>
                    <th>Attending Nurse</th>
                    <th>Attending Physician</th>
                </tr>
            </thead>
            <tbody id="log-tbody">
                ${list.map(log => {
                    let nName = "Nurse";
                    if (log.triage && log.triage.nurseId) {
                        let n = users.find(u => u.id == log.triage.nurseId);
                        if (n) nName = "Nurse - " + n.name.replace("Nurse - ", "").replace("Nurse ", "");
                    } else if (log.doctor && log.doctor.toLowerCase().includes("nurse")) {
                        nName = "Nurse - " + log.doctor.replace("Nurse - ", "").replace("Nurse ", "");
                    }
                    let dName = "N/A";
                    if (log.exam && log.exam.doctorId) {
                        let d = users.find(u => u.id == log.exam.doctorId);
                        if (d) dName = "Doctor - " + d.name.replace("Doctor - ", "").replace("Dr. ", "");
                    } else if (log.doctor && log.doctor.toLowerCase().includes("doc")) {
                        dName = "Doctor - " + log.doctor.replace("Doctor - ", "").replace("Dr. ", "");
                    }
                    return `
                    <tr>
                        <td class="text-xs fw6" style="white-space: nowrap;">${log.date || '—'}</td>
                        <td class="text-xs">${log.patientId || '—'}</td>
                        <td><div class="fw6">${log.name || '—'}</div></td>
                        <td class="text-xs">${log.age || '—'} / ${log.sex ? log.sex.charAt(0) : '—'}</td>
                        <td class="text-xs">${log.college || '—'} - ${log.year || '—'}</td>
                        <td class="text-xs">${log.timeIn || '—'}</td>
                        <td class="text-xs">${log.timeOut || '—'}</td>
                        <td><span class="badge b-gray">${log.visitLabel || log.purpose || '—'}</span></td>
                        <td><span style="color: var(--maroon); font-weight: 600;">${nName}</span></td>
                        <td><span style="color: var(--blue); font-weight: 600;">${dName}</span></td>
                    </tr>
                `}).join('')}
            </tbody>
        </table>
    </div>`;
}

// ==========================================
// TV BOARD ENGINE
// ==========================================
function initTVQueue() {
    updateTVQueue();
    if (tvInterval) clearInterval(tvInterval);
    tvInterval = setInterval(updateTVQueue, 3000);
    // Start clock
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(updateTVClock, 1000);
    updateTVClock();
}

function updateTVClock() {
    const clockEl = document.getElementById('tv-clock');
    if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Manila',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

async function updateTVQueue() {
    try {
        await syncLoad();
        const today = todayStr();
        const qWaiting = queue.filter(q => q.status === 'waiting' && q.date === today);
        const qNurse = queue.filter(q => (q.status === 'triaged' || q.status === 'examined') && q.date === today);
        const qDoctor = queue.filter(q => q.status === 'with-doctor' && q.date === today);
        let qDone = dailyLog.filter(q => q.status === 'done' && q.date === today);
        qDone.sort((a, b) => {
            const tA = new Date(today + ' ' + (a.timeOut || a.timeIn || '00:00'));
            const tB = new Date(today + ' ' + (b.timeOut || b.timeIn || '00:00'));
            return tB - tA;
        });
        qDone = qDone.slice(0, 5);

        const renderCards = (list, color) => list.map(q => `
            <div style="background: #fdfdfc; border: 1px solid var(--border); border-left: 5px solid ${color}; padding: 10px 14px; border-radius: 10px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <div style="font-size: 1.6rem; font-weight: 700; color: ${color}; min-width: 50px; text-align: center;">#${q.queueNum}</div>
                <div style="flex: 1; overflow: hidden;">
                    <div style="font-size: 1.1rem; font-weight: 700; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${q.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">${q.visitLabel || q.purpose || 'Visit'}</div>
                </div>
            </div>
        `).join('');

        const waitingEl = document.getElementById('tv-col-waiting');
        if (waitingEl) waitingEl.innerHTML = renderCards(qWaiting, 'var(--gold)') || '<div style="text-align: center; color: var(--text-muted); font-size: 1.1rem; margin-top: 20px;">No patients waiting.</div>';
        const nurseEl = document.getElementById('tv-col-nurse');
        if (nurseEl) nurseEl.innerHTML = renderCards(qNurse, 'var(--maroon)') || '<div style="text-align: center; color: var(--text-muted); font-size: 1.1rem; margin-top: 20px;">Nurse station clear.</div>';
        const doctorEl = document.getElementById('tv-col-doctor');
        if (doctorEl) doctorEl.innerHTML = renderCards(qDoctor, 'var(--blue)') || '<div style="text-align: center; color: var(--text-muted); font-size: 1.1rem; margin-top: 20px;">Doctor clinic clear.</div>';

        const renderDoneCards = (list) => list.map(q => `
            <div style="background: #f9fdfa; border: 1px solid #c3e6cb; border-bottom: 4px solid var(--green); padding: 10px 16px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 140px;">
                <div style="font-size: 1.6rem; font-weight: 800; color: var(--green); line-height: 1;">#${q.queueNum}</div>
                <div style="font-size: 0.9rem; font-weight: 700; color: #333; text-align: center; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${q.name}</div>
            </div>
        `).join('');
        const doneEl = document.getElementById('tv-col-done');
        if (doneEl) doneEl.innerHTML = renderDoneCards(qDone) || '<div style="text-align: center; color: var(--text-muted); font-size: 1rem; width: 100%;">No completed visits yet today.</div>';
    } catch (e) {
        console.error("TV Engine Error:", e);
    }
}

// ==========================================
// CLINICAL DECISION SUPPORT: VITAL SIGNS CHECKER
// ==========================================
function getVitalStyle(label, valStr) {
    if (!valStr || valStr === '—' || String(valStr).includes('undefined')) return '';
    let v = parseFloat(valStr);
    let bad = false;
    if (label.includes('BP') || label.includes('Blood Pressure')) {
        let parts = String(valStr).split('/');
        if (parts.length === 2) {
            let sys = parseInt(parts[0]);
            let dia = parseInt(parts[1]);
            if (sys > 130 || sys < 90 || dia > 85 || dia < 60) bad = true;
        }
    }
    if ((label.includes('HR') || label.includes('Heart')) && (v > 100 || v < 60)) bad = true;
    if ((label.includes('Temp')) && (v >= 37.8 || v < 36.0)) bad = true;
    if ((label.includes('RR') || label.includes('Resp')) && (v > 20 || v < 12)) bad = true;
    if ((label.includes('O₂')) && (v < 95)) bad = true;
    return bad ? 'color: #d32f2f; font-weight: 800; background: #ffebee; padding: 2px 6px; border-radius: 4px;' : '';
}