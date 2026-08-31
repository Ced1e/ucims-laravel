/* assets/js/nurse.js — Combined & Optimized Nurse Interface */

function nurseNav(sec) {
    localStorage.setItem('ucims-nurse-nav', sec);
    ['queue', 'records', 'services', 'medcerts', 'daily-records', 'log'].forEach(s => {
        const el = document.getElementById('nn-' + s);
        if (el) el.classList.toggle('active', s === sec);
    });
    const m = document.getElementById('nurse-main');
    if (sec === 'queue') renderNurseQueue(m);
    if (sec === 'records') renderNurseRecords(m);
    if (sec === 'services') renderNurseServices(m);
    if (sec === 'medcerts') renderNurseMedCerts(m);
    if (sec === 'daily-records') renderNurseDailyRecords(m);
    if (sec === 'log') renderDailyLog('nurse-main');
}

function visitBadge(q) {
    const map = {
        checkup: '<span class="badge b-maroon"><i class="bi bi-clipboard2-pulse"></i> Check-up</span>',
        medicine: '<span class="badge b-gold"><i class="bi bi-capsule"></i> Medicine Req.</span>',
        'follow-up': '<span class="badge b-blue"><i class="bi bi-arrow-repeat"></i> Follow-up</span>',
        medcert: '<span class="badge b-green"><i class="bi bi-file-earmark-medical"></i> Med Cert</span>'
    };
    return map[q.purposeType] || `<span class="badge b-gray">${q.purpose}</span>`;
}

function renderNurseQueue(m) {
    // 1. Get all active patients (anyone not finalized)
    let waiting = queue.filter(q => !q.finalized);
    
    // 2. Count "Done Today" by looking at the Daily Log (where the backend moves them)
    const todayDate = typeof todayStr === 'function' ? todayStr() : new Date().toLocaleDateString('en-CA');
    const doneTodayCount = dailyLog.filter(log => log.date === todayDate && log.status === 'done').length;

    waiting.sort((a, b) => {
        const pMap = { 'red': 1, 'yellow': 2, 'green': 3 };
        const pA = a.triage?.priority ? pMap[a.triage.priority] : 4;
        const pB = b.triage?.priority ? pMap[b.triage.priority] : 4;
        if (pA !== pB) return pA - pB;
        return a.queueNum - b.queueNum;
    });

    m.innerHTML = `
        <div class="page-header"><h1>Queue Monitoring</h1><p>Real-time patient queue — ${waiting.length} patient(s) currently active.</p></div>
        <div class="stats-row">
            <div class="stat-card"><div class="stat-num">${waiting.length}</div><div class="stat-label">Active in Queue</div></div>
            <div class="stat-card stat-green"><div class="stat-num">${doneTodayCount}</div><div class="stat-label">Done Today</div></div>
        </div>
        <div class="card-title" style="margin-bottom:10px;">Queue List</div>
        ${!waiting.length ? `<div class="empty-state"><div class="ei"><i class="bi bi-check2-circle text-muted" style="opacity: 0.5;"></i></div><p>Queue is clear. All patients attended to.</p></div>` : ''}
        ${waiting.map(q => {
            const pc = q.triage?.priority === 'red' ? 'border-left:4px solid #C0392B;background:#fdf0ef' : (q.triage?.priority === 'yellow' ? 'border-left:4px solid var(--gold);background:#fefaed' : '');
            return `<div class="queue-item" style="${pc}">
                <div class="queue-num">#${q.queueNum}</div>
                <div class="queue-info">
                    <div class="queue-name">${q.name}</div>
                    <div class="flex gap6 mt4" style="flex-wrap:wrap;">
                        ${visitBadge(q)}
                        ${statusBadge(q.status)}
                    </div>
                    <div class="queue-detail mt4">Arrived: ${q.time}${q.triage?.complaint ? ' · "' + q.triage.complaint + '"' : ''}</div>
                </div>
                <div class="queue-actions">
                    ${!q.triaged ? `<button class="btn ${q.purposeType === 'medcert' ? 'btn-outline' : 'btn-primary'} btn-sm" onclick="openTriageModal(${q.queueNum})"><i class="bi bi-heart-pulse"></i> ${q.purposeType === 'medcert' ? 'Optional Triage' : 'Triage'}</button>` : ''}
                    ${q.triaged ? `<button class="btn btn-outline btn-sm" onclick="viewTriageModal(${q.queueNum})"><i class="bi bi-eye"></i> View Triage</button>` : ''}
                    
                    ${q.triaged && !q.endorsed ? `<button class="btn btn-outline btn-sm" onclick="endorsePatient(${q.queueNum})"><i class="bi bi-arrow-right-circle"></i> Endorse</button>` : ''}
                    ${q.endorsed && q.status !== 'examined' ? `<button class="btn btn-outline btn-sm" style="color:var(--blue);" onclick="undoEndorse(${q.queueNum})"><i class="bi bi-arrow-counterclockwise"></i> Undo Endorse</button>` : ''}
                    
                    ${(!q.endorsed && (q.triaged || q.purposeType === 'medcert')) ? `<button class="btn btn-primary btn-sm" onclick="nurseCompleteVisit(${q.queueNum})"><i class="bi bi-check-circle"></i> Complete Visit</button>` : ''}
                    ${q.status === 'examined' ? `<button class="btn btn-success btn-sm" onclick="nurseCompleteVisit(${q.queueNum})"><i class="bi bi-check-circle"></i> Complete Checkout</button>` : ''}
                    
                    <button class="btn btn-outline btn-sm" onclick="openViewModal(${q.queueNum})"><i class="bi bi-file-medical"></i> Record</button>
                    <button class="btn btn-outline btn-sm" style="color:var(--text-muted);" onclick="cancelFromQueue(${q.queueNum})" title="Cancel & remove from queue"><i class="bi bi-x-circle"></i> Cancel</button>
                </div>
            </div>`;
        }).join('')}
    `;
}

