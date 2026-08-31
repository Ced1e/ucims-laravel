/* assets/js/admin.js — Admin interface (session-aware, full DB integration) */
let activeRoleTab = 'nurse';
let chartInstances = {};
let filteredStatData = [];
let currentTableGroup = 'day';
let dbStaff = [];

async function adminNav(sec) {
    localStorage.setItem('ucims-admin-nav', sec);
    ['stats', 'accounts', 'auth', 'validation'].forEach(s => {
        const el = document.getElementById('an-' + s);
        if (el) el.classList.toggle('active', s === sec);
    });
    const m = document.getElementById('admin-main');
    if (sec === 'stats') renderAdminStats(m);
    if (sec === 'accounts') {
        m.innerHTML = '<div style="padding:40px;text-align:center;">Loading staff records...</div>';
        await fetchStaffDB();
        renderAdminAccounts(m);
    }
    if (sec === 'auth') renderAdminAuth(m);
    if (sec === 'validation') renderAdminValidation(m);
}

async function fetchStaffDB() {
    try {
        let res = await fetch('backend/api_records.php?action=get_staff');
        let data = await res.json();
        if (data.status === 'success') {
            dbStaff = data.staff || [];
        }
    } catch (e) {
        console.error("Error fetching staff:", e);
        toast("Could not load staff list.", "error");
    }
}

function switchRoleTab(role) {
    activeRoleTab = role;
    renderAdminAccounts(document.getElementById('admin-main'));
}

