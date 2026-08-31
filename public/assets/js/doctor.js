/* assets/js/doctor.js — Doctor interface (session-aware) */

function docNav(sec) {
    localStorage.setItem('ucims-doc-nav', sec);
    
    // Update active class for all doctor sidebar links
    ['consult', 'history', 'records', 'medcerts', 'labs'].forEach(s => {
        const el = document.getElementById('dn-' + s);
        if (el) el.classList.toggle('active', s === sec);
    });

    const m = document.getElementById('doctor-main');
    if (sec === 'consult') renderDocConsult(m);
    if (sec === 'history') renderDocHistory(m);
    if (sec === 'records') renderNurseRecords(m); // Reuse Nurse logic 
    if (sec === 'medcerts') renderDocMedCerts(m); // Reuse Nurse logic 
    if (sec === 'labs') renderDocLabRequests(m);    // Your new Lab Request logic
}

function renderDocConsult(m) {
    const activeQueue = queue.filter(q => q.status === 'triaged' || q.status === 'with-doctor');
    m.innerHTML = `
        <div class="page-header">
            <h1>Medical Consultations</h1>
            <p>Patients waiting for doctor's examination.</p>
        </div>
        <div class="card">
            <div class="card-title">Patient Queue</div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr><th>Queue #</th><th>Patient Name</th><th>Purpose</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        ${activeQueue.length === 0 ? 
                            `<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--text-muted);">No patients waiting.</td></tr>`
                            : activeQueue.map(q => `
                                <tr>
                                    <td><span class="num-badge" style="background:var(--maroon);">${q.queueNum}</span></td>
                                    <td style="font-weight:600; color:var(--maroon);">${q.name}</td>
                                    <td>${visitBadge(q)}</td>
                                    <td><span class="badge ${q.status === 'with-doctor' ? 'b-blue' : 'b-yellow'}">${q.status}</span></td>
                                    <td>
                                        <div class="flex gap6">
                                            <button class="btn btn-primary btn-sm" onclick="openExamModal(${q.queueNum})">
                                                <i class="bi bi-file-medical"></i> Examine
                                            </button>
                                            <button class="btn btn-success btn-sm" onclick="docQuickComplete(${q.queueNum})">
                                                <i class="bi bi-check-circle"></i> Completed
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Function to clear patient without a full exam
function docQuickComplete(qnum) {
    const e = queue.find(q => q.queueNum == qnum);
    if (!e) return;
    if (!confirm(`Mark visit for ${e.name} as completed?`)) return;

    e.status = 'examined'; // Return to nurse for final checkout 
    e.timeOut = nowTime();
    e.diagnosis = e.diagnosis || "Follow-up/Consultation Completed";
    saveData();
    renderDocConsult(document.getElementById('doctor-main'));
    toast('Patient cleared and returned to Nurse Station.');
}

function openDocViewRecord(qnum) {
    const e = queue.find(q => q.queueNum == qnum);
    if (!e) return;
    const u = getUserById(e.patientId);
    if (!u) { toast('No registered profile found for this patient.', 'info'); return; }
    openPatRecord(u.id);
}

// Temporary storage for files before saving to DB
let tempLabFiles = {}; 

function renderDocLabRequests(m) {
    let pendingVisits = [];

    // ONLY scan the dailyLog (requires Nurse "Complete Visit")
    dailyLog.forEach((log, idx) => {
        // Strict Check: Remove any empty or blank lab requests
        let validLabs = (log.exam?.labs || []).filter(l => l && l.trim() !== '');

        if (validLabs.length > 0) {
            let pendingLabs = [];

            validLabs.forEach((labName, labIdx) => {
                // A lab is pending if it has no attachments array OR the array is empty
                let hasAttachment = log.exam.labAttachments && 
                                    log.exam.labAttachments[labIdx] && 
                                    Array.isArray(log.exam.labAttachments[labIdx]) && 
                                    log.exam.labAttachments[labIdx].length > 0;
                                    
                if (!hasAttachment) {
                    pendingLabs.push({ name: labName, idx: labIdx });
                }
            });

            // Only push to the list if there are actual tests pending
            if (pendingLabs.length > 0) {
                pendingVisits.push({
                    logIdx: idx, // CRITICAL FIX: Save the exact visit index!
                    patientId: log.patientId,
                    name: log.name,
                    date: log.date || 'Today',
                    pendingCount: pendingLabs.length,
                    labs: pendingLabs
                });
            }
        }
    });

    // Sort by newest date first
    pendingVisits.sort((a, b) => new Date(b.date) - new Date(a.date));

    m.innerHTML = `
        <div class="page-header">
            <h1>Laboratory Requests</h1>
            <p>Pending laboratory tests from completed visits.</p>
        </div>
        <div class="card">
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Patient Name & ID</th>
                            <th>Pending Tests</th>
                            <th style="text-align:right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pendingVisits.length === 0 ? 
                            `<tr><td colspan="4" class="text-center p20" style="color:var(--text-muted); padding:40px;">No pending laboratory submissions.</td></tr>` : 
                            pendingVisits.map(p => `
                            <tr>
                                <td class="text-xs fw6">${p.date}</td>
                                <td>
                                    <div class="fw6" style="color:var(--maroon);">${p.name}</div>
                                    <div class="text-xs text-muted">ID: ${p.patientId}</div>
                                </td>
                                <td>
                                    <span class="badge b-blue">${p.pendingCount} Test(s) Pending</span>
                                    <div class="text-xs text-muted mt4">${p.labs.map(l => l.name).join(', ')}</div>
                                </td>
                                <td style="text-align:right;">
                                    <button class="btn btn-primary btn-sm" onclick="openLabAttachmentPanel(${p.logIdx})">
                                        <i class="bi bi-paperclip"></i> Attach Results
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openLabAttachmentPanel(logIdx) {
    const log = dailyLog[logIdx];
    if (!log) return;

    tempLabFiles = {}; // Reset temporary storage
    
    // Get valid labs
    const validLabs = (log.exam?.labs || []).filter(l => l && l.trim() !== '');

    // Find tests that don't have attachments yet
    const pendingTests = validLabs.map((name, idx) => ({ name, idx }))
        .filter(item => {
            let hasAttachment = log.exam.labAttachments && 
                                log.exam.labAttachments[item.idx] && 
                                Array.isArray(log.exam.labAttachments[item.idx]) && 
                                log.exam.labAttachments[item.idx].length > 0;
            return !hasAttachment;
        });

    let html = `
        <div class="profile-head" style="margin-bottom:16px;">
            <div class="profile-avatar">${log.name[0]}</div>
            <div>
                <div class="profile-name">${log.name}</div>
                <div class="profile-meta">Attaching results for visit on ${log.date || 'Today'}</div>
            </div>
        </div>
        
        <div class="card-title" style="font-size:0.95rem; margin-bottom:14px; border-bottom: 2px solid var(--border); padding-bottom: 8px;">
            <i class="bi bi-file-earmark-medical"></i> Pending Laboratory Results
        </div>
        
        <div style="display:flex; flex-direction:column; gap:16px;">
            ${pendingTests.map(test => `
                <div style="background:#ffffff; border:1px solid var(--border); border-radius:8px; padding:16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); border-left: 4px solid var(--maroon);">
                    
                    <div style="margin-bottom: 12px; display: flex; align-items: center;">
                        <span class="fw6" style="color:var(--maroon); font-size: 1.05rem;">${test.name}</span>
                        <span style="color: #dc3545; font-size: 1.1rem; margin-left: 4px;" title="Required">*</span>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 12px; background: #f9f8f6; padding: 10px 14px; border-radius: 6px; border: 1px dashed #ccc;">
                        
                        <input type="file" id="lab-file-${test.idx}" style="display: none;" accept="image/*,.pdf" multiple onchange="prepareLabFiles(${test.idx})">
                        
                        <button class="btn btn-outline btn-sm" style="background: #fff;" onclick="document.getElementById('lab-file-${test.idx}').click()">
                            <i class="bi bi-upload"></i> Browse Files
                        </button>
                        
                        <div id="file-status-${test.idx}" class="text-sm text-muted" style="flex: 1;">No files selected</div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="modal-footer" style="margin-top:24px; border-top:1px solid var(--border); padding-top:16px; display:flex; justify-content:space-between; align-items: center;">
            <span class="text-xs text-muted"><span style="color: #dc3545;">*</span> Indicates required attachments</span>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-outline" onclick="closeModal('modal-view')">Cancel</button>
                <button class="btn btn-primary" onclick="saveAllUploadedLabs(${logIdx})">
                    <i class="bi bi-check-circle"></i> Save Results
                </button>
            </div>
        </div>
    `;

    document.getElementById('view-modal-content').innerHTML = html;
    openModal('modal-view');
}

function prepareLabFiles(labIdx) {
    const input = document.getElementById(`lab-file-${labIdx}`);
    const statusLabel = document.getElementById(`file-status-${labIdx}`);
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    let currentUploads = [];
    let processedCount = 0;

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentUploads.push(e.target.result); 
            processedCount++;

            if (processedCount === files.length) {
                tempLabFiles[labIdx] = currentUploads;
                statusLabel.innerHTML = `<b class="text-green">${files.length} file(s) staged</b>`;
            }
        };
        reader.readAsDataURL(file);
    });
}