function endorsePatient(qnum) {
    const e = queue.find(q => q.queueNum == qnum);
    if (!e) { toast('Queue entry not found.', 'error'); return; }
    if (!e.triaged) { toast('Please complete triage before endorsing.', 'error'); return; }
    e.endorsed = true;
    e.status = 'with-doctor';
    saveData();
    toast(`${e.name} endorsed to the doctor.`);
    nurseNav('queue');
}

function undoEndorse(qnum) {
    const e = queue.find(q => q.queueNum == qnum);
    if (!e) return;
    if (!confirm(`Undo endorsement for ${e.name}?`)) return;
    e.endorsed = false;
    e.status = 'triaged';
    saveData();
    toast(`Endorsement undone for ${e.name}.`, 'info');
    nurseNav('queue');
}

function cancelFromQueue(qnum) {
    const e = queue.find(q => q.queueNum == qnum);
    if (!e) return;
    if (!confirm(`Cancel ${e.name} from the queue?`)) return;
    
    e.status = 'cancelled';
    e.finalized = true;
    
    // FIX: Push a copy of 'e'. It already contains the correct original date from the database.
    dailyLog.push({...e});

    const qIndex = queue.findIndex(q => q.queueNum == qnum);
    if (qIndex > -1) queue.splice(qIndex, 1);

    saveData();
    toast(`${e.name} cancelled and removed from active queue.`, 'info');
    nurseNav('queue');
}

function viewTriageModal(qnum) {
    const e = queue.find(q => q.queueNum == qnum);
    if (!e) return;
    const t = e.triage || {};
    document.getElementById('view-modal-content').innerHTML = `
        <div class="profile-head" style="margin-bottom:16px;">
            <div class="profile-avatar">${e.name[0]}</div>
            <div><div class="profile-name">${e.name}</div>
            <div class="profile-meta">#${e.queueNum} · ${e.purpose} · Arrived ${e.time}</div></div>
        </div>
        <div class="card-title" style="font-size:.9rem;">Triage Assessment</div>
        ${t.bp ? `
            <div class="grid3 mb8">
                ${[['BP', t.bp], ['HR', t.hr ? t.hr + ' bpm' : ''], ['Temp', t.temp ? t.temp + '°C' : ''], ['RR', t.rr ? t.rr + ' br/min' : ''], ['O₂', t.o2 ? t.o2 + '%' : ''], ['Wt/Ht', (t.weight || '—') + 'kg / ' + (t.height || '—') + 'cm']].map(([l, v]) => `
                    <div style="background:#f9f8f6;padding:10px 12px;border-radius:7px;">
                        <div class="text-xs text-muted">${l}</div>
                        <div class="fw6 text-sm mt4"><span style="${getVitalStyle(l, v)}">${v || '—'}</span></div>
                    </div>
                `).join('')}
            </div>
            <div class="info-grid">
                <div class="info-item"><div class="info-lbl">Chief Complaint</div><div class="info-val">${t.complaint || '—'}</div></div>
                <div class="info-item"><div class="info-lbl">Initial Assessment</div><div class="info-val">${t.notes || '—'}</div></div>
            </div>
        ` : `<p class="text-muted text-sm">No triage recorded yet.</p>`}
        <div class="modal-footer" style="margin-top:20px; border-top:1px solid var(--border); padding-top:16px;">
            <button class="btn btn-outline" onclick="closeModal('modal-view')">Close</button>
            <button class="btn btn-primary" onclick="closeModal('modal-view'); setTimeout(()=>openTriageModal(${qnum}), 200)"><i class="bi bi-pencil"></i> Edit Triage Details</button>
        </div>
    `;
    openModal('modal-view');
}

// ==========================================
// MEDICAL CERTIFICATE ISSUANCE WORKFLOW (NURSE: VIEW ONLY)
// ==========================================
function renderNurseMedCerts(m) {
    // RESTRICTION 2: Only pull from dailyLog. 
    // This guarantees they ONLY appear after the Nurse clicks "Complete Visit" in the Queue.
    let certs = dailyLog.filter(l => l.purposeType === 'medcert' && !l.medcertReleased).map(l => ({...l, isLog: true}));
    certs.sort((a, b) => (a.queueNum || 0) - (b.queueNum || 0));

    m.innerHTML = `
        <div class="page-header">
            <h1>Medical Certificate Requests</h1>
            <p>View requested certificates. (Release access is restricted to Physicians)</p>
        </div>
        <div class="stats-row">
            <div class="stat-card stat-blue"><div class="stat-num">${certs.length}</div><div class="stat-label">Pending Doctor Release</div></div>
        </div>
        ${!certs.length ? `<div class="empty-state"><div class="ei"><i class="bi bi-file-earmark-check text-muted" style="opacity: 0.5;"></i></div><p>No pending certificate requests ready for review.</p></div>` :
        `<div class="card"><div class="table-wrap"><table><thead><tr><th>Queue #</th><th>Patient</th><th>Request Details</th><th>Status</th><th>Actions</th></tr></thead><tbody>${certs.map(q => {
            const md = q.medcertData || {};
            return `<tr>
                <td><span class="num-badge b-blue">${q.queueNum}</span></td>
                <td><div class="fw6">${q.name}</div><div class="text-xs text-muted">${q.patientId}</div></td>
                <td><div class="fw6 text-sm" style="color:var(--maroon);">${md.reason || 'Medical Certificate'}</div><div class="text-xs text-muted">Req. Date: ${q.date || 'N/A'}</div></td>
                <td><span class="badge b-blue">Awaiting Physician</span></td>
                
                <td><button class="btn btn-outline btn-sm" onclick="viewMedCertOnly(${q.queueNum})"><i class="bi bi-eye"></i> View Request</button></td>
            </tr>`;
        }).join('')}</tbody></table></div></div>`}
    `;
}