function renderAdminAccounts(m) {
    const nurseCount = dbStaff.filter(u => u.role === 'nurse').length;
    const docCount = dbStaff.filter(u => u.role === 'doctor').length;
    const adminCount = dbStaff.filter(u => u.role === 'admin').length;
    const patCount = window.dbPatients ? window.dbPatients.length : 0;

    m.innerHTML = `
        <div class="page-header">
            <h1>Account Creation & Management</h1>
            <p>Manage staff accounts — nurses, doctors, and administrators.</p>
        </div>
        <div class="stats-row mb16">
            <div class="stat-card"><div class="stat-num" style="color:var(--maroon);">${nurseCount}</div><div class="stat-label">NURSES</div></div>
            <div class="stat-card"><div class="stat-num" style="color:var(--gold);">${docCount}</div><div class="stat-label">DOCTORS</div></div>
            <div class="stat-card"><div class="stat-num" style="color:var(--blue);">${adminCount}</div><div class="stat-label">ADMINS</div></div>
            <div class="stat-card"><div class="stat-num" style="color:var(--green);">${patCount}</div><div class="stat-label">PATIENTS</div></div>
        </div>
        <div style="display: grid; grid-template-columns: 1.3fr 1fr; gap: 20px; align-items: start;">
            <div class="card">
                <div class="card-title">Create Staff Account</div>
                <div class="tabs mb16" id="staff-role-tabs">
                    <button class="tab active" onclick="selStaffRole('nurse')">Nurse</button>
                    <button class="tab" onclick="selStaffRole('doctor')">Doctor</button>
                    <button class="tab" onclick="selStaffRole('admin')">Admin</button>
                </div>
                <input type="hidden" id="cs-role" value="nurse">
                <div class="card-title" style="font-size:.9rem; color:var(--maroon);"><i class="bi bi-person-badge"></i> 1. Personal & Contact</div>
                <div class="grid3">
                    <div class="field"><label>First Name *</label><input id="cs-fname" placeholder="Juan"></div>
                    <div class="field"><label>Middle Name</label><input id="cs-mname" placeholder="Santos"></div>
                    <div class="field"><label>Last Name *</label><input id="cs-lname" placeholder="dela Cruz"></div>
                </div>
                <div class="grid3">
                    <div class="field"><label>Sex *</label><select id="cs-sex"><option>Male</option><option>Female</option></select></div>
                    <div class="field"><label>Date of Birth *</label><input type="date" id="cs-dob"></div>
                    <div class="field"><label>Mobile No. *</label><input id="cs-mobile" placeholder="09xx-xxx-xxxx"></div>
                </div>
                <div class="grid2">
                    <div class="field"><label>Landline No.</label><input id="cs-landline" placeholder="(082) xxx-xxxx"></div>
                    <div class="field"><label>USeP Email *</label><input type="email" id="cs-email" placeholder="staff@usep.edu.ph"></div>
                </div>
                <div class="card-title mt16" style="font-size:.9rem; color:var(--maroon);"><i class="bi bi-geo-alt"></i> 2. Complete Address</div>
                <div class="grid3">
                    <div class="field"><label>Block/House No.</label><input id="cs-block" placeholder="Blk 1 Lot 2"></div>
                    <div class="field"><label>Street</label><input id="cs-street" placeholder="Main St."></div>
                    <div class="field"><label>Barangay *</label><input id="cs-brgy" placeholder="Obrero"></div>
                </div>
                <div class="grid2">
                    <div class="field"><label>City/Municipality *</label><input id="cs-city" placeholder="Davao City"></div>
                    <div class="field"><label>Province</label><input id="cs-prov" placeholder="Davao del Sur"></div>
                </div>
                <div class="card-title mt16" style="font-size:.9rem; color:var(--maroon);"><i class="bi bi-briefcase"></i> 3. Employment Details</div>
                <div class="grid3">
                    <div class="field"><label>Status *</label><select id="cs-emp-stat"><option>Full-time</option><option>Part-time</option><option>Contractual</option></select></div>
                    <div class="field"><label>Schedule *</label><input id="cs-sched" placeholder="MWF 8AM-5PM"></div>
                    <div class="field"><label>Role Description</label><input id="cs-roledesc" placeholder="e.g. Triage Nurse"></div>
                </div>
                <div class="card-title mt16" style="font-size:.9rem; color:var(--maroon);"><i class="bi bi-shield-lock"></i> 4. System Credentials</div>
                <div class="grid2 mb16">
                    <div class="field mb0"><label>Clinic ID Number *</label><input id="cs-cid" value="N-" placeholder="N-001"></div>
                    <div class="field mb0"><label>Password *</label><input type="password" id="cs-pass" placeholder="••••••••"></div>
                </div>
                <button class="btn btn-primary w100" onclick="createStaffAccount()"><i class="bi bi-person-plus"></i> Create Account</button>
            </div>
            <div class="card">
                <div class="card-title">Active Staff</div>
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>ID</th><th>Name & Role</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody id="admin-staff-list">
                            ${renderStaffList()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderStaffList() {
    if (!dbStaff.length) return `<tr><td colspan="4" class="text-center text-muted p16">No staff found in database.</td></tr>`;
    return dbStaff.map(u => `
        <tr>
            <td class="text-xs fw6">${u.clinicId || u.id}</td>
            <td><div class="fw6">${u.name}</div><div class="text-xs text-muted" style="text-transform:capitalize;">${u.role}</div></td>
            <td><span class="badge b-green">Active</span></td>
            <td>
                <div style="display:flex; gap:6px;">
                    <button class="btn btn-outline btn-sm" onclick="openEditStaff('${u.id}')" title="Edit Profile"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-outline btn-sm" onclick="resetStaffPass('${u.id}')" title="Reset Password"><i class="bi bi-key"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="disableStaff('${u.id}')" title="Disable Account"><i class="bi bi-person-x"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function selStaffRole(r) {
    document.getElementById('cs-role').value = r;
    const tabs = document.querySelectorAll('#staff-role-tabs .tab');
    tabs[0].classList.toggle('active', r === 'nurse');
    tabs[1].classList.toggle('active', r === 'doctor');
    tabs[2].classList.toggle('active', r === 'admin');
    const idBox = document.getElementById('cs-cid');
    if (r === 'nurse') idBox.value = 'N-';
    if (r === 'doctor') idBox.value = 'D-';
    if (r === 'admin') idBox.value = 'A-';
}

let currentEditStaffId = null;