async function saveAllUploadedLabs(logIdx) {
    if (Object.keys(tempLabFiles).length === 0) {
        toast("No files have been selected to save.", "error");
        return;
    }

    const log = dailyLog[logIdx];
    if (!log) return;

    if (!log.exam.labAttachments) {
        log.exam.labAttachments = [];
    }

    // Move staged files to the actual log object using integer indices
    for (const [labIdxStr, fileDataArray] of Object.entries(tempLabFiles)) {
        let lIdx = parseInt(labIdxStr);
        log.exam.labAttachments[lIdx] = fileDataArray;
    }

    try {
        toast("Saving laboratory results...", "info");
        await saveData(); 
        
        closeModal('modal-view');
        toast("All laboratory results saved successfully!", "success");
        
        // This will instantly remove them from the list!
        renderDocLabRequests(document.getElementById('doctor-main'));
    } catch (e) {
        console.error("Save error:", e);
        toast("Failed to save to database.", "error");
    }
}

// ==========================================
// DOCTOR EXAMINATION HISTORY & SEARCH
// ==========================================
function renderDocHistory(m) {
    m.innerHTML = `
        <div class="page-header">
            <h1>Examination History</h1>
            <p>View past consultations and complete patient histories.</p>
        </div>
        <div class="card">
            <div class="search-bar" style="margin-bottom: 16px;">
                <input type="text" id="doc-hist-search" class="search-input" placeholder="Search by patient name or ID..." oninput="filterDocHistory()">
            </div>
            <div id="doc-hist-table"></div>
        </div>
    `;
    filterDocHistory();
}