function viewMedCertOnly(qnum) {
    const e = dailyLog.find(l => l.queueNum == qnum);
    if (!e) return;
    
    const u = users.find(x => x.id === e.patientId) || {};
    const perm = u.permanent || {};
    const md = e.medcertData || {};
    const diag = e.diagnosis && e.diagnosis !== 'Completed at Nurse Station' ? e.diagnosis : (e.complaint || '');
    const courseStr = perm.dept ? `${perm.dept} - ${perm.yearLevel || perm.yearsec || ''}` : (e.college || 'USeP');

    let html = `
        <div class="card-title" style="margin-bottom: 16px;"><i class="bi bi-file-medical"></i> Medical Certificate Request</div>
        
        <div class="alert alert-warning text-sm mb16">
            <i class="bi bi-shield-lock"></i> <b>Role Restriction:</b> Only the attending physician can finalize, sign, and release this document.
        </div>

        <div style="background:#f9f8f6; border:1px solid var(--border); border-radius:8px; padding:24px; font-family:serif; line-height: 2.2; font-size: 1.05rem; opacity: 0.85;">
            <div style="font-weight:bold; margin-bottom:10px;">TO WHOM IT MAY CONCERN:</div>
            <div style="text-indent: 30px;">
                This is to certify that <b><u>&nbsp;&nbsp;${e.name}&nbsp;&nbsp;</u></b>
                of <b><u>&nbsp;&nbsp;${courseStr}&nbsp;&nbsp;</u></b>
                has been examined by the undersigned at this office on <b><u>&nbsp;&nbsp;${md.examDate || e.date || ''}&nbsp;&nbsp;</u></b>
                and found him/her to be with <b><u>&nbsp;&nbsp;${md.findings || diag}&nbsp;&nbsp;</u></b>.
            </div>
            <div style="text-indent: 30px; margin-top: 10px;">
                This certification is issued upon his/her request for the purpose of:
                <b><u>&nbsp;&nbsp;${md.purpose || md.reason || ''}&nbsp;&nbsp;</u></b>.
            </div>
        </div>

        <div class="modal-footer" style="margin-top:20px; border-top:1px solid var(--border); padding-top:16px; display:flex; justify-content:flex-end;">
            <button class="btn btn-outline" onclick="closeModal('modal-view')">Close Window</button>
        </div>
    `;
    document.getElementById('view-modal-content').innerHTML = html;
    openModal('modal-view');
}




function releaseMedCert(qnum) {
    const e = queue.find(q => q.queueNum == qnum);
    if (!e) return;
    if (!confirm(`Confirm preparation of Medical Request Form for ${e.name}?`)) return;
    let certSvc = e.services.find(s => s.type === 'certificate');
    if (certSvc) certSvc.nurseId = currentUser.id;
    e.servicesDone = true;
    saveData();
    toast(`Medical Request Form prepared for ${e.name}. Please complete their visit in the Queue.`, 'success');
    nurseNav('queue');
}

function renderNurseServices(m) {
    const eligible = queue.filter(q => q.triaged && !q.servicesDone && !q.finalized && q.purposeType !== 'medcert');
    m.innerHTML = `
        <div class="page-header"><h1>Services</h1><p>Issue medicines and treatments.</p></div>
        ${!eligible.length ? `<div class="empty-state"><div class="ei"><i class="bi bi-capsule text-muted" style="opacity: 0.5;"></i></div><p>No active patients require services.</p></div>` :
        `<div class="card"><div class="table-wrap"><table><thead><tr><th>#</th><th>Patient</th><th>Type</th><th>Services Issued</th><th>Action</th></tr></thead><tbody>${eligible.map(q => `
            <tr>
                <td><span class="num-badge">${q.queueNum}</span></td>
                <td><div class="fw6">${q.name}</div></td>
                <td>${visitBadge(q)}</td>
                <td>${(q.services && q.services.length > 0) ? `<span class="badge b-green">${q.services.length} items issued</span>` : `<span class="badge b-gray">None</span>`}</td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button class="btn btn-primary btn-sm" onclick="openServicesModal(${q.queueNum})"><i class="bi bi-capsule"></i> Manage</button>
                        ${q.exam && q.exam.rx && q.exam.rx.length > 0 ? `<button class="btn btn-outline btn-sm" style="color:var(--maroon); border-color:var(--maroon);" onclick="viewPrescription(${q.queueNum})"><i class="bi bi-prescription2"></i> View Rx</button>` : ''}
                        <button class="btn btn-success btn-sm" onclick="finishServices(${q.queueNum})" title="Remove from list"><i class="bi bi-check-circle"></i> Mark Done</button>
                    </div>
                </td>
            </tr>
        `).join('')}</tbody></table></div></div>`}
    `;
}

function viewPrescription(qnum) {
    const e = queue.find(q => q.queueNum == qnum);
    if (!e) return;
    const rxList = e.exam?.rx || [];
    let html = `<div class="card-title" style="margin-bottom:12px;"><i class="bi bi-prescription2"></i> Doctor's Prescription for ${e.name}</div>
        <div class="table-wrap"><table><thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Route</th></tr></thead><tbody>
        ${rxList.map(rx => `<tr><td><b>${rx.drug}</b></td><td>${rx.dose}</td><td>${rx.freq}</td><td>${rx.duration}</td><td>${rx.route}</td></tr>`).join('')}
        </tbody></table></div>`;
    if (e.exam?.instructions) {
        html += `<div class="mt16 p12" style="background:#fdf5f5; border-radius:8px; padding: 12px;"><span class="fw6" style="color:var(--maroon);">Doctor's Instructions:</span><p class="text-sm mt4">${e.exam.instructions}</p></div>`;
    }
    html += `<div class="modal-footer" style="margin-top:20px; border-top:1px solid var(--border); padding-top:16px; display:flex; justify-content:flex-end;"><button class="btn btn-outline" onclick="closeModal('modal-view')">Close</button></div>`;
    document.getElementById('view-modal-content').innerHTML = html;
    openModal('modal-view');
}