function openEditStaff(id) {
    const u = dbStaff.find(x => String(x.id) === String(id));
    if (!u) return;
    currentEditStaffId = u.id;
    const hr = u.hrProfile || {};
    document.getElementById('edit-staff-id-label').innerHTML = `<b>${u.clinicId || id}</b> · ${u.role.toUpperCase()}`;
    document.getElementById('edit-staff-content').innerHTML = `
        <div class="card-title" style="font-size:.9rem; color:var(--maroon);"><i class="bi bi-person-badge"></i> 1. Personal & Contact</div>
        <div class="grid3">
            <div class="field"><label>First Name *</label><input id="es-fname" value="${hr.fname || ''}"></div>
            <div class="field"><label>Middle Name</label><input id="es-mname" value="${hr.mname || ''}"></div>
            <div class="field"><label>Last Name *</label><input id="es-lname" value="${hr.lname || ''}"></div>
        </div>
        <div class="grid3">
            <div class="field"><label>Sex *</label><select id="es-sex"><option ${hr.sex === 'Male' ? 'selected' : ''}>Male</option><option ${hr.sex === 'Female' ? 'selected' : ''}>Female</option></select></div>
            <div class="field"><label>Date of Birth *</label><input type="date" id="es-dob" value="${hr.dob || ''}"></div>
            <div class="field"><label>Mobile No. *</label><input id="es-mobile" value="${hr.mobile || ''}"></div>
        </div>
        <div class="grid2">
            <div class="field"><label>Landline No.</label><input id="es-landline" value="${hr.landline || ''}"></div>
            <div class="field"><label>USeP Email *</label><input type="email" id="es-email" value="${u.email || ''}"></div>
        </div>
        <div class="card-title mt16" style="font-size:.9rem; color:var(--maroon);"><i class="bi bi-geo-alt"></i> 2. Complete Address</div>
        <div class="grid3">
            <div class="field"><label>Block/House No.</label><input id="es-block" value="${hr.block || ''}"></div>
            <div class="field"><label>Street</label><input id="es-street" value="${hr.street || ''}"></div>
            <div class="field"><label>Barangay *</label><input id="es-brgy" value="${hr.brgy || ''}"></div>
        </div>
        <div class="grid2">
            <div class="field"><label>City/Municipality *</label><input id="es-city" value="${hr.city || ''}"></div>
            <div class="field"><label>Province</label><input id="es-prov" value="${hr.prov || ''}"></div>
        </div>
        <div class="card-title mt16" style="font-size:.9rem; color:var(--maroon);"><i class="bi bi-briefcase"></i> 3. Employment Details</div>
        <div class="grid3 mb16">
            <div class="field"><label>Status *</label><select id="es-emp-stat"><option ${hr.empStat === 'Full-time' ? 'selected' : ''}>Full-time</option><option ${hr.empStat === 'Part-time' ? 'selected' : ''}>Part-time</option><option ${hr.empStat === 'Contractual' ? 'selected' : ''}>Contractual</option></select></div>
            <div class="field"><label>Schedule *</label><input id="es-sched" value="${hr.schedule || ''}"></div>
            <div class="field"><label>Role Description</label><input id="es-roledesc" value="${hr.roleDesc || ''}"></div>
        </div>
    `;
    openModal('modal-edit-staff');
}

async function saveStaffEdit() {
    const payload = {
        action: 'update_staff',
        uid: currentEditStaffId,
        hr: {
            fname: val('es-fname'), mname: val('es-mname'), lname: val('es-lname'), email: val('es-email'),
            sex: val('es-sex'), dob: val('es-dob'), mobile: val('es-mobile'), landline: val('es-landline'),
            block: val('es-block'), street: val('es-street'), brgy: val('es-brgy'), city: val('es-city'), prov: val('es-prov'),
            empStat: val('es-emp-stat'), sched: val('es-sched'), roleDesc: val('es-roledesc')
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
            toast('Staff profile updated successfully!', 'success');
            closeModal('modal-edit-staff');
            await fetchStaffDB();
            renderAdminAccounts(document.getElementById('admin-main'));
        } else {
            toast(data.message || 'Database error.', 'error');
        }
    } catch (err) {
        toast('Server connection error.', 'error');
    }
}

async function createStaffAccount() {
    const payload = {
        action: 'create_staff',
        role: document.getElementById('cs-role').value,
        fname: val('cs-fname'), mname: val('cs-mname'), lname: val('cs-lname'),
        sex: val('cs-sex'), dob: val('cs-dob'), mobile: val('cs-mobile'), landline: val('cs-landline'), email: val('cs-email'),
        block: val('cs-block'), street: val('cs-street'), brgy: val('cs-brgy'), city: val('cs-city'), prov: val('cs-prov'),
        empStat: val('cs-emp-stat'), sched: val('cs-sched'), roleDesc: val('cs-roledesc'),
        cid: val('cs-cid'), pass: val('cs-pass')
    };
    if (!payload.fname || !payload.lname || !payload.sex || !payload.dob || !payload.mobile || !payload.email || !payload.brgy || !payload.city || !payload.empStat || !payload.sched || !payload.cid || payload.pass.length < 6) {
        toast('Please fill all required (*) fields. Password min 6 chars.', 'error');
        return;
    }
    try {
        let res = await fetch('backend/api_records.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        let data = await res.json();
        if (data.status === 'success') {
            toast(`Account for ${payload.fname} created successfully!`, 'success');
            await fetchStaffDB();
            renderAdminAccounts(document.getElementById('admin-main'));
        } else {
            toast(data.message || 'Database error.', 'error');
        }
    } catch (err) {
        toast('Server connection error.', 'error');
    }
}

async function resetStaffPass(uid) {
    const newPass = prompt("Enter new password (min 6 characters):");
    if (!newPass || newPass.length < 6) {
        toast("Password must be at least 6 characters.", "error");
        return;
    }
    try {
        let res = await fetch('backend/api_records.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset_staff_password', uid: uid, new_password: newPass })
        });
        let data = await res.json();
        if (data.status === 'success') {
            toast("Password reset successfully.");
        } else {
            toast(data.message, "error");
        }
    } catch (e) {
        toast("Server error.", "error");
    }
}