function filterDocHistory() {
    const q = (document.getElementById('doc-hist-search')?.value || '').toLowerCase();
    const el = document.getElementById('doc-hist-table');
    if (!el) return;
    let filtered = [...dailyLog];
    if (q) {
        filtered = filtered.filter(l => l.name.toLowerCase().includes(q) || String(l.patientId).toLowerCase().includes(q));
    }
    filtered.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + (a.timeIn || '00:00'));
        const dateB = new Date(b.date + ' ' + (b.timeIn || '00:00'));
        return dateB - dateA;
    });
    if (!q) filtered = filtered.slice(0, 20);
    if (!filtered.length) {
        el.innerHTML = `<div class="empty-state"><p>No examination history found.</p></div>`;
        return;
    }
    el.innerHTML = `
        <div class="table-wrap">
            <table>
                <thead>
                    <tr><th>Date</th><th>Patient</th><th>Visit Type</th><th>Diagnosis</th><th>Physician</th><th>Summary</th></tr>
                </thead>
                <tbody>
                    ${filtered.map((log, idx) => {
                        const origIndex = dailyLog.indexOf(log);
                        return `
                        <tr>
                            <td class="text-xs fw6" style="white-space: nowrap;">${log.date}</td>
                            <td><div class="fw6">${log.name}</div><div class="text-xs text-muted">${log.patientId}</div></td>
                            <td>${visitBadge(log)}</td>
                            <td>${log.diagnosis || '—'}</td>
                            <td>${log.doctor || '—'}</td>
                            <td>
                                <button class="btn btn-outline btn-sm" onclick="openDocSummaryByIndex(${origIndex})"><i class="bi bi-eye"></i> View Summary</button>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function openDocSummaryByIndex(idx) {
    const log = dailyLog[idx];
    if (!log) return;
    const html = `
        <div style="background:#f9f8f6; border:1px solid var(--border); border-radius:8px; padding:18px; margin-bottom:14px;">
            <div class="grid2 mb8">
                <div><span class="text-muted text-xs uppercase fw6">Patient Name</span><div class="fw6">${log.name}</div></div>
                <div><span class="text-muted text-xs uppercase fw6">Date & Time</span><div>${log.date} | In: ${log.timeIn} - Out: ${log.timeOut || 'N/A'}</div></div>
            </div>
            <div class="grid2">
                <div><span class="text-muted text-xs uppercase fw6">Purpose</span><div>${log.visitLabel || log.purpose}</div></div>
                <div><span class="text-muted text-xs uppercase fw6">Attending Physician</span><div>${log.doctor}</div></div>
            </div>
        </div>
        <div class="card-title" style="font-size:1rem; margin-bottom:10px;"><i class="bi bi-clipboard2-pulse"></i> Clinical Notes</div>
        <div class="info-grid mb16">
            <div class="info-item"><div class="info-lbl">Chief Complaint</div><div class="info-val">${log.complaint || '—'}</div></div>
            <div class="info-item"><div class="info-lbl">Nurse Notes</div><div class="info-val">${log.nurseNotes || '—'}</div></div>
        </div>
        <div class="card-title" style="font-size:1rem; margin-bottom:10px;"><i class="bi bi-heart-pulse"></i> Physician Findings</div>
        <div class="field mb16">
            <div class="text-sm" style="background:#fff; padding:12px; border:1px solid var(--border); border-radius:6px;">
                <span class="text-muted">Diagnosis:</span> <b>${log.diagnosis || 'None recorded'}</b>
            </div>
        </div>
        <div class="card-title" style="font-size:1rem; margin-bottom:10px;"><i class="bi bi-capsule"></i> Treatments & Prescriptions</div>
        <div class="text-sm" style="background:#fff; padding:12px; border:1px solid var(--border); border-radius:6px; line-height:1.6;">
            ${log.treatment || 'No treatments or prescriptions issued.'}
        </div>
        <div class="modal-footer" style="margin-top:20px; border-top:1px solid var(--border); padding-top:16px; display:flex; justify-content:flex-end;">
            <button class="btn btn-outline" onclick="closeModal('modal-view')">Close</button>
        </div>
    `;
    document.getElementById('view-modal-content').innerHTML = html;
    openModal('modal-view');
}

// ==========================================
// ACTIVE EXAMINATION MODAL & WORKFLOW
// ==========================================
function openExamModal(qnum, startTab) {
    const e = queue.find(q => q.queueNum == qnum);
    if (!e) return;
    activeQ = qnum;
    const ex = e.exam || {};
    document.getElementById('exam-modal-patient').innerHTML = `<b>${e.name}</b> · Queue #${e.queueNum} · ${e.visitLabel || e.purpose}`;
    populateTriageReview(e);
    ['general', 'heent', 'chest', 'cardio', 'abdomen', 'extremities', 'neuro', 'diagnosis', 'icd'].forEach(f => setVal('ex-' + f, ex[f] || ''));
    setVal('ex-instructions', ex.instructions || '');
    setVal('ex-notes', ex.finalNotes || '');
    document.querySelectorAll('.lab-chk').forEach(cb => { cb.checked = (ex.labs || []).includes(cb.value); });
    setVal('ex-lab-other', '');
    rxCount = 0;
    const rxl = document.getElementById('rx-list');
    if (rxl) rxl.innerHTML = '';
    (ex.rx || []).forEach(r => addRx(r));
    examModalTab(startTab || 'triage-review');
    openModal('modal-exam');
}