function finishServices(qnum) {
    const e = queue.find(q => q.queueNum == qnum);
    if (!e) return;
    e.servicesDone = true;
    saveData();
    toast(`Services completed and removed from list for ${e.name}.`);
    nurseNav('services');
}

// ==========================================
// RECORD MANAGEMENT (Database-Direct Fetching)
// ==========================================
const COLLEGES = ['CIC', 'CT', 'COE', 'CAS', 'CAEC', 'CBA', 'CED'];
const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
let dbPatients = []; 

function renderNurseRecords(m) {
    m.innerHTML = `
        <div class="page-header"><h1>Record Management</h1><p>Search, filter, and manage permanent patient records.</p></div>
        <div class="tabs" id="rec-tabs">
            <button class="tab active" onclick="recTab('search',this)"><i class="bi bi-search"></i> Search & Filter</button>
            <button class="tab" onclick="recTab('deletion',this)"><i class="bi bi-trash"></i> Record Deletion</button>
        </div>
        <div id="rec-panel"></div>
    `;
    recTab('search', document.querySelector('#rec-tabs .tab'));
}

async function recTab(t, el) {
    document.querySelectorAll('#rec-tabs .tab').forEach(x => x.classList.remove('active'));
    if (el) el.classList.add('active');
    const p = document.getElementById('rec-panel');
    if (!p) return;

    if (t === 'search') {
        p.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted);">Fetching live records from database...</div>`;
        try {
            let res = await fetch('backend/api_records.php?action=get_all');
            let data = await res.json();
            if (data.status === 'success') {
                dbPatients = data.patients || [];
                dbPatients.forEach(dbp => {
                    let existing = users.find(u => String(u.id) === String(dbp.id) || String(u.patientId) === String(dbp.patientId));
                    if (existing) {
                        existing.permanent = dbp.permanent;
                        existing.demographics = dbp.demographics;
                        existing.name = dbp.name;
                    } else {
                        users.push(dbp);
                    }
                });
            }
        } catch (e) { console.error("DB Fetch Error", e); }
        p.innerHTML = `
            <div class="card">
                <div class="card-title">Search & Filter Patient Records</div>
                <div class="search-bar">
                    <input class="search-input" id="rec-q" placeholder="Search by name or ID..." oninput="filterRecs()">
                    <select class="filter-sel" id="rec-college" onchange="filterRecs()">
                        <option value="">All Colleges</option>
                        ${COLLEGES.map(c => `<option>${c}</option>`).join('')}
                    </select>
                    <select class="filter-sel" id="rec-year" onchange="filterRecs()">
                        <option value="">All Year Levels</option>
                        ${YEAR_LEVELS.map(y => `<option>${y}</option>`).join('')}
                    </select>
                    <select class="filter-sel" id="rec-ptype" onchange="filterRecs()">
                        <option value="">All Types</option>
                        <option>Student</option><option>Faculty</option>
                    </select>
                </div>
                <div id="rec-table"></div>
            </div>
        `;
        filterRecs();
    } else {
        p.innerHTML = `
            <div class="card">
                <div class="card-title">Record Deletion</div>
                <div class="alert alert-danger text-sm mb8"><i class="bi bi-exclamation-triangle"></i> Irreversible. Requires authorization.</div>
                <div class="field"><label>Select Patient</label>
                    <select id="del-pid"><option value="" disabled selected hidden>— Select patient —</option>
                        ${dbPatients.map(u => `<option value="${u.id}">${u.name} (${u.patientId})</option>`).join('')}
                    </select>
                </div>
                <div class="field"><label>Reason</label><textarea></textarea></div>
                <div class="field"><label>Authorization Code</label><input type="password"></div>
                <button class="btn btn-danger" onclick="toast('Deletion request submitted.','info')">Submit Deletion Request</button>
            </div>
        `;
    }
}

function filterRecs() {
    const q = val('rec-q')?.toLowerCase() || '';
    const col = val('rec-college') || '';
    const yr = val('rec-year') || '';
    const pt = val('rec-ptype') || '';
    let list = [...dbPatients];
    if (q) list = list.filter(u => u.name.toLowerCase().includes(q) || String(u.patientId).toLowerCase().includes(q));
    if (col) list = list.filter(u => u.permanent?.dept === col);
    if (yr) list = list.filter(u => u.permanent?.yearLevel === yr || u.permanent?.yearsec === yr);
    if (pt) list = list.filter(u => u.permanent?.pattype === pt);
    list.reverse();
    if (!q && !col && !yr && !pt) list = list.slice(0, 20);
    const el = document.getElementById('rec-table');
    if (el) el.innerHTML = renderRecTable(list);
}