async function disableStaff(uid) {
    if (!confirm("Disable this staff account? They will no longer be able to log in.")) return;
    try {
        let res = await fetch('backend/api_records.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'disable_staff', uid: uid })
        });
        let data = await res.json();
        if (data.status === 'success') {
            toast("Staff account disabled.");
            await fetchStaffDB();
            renderAdminAccounts(document.getElementById('admin-main'));
        } else {
            toast(data.message, "error");
        }
    } catch (e) {
        toast("Server error.", "error");
    }
}

// ==========================================
// AUTHORIZATION & VALIDATION
// ==========================================
function renderAdminAuth(m) {
    // We need a list of staff from DB for the dropdown
    const staffList = dbStaff.filter(u => u.role !== 'patient' && u.role !== 'inactive');
    m.innerHTML = `
        <div class="page-header"><h1>System Authorization Management</h1><p>Control user roles and feature access permissions across the system.</p></div>
        <div class="grid2" style="align-items: start;">
            <div class="card">
                <div class="card-title">Modify User Role</div>
                <div class="text-sm text-muted mb8">Elevate or demote permissions for existing staff members.</div>
                <div class="field-row mt12">
                    <div class="field"><label>Select User</label>
                        <select id="auth-uid"><option value="" disabled selected hidden>— Select Staff —</option>
                            ${staffList.map(u => `<option value="${u.id}">${u.name} (${u.role.toUpperCase()})</option>`).join('')}
                        </select>
                    </div>
                    <div class="field"><label>New Role</label>
                        <select id="auth-role"><option value="nurse">Nurse</option><option value="doctor">Doctor</option><option value="admin">Admin</option></select>
                    </div>
                </div>
                <button class="btn btn-primary w100 mt8" onclick="changeRole()"><i class="bi bi-arrow-repeat"></i> Update Role Authorization</button>
            </div>
            <div class="card">
                <div class="card-title">Role Permissions Overview</div>
                <div class="table-wrap">
                    <thead><tr><th>Feature Module</th><th>Patient</th><th>Nurse</th><th>Doctor</th><th>Admin</th></tr></thead>
                    <tbody>
                        ${[
                            ['Patient Registration', '<i class="bi bi-check-lg" style="color:var(--green);"></i>', '', '', '<i class="bi bi-check-lg" style="color:var(--green);"></i>'],
                            ['Queue Entry', '<i class="bi bi-check-lg" style="color:var(--green);"></i>', '', '', ''],
                            ['Queue Monitoring', '', '<i class="bi bi-check-lg" style="color:var(--green);"></i>', '', ''],
                            ['Triage Assessment', '', '<i class="bi bi-check-lg" style="color:var(--green);"></i>', '', ''],
                            ['Record Management', '', '<i class="bi bi-check-lg" style="color:var(--green);"></i>', '', ''],
                            ['Certificate Processing', '', '<i class="bi bi-check-lg" style="color:var(--green);"></i>', '', ''],
                            ['Daily Patient Log', '', '<i class="bi bi-check-lg" style="color:var(--green);"></i>', '<i class="bi bi-check-lg" style="color:var(--green);"></i>', '<i class="bi bi-check-lg" style="color:var(--green);"></i>'],
                            ['Medical Examination', '', '', '<i class="bi bi-check-lg" style="color:var(--green);"></i>', ''],
                            ['Prescriptions', '', '', '<i class="bi bi-check-lg" style="color:var(--green);"></i>', ''],
                            ['Account Creation', '', '', '', '<i class="bi bi-check-lg" style="color:var(--green);"></i>'],
                        ].map(r => `<tr>${r.map((c, i) => `<td ${i === 0 ? 'class="fw6"' : 'style="text-align:center;"'}>${c}</td>`).join('')}</tr>`).join('')}
                    </tbody>
                </table></div>
            </div>
        </div>
    `;
}