function populateTriageReview(e) {
    const t = e.triage || {};
    const el = document.getElementById('triage-review-content');
    if (!el) return;
    if (t.bp) {
        el.innerHTML = `
            <div class="alert alert-info text-sm mb8"><i class="bi bi-info-circle"></i> Nurse-recorded vital signs. <b>View only — cannot be modified.</b></div>
            <div class="grid3 mb8">
                ${[['Blood Pressure', t.bp],
                   ['Heart Rate', t.hr ? t.hr + ' bpm' : ''],
                   ['Temperature', t.temp ? t.temp + '°C' : ''],
                   ['Resp. Rate', t.rr ? t.rr + ' br/min' : ''],
                   ['O₂ Saturation', t.o2 ? t.o2 + '%' : ''],
                   ['Weight / Height', (t.weight || '—') + 'kg / ' + (t.height || '—') + 'cm']].map(([l, v]) => `
                    <div style="background:#f9f8f6;padding:10px 12px;border-radius:7px;">
                        <div class="text-xs text-muted">${l}</div>
                        <div class="fw6 text-sm mt4"><span style="${getVitalStyle(l, v)}">${v || '—'}</span></div>
                    </div>
                `).join('')}
            </div>
            <div class="info-grid">
                <div class="info-item"><div class="info-lbl">Chief Complaint</div><div class="info-val">${t.complaint || '—'}</div></div>
                <div class="info-item"><div class="info-lbl">Nurse Assessment</div><div class="info-val">${t.notes || '—'}</div></div>
            </div>
        `;
    } else {
        el.innerHTML = `<div class="alert alert-warn text-sm"><i class="bi bi-exclamation-triangle"></i> No triage data recorded yet for this patient.</div>`;
    }
}

function examModalTab(t) {
    ['triage-review', 'diagnosis', 'prescriptions', 'finalize'].forEach(x => {
        const el = document.getElementById('emt-' + x);
        if (el) el.classList.toggle('active', x === t);
    });
    document.querySelectorAll('#exam-tabs .tab').forEach((el, i) =>
        el.classList.toggle('active', ['triage-review', 'diagnosis', 'prescriptions', 'finalize'][i] === t));
    if (t === 'finalize') renderFinalizeSummary();
}

function renderFinalizeSummary() {
    const e = queue.find(q => q.queueNum == activeQ);
    if (!e) return;
    const ex = e.exam || {}, t = e.triage || {};
    const el = document.getElementById('finalize-summary');
    if (!el) return;
    el.innerHTML = `
        <div style="background:#f9f8f6;border-radius:8px;padding:16px 18px;margin-bottom:14px;">
            <div class="text-xs fw6 text-muted" style="text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Consultation Summary</div>
            <div class="grid2 text-sm" style="gap:10px;">
                <div><span class="text-muted">Patient:</span> <b>${e.name}</b></div>
                <div><span class="text-muted">Visit Type:</span> ${e.visitLabel || e.purpose}</div>
                <div><span class="text-muted">Chief Complaint:</span> ${t.complaint || '—'}</div>
                <div><span class="text-muted">Diagnosis:</span> <b>${ex.diagnosis || 'Not entered'}</b>${ex.icd ? ' (' + ex.icd + ')' : ''}</div>
                <div><span class="text-muted">Lab Requests:</span> ${(ex.labs || []).join(', ') || 'None'}</div>
                <div><span class="text-muted">Prescriptions:</span> ${(ex.rx || []).filter(r => r.drug).map(r => r.drug + ' ' + r.dose).join(', ') || 'None'}</div>
            </div>
            ${ex.instructions ? `<div class="text-sm mt8"><span class="text-muted">Instructions:</span> ${ex.instructions}</div>` : ''}
        </div>
    `;
}

function saveDiagnosis() {
    const e = queue.find(q => q.queueNum == activeQ);
    if (!e) return;
    if (!val('ex-diagnosis').trim()) { toast('Please enter a diagnosis.', 'error'); return; }
    if (!e.exam) e.exam = {};
    ['general', 'heent', 'chest', 'cardio', 'abdomen', 'extremities', 'neuro', 'diagnosis', 'icd'].forEach(f => { e.exam[f] = val('ex-' + f) || ''; });
    saveData();
    toast('Diagnosis and findings saved.');
    examModalTab('prescriptions');
}

function savePrescriptions() {
    const e = queue.find(q => q.queueNum == activeQ);
    if (!e) return;
    if (!e.exam) e.exam = {};
    e.exam.labs = Array.from(document.querySelectorAll('.lab-chk:checked')).map(c => c.value);
    const lo = val('ex-lab-other');
    if (lo && lo.trim() !== '') e.exam.labs.push(lo);
    e.exam.instructions = val('ex-instructions');
    e.exam.rx = Array.from(document.querySelectorAll('.rx-block')).map(b => ({
        drug: b.querySelector('.rx-drug')?.value || '',
        dose: b.querySelector('.rx-dose')?.value || '',
        freq: b.querySelector('.rx-freq')?.value || '',
        duration: b.querySelector('.rx-dur')?.value || '',
        route: b.querySelector('.rx-route')?.value || ''
    })).filter(r => r.drug.trim());
    saveData();
    toast('Prescriptions saved.');
    examModalTab('finalize');
}