function renderRecTable(list) {
    if (!list.length) return `<div class="empty-state"><p>No records found.</p></div>`;
    return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>College</th><th>Yr</th><th>Actions</th></tr></thead><tbody>${list.map(u => `
        <tr>
            <td class="text-xs">${u.patientId || u.id}</td>
            <td><div class="fw6">${u.name}</div></td>
            <td class="text-xs">${u.permanent?.dept || '—'}</td>
            <td>${u.permanent?.yearLevel || u.permanent?.yearsec || '—'}</td>
            <td>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-outline btn-sm" onclick="openPatRecord('${u.id}', true)"><i class="bi bi-file-medical"></i> View & Edit</button>
                    <button class="btn btn-primary btn-sm" style="background-color: var(--blue);" onclick="openPatientHistory('${u.id}')"><i class="bi bi-clock-history"></i> Visit History</button>
                </div>
            </td>
        </tr>
    `).join('')}</tbody></table></div>`;
}

function openPatientHistory(uid) {
    const u = dbPatients.find(x => String(x.id) === String(uid) || String(x.patientId) === String(uid))
        || users.find(x => String(x.id) === String(uid) || String(x.patientId) === String(uid));
    
    if (!u) { toast('Patient profile not found.', 'error'); return; }

    // Bulletproof Match: ID, PatientId, or Exact Name
    let history = dailyLog.filter(l => {
        const matchById = String(l.patientId) === String(uid); // Internal Serial ID
        const matchByUniv = String(l.univId) === String(u.patientId); // University ID
        const matchByName = (l.name.toLowerCase().trim() === u.name.toLowerCase().trim()); // Full Name
        return matchById || matchByUniv || matchByName;
    });

    history.sort((a, b) => getSortTime(b) - getSortTime(a));

    let html = `
        <div class="profile-head" style="margin-bottom:16px; background: linear-gradient(135deg, var(--blue), #2c5282);">
            <div class="profile-avatar">${(u.name || 'P')[0]}</div>
            <div><div class="profile-name">${u.name}</div><div class="profile-meta">ID: ${u.patientId || uid} · Clinic Visit History</div></div>
        </div>
        <div class="card-title" style="font-size: 1rem;"><i class="bi bi-journal-medical"></i> Consultation & Service History</div>
    `;

    if (!history.length) {
        html += `<div class="empty-state" style="padding: 30px;"><div class="ei"><i class="bi bi-calendar-x text-muted" style="opacity: 0.5;"></i></div><p>No past visits recorded for this patient.</p></div>`;
    } else {
        html += `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Time (In-Out)</th><th>Purpose</th><th>Physician/Nurse</th><th>Findings / Services</th></tr></thead><tbody>${history.map(log => `
            <tr>
                <td class="text-xs fw6" style="white-space: nowrap;">${log.date}</td>
                <td class="text-xs" style="white-space: nowrap;">${log.timeIn} - ${log.timeOut || 'N/A'}</td>
                <td>${visitBadge(log)}</td>
                <td>
                    ${log.attendingPhysician !== 'N/A' ? `<div class="fw6" style="color:var(--blue);">${log.attendingPhysician}</div>` : ''}
                    <div class="fw6" style="color:var(--maroon);">${log.attendingNurse || 'Nurse'}</div>
                </td>
                <td style="max-width: 250px;">
                    <div class="fw6 text-sm" style="color:var(--maroon);">${log.diagnosis && log.diagnosis !== 'Completed at Nurse Station' && log.diagnosis !== 'N/A' ? log.diagnosis : (log.complaint || '—')}</div>
                    <div class="text-xs text-muted" style="margin-top: 4px;">${log.treatment || 'No treatments recorded'}</div>
                </td>
            </tr>
        `).join('')}</tbody></table></div>`;
    }
    html += `<div class="modal-footer" style="margin-top:20px; border-top:1px solid var(--border); padding-top:16px; display:flex; justify-content:flex-end;"><button class="btn btn-outline" onclick="closeModal('modal-view')">Close</button></div>`;
    document.getElementById('view-modal-content').innerHTML = html;
    openModal('modal-view');
}

// ==========================================
// DAILY PATIENT RECORDS (History Archive)
// ==========================================
function renderNurseDailyRecords(m) {
    m.innerHTML = `
        <style>
            @media print {
                .sidebar, .home-topbar, .search-bar, .page-header p { display: none !important; }
                .page-header h1 { font-size: 20pt !important; margin-bottom: 10px; color: var(--maroon); }
                .card { box-shadow: none !important; border: none !important; padding: 0 !important; background: transparent !important; }
                .table-wrap { overflow: visible !important; }
                table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse; }
                th, td { white-space: normal !important; word-wrap: break-word !important; font-size: 9pt !important; padding: 8px 6px !important; }
                th:nth-child(1) { width: 10%; } th:nth-child(2) { width: 8%; } th:nth-child(3) { width: 14%; } 
                th:nth-child(4) { width: 8%; } th:nth-child(5) { width: 12%; } th:nth-child(6) { width: 16%; } 
                th:nth-child(7) { width: 16%; } th:nth-child(8) { width: 16%; }
                .hide-print { display: none !important; }
            }
        </style>
        <div class="page-header">
            <h1>Daily Patient Records</h1>
            <p>Searchable archive of complete clinical visits and medical data.</p>
        </div>
        <div class="card">
            <div class="search-bar" style="margin-bottom: 16px; display: flex; gap: 12px;">
                <input type="text" id="dpr-search" class="search-input hide-print" style="flex: 1;" placeholder="Search by patient name, ID, or Date (YYYY-MM-DD)..." oninput="filterDPR()">
                <button class="btn btn-outline hide-print" onclick="window.print()"><i class="bi bi-printer"></i> Print Records</button>
            </div>
            <div id="dpr-table"></div>
        </div>
    `;
    filterDPR();
}

function filterDPR() {
    const q = (document.getElementById('dpr-search')?.value || '').toLowerCase();
    let filtered = [...dailyLog];
    if (q) {
        filtered = filtered.filter(l =>
            (l.name && l.name.toLowerCase().includes(q)) ||
            (l.patientId && String(l.patientId).toLowerCase().includes(q)) ||
            (l.date && l.date.includes(q))
        );
    }
    filtered.sort((a, b) => getSortTime(b) - getSortTime(a));

    let html = `<div class="table-wrap"><table><thead><tr><th>Date</th><th>ID</th><th>Patient Name</th><th>Age/Sex</th><th>Course/Yr</th><th>Notes / Complaints</th><th>Physician Diagnosis</th><th>Treatment</th><th class="hide-print">Actions</th></tr></thead><tbody>`;
    if (filtered.length === 0) {
        html += `<tr><td colspan="9" style="text-align:center; padding: 40px; color: var(--text-muted);">No records found.</td></tr>`;
    } else {
        html += filtered.map(log => {
            const idx = dailyLog.indexOf(log);
            return `<tr>
                <td class="text-xs fw6" style="white-space: nowrap;">${log.date || '—'}</td>
                <td class="text-xs">${log.patientId || '—'}</td>
                <td><div class="fw6">${log.name || '—'}</div></td>
                <td class="text-xs">${log.age || '—'} / ${log.sex ? log.sex.charAt(0) : '—'}</td>
                <td class="text-xs">${log.college || '—'} - ${log.year || '—'}</td>
                <td class="text-xs" style="max-width: 200px; white-space: normal;">
                    <div style="margin-bottom:4px;"><b>Complaint:</b> ${log.complaint || 'N/A'}</div>
                    <div><b>Notes:</b> ${log.nurseNotes || 'N/A'}</div>
                </td>
                <td class="text-xs" style="max-width: 180px; white-space: normal; color: var(--blue); font-weight: 600;">${log.diagnosis || 'N/A'}</td>
                <td class="text-xs" style="max-width: 180px; white-space: normal; color: var(--green); font-weight: 600;">${log.treatment || 'N/A'}</td>
                <td class="hide-print"><button class="btn btn-outline btn-sm" onclick="openFullVisitDetails(${idx})"><i class="bi bi-file-text"></i> View</button></td>
            </tr>`;
        }).join('');
    }
    html += `</tbody></table></div>`;
    const container = document.getElementById('dpr-table');
    if (container) container.innerHTML = html;
}

// ==========================================
// FULL VISIT DETAILS MODAL (2-Tab Layout)
// ==========================================
function switchVisitTab(tab) {
    document.querySelectorAll('#visit-view-tabs .tab').forEach(el => el.classList.remove('active'));
    document.querySelector(`#visit-view-tabs .tab[onclick="switchVisitTab('${tab}')"]`).classList.add('active');
    document.querySelectorAll('.visit-tab-panel').forEach(el => el.style.display = 'none');
    document.getElementById('visit-tab-' + tab).style.display = 'block';
}