async function changeRole() {
    const uid = val('auth-uid');
    const role = val('auth-role');
    if (!uid) { toast('Please select a user.', 'error'); return; }
    try {
        let res = await fetch('backend/api_records.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_role', uid: uid, role: role })
        });
        let data = await res.json();
        if (data.status === 'success') {
            toast(`Role updated to ${role}.`);
            await fetchStaffDB();  // refresh local staff list
            renderAdminAuth(document.getElementById('admin-main'));
        } else {
            toast(data.message, 'error');
        }
    } catch (e) {
        toast('Server error.', 'error');
    }
}

async function deactivateAccount(uid) {
    if (!confirm('Deactivate this account? The user will no longer be able to log in.')) return;
    try {
        let res = await fetch('backend/api_records.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'deactivate_staff', uid: uid })
        });
        let data = await res.json();
        if (data.status === 'success') {
            toast('Account deactivated.');
            await fetchStaffDB();
            renderAdminAccounts(document.getElementById('admin-main'));
        } else {
            toast(data.message, 'error');
        }
    } catch (e) {
        toast('Server error.', 'error');
    }
}

function renderAdminValidation(m) {
    const total = window.dbPatients ? window.dbPatients.length : 0;
    const withDept = window.dbPatients ? window.dbPatients.filter(p => p.permanent?.dept).length : 0;
    m.innerHTML = `
        <div class="page-header"><h1>Record Validation</h1><p>Review and validate system data integrity and record completeness.</p></div>
        <div class="stats-row">
            <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Total Patients</div></div>
            <div class="stat-card stat-green"><div class="stat-num">${withDept}</div><div class="stat-label">Complete Profiles</div></div>
            <div class="stat-card stat-gold"><div class="stat-num">${total - withDept}</div><div class="stat-label">Incomplete Profiles</div></div>
            <div class="stat-card stat-blue"><div class="stat-num">${dailyLog.length}</div><div class="stat-label">Total Log Entries</div></div>
        </div>
        <div class="card">
            <div class="card-title">Patient Record Completeness Report</div>
            <div class="text-sm text-muted mb12">Identifies which patients are missing critical data modules.</div>
            <div class="table-wrap mt8">
                <thead><tr><th>Patient</th><th>Demographics</th><th>Health Records</th><th>Questionnaire</th><th>Permanent</th><th>Status</th></tr></thead>
                <tbody>
                    ${(window.dbPatients || []).map(u => {
                        const hasDem = !!(u.demographics?.dob && u.demographics?.contact);
                        const hasHlth = !!(u.healthRecord?.genAppearance); // placeholder; actual data may be deeper
                        const hasQuest = !!(u.questionnaire?.syncope);
                        const hasPerm = !!(u.permanent?.dept);
                        const ok = hasDem && hasHlth && hasPerm;
                        const chk = v => `<td style="text-align:center;">${v ? '<span class="badge b-green"><i class="bi bi-check"></i></span>' : '<span class="badge b-red"><i class="bi bi-x"></i></span>'}</td>`;
                        return `<tr><td><div class="fw6">${u.name}</div><div class="text-xs text-muted">${u.patientId || u.id}</div></td>${chk(hasDem)}${chk(hasHlth)}${chk(hasQuest)}${chk(hasPerm)}<td style="text-align:center;">${ok ? '<span class="badge b-green">Complete</span>' : '<span class="badge b-yellow">Incomplete</span>'}</td></tr>`;
                    }).join('') || '<tr><td colspan="6" class="center text-muted p16">No patients registered.</td></tr>'}
                </tbody>
            </table></div>
        </div>
    `;
}

// ==========================================
// CLINIC ANALYTICS & STATISTICS DASHBOARD
// ==========================================
function renderAdminStats(m) {
    m.innerHTML = `
        <div class="page-header">
            <h1>Clinic Analytics & Statistics</h1>
            <p>Monitor consultation trends, averages, and demographic breakdowns.</p>
        </div>
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-title" style="font-size: 0.9rem;"><i class="bi bi-funnel"></i> Filter Data</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                <div class="field mb0">
                    <div class="text-xs text-muted mb4">Search Patient</div>
                    <input type="text" id="stat-search" class="ppr-input" placeholder="Name or ID..." oninput="updateStats()">
                </div>
                <div class="field mb0">
                    <div class="text-xs text-muted mb4">College</div>
                    <select id="stat-college" class="ppr-input" onchange="updateStats()">
                        <option value="">All Colleges</option>
                        <option>CIC</option><option>CT</option><option>COE</option><option>CAS</option><option>CAEC</option><option>CBA</option><option>CED</option>
                    </select>
                </div>
                <div class="field mb0">
                    <div class="text-xs text-muted mb4">Year Level</div>
                    <select id="stat-year" class="ppr-input" onchange="updateStats()">
                        <option value="">All Years</option>
                        <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>5th Year</option>
                    </select>
                </div>
                <div class="field mb0">
                    <div class="text-xs text-muted mb4">Handled By (Staff)</div>
                    <select id="stat-staff" class="ppr-input" onchange="updateStats()">
                        <option value="">All Staff</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="stats-row" id="stat-kpis" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;"></div>
        <div class="card" style="margin-bottom: 20px;">
            <div class="card-title">Overall Consultation Trends</div>
            <div style="position: relative; height: 250px;"><canvas id="trendChart"></canvas></div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div class="card"><div class="card-title">Average Consults by Day of Week</div><div style="position: relative; height: 250px;"><canvas id="avgDayChart"></canvas></div></div>
            <div class="card"><div class="card-title">Consultation Types Comparison</div><div style="position: relative; height: 250px;"><canvas id="typeChart"></canvas></div></div>
        </div>
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border); margin-bottom: 16px;">
                <div class="card-title" style="margin-bottom: 0;">Consultation Data Table</div>
                <div class="tabs" style="border: none; margin-bottom: 0;" id="table-group-tabs">
                    <button class="tab active" onclick="switchTableGroup('day')">Daily</button>
                    <button class="tab" onclick="switchTableGroup('week')">Weekly</button>
                    <button class="tab" onclick="switchTableGroup('month')">Monthly</button>
                </div>
            </div>
            <div class="table-wrap" id="stat-table-container"></div>
        </div>
    `;
    populateStaffDropdown();
    updateStats();
}

function populateStaffDropdown() {
    const staffSelect = document.getElementById('stat-staff');
    if (!staffSelect) return;
    const uniqueStaff = [...new Set(dailyLog.map(log => log.doctor))].filter(Boolean);
    uniqueStaff.forEach(staff => {
        let opt = document.createElement('option');
        opt.value = staff;
        opt.textContent = staff;
        staffSelect.appendChild(opt);
    });
}

function updateStats() {
    const qSearch = (document.getElementById('stat-search')?.value || '').toLowerCase();
    const qCollege = document.getElementById('stat-college')?.value || '';
    const qYear = document.getElementById('stat-year')?.value || '';
    const qStaff = document.getElementById('stat-staff')?.value || '';
    filteredStatData = dailyLog.filter(log => {
        if (qSearch && !log.name.toLowerCase().includes(qSearch) && !String(log.patientId).toLowerCase().includes(qSearch)) return false;
        if (qCollege && log.college !== qCollege) return false;
        if (qYear && log.year !== qYear) return false;
        if (qStaff && log.doctor !== qStaff) return false;
        return true;
    });
    renderKpis(filteredStatData);
    renderCharts(filteredStatData);
    renderStatTable(filteredStatData, currentTableGroup);
}

function renderKpis(data) {
    const kpiContainer = document.getElementById('stat-kpis');
    if (!kpiContainer) return;
    const total = data.length;
    const uniqueDates = [...new Set(data.map(d => d.date))];
    const avgPerDay = uniqueDates.length > 0 ? (total / uniqueDates.length).toFixed(1) : 0;
    kpiContainer.innerHTML = `
        <div class="stat-card" style="border-top-color: var(--maroon);"><div class="stat-num">${total}</div><div class="stat-label">Total Consultations Filtered</div></div>
        <div class="stat-card" style="border-top-color: var(--gold);"><div class="stat-num" style="color: var(--gold);">${avgPerDay}</div><div class="stat-label">Overall Average / Day</div></div>
    `;
}

function renderCharts(data) {
    let dateGroups = {};
    data.forEach(d => { dateGroups[d.date] = (dateGroups[d.date] || 0) + 1; });
    const sortedDates = Object.keys(dateGroups).sort();
    const trendValues = sortedDates.map(date => dateGroups[date]);
    if (chartInstances['trend']) chartInstances['trend'].destroy();
    chartInstances['trend'] = new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: { labels: sortedDates, datasets: [{ label: 'Total Consultations', data: trendValues, borderColor: '#7B1113', backgroundColor: 'rgba(123,17,19,0.1)', borderWidth: 3, tension: 0.3, fill: true, pointBackgroundColor: '#C9A227', pointRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
    let dayCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let dayOccurrences = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };
    data.forEach(d => {
        let dayIndex = new Date(d.date).getDay();
        if (dayIndex >= 1 && dayIndex <= 5) {
            dayCounts[dayIndex]++;
            dayOccurrences[dayIndex].add(d.date);
        }
    });
    let avgData = [1, 2, 3, 4, 5].map(i => {
        let totalSpecificDays = dayOccurrences[i].size || 1;
        return dayCounts[i] === 0 ? 0 : (dayCounts[i] / totalSpecificDays).toFixed(1);
    });
    if (chartInstances['avgDay']) chartInstances['avgDay'].destroy();
    chartInstances['avgDay'] = new Chart(document.getElementById('avgDayChart'), {
        type: 'pie',
        data: { labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], datasets: [{ data: avgData, backgroundColor: ['#7B1113', '#9B1E20', '#C9A227', '#1A3A6B', '#2D6A2D'], borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
    let typeGroups = { 'checkup': 0, 'medicine': 0, 'follow-up': 0, 'medcert': 0 };
    data.forEach(d => { if (typeGroups[d.purposeType] !== undefined) typeGroups[d.purposeType]++; });
    if (chartInstances['type']) chartInstances['type'].destroy();
    chartInstances['type'] = new Chart(document.getElementById('typeChart'), {
        type: 'bar',
        data: { labels: ['Check-up', 'Med Request', 'Follow-up', 'Med Cert'], datasets: [{ label: 'Count', data: [typeGroups['checkup'], typeGroups['medicine'], typeGroups['follow-up'], typeGroups['medcert']], backgroundColor: ['#7B1113', '#C9A227', '#1A3A6B', '#2D6A2D'], borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
}

function getWeekStr(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return "Week of " + monday.toISOString().split('T')[0];
}
function getMonthStr(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

function switchTableGroup(groupType) {
    currentTableGroup = groupType;
    ['day', 'week', 'month'].forEach((t, i) => {
        const tabEl = document.querySelectorAll('#table-group-tabs .tab')[i];
        if (tabEl) tabEl.classList.toggle('active', t === groupType);
    });
    renderStatTable(filteredStatData, groupType);
}

function renderStatTable(data, groupBy) {
    const tableContainer = document.getElementById('stat-table-container');
    if (!tableContainer) return;
    let groups = {};
    data.forEach(d => {
        let key = d.date;
        if (groupBy === 'week') key = getWeekStr(d.date);
        if (groupBy === 'month') key = getMonthStr(d.date);
        if (!groups[key]) groups[key] = { total: 0, checkup: 0, medicine: 0, followup: 0, medcert: 0 };
        groups[key].total++;
        if (d.purposeType === 'checkup') groups[key].checkup++;
        if (d.purposeType === 'medicine') groups[key].medicine++;
        if (d.purposeType === 'follow-up') groups[key].followup++;
        if (d.purposeType === 'medcert') groups[key].medcert++;
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => new Date(b.replace('Week of ', '')) - new Date(a.replace('Week of ', '')));
    if (sortedKeys.length === 0) {
        tableContainer.innerHTML = '<div class="empty-state"><p>No data matches the selected filters.</p></div>';
        return;
    }
    tableContainer.innerHTML = `
        <table>
            <thead><tr><th>Time Period</th><th>Total Patients</th><th>Check-ups</th><th>Med Requests</th><th>Follow-ups</th><th>Med Certs</th></tr></thead>
            <tbody>${sortedKeys.map(k => `<tr><td class="fw6">${k}</td><td><span class="badge b-blue" style="font-size: 0.9rem;">${groups[k].total}</span></td><td>${groups[k].checkup}</td><td>${groups[k].medicine}</td><td>${groups[k].followup}</td><td>${groups[k].medcert}</td></tr>`).join('')}</tbody>
        </table>
    `;
}