function addRx(rx) {
    rxCount++;
    const id = rxCount;
    const div = document.createElement('div');
    div.className = 'rx-block';
    div.id = 'rx-' + id;
    div.innerHTML = `
        <button class="rx-remove" onclick="document.getElementById('rx-${id}').remove()"><i class="bi bi-x"></i></button>
        <div class="field-row">
            <div class="field"><label>Drug Name</label><input class="rx-drug" placeholder="Generic name" value="${rx?.drug || ''}"></div>
            <div class="field"><label>Dosage</label><input class="rx-dose" placeholder="e.g. 500mg" value="${rx?.dose || ''}"></div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px;">
            <div class="field"><label>Frequency</label><input class="rx-freq" placeholder="e.g. 3x a day" value="${rx?.freq || ''}"></div>
            <div class="field"><label>Duration</label><input class="rx-dur" placeholder="e.g. 7 days" value="${rx?.duration || ''}"></div>
            <div class="field"><label>Route</label>
                <select class="rx-route">
                    <option ${rx?.route === 'Oral' ? 'selected' : ''}>Oral</option>
                    <option ${rx?.route === 'Topical' ? 'selected' : ''}>Topical</option>
                    <option ${rx?.route === 'IV' ? 'selected' : ''}>IV</option>
                    <option ${rx?.route === 'IM' ? 'selected' : ''}>IM</option>
                    <option ${rx?.route === 'Inhaled' ? 'selected' : ''}>Inhaled</option>
                </select>
            </div>
        </div>
    `;
    document.getElementById('rx-list')?.appendChild(div);
}

function finalizeConsult() {
    const e = queue.find(q => q.queueNum == activeQ);
    if (!e) return;
    if (!e.exam) e.exam = {};
    // Capture all fields
    e.exam.general = val('ex-general') || '';
    e.exam.heent = val('ex-heent') || '';
    e.exam.chest = val('ex-chest') || '';
    e.exam.cardio = val('ex-cardio') || '';
    e.exam.abdomen = val('ex-abdomen') || '';
    e.exam.extremities = val('ex-extremities') || '';
    e.exam.neuro = val('ex-neuro') || '';
    e.exam.diagnosis = val('ex-diagnosis') || '';
    e.exam.icd = val('ex-icd') || '';
    e.exam.finalNotes = val('ex-notes') || '';
    e.exam.instructions = val('ex-instructions') || '';
    e.exam.doctorId = currentUser.id;
    // Capture prescriptions
    e.exam.rx = [];
    document.querySelectorAll('.rx-block').forEach(row => {
        const drugName = row.querySelector('.rx-drug')?.value;
        if (drugName && drugName.trim() !== '') {
            e.exam.rx.push({
                drug: drugName,
                dose: row.querySelector('.rx-dose')?.value || '',
                freq: row.querySelector('.rx-freq')?.value || '',
                duration: row.querySelector('.rx-dur')?.value || '',
                route: row.querySelector('.rx-route')?.value || 'Oral'
            });
        }
    });
    // Capture lab requests
    e.exam.labs = Array.from(document.querySelectorAll('.lab-chk:checked')).map(c => c.value);
    const lo = val('ex-lab-other');
    if (lo && lo.trim() !== '') e.exam.labs.push(lo);
    e.status = 'examined';
    e.timeOut = nowTime();
    saveData();
    closeModal('modal-exam');
    renderDocConsult(document.getElementById('doctor-main'));
    toast('Examination finalized! Patient returned to Nurse Station.', 'success');
}

function visitBadge(q) {
    const pt = q.purposeType || q.purpose || '';
    const map = {
        checkup: '<span class="badge b-maroon"><i class="bi bi-clipboard2-pulse"></i> Check-up</span>',
        medicine: '<span class="badge b-gold"><i class="bi bi-capsule"></i> Medicine Req.</span>',
        'follow-up': '<span class="badge b-blue"><i class="bi bi-arrow-repeat"></i> Follow-up</span>',
        medcert: '<span class="badge b-green"><i class="bi bi-file-earmark-medical"></i> Med Cert</span>'
    };
    return map[pt.toLowerCase()] || `<span class="badge b-gray">${q.visitLabel || pt}</span>`;
}

// ==========================================
// DOCTOR: MEDICAL CERTIFICATE FULL ACCESS
// ==========================================
let tempMedCertDraft = {};
let tempSignatureBase64 = null;

function renderDocMedCerts(m) {
    // Only pull from dailyLog (ensures Nurse clicked Complete Visit)
    let certs = dailyLog.filter(l => l.purposeType === 'medcert' && !l.medcertReleased).map(l => ({...l, isLog: true}));
    certs.sort((a, b) => (a.queueNum || 0) - (b.queueNum || 0));

    m.innerHTML = `
        <div class="page-header">
            <h1>Medical Certificate Requests</h1>
            <p>Process, digitally sign, and release official medical certificates.</p>
        </div>
        <div class="stats-row">
            <div class="stat-card stat-blue"><div class="stat-num">${certs.length}</div><div class="stat-label">Pending Releases</div></div>
        </div>
        ${!certs.length ? `<div class="empty-state"><div class="ei"><i class="bi bi-file-earmark-check text-muted" style="opacity: 0.5;"></i></div><p>No pending certificate requests.</p></div>` :
        `<div class="card"><div class="table-wrap"><table><thead><tr><th>Queue #</th><th>Patient</th><th>Request Details</th><th>Status</th><th>Actions</th></tr></thead><tbody>${certs.map(q => {
            const md = q.medcertData || {};
            return `<tr>
                <td><span class="num-badge b-blue">${q.queueNum}</span></td>
                <td><div class="fw6">${q.name}</div><div class="text-xs text-muted">${q.patientId}</div></td>
                <td><div class="fw6 text-sm" style="color:var(--maroon);">${md.reason || 'Medical Certificate'}</div><div class="text-xs text-muted">Req. Date: ${q.date || 'N/A'}</div></td>
                <td><span class="badge b-green">Ready for Physician</span></td>
                <td><button class="btn btn-primary btn-sm" onclick="openMedCertModal(${q.queueNum}, true)"><i class="bi bi-pencil-square"></i> Review & Process</button></td>
            </tr>`;
        }).join('')}</tbody></table></div></div>`}
    `;
}

function openMedCertModal(qnum, isLog) {
    const e = dailyLog.find(l => l.queueNum == qnum);
    if (!e) return;
    
    const u = users.find(x => x.id === e.patientId) || {};
    const perm = u.permanent || {};
    const md = e.medcertData || {};
    const diag = e.diagnosis && e.diagnosis !== 'Completed at Nurse Station' ? e.diagnosis : (e.complaint || '');
    
    const sigName = currentUser && currentUser.name ? currentUser.name.toUpperCase() : '';
    const courseStr = perm.dept ? `${perm.dept} - ${perm.yearLevel || perm.yearsec || ''}` : (e.college || 'USeP');

    let html = `
        <div class="card-title" style="margin-bottom: 16px;"><i class="bi bi-file-medical"></i> Medical Certificate Processing</div>
        
        <div class="alert alert-info text-sm mb16">
            <i class="bi bi-check-circle"></i> <b>Status: Visit Completed.</b> Fill out the blanks to finalize the document.
        </div>

        <div style="background:#fff; border:1px solid var(--border); border-radius:8px; padding:24px; font-family:serif; line-height: 2.2; font-size: 1.05rem;">
            <div style="font-weight:bold; margin-bottom:10px;">TO WHOM IT MAY CONCERN:</div>
            <div style="text-indent: 30px;">
                This is to certify that <input type="text" id="mc-name" value="${e.name}" disabled style="border:none; border-bottom:1px solid var(--border); outline:none; width: 220px; text-align:center; font-weight:bold; background:transparent; color:#000;">
                of <input type="text" id="mc-course" value="${courseStr}" style="border:none; border-bottom:1px solid #000; outline:none; width: 180px; text-align:center; font-weight:bold; background:transparent;">
                has been examined by the undersigned at this office on <input type="date" id="mc-date" value="${md.examDate || e.date || ''}" style="border:none; border-bottom:1px solid #000; outline:none; font-weight:bold; background:transparent;">
                and found him/her to be with <input type="text" id="mc-findings" value="${md.findings || diag}" placeholder="[Diagnosis/Findings]" style="border:none; border-bottom:1px solid #000; outline:none; width: 100%; max-width: 400px; font-weight:bold; background:transparent;">.
            </div>
            <div style="text-indent: 30px; margin-top: 10px;">
                This certification is issued upon his/her request for the purpose of:
                <input type="text" id="mc-purpose" value="${md.purpose || md.reason || ''}" placeholder="[Purpose]" style="border:none; border-bottom:1px solid #000; outline:none; width: 100%; font-weight:bold; background:transparent;">
            </div>
            <div style="margin-top: 50px; text-align:right; font-family: Arial, sans-serif;">
                <input type="text" id="mc-doctor" value="${sigName}" placeholder="NAME OF PHYSICIAN" style="border:none; border-bottom:1px solid #000; outline:none; width: 280px; text-align:center; font-weight:bold; display:block; margin-left:auto; font-size: 1.1rem; background:transparent; text-transform:uppercase;">
            </div>
        </div>

        <div class="modal-footer" style="margin-top:20px; border-top:1px solid var(--border); padding-top:16px; display:flex; justify-content:space-between; align-items:center;">
            <span class="text-xs text-muted">A signature panel will appear upon proceeding.</span>
            <div style="display:flex; gap:8px;">
                <button class="btn btn-outline" onclick="closeModal('modal-view')">Cancel</button>
                <button class="btn btn-primary" onclick="openSignaturePanel(${qnum}, true)"><i class="bi bi-printer"></i> Release and Print</button>
            </div>
        </div>
    `;
    document.getElementById('view-modal-content').innerHTML = html;
    openModal('modal-view');
}