function openFullVisitDetails(idx) {
    const log = dailyLog[idx];
    if (!log) return;
    const t = log.triage || {};
    const ex = log.exam || {};
    const svcs = log.services || [];
    const md = log.medcertData || {};
    const rx = log.rx || ex.rx || [];
    const labs = log.labs || ex.labs || [];

    let html = `
        <div class="profile-head" style="margin-bottom:16px;">
            <div class="profile-avatar">${(log.name || 'P')[0]}</div>
            <div><div class="profile-name">${log.name}</div><div class="profile-meta">${log.date} · In: ${log.timeIn} - Out: ${log.timeOut || 'N/A'} · Attending: ${log.attendingPhysician !== 'N/A' ? log.attendingPhysician : log.attendingNurse}</div></div>
        </div>
        <div class="tabs" id="visit-view-tabs" style="margin-bottom:16px;">
            <button class="tab active" onclick="switchVisitTab('consult')">1. Consultation Details</button>
            <button class="tab" onclick="switchVisitTab('services')">2. Services & Treatments</button>
        </div>
        <div id="visit-tab-consult" class="visit-tab-panel" style="display:block; max-height: 55vh; overflow-y: auto; padding-right: 8px;">
            <div class="card-title" style="font-size: 1rem;"><i class="bi bi-info-circle"></i> Visit Overview</div>
            <div class="field mb12"><div class="text-xs text-muted">Purpose of Visit</div><div class="fw6" style="color:var(--maroon);">${log.visitLabel || log.purpose || '—'}</div></div>
            <div class="card-title mt16" style="font-size: 1rem;"><i class="bi bi-clipboard2-pulse"></i> Nurse Triage Assessment</div>
            <div class="grid3 mb12" style="gap:10px;">
                <div class="field mb0"><div class="text-xs text-muted">BP</div><div class="fw6">${t.bp || '—'}</div></div>
                <div class="field mb0"><div class="text-xs text-muted">HR</div><div class="fw6">${t.hr ? t.hr + ' bpm' : '—'}</div></div>
                <div class="field mb0"><div class="text-xs text-muted">Temp</div><div class="fw6">${t.temp ? t.temp + '°C' : '—'}</div></div>
                <div class="field mb0"><div class="text-xs text-muted">RR</div><div class="fw6">${t.rr ? t.rr + ' br/min' : '—'}</div></div>
                <div class="field mb0"><div class="text-xs text-muted">O2</div><div class="fw6">${t.o2 ? t.o2 + '%' : '—'}</div></div>
                <div class="field mb0"><div class="text-xs text-muted">Wt/Ht</div><div class="fw6">${t.weight ? t.weight + 'kg' : '—'} / ${t.height ? t.height + 'cm' : '—'}</div></div>
            </div>
            <div class="field mb12"><div class="text-xs text-muted">Chief Complaint</div><div class="text-sm ppr-input" style="background:#f9f8f6;">${t.complaint || '—'}</div></div>
            <div class="field mb12"><div class="text-xs text-muted">Nurse Notes</div><div class="text-sm ppr-input" style="background:#f9f8f6;">${t.notes || '—'}</div></div>
            <div class="card-title mt16" style="font-size: 1rem;"><i class="bi bi-heart-pulse"></i> Doctor's Examination</div>
            <div class="grid2 mb12" style="gap:10px;">
                ${['General', 'HEENT', 'Chest', 'Cardio', 'Abdomen', 'Extremities', 'Neuro'].map(sys =>
                    `<div class="field mb0"><div class="text-xs text-muted">${sys}</div><div class="text-sm">${ex[sys.toLowerCase()] || '—'}</div></div>`
                ).join('')}
            </div>
            <div class="field mb12"><div class="text-xs text-muted">Diagnosis</div><div class="text-sm ppr-input fw6" style="background:#fdf5f5; color:var(--maroon);">${ex.diagnosis || '—'} ${ex.icd ? `(ICD: ${ex.icd})` : ''}</div></div>
            <div class="field mb12"><div class="text-xs text-muted">Physician Notes & Instructions</div><div class="text-sm ppr-input" style="background:#f9f8f6;">${ex.finalNotes || ex.instructions || '—'}</div></div>
        </div>
        <div id="visit-tab-services" class="visit-tab-panel" style="display:none; max-height: 55vh; overflow-y: auto; padding-right: 8px;">
            <div class="card-title" style="font-size: 1rem;"><i class="bi bi-file-earmark-medical"></i> Medical Certificate</div>
            ${md.reason ? `<div class="grid2 mb12" style="gap:10px;">
                <div class="field mb0"><div class="text-xs text-muted">Reason</div><div class="fw6 text-sm">${md.reason}</div></div>
                <div class="field mb0"><div class="text-xs text-muted">Status</div><div class="fw6 text-sm text-green">Issued / Released</div></div>
                <div class="field mb0"><div class="text-xs text-muted">From Date</div><div class="text-sm">${md.dateFrom || '—'}</div></div>
                <div class="field mb0"><div class="text-xs text-muted">To Date</div><div class="text-sm">${md.dateTo || '—'}</div></div>
            </div>` : `<p class="text-sm text-muted mb12">No medical certificate requested durante this visit.</p>`}
            <div class="card-title mt16" style="font-size: 1rem;"><i class="bi bi-capsule"></i> Clinic Services & Meds Issued</div>
            ${svcs.length ? `<ul style="margin:0; padding-left:20px; font-size:0.9rem;">${svcs.map(s => `<li style="margin-bottom:6px;"><b>${s.name}</b> ${s.qty ? `(Qty: ${s.qty})` : ''} — <i>${s.type}</i></li>`).join('')}</ul>` : `<p class="text-sm text-muted">No on-site clinic services or medicines issued.</p>`}
            <div class="card-title mt16" style="font-size: 1rem;"><i class="bi bi-prescription2"></i> Doctor's Prescription (Rx)</div>
            ${rx.length ? `<div class="table-wrap mb12"><table><thead><tr><th>Medicine</th><th>Dose</th><th>Freq</th><th>Duration</th><th>Route</th></tr></thead><tbody>${rx.map(r => `<tr><td class="fw6">${r.drug}</td><td>${r.dose}</td><td>${r.freq}</td><td>${r.duration}</td><td>${r.route}</td></tr>`).join('')}</tbody></table></div>` : `<p class="text-sm text-muted">No external prescriptions issued.</p>`}
            <div class="card-title mt16" style="font-size: 1rem;"><i class="bi bi-droplet"></i> Lab Requests</div>
            ${labs.length ? `<ul style="margin:0; padding-left:20px; font-size:0.9rem;">${labs.map(l => `<li style="margin-bottom:6px;">${l}</li>`).join('')}</ul>` : `<p class="text-sm text-muted">No lab tests requested.</p>`}
        </div>
        <div class="modal-footer" style="margin-top:20px; border-top:1px solid var(--border); padding-top:16px; display:flex; justify-content:flex-end;"><button class="btn btn-outline" onclick="closeModal('modal-view')">Close</button></div>
    `;
    document.getElementById('view-modal-content').innerHTML = html;
    openModal('modal-view');
}

// ==========================================
// FINAL CHECKOUT (Snapshot Creation)
// ==========================================
function nurseCompleteVisit(qnum) {
    const e = queue.find(q => q.queueNum == qnum);
    if (!e) return;
    if (!confirm(`Mark visit as complete for ${e.name}?`)) return;

    e.timeOut = nowTime();
    e.finalized = true;
    e.status = 'done'; 

    const u = users.find(x => x.id === e.patientId) || {};
    const demo = u.demographics || {};
    const perm = u.permanent || {};

    const issuedMeds = (e.services || []).filter(s => s.type === 'medicine').map(s => s.name + ' ' + s.qty).join(', ');
    const certIssued = (e.services || []).some(s => s.type === 'certificate') ? 'Medical Certificate Prepared' : '';
    
    let treatmentArr = [];
    if (issuedMeds) treatmentArr.push(`Issued: ${issuedMeds}`);
    if (certIssued) treatmentArr.push(certIssued);
    let treatmentData = treatmentArr.length > 0 ? treatmentArr.join(' | ') : 'No services issued';

    const docName = e.exam?.doctorId ? (users.find(x => x.id === e.exam.doctorId)?.name || 'N/A') : 'N/A';
    const nurseName = currentUser?.name || 'Nurse';

    // Send to historical log
    dailyLog.push({
        queueNum: e.queueNum,
        patientId: e.patientId,
        univId: u.patientId || u.univ_id || u.id, 
        name: e.name,
        sex: demo.sex || 'N/A',
        age: demo.age || 'N/A',
        college: perm.dept || perm.pattype || 'N/A',
        year: perm.yearsec || perm.yearLevel || 'N/A',
        purpose: e.purpose,
        purposeType: e.purposeType,
        visitLabel: e.visitLabel || e.purpose,
        status: e.status, 
        timeIn: e.time,
        timeOut: e.timeOut,
        date: e.date || (typeof todayStr === 'function' ? todayStr() : new Date().toLocaleDateString('en-CA')), // FIX: Preserve original arrival date
        complaint: e.triage?.complaint || (e.purposeType === 'medcert' ? 'Medical Certificate Request' : 'None'),
        nurseNotes: e.triage?.notes || (e.purposeType === 'medcert' ? 'Processed and Prepared' : 'None'),
        diagnosis: e.exam?.diagnosis || 'Completed at Nurse Station',
        treatment: treatmentData,
        attendingNurse: nurseName,
        attendingPhysician: docName !== 'N/A' ? "Dr. " + docName : 'N/A',
        triage: e.triage || {},
        exam: e.exam || {},
        services: e.services || [],
        medcertData: e.medcertData || {},
        labs: e.exam?.labs || [],
        rx: e.exam?.rx || []
    });

    const qIndex = queue.findIndex(q => q.queueNum == qnum);
    if (qIndex > -1) queue.splice(qIndex, 1);

    saveData();
    toast(`Visit completed for ${e.name}. Data archived to Daily Patient Records.`);
    nurseNav('queue');
}

// ==========================================
// DAILY PATIENT LOG (The Table Render)
// ==========================================
function renderDailyLog(containerId) {
    const m = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!m) return;

    let logs = [...dailyLog].sort((a, b) => getSortTime(b) - getSortTime(a));

    let html = `
        <style>
            /* === AGGRESSIVE PRINT STYLES FOR DAILY LOG === */
            @media print {
                /* Try to force landscape mode */
                @page { size: landscape; margin: 5mm; } 
                
                /* Hide navigation and UI clutter */
                .sidebar, .home-topbar, .search-bar, .hide-print { display: none !important; }
                
                /* Reset backgrounds and remove container limits */
                body, html { background: #fff !important; margin: 0 !important; padding: 0 !important; }
                #nurse-main { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; }
                .card { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; background: transparent !important; }
                
                /* Table adjustments to fit 10 columns */
                .table-wrap { overflow: visible !important; }
                table { 
                    width: 100% !important; 
                    table-layout: auto !important; 
                    border-collapse: collapse !important; 
                }
                th, td { 
                    font-size: 7.5pt !important; /* Super small font to fit the page */
                    padding: 4px 2px !important; /* Minimum padding */
                    border: 1px solid #ccc !important; /* Grid lines for readability */
                    white-space: normal !important; 
                    word-wrap: break-word !important;
                    color: #000 !important;
                }
                th { 
                    background-color: #f0f0f0 !important; 
                    -webkit-print-color-adjust: exact; 
                    color-adjust: exact; 
                }
                
                /* Strip badge colors to save ink and space */
                .badge { padding: 0 !important; background: transparent !important; color: #000 !important; border: none !important; font-weight: normal !important; }
                
                /* Make the header simpler for print */
                .page-header h1 { font-size: 16pt !important; text-align: center; margin-bottom: 10px; color: #000 !important; }
                .page-header p { display: none !important; }
            }
        </style>

        <div class="page-header">
            <h1>Daily Patient Log</h1>
            <p class="hide-print">Comprehensive master list of all completed clinic visits.</p>
        </div>
        <div class="card">
            <div class="search-bar" style="margin-bottom: 16px; display: flex; gap: 12px;">
                <input type="text" id="dpl-search" class="search-input hide-print" style="flex: 1;" placeholder="Search by name, ID, or date..." oninput="filterDailyLog()">
                <button class="btn btn-outline hide-print" onclick="window.print()"><i class="bi bi-printer"></i> Print Log</button>
            </div>
            <div id="dpl-table">
                ${generateDailyLogTable(logs)}
            </div>
        </div>
    `;
    m.innerHTML = html;
}

function filterDailyLog() {
    const q = (document.getElementById('dpl-search')?.value || '').toLowerCase();
    let filtered = [...dailyLog].filter(l => 
        (l.name && l.name.toLowerCase().includes(q)) || 
        (l.patientId && String(l.patientId).includes(q)) || 
        (l.date && l.date.includes(q))
    );
    filtered.sort((a, b) => getSortTime(b) - getSortTime(a));
    document.getElementById('dpl-table').innerHTML = generateDailyLogTable(filtered);
}

function generateDailyLogTable(list) {
    if (!list.length) return `<div class="empty-state" style="padding:40px;"><p class="text-muted">No records found.</p></div>`;
    
    return `<div class="table-wrap"><table>
        <thead>
            <tr>
                <th>DATE</th><th>ID</th><th>PATIENT NAME</th><th>AGE/SEX</th><th>COLLEGE/YR</th>
                <th>TIME IN</th><th>TIME OUT</th><th>PURPOSE OF VISIT</th><th>ATTENDING NURSE</th><th>ATTENDING PHYSICIAN</th>
            </tr>
        </thead>
        <tbody>
            ${list.map(log => `
                <tr>
                    <td class="text-xs fw6" style="white-space: nowrap;">${log.date || '—'}</td>
                    <td class="text-xs">${log.patientId || '—'}</td>
                    <td><div class="fw6">${log.name || '—'}</div></td>
                    <td class="text-xs">${log.age || '—'} / ${log.sex ? log.sex.charAt(0) : '—'}</td>
                    <td class="text-xs">${log.college || '—'} - ${log.year || '—'}</td>
                    <td class="text-xs" style="white-space: nowrap;">${log.timeIn || '—'}</td>
                    <td class="text-xs" style="white-space: nowrap;">${log.timeOut || '—'}</td>
                    <td><span class="badge b-gray" style="font-size:0.75rem;">${log.purpose || '—'}</span></td>
                    <td class="fw6" style="color: var(--maroon);">${log.attendingNurse || 'Nurse'}</td>
                    <td class="fw6" style="color: var(--blue);">${log.attendingPhysician || 'N/A'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table></div>`;
}

// --- ULTIMATE SORT HELPER: Combines Date & Time into a perfect mathematical timestamp ---
function getSortTime(log) {
    let dateVal = log.date || "1970-01-01";
    let t = log.timeOut || log.timeIn || "12:00 AM";
    let h = 0, m = 0;
    
    // Safely extract AM/PM into 24-hour format
    let match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
        h = parseInt(match[1], 10);
        m = parseInt(match[2], 10);
        if (match[3].toUpperCase() === 'PM' && h < 12) h += 12;
        if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
    } else {
        let m24 = t.match(/(\d+):(\d+)/);
        if (m24) { h = parseInt(m24[1], 10); m = parseInt(m24[2], 10); }
    }
    
    // Format perfectly to YYYY-MM-DDTHH:mm:00
    let hh = h.toString().padStart(2, '0');
    let mm = m.toString().padStart(2, '0');
    
    // Convert to a pure numeric timestamp
    let timestamp = new Date(`${dateVal}T${hh}:${mm}:00`).getTime();
    return isNaN(timestamp) ? 0 : timestamp;
}