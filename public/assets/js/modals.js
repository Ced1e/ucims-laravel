/* modals.js — Triage + Services modal handlers + Patient Record Editor (session-aware) */

// ==========================================
// TRIAGE MODAL
// ==========================================
function openTriageModal(qnum) {
    const e = queue.find(q => q.queueNum == qnum);
    if (!e) return;
    activeQ = qnum;
    document.getElementById('triage-patient').innerHTML = `<b>${e.name}</b> · #${e.queueNum} · ${e.visitLabel || e.purpose}`;
    
    // Clear every field unconditionally
    const fields = ['bp', 'hr', 'temp', 'rr', 'o2', 'weight', 'height', 'complaint', 'notes'];
    fields.forEach(f => setVal('tr-' + f, ''));
    
    openModal('modal-triage');
}

function saveTriage() {
    const e = queue.find(q => q.queueNum == activeQ);
    if (!e) return;
    if (!val('tr-bp').trim()) { toast('Blood pressure is required.', 'error'); return; }
    if (!val('tr-complaint').trim()) { toast('Chief complaint is required.', 'error'); return; }
    e.triage = {
        bp: val('tr-bp'), hr: val('tr-hr'), temp: val('tr-temp'), rr: val('tr-rr'),
        o2: val('tr-o2'), weight: val('tr-weight'), height: val('tr-height'),
        complaint: val('tr-complaint'), notes: val('tr-notes'),
        nurseId: currentUser.id
    };
    e.triaged = true;
    e.status = 'triaged';
    saveData();
    closeModal('modal-triage');
    nurseNav('queue');
    toast('Triage assessment saved successfully.');
}

// ==========================================
// MEDICINE ISSUANCE MODAL
// ==========================================
function openServicesModal(qnum) {
    const e = queue.find(q => q.queueNum == qnum);
    if (!e) return;
    activeQ = qnum;
    document.getElementById('svc-patient').innerHTML = `<b>${e.name}</b> · #${e.queueNum} · ${e.visitLabel || e.purpose}`;
    ['svc-med-name', 'svc-med-dose', 'svc-med-qty', 'svc-med-freq', 'svc-med-dur', 'svc-med-instr', 'svc-med-by'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    if (currentUser) {
        document.getElementById('svc-med-by').value = currentUser.name.replace("Nurse - ", "").replace("Nurse ", "");
    }
    renderSvcList(e);
    openModal('modal-services');
}

function saveMedicine() {
    const e = queue.find(q => q.queueNum == activeQ);
    if (!e) return;
    if (!val('svc-med-name').trim() || !val('svc-med-qty').trim()) {
        toast('Medicine name and quantity required.', 'error');
        return;
    }
    if (!e.services) e.services = [];
    e.services.push({
        type: 'medicine',
        name: val('svc-med-name'),
        dose: val('svc-med-dose'),
        qty: val('svc-med-qty'),
        freq: val('svc-med-freq'),      // frequency
        duration: val('svc-med-dur'),   // FIX: Changed 'dur' to 'duration' to match the database!
        instr: val('svc-med-instr'),
        by: val('svc-med-by') || currentUser.name,
        time: nowTime(),
        nurseId: currentUser.id
    });
    saveData();
    closeModal('modal-services');
    nurseNav('services');
    toast(`Medicine issued to ${e.name}.`);
}

function renderSvcList(e) {
    const el = document.getElementById('svc-issued-list');
    if (!el) return;
    if (!(e.services || []).length) {
        el.innerHTML = '<div class="text-muted text-sm mt8">No services issued yet.</div>';
        return;
    }
    el.innerHTML = `<div class="text-xs fw6 text-muted mt8 mb4" style="text-transform:uppercase;letter-spacing:.5px;">Issued Medicines</div>
        ${e.services.map(s => s.type === 'medicine'
            ? `<div style="background:#f9f8f6;padding:8px 12px;border-radius:7px;margin-bottom:5px;font-size:.845rem;"><i class="bi bi-capsule" style="color:var(--maroon);"></i> <b>${s.name}</b> ${s.dose} — ${s.qty} <br><span class="text-muted">${s.instr}</span> · by ${s.by} at ${s.time}</div>`
            : ''
        ).join('')}`;
}

// ==========================================
// VIEW FULL PATIENT PERMANENT RECORD (EDITABLE)
// ==========================================
let currentPatId = null;
let isEditingPpr = false;

async function openPatRecord(uid, allowEdit = false) {
    currentPatId = uid;
    isEditingPpr = false;
    try {
        let res = await fetch('backend/api_records.php?uid=' + uid);
        let data = await res.json();
        if (data.status === 'error') {
            toast(data.message, 'error');
            return;
        }
        const p = data.profile.permanent || {};
        const d = data.profile.demographics || {};
        const h = data.profile.health || {};
        const q = data.profile.questionnaire || {};
        const f = q.female || {};
        const pr = data.profile;

        const html = `
            <div class="profile-head" style="margin-bottom:16px;">
                <div class="profile-avatar">${(pr.fname || 'P')[0]}</div>
                <div>
                    <div class="profile-name">${pr.fname} ${pr.lname}</div>
                    <div class="profile-meta">ID: ${p.studid || uid} · ${p.pattype || 'Student'} · ${p.dept || ''}</div>
                </div>
            </div>
            <div class="tabs" id="ppr-view-tabs" style="margin-bottom:16px;">
                <button class="tab active" onclick="switchPprTab('personal')">1. Personal Info</button>
                <button class="tab" onclick="switchPprTab('health')">2. Health & Vitals</button>
                <button class="tab" onclick="switchPprTab('systems')">3. System Review</button>
                <button class="tab" onclick="switchPprTab('questionnaire')">4. Questionnaire</button>
                <button class="tab" onclick="switchPprTab('labs')">5. Lab Results</button>
            </div>
            <form id="ppr-edit-form" style="max-height: 50vh; overflow-y: auto; padding-right: 8px;">
                <div id="ppr-tab-personal" class="tab-panel active">
                    <div class="card-title" style="font-size: 1rem;"><i class="bi bi-person-lines-fill"></i> Name & Designation</div>
                    <div class="grid3 mb12">
                        <div class="field mb0"><div class="text-xs text-muted">First Name</div><input type="text" id="ep-fname" class="ppr-input" value="${pr.fname || ''}" disabled></div>
                        <div class="field mb0"><div class="text-xs text-muted">Middle Name</div><input type="text" id="ep-mname" class="ppr-input" value="${pr.mname || ''}" disabled></div>
                        <div class="field mb0"><div class="text-xs text-muted">Last Name</div><input type="text" id="ep-lname" class="ppr-input" value="${pr.lname || ''}" disabled></div>
                    </div>
                    <div class="grid3 mb12">
                        <div class="field mb0"><div class="text-xs text-muted">Patient Type</div>
                            <select id="ep-pattype" class="ppr-input" disabled><option ${p.pattype === 'Student' ? 'selected' : ''}>Student</option><option ${p.pattype === 'Faculty' ? 'selected' : ''}>Faculty</option></select>
                        </div>
                        <div class="field mb0"><div class="text-xs text-muted">College/Dept</div><input type="text" id="ep-dept" class="ppr-input" value="${p.dept || ''}" disabled></div>
                        <div class="field mb0"><div class="text-xs text-muted">Year Level</div><input type="text" id="ep-year" class="ppr-input" value="${p.yearLevel || ''}" disabled></div>
                    </div>
                    <div class="card-title mt16" style="font-size: 1rem;"><i class="bi bi-info-circle"></i> Demographics</div>
                    <div class="grid3 mb12">
                        <div class="field mb0"><div class="text-xs text-muted">Date of Birth</div><input type="date" id="ep-dob" class="ppr-input" value="${d.dob || ''}" disabled></div>
                        <div class="field mb0"><div class="text-xs text-muted">Sex</div>
                            <select id="ep-sex" class="ppr-input" disabled><option value="Male" ${d.sex === 'Male' ? 'selected' : ''}>Male</option><option value="Female" ${d.sex === 'Female' ? 'selected' : ''}>Female</option></select>
                        </div>
                        <div class="field mb0"><div class="text-xs text-muted">Civil Status</div>
                            <select id="ep-civil" class="ppr-input" disabled><option ${d.civil === 'Single' ? 'selected' : ''}>Single</option><option ${d.civil === 'Married' ? 'selected' : ''}>Married</option><option ${d.civil === 'Widowed' ? 'selected' : ''}>Widowed</option><option ${d.civil === 'Separated' ? 'selected' : ''}>Separated</option></select>
                        </div>
                    </div>
                    <div class="grid2 mb12">
                        <div class="field mb0"><div class="text-xs text-muted">Contact No.</div><input type="text" id="ep-contact" class="ppr-input" value="${d.contact || ''}" disabled></div>
                        <div class="field mb0"><div class="text-xs text-muted">Religion</div><input type="text" id="ep-religion" class="ppr-input" value="${d.religion || ''}" disabled></div>
                        <div class="field mb0" style="grid-column: span 2;"><div class="text-xs text-muted">Current Address</div><input type="text" id="ep-address" class="ppr-input" value="${d.address || ''}" disabled></div>
                    </div>
                </div>
                <div id="ppr-tab-health" class="tab-panel">
                    <div class="card-title" style="font-size: 1rem;"><i class="bi bi-clipboard2-pulse"></i> Initial Vitals</div>
                    <div class="grid3 mb12">
                        <div class="field mb0"><div class="text-xs text-muted">Height (cm)</div><input type="number" id="ep-height" class="ppr-input" value="${h.height || ''}" disabled></div>
                        <div class="field mb0"><div class="text-xs text-muted">Weight (kg)</div><input type="number" id="ep-weight" class="ppr-input" value="${h.weight || ''}" disabled></div>
                        <div class="field mb0"><div class="text-xs text-muted">Blood Pressure</div><input type="text" id="ep-bp" class="ppr-input" value="${h.bp || ''}" disabled></div>
                    </div>
                    <div class="grid3 mb12">
                        <div class="field mb0"><div class="text-xs text-muted">Pulse Rate</div><input type="number" id="ep-pr" class="ppr-input" value="${h.pr || ''}" disabled></div>
                        <div class="field mb0"><div class="text-xs text-muted">Resp. Rate</div><input type="number" id="ep-rr" class="ppr-input" value="${h.rr || ''}" disabled></div>
                        <div class="field mb0"><div class="text-xs text-muted">Temperature</div><input type="number" step="0.1" id="ep-temp" class="ppr-input" value="${h.temp || ''}" disabled></div>
                    </div>
                    <div class="card-title mt16" style="font-size: 1rem;"><i class="bi bi-journal-medical"></i> Medical History</div>
                    <div class="field mb12"><div class="text-xs text-muted">Infectious Diseases</div><textarea id="ep-infectious" class="ppr-input" disabled>${h.infectious || ''}</textarea></div>
                    <div class="field mb12"><div class="text-xs text-muted">Social History</div><textarea id="ep-socialhx" class="ppr-input" disabled>${h.socialHx || ''}</textarea></div>
                    <div class="field mb12"><div class="text-xs text-muted">Family History</div><textarea id="ep-familyhx" class="ppr-input" disabled>${h.familyHx || ''}</textarea></div>
                </div>
                <div id="ppr-tab-systems" class="tab-panel">
                    <div class="alert alert-info text-xs"><i class="bi bi-info-circle"></i> Review of systems recorded during initial registration.</div>
                    <div class="grid3 mb12" style="gap:10px;">
                        ${['Skin', 'Lymph', 'Integument', 'Circulatory', 'Endocrine', 'Allergic', 'Heent', 'Mouth', 'Breast', 'Respiratory', 'Cardiovascular', 'Gastrointestinal', 'Genitourinary', 'Psychiatric'].map(sys =>
                            `<div class="field mb0"><div class="text-xs text-muted">${sys}</div><input type="text" id="ep-sr-${sys.toLowerCase()}" class="ppr-input" value="${h['sr' + sys] || 'Unremarkable'}" disabled></div>`
                        ).join('')}
                    </div>
                </div>
                <div id="ppr-tab-questionnaire" class="tab-panel">
                    <div class="card-title" style="font-size: 1rem;"><i class="bi bi-question-circle"></i> Medical Questionnaire</div>
                    <div class="grid2 mb12">
                        <div class="field mb0"><div class="text-xs text-muted">Hospitalized?</div>
                            <select id="ep-hosp" class="ppr-input" disabled><option value="No" ${q.hosp === 'No' ? 'selected' : ''}>No</option><option value="Yes" ${q.hosp === 'Yes' ? 'selected' : ''}>Yes</option></select>
                        </div>
                        <div class="field mb0"><div class="text-xs text-muted">Illness / Reason</div><input type="text" id="ep-hosp-illness" class="ppr-input" value="${q.hospIllness || ''}" disabled></div>
                        <div class="field mb0"><div class="text-xs text-muted">Surgery?</div>
                            <select id="ep-surg" class="ppr-input" disabled><option value="No" ${q.surg === 'No' ? 'selected' : ''}>No</option><option value="Yes" ${q.surg === 'Yes' ? 'selected' : ''}>Yes</option></select>
                        </div>
                        <div class="field mb0"><div class="text-xs text-muted">Surgery Type</div><input type="text" id="ep-surg-type" class="ppr-input" value="${q.surgType || ''}" disabled></div>
                    </div>
                    <div class="card-title mt16" style="font-size: 1rem; color: var(--maroon);"><i class="bi bi-gender-female"></i> Female Section</div>
                    <div class="grid2 mb12">
                        <div class="field mb0"><div class="text-xs text-muted">Menarche Age</div><input type="text" id="ep-menarche" class="ppr-input" value="${f.menarche || ''}" disabled></div>
                        <div class="field mb0"><div class="text-xs text-muted">Periods / Year</div><input type="text" id="ep-periods" class="ppr-input" value="${f.periodsYr || ''}" disabled></div>
                        <div class="field mb0"><div class="text-xs text-muted">Dysmenorrhea?</div>
                            <select id="ep-dysmen" class="ppr-input" disabled><option value="No" ${f.dysmenorrhea === 'No' ? 'selected' : ''}>No</option><option value="Yes" ${f.dysmenorrhea === 'Yes' ? 'selected' : ''}>Yes</option></select>
                        </div>
                    </div>
                </div>
                <div id="ppr-tab-labs" class="tab-panel">
                    <div class="card-title" style="font-size: 1rem;"><i class="bi bi-file-earmark-medical"></i> Laboratory History</div>
                    <div id="ppr-lab-gallery" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px;">
                        ${(() => {
                            // Find all visits in dailyLog for this patient that have attachments
                            const patientLogs = dailyLog.filter(l => String(l.patientId) === String(uid) && l.exam?.labAttachments);
                            let labHtml = '';
                            
                            patientLogs.forEach(log => {
                                log.exam.labs.forEach((labName, idx) => {
                                    const files = log.exam.labAttachments[idx];
                                    if (files && files.length > 0) {
                                        files.forEach((fileData, fIdx) => {
                                            
                                            // CRITICAL FIX: Properly detect if it's a PDF based on Base64 header OR file path extension
                                            const isBase64 = fileData.startsWith('data:');
                                            const isPdf = (isBase64 && fileData.includes('application/pdf')) || fileData.endsWith('.pdf');

                                            // CRITICAL FIX: Bypass Chrome's block on Base64 PDFs by building a safe iframe window
                                            const clickAction = (isBase64 && isPdf) 
                                                ? `onclick="event.preventDefault(); let w = window.open(''); w.document.write('<iframe src=\\'${fileData}\\' width=\\'100%\\' height=\\'100%\\' style=\\'border:none;\\'></iframe>');"`
                                                : `href="${fileData}" target="_blank"`;

                                            labHtml += `
                                                <div style="border: 1px solid var(--border); border-radius: 8px; padding: 10px; background: #fff; position: relative;">
                                                    <div class="text-xs fw6" style="color: var(--maroon); margin-bottom: 5px;">${labName}</div>
                                                    <div class="text-xs text-muted mb8">Uploaded: ${log.date}</div>
                                                    
                                                    <a ${clickAction} style="display: block; text-decoration: none; cursor: pointer;">
                                                        ${!isPdf 
                                                            ? `<img src="${fileData}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;">` 
                                                            : `<div style="height: 100px; display: flex; align-items: center; justify-content: center; background: #f9f8f6; border-radius: 4px; color: var(--blue); border: 1px solid #eee;"><i class="bi bi-file-pdf" style="font-size: 2rem;"></i></div>`}
                                                        <div class="text-center text-xs mt4" style="color: var(--blue);">Click to View Full</div>
                                                    </a>
                                                </div>`;
                                        });
                                    }
                                });
                            });
                            return labHtml || '<div style="grid-column: span 2; text-align: center; color: var(--text-muted); padding: 20px;">No laboratory results found for this patient.</div>';
                        })()}
                    </div>
                </div>
            </form>
        `;
        const footerHtml = allowEdit ? `
            <div class="modal-footer" style="margin-top:20px; border-top:1px solid var(--border); padding-top:16px; display:flex; justify-content:flex-end; gap:8px;">
                <button class="btn btn-outline" onclick="closePprModal()">Close</button>
                <button class="btn btn-primary" id="btn-edit-ppr" onclick="toggleEditPpr()"><i class="bi bi-pencil"></i> Edit Full Record</button>
            </div>
        ` : `
            <div class="modal-footer" style="margin-top:20px; border-top:1px solid var(--border); padding-top:16px;">
                <button class="btn btn-outline" onclick="closePprModal()">Close</button>
            </div>
        `;
        document.getElementById('view-modal-content').innerHTML = html + footerHtml;
        openModal('modal-view');
    } catch (e) {
        document.getElementById('view-modal-content').innerHTML = `<div class="alert alert-danger">Connection error fetching records.</div>`;
        openModal('modal-view');
    }
}

function switchPprTab(tabName) {
    // Add 'labs' to the array below
    ['personal', 'health', 'systems', 'questionnaire', 'labs'].forEach((t, i) => {
        const p = document.getElementById('ppr-tab-' + t);
        if (p) p.classList.toggle('active', t === tabName);
        const tabEl = document.querySelectorAll('#ppr-view-tabs .tab')[i];
        if (tabEl) tabEl.classList.toggle('active', t === tabName);
    });
}

function toggleEditPpr() {
    isEditingPpr = true;
    document.querySelectorAll('.ppr-input').forEach(el => el.disabled = false);
    const btn = document.getElementById('btn-edit-ppr');
    btn.innerHTML = '<i class="bi bi-check-circle"></i> Save All Changes';
    btn.classList.replace('btn-primary', 'btn-success');
    btn.onclick = savePprData;
}

function closePprModal() {
    if (isEditingPpr) {
        if (confirm("You have unsaved changes. Do you want to save them before closing?")) {
            savePprData();
        } else {
            closeModal('modal-view');
        }
    } else {
        closeModal('modal-view');
    }
}

async function savePprData() {
    const payload = {
        action: 'update_ppr',
        uid: currentPatId,
        user: {
            fname: document.getElementById('ep-fname').value,
            mname: document.getElementById('ep-mname').value,
            lname: document.getElementById('ep-lname').value
        },
        permanent: {
            pattype: document.getElementById('ep-pattype').value,
            dept: document.getElementById('ep-dept').value,
            year: document.getElementById('ep-year').value
        },
        demographics: {
            dob: document.getElementById('ep-dob').value,
            sex: document.getElementById('ep-sex').value,
            civil: document.getElementById('ep-civil').value,
            contact: document.getElementById('ep-contact').value,
            religion: document.getElementById('ep-religion').value,
            address: document.getElementById('ep-address').value
        },
        health: {
            height: document.getElementById('ep-height').value,
            weight: document.getElementById('ep-weight').value,
            bp: document.getElementById('ep-bp').value,
            pr: document.getElementById('ep-pr').value,
            rr: document.getElementById('ep-rr').value,
            temp: document.getElementById('ep-temp').value,
            infectious: document.getElementById('ep-infectious').value,
            socialHx: document.getElementById('ep-socialhx').value,
            familyHx: document.getElementById('ep-familyhx').value,
            srSkin: document.getElementById('ep-sr-skin').value,
            srLymph: document.getElementById('ep-sr-lymph').value,
            srIntegument: document.getElementById('ep-sr-integument').value,
            srCirculatory: document.getElementById('ep-sr-circulatory').value,
            srEndocrine: document.getElementById('ep-sr-endocrine').value,
            srAllergic: document.getElementById('ep-sr-allergic').value,
            srHeent: document.getElementById('ep-sr-heent').value,
            srMouth: document.getElementById('ep-sr-mouth').value,
            srBreast: document.getElementById('ep-sr-breast').value,
            srRespiratory: document.getElementById('ep-sr-respiratory').value,
            srCardiovascular: document.getElementById('ep-sr-cardiovascular').value,
            srGastrointestinal: document.getElementById('ep-sr-gastrointestinal').value,
            srGenitourinary: document.getElementById('ep-sr-genitourinary').value,
            srPsychiatric: document.getElementById('ep-sr-psychiatric').value
        },
        quest: {
            hosp: document.getElementById('ep-hosp').value,
            hospIllness: document.getElementById('ep-hosp-illness').value,
            surg: document.getElementById('ep-surg').value,
            surgType: document.getElementById('ep-surg-type').value,
            menarche: document.getElementById('ep-menarche').value,
            periods: document.getElementById('ep-periods').value,
            dysmen: document.getElementById('ep-dysmen').value
        }
    };
    try {
        let res = await fetch('backend/api_records.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        let data = await res.json();
        if (data.status === 'success') {
            toast('Permanent Patient Records updated successfully!', 'success');
            isEditingPpr = false;
            closeModal('modal-view');
            // Refresh data and current view
            await syncLoad();
            await fetchAllPatients();
            if (document.getElementById('page-nurse').classList.contains('active')) {
                nurseNav(localStorage.getItem('ucims-nurse-nav') || 'queue');
            } else if (document.getElementById('page-doctor').classList.contains('active')) {
                docNav(localStorage.getItem('ucims-doc-nav') || 'consult');
            } else if (document.getElementById('page-admin').classList.contains('active')) {
                // Admin may need refresh of patient list
                await fetchAllPatients();
                renderAdminValidation(document.getElementById('admin-main'));
            }
        } else {
            toast('Failed to save: ' + data.message, 'error');
            if (data.errors) {
                alert("DATABASE ERRORS:\n" + data.errors.join("\n"));
            }
        }
    } catch (e) {
        toast('Connection error while saving.', 'error');
    }
}

// ==========================================
// DOCTOR: OPEN VISIT SUMMARY MODAL (from daily log)
// ==========================================
function openVisitSummaryModal(qnum) {
    const log = dailyLog.find(l => l.queueNum == qnum);
    if (!log) {
        toast('Record not found in the daily log.', 'error');
        return;
    }
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
// NURSE: OPEN QUEUE ENTRY DETAILS (simple view)
// ==========================================
function openViewModal(qnum) {
    const e = queue.find(q => q.queueNum == qnum);
    if (!e) return;
    const u = getUserById(e.patientId);
    const demo = u?.demographics || {};
    const perm = u?.permanent || {};
    let html = `
        <div class="profile-head" style="margin-bottom:16px;">
            <div class="profile-avatar">${e.name[0]}</div>
            <div><div class="profile-name">${e.name}</div><div class="profile-meta">#${e.queueNum} · ${e.visitLabel || e.purpose} · Arrived ${e.time}</div></div>
        </div>
        <div class="grid2 mb12">
            <div><span class="text-muted">ID Number:</span> ${e.patientId}</div>
            <div><span class="text-muted">Course/Year:</span> ${perm.dept || '—'} ${perm.yearLevel || ''}</div>
            <div><span class="text-muted">Contact:</span> ${demo.contact || '—'}</div>
            <div><span class="text-muted">Emergency Contact:</span> ${demo.emname || '—'} (${demo.emrel || ''})</div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline" onclick="closeModal('modal-view')">Close</button>
            <button class="btn btn-primary" onclick="closeModal('modal-view'); openPatRecord('${e.patientId}', true)">View Full PPR</button>
        </div>
    `;
    document.getElementById('view-modal-content').innerHTML = html;
    openModal('modal-view');
}

// ==========================================
// INITIALIZATION (already called from DOMContentLoaded in modals.js? We'll keep)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    wireLogo();
    renderPPR();
    document.getElementById('login-staffpw')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    document.getElementById('login-idnum')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    document.querySelectorAll('.modal-overlay').forEach(ov => {
        ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
    });
    // Wait for PostgreSQL to load queue and then restore session
    await syncLoad();
    await restoreSession();
});