function openSignaturePanel(qnum, isLog) {
    const e = dailyLog.find(l => l.queueNum == qnum);
    if (!e) return;

    tempMedCertDraft = {
        findings: document.getElementById('mc-findings')?.value || '',
        purpose: document.getElementById('mc-purpose')?.value || '',
        doctor: document.getElementById('mc-doctor')?.value || '',
        examDate: document.getElementById('mc-date')?.value || ''
    };
    tempSignatureBase64 = null;

    const html = `
        <div class="page-header" style="margin-bottom: 20px;">
            <h2 style="color: var(--maroon); margin:0;">Finalize Certificate</h2>
            <p class="text-muted text-sm" style="margin:4px 0 0 0;">Please provide your signature and license number.</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 16px;">
            <div>
                <label class="fw6 text-sm" style="display:block; margin-bottom:6px;">Physician Name</label>
                <input type="text" id="mc-doc-name" class="input" value="${tempMedCertDraft.doctor}" placeholder="Dr. Name" style="text-transform:uppercase;">
            </div>
            <div>
                <label class="fw6 text-sm" style="display:block; margin-bottom:6px;">License Number <span class="text-red">*</span></label>
                <input type="text" id="mc-license" class="input" placeholder="e.g. 0123456" required>
            </div>
            <div style="padding:20px; border:2px dashed var(--border); border-radius:10px; background:#fdfcfb; text-align:center;">
                <label class="fw6 text-sm" style="display:block; margin-bottom:12px; color: var(--maroon);"><i class="bi bi-pen"></i> Upload E-Signature</label>
                <input type="file" id="mc-sig-file" class="hide" accept="image/png, image/jpeg" onchange="previewSignature(this)">
                <button class="btn btn-outline btn-sm" onclick="document.getElementById('mc-sig-file').click()"><i class="bi bi-upload"></i> Select Image File</button>
                <div id="sig-preview-container" style="margin-top: 15px; display: none;">
                    <img id="sig-preview-img" style="max-height: 80px; max-width: 100%; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
                </div>
            </div>
        </div>
        <div class="modal-footer" style="margin-top:24px; padding-top:16px; border-top:1px solid var(--border); display:flex; gap:10px;">
            <button class="btn btn-outline" style="flex:1;" onclick="closeModal('modal-view')">Cancel</button>
            <button class="btn btn-primary" style="flex:2;" onclick="finalizeMedCertPDF(${qnum}, true)"><i class="bi bi-check-circle"></i> Generate, Release & Print</button>
        </div>
    `;
    document.getElementById('view-modal-content').innerHTML = html;
}

function previewSignature(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            tempSignatureBase64 = e.target.result;
            document.getElementById('sig-preview-img').src = tempSignatureBase64;
            document.getElementById('sig-preview-container').style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function finalizeMedCertPDF(qnum, isLog) {
    const e = dailyLog.find(l => l.queueNum == qnum);
    if (!e) return;

    // Bypass Chrome Popup Blocker
    const printTab = window.open('', '_blank');
    printTab.document.write('<body style="background:#525659; display:flex; justify-content:center; align-items:center; height:100vh; color:white; font-family:sans-serif;"><h2>Generating PDF Document... Please wait.</h2></body>');

    const licenseNo = document.getElementById('mc-license').value.trim() || '_______________';
    const finalDocName = document.getElementById('mc-doc-name').value.trim() || tempMedCertDraft.doctor || '_______________________';

    toast('Processing PDF... Please wait.', 'info');

    // Restore digital input data
    if (!e.medcertData) e.medcertData = {};
    e.medcertData.findings = tempMedCertDraft.findings || '_______________________';
    e.medcertData.purpose = tempMedCertDraft.purpose || '_______________________';
    
    // CRITICAL BUG FIX: Add a fallback string so PHP never sees this as "empty" and skips it
    e.medcertData.reason = tempMedCertDraft.purpose || 'Medical Certificate Request'; 
    
    e.medcertData.doctor = finalDocName;
    e.medcertData.examDate = tempMedCertDraft.examDate;

    const u = users.find(x => x.id === e.patientId) || {};
    const perm = u.permanent || {};
    const courseStr = perm.dept ? `${perm.dept} - ${perm.yearLevel || perm.yearsec || ''}` : (e.college || 'USeP');

    const formatDt = (d) => d ? new Date(d).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'}) : '_________________';
    const eDate = formatDt(e.medcertData.examDate);
    const today = new Date();
    const iDay = today.getDate();
    const iMon = today.toLocaleDateString('en-US', {month: 'long'});
    const iYr = today.getFullYear().toString().slice(-2);

    const sigHtml = tempSignatureBase64 
        ? `<img src="${tempSignatureBase64}" style="max-height: 75px; max-width: 250px; display: block; margin: 0 auto -20px auto; position: relative; z-index: 10;">` 
        : `<div style="height: 55px;"></div>`; 

    const printHTML = `
        <div style="padding: 10px 15px; background: #fff; color: #000; width: 710px; box-sizing: border-box; margin: 0 auto;">
            <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 20px; font-family: Arial, sans-serif;">
                <tr>
                    <td style="width: 120px; text-align: center; border-right: 1.5px solid #000; padding: 10px;">
                        <img src="assets/img/logo.png" style="width: 85px; height: 85px;">
                    </td>
                    <td style="text-align: center; padding: 10px; border-right: 1.5px solid #000; font-size: 9pt; line-height: 1.3;">
                        Republic of the Philippines<br>
                        <b style="font-size: 10.5pt;">University of Southeastern Philippines</b><br>
                        Iñigo St., Bo. Obrero, Davao City 8000<br>
                        Telephone: (082) 227-8192<br>
                        Website: <span style="color:blue; text-decoration:underline;">www.usep.edu.ph</span><br>
                        Email: president@usep.edu.ph
                    </td>
                    <td style="width: 220px; padding: 0; vertical-align: top;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 8pt; height: 100%;">
                            <tr><td style="border-bottom: 1px solid #000; padding: 6px 8px;">Form No.</td><td style="border-bottom: 1px solid #000; border-left: 1px solid #000; padding: 6px 8px;">FM-USeP-IMC-01</td></tr>
                            <tr><td style="border-bottom: 1px solid #000; padding: 6px 8px;">Issue Status</td><td style="border-bottom: 1px solid #000; border-left: 1px solid #000; padding: 6px 8px;">02</td></tr>
                            <tr><td style="border-bottom: 1px solid #000; padding: 6px 8px;">Revision No.</td><td style="border-bottom: 1px solid #000; border-left: 1px solid #000; padding: 6px 8px;">01</td></tr>
                            <tr><td style="border-bottom: 1px solid #000; padding: 6px 8px;">Date Effective</td><td style="border-bottom: 1px solid #000; border-left: 1px solid #000; padding: 6px 8px;">01 MARCH 2018</td></tr>
                            <tr><td style="padding: 6px 8px;">Approved by</td><td style="border-left: 1px solid #000; padding: 6px 8px;">President</td></tr>
                        </table>
                    </td>
                </tr>
            </table>
            <div style="text-align: center; font-weight: bold; font-size: 14pt; padding: 8px; border: 1.5px solid #000; margin-bottom: 30px; letter-spacing: 1px; font-family: Arial, sans-serif;">MEDICAL CERTIFICATE</div>
            <div style="font-family: 'Times New Roman', Times, serif; font-size: 11.5pt; line-height: 2.2; text-align: justify; padding: 0 10px;">
                <div style="font-weight: bold; margin-bottom: 15px; font-family: Arial, sans-serif;">TO WHOM IT MAY CONCERN:</div>
                <p style="text-indent: 40px; margin: 0 0 10px 0;">This is to certify that <u style="font-weight:bold;">&nbsp;&nbsp;&nbsp;${e.name}&nbsp;&nbsp;&nbsp;</u> of <u style="font-weight:bold;">&nbsp;&nbsp;&nbsp;${courseStr}&nbsp;&nbsp;&nbsp;</u> has been examined by the undersigned at this office on <u style="font-weight:bold;">&nbsp;&nbsp;&nbsp;${eDate}&nbsp;&nbsp;&nbsp;</u> and found him/her to be with <u style="font-weight:bold;">&nbsp;&nbsp;&nbsp;${e.medcertData.findings}&nbsp;&nbsp;&nbsp;</u>.</p>
                <p style="text-indent: 40px; margin: 0 0 10px 0;">This certification is issued upon his/her request for the purpose of: <u style="font-weight:bold;">&nbsp;&nbsp;&nbsp;${e.medcertData.purpose}&nbsp;&nbsp;&nbsp;</u>.</p>
                <p style="text-indent: 40px; margin: 0 0 10px 0;">Issued this <u style="font-weight:bold;">&nbsp;&nbsp;&nbsp;${iDay}&nbsp;&nbsp;&nbsp;</u> day of <u style="font-weight:bold;">&nbsp;&nbsp;&nbsp;${iMon}&nbsp;&nbsp;&nbsp;</u>, 20<u style="font-weight:bold;">${iYr}</u> at Davao City, Philippines.</p>
                <table style="width: 100%; margin-top: 50px;">
                    <tr>
                        <td></td>
                        <td style="width: 280px; text-align: center; font-family: Arial, sans-serif; font-size: 10pt;">
                            ${sigHtml}
                            <span style="font-weight: bold; text-decoration: underline; font-size: 11pt; display: block; margin-bottom: 3px; position: relative; z-index: 20;">${finalDocName.toUpperCase()}</span>
                            <span>License No. ${licenseNo}</span>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    `;

    // 1. Compressed config for saving to the Database (Avoids Server Crash)
    const dbOpt = { margin: 0.5, filename: `medcert_${e.name}.pdf`, image: { type: 'jpeg', quality: 0.40 }, html2canvas: { scale: 0.8, useCORS: true }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
    
    // 2. High-res config for the Doctor's Print View
    const printOpt = { margin: 0.5, filename: `medcert_${e.name}.pdf`, image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 1.5, useCORS: true }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };

    try {
        e.medcertReleased = true;
        e.medcertData.additional_notes = e.exam?.finalNotes || ''; // Maps any doctor remarks to the column
        
        // Generate tiny Base64 text for PostgreSQL
        const pdfBase64 = await html2pdf().set(dbOpt).from(printHTML).outputPdf('datauristring');
        e.medcertData.pdfBase64 = pdfBase64;
        
        // Generate crisp Blob URL for actual printing
        const pdfBlobUrl = await html2pdf().set(printOpt).from(printHTML).outputPdf('bloburl');
        printTab.location.href = pdfBlobUrl; 
        
        // Send data to PHP
        saveData();
        
        // CRITICAL FIX: Delay memory cleanup by 1.5 seconds! 
        // This guarantees the Base64 string isn't deleted before JavaScript finishes sending it to PHP.
        setTimeout(() => {
            delete e.medcertData.pdfBase64; 
            tempSignatureBase64 = null;
        }, 1500);
        
        closeModal('modal-view');
        toast(`Medical Certificate officially released and opened for printing.`, 'success');
        
        if (typeof docNav === 'function') docNav('medcerts');

    } catch (err) {
        console.error("PDF Error:", err);
        printTab.close(); 
        toast(err.message || 'Error processing document.', 'error');
    }
}