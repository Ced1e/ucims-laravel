/* auth.js - Login, Registration, Logout (session-based, no localStorage tokens) */

let loginRole = 'patient';  // 'patient' or 'staff'

// ==========================================
// ROLE SWITCHER (Patient / Staff tabs)
// ==========================================
function setRole(r) {
    loginRole = r;
    // Update tab active styles
    const tabs = document.querySelectorAll('.role-tab');
    if (tabs.length >= 2) {
        tabs[0].classList.toggle('active', r === 'patient');
        tabs[1].classList.toggle('active', r === 'staff');
    }
    // Show/hide corresponding input fields
    const patFields = document.getElementById('login-pat-fields');
    const staffFields = document.getElementById('login-staff-fields');
    const regLink = document.getElementById('login-register-link');
    if (r === 'patient') {
        if (patFields) patFields.style.display = 'block';
        if (staffFields) staffFields.style.display = 'none';
        if (regLink) regLink.style.display = 'block';
    } else {
        if (patFields) patFields.style.display = 'none';
        if (staffFields) staffFields.style.display = 'block';
        if (regLink) regLink.style.display = 'none';
    }
}

// ==========================================
// LOGIN FUNCTION
// ==========================================
async function doLogin() {
    const err = document.getElementById('login-error');
    err.style.display = 'none';
    let payload = { loginRole: loginRole };
    if (loginRole === 'patient') {
        payload.email = val('login-email').trim();
        payload.idNum = val('login-idnum').trim();
        if (!payload.email || !payload.idNum) {
            showErr(err, 'Please enter your email address and ID number.');
            return;
        }
    } else {
        payload.clinicId = val('login-clinicid').trim();
        payload.password = val('login-staffpw').trim();
        if (!payload.clinicId || !payload.password) {
            showErr(err, 'Please enter your Clinic ID and password.');
            return;
        }
    }

    try {
        let response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        let data = await response.json();
        if (data.status === 'success') {
            loginSuccess(data.user);
        } else {
            showErr(err, data.message);
        }
    } catch (error) {
        showErr(err, 'Server connection failed. Is the backend running?');
        console.error(error);
    }
}

function showErr(el, msg) {
    el.style.display = 'block';
    el.textContent = msg;
}

function loginSuccess(u) {
    // Ensure id is an integer
    u.id = parseInt(u.id);
    currentUser = u;
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
        if (n) n.textContent = u.name;
        if (rl) rl.textContent = roleLabels[r] || r;
        if (av) av.textContent = u.name[0].toUpperCase();
    });
    syncLoad().then(async () => {
        await fetchAllPatients();
        if (u.role === 'admin') await fetchAllStaff();
        if (u.role === 'patient') {
            showPage('page-patient');
            patNav('visit');
        } else if (u.role === 'nurse') {
            showPage('page-nurse');
            nurseNav('queue');
        } else if (u.role === 'doctor') {
            showPage('page-doctor');
            docNav('consult');
        } else if (u.role === 'admin') {
            showPage('page-admin');
            adminNav('accounts');
        }
    });
}
// ==========================================
// LOGOUT
// ==========================================
async function logout() {
    try {
        await fetch('/api/auth/logout');
    } catch(e) {}
    currentUser = null;
    ['ucims-pat-nav', 'ucims-nurse-nav', 'ucims-doc-nav', 'ucims-admin-nav'].forEach(k => localStorage.removeItem(k));
    ['login-email', 'login-idnum', 'login-clinicid', 'login-staffpw'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const err = document.getElementById('login-error');
    if (err) err.style.display = 'none';
    showPage('page-home');
    if (tvInterval) clearInterval(tvInterval);
    if (clockInterval) clearInterval(clockInterval);
}

// ==========================================
// GO TO REGISTRATION
// ==========================================
function goSignup() {
    pprStep = 1;
    renderPPR();
    showPage('page-signup');
}

// ==========================================
// 5-STEP PATIENT REGISTRATION (PPR)
// ==========================================
let pprStep = 1;
const PPR_TOTAL_STEPS = 5;

function renderPPR() {
    for (let i = 1; i <= PPR_TOTAL_STEPS; i++) {
        const el = document.getElementById('ppr-sec-' + i);
        const tab = document.getElementById('ppr-step-' + i);
        if (el) el.style.display = i === pprStep ? 'block' : 'none';
        if (tab) {
            tab.classList.remove('active', 'done');
            if (i < pprStep) tab.classList.add('done');
            else if (i === pprStep) tab.classList.add('active');
        }
    }
    const back = document.getElementById('ppr-nav-back');
    const next = document.getElementById('ppr-nav-next');
    if (back) back.style.display = pprStep > 1 ? 'inline-flex' : 'none';
    if (next) next.innerHTML = pprStep === PPR_TOTAL_STEPS ? '<i class="bi bi-check-circle"></i> Create Account' : 'Next Step <i class="bi bi-arrow-right"></i>';
}

function pprBack() {
    if (pprStep > 1) {
        pprStep--;
        renderPPR();
    }
}

function pprToggleFemale() {
    const sex = val('ppr-sex');
    const notice = document.getElementById('ppr-female-notice');
    const fields = document.getElementById('ppr-female-fields');
    if (sex === 'Male') {
        if (notice) notice.style.display = 'block';
        if (fields) fields.style.display = 'none';
    } else {
        if (notice) notice.style.display = 'none';
        if (fields) fields.style.display = 'block';
    }
}

function pprToggleQ(targetId, expectedVal) {
    const target = document.getElementById(targetId);
    if (target && window.event) {
        const name = window.event.target.name;
        const checkedVal = document.querySelector(`input[name="${name}"]:checked`)?.value;
        target.style.display = (checkedVal === expectedVal) ? 'block' : 'none';
    }
}

async function pprNext() {
    const e = document.getElementById('ppr-err');
    e.style.display = 'none';
    const show = msg => { e.style.display = 'block'; e.textContent = msg; window.scrollTo(0, 0); return false; };

    // ==========================================
    // STRICT FORMAT VALIDATORS (Regex)
    // ==========================================
    const isValidName = (name) => /^[A-ZÑ][a-zA-Z\s\-Ññ]*$/.test(name);
    const isValidText = (text) => /^[a-zA-Z\s\-Ññ]+$/.test(text);
    const isValidAddress = (addr) => /[a-zA-Z]/.test(addr) && /^[a-zA-Z0-9\s,.\-#Ññ]+$/.test(addr);
    const isUsepEmail = (email) => /^[^\s@]+@usep\.edu\.ph$/.test(email);
    const isValidPhone = (phone) => /^09\d{9}$/.test(phone);
    const isValidId = (id) => /^20\d{2}-\d{5}$/.test(id); // Matches 20XX-XXXXX
    const isAllCaps = (text) => /^[A-ZÑ\s\-]+$/.test(text); // Signature validation

    // Helpers to safely get values
    const safeVal = (id) => (document.getElementById(id) ? document.getElementById(id).value.trim() : '');

    // ==========================================
    // STEP 1: Personal Info Validation
    // ==========================================
    if (pprStep === 1) {
        const sname = safeVal('ppr-surname');
        const fname = safeVal('ppr-firstname');
        const mname = safeVal('ppr-midname');
        if (!sname || !isValidName(sname)) return show('Surname is required, must start with a Capital letter, and contain only letters.');
        if (!fname || !isValidName(fname)) return show('First Name is required, must start with a Capital letter, and contain only letters.');
        if (!mname || !isValidName(mname)) return show('Middle Name is required, must start with a Capital letter, and contain only letters.');

        const ageVal = parseInt(safeVal('ppr-age'));
        if (!safeVal('ppr-age') || isNaN(ageVal) || ageVal < 1 || ageVal > 120) return show('Please enter a valid age between 1 and 120.');

        if (!safeVal('ppr-sex')) return show('Sex is required.');
        if (!safeVal('ppr-status')) return show('Civil status is required.');
        if (!safeVal('ppr-course')) return show('College / Designation is required.');

        const religion = safeVal('ppr-religion');
        if (!religion || !isValidText(religion)) return show('Religion is required and must contain only letters.');

        const bdateVal = safeVal('ppr-birthdate');
        if (!bdateVal) return show('Birthdate is required.');
        if (new Date(bdateVal) > new Date()) return show('Birthdate cannot be a future date.');

        const bplace = safeVal('ppr-birthplace');
        if (!bplace || !isValidAddress(bplace)) return show('Birthplace is required and must contain valid characters.');

        const cAddress = safeVal('ppr-city-address');
        if (!cAddress || !isValidAddress(cAddress)) return show('City Address is required and must contain valid characters.');

        const pAddress = safeVal('ppr-prov-address');
        if (!pAddress || !isValidAddress(pAddress)) return show('Provincial Address is required and must contain valid characters.');

        const email = safeVal('ppr-email');
        if (!email || !isUsepEmail(email)) return show('A valid USeP Email address ending in @usep.edu.ph is required.');

        if (!isValidPhone(safeVal('ppr-contact'))) return show('Contact number must be exactly 11 digits and start with 09 (e.g., 09123456789).');

        const emName = safeVal('ppr-emname');
        if (!emName || !isValidName(emName)) return show('Emergency Contact Name is required, must start with a Capital letter, and contain only letters.');

        if (!isValidPhone(safeVal('ppr-emcontact'))) return show('Emergency Contact Number must be exactly 11 digits and start with 09.');

        const emRel = safeVal('ppr-emrel');
        if (!emRel || !isValidText(emRel)) return show('Emergency Contact Relationship is required and must contain only letters.');
    }

    // ==========================================
    // STEP 2: Health Record Validation
    // ==========================================
    if (pprStep === 2) {
        // 1. Vital Signs (Required)
        const vitals = ['ppr-gen-appearance', 'ppr-height', 'ppr-weight', 'ppr-pr', 'ppr-rr', 'ppr-temp', 'ppr-bp', 'ppr-cr-rest', 'ppr-cr-activity'];
        for (let v of vitals) {
            if (!safeVal(v)) return show('All vital signs and physical measurements are required.');
        }

        // 2. System Review (Required, Valid Inputs, 'Unremarkable' fallback)
        const sysReview = ['ppr-sr-skin', 'ppr-sr-lymph', 'ppr-sr-integument', 'ppr-sr-circulatory', 'ppr-sr-endocrine', 'ppr-sr-allergic', 'ppr-sr-heent', 'ppr-sr-mouth', 'ppr-sr-breast', 'ppr-sr-respiratory', 'ppr-sr-cardiovascular', 'ppr-sr-gastrointestinal', 'ppr-sr-genitourinary', 'ppr-sr-psychiatric'];
        for (let sr of sysReview) {
            let sVal = safeVal(sr);
            if (!sVal) return show('All System Review fields are required. If a system is not applicable, please type "Unremarkable".');
            if (!isValidAddress(sVal)) return show('System Review fields must contain valid text.');
        }
    }

    // ==========================================
    // STEP 3: Questionnaire Conditional Validation
    // ==========================================
    if (pprStep === 3) {
        const hosp = document.querySelector('input[name="ppr-q-hosp"]:checked')?.value;
        if (hosp === 'Yes' && (!safeVal('ppr-hosp-illness') || !safeVal('ppr-hosp-when'))) {
            return show('You selected "Yes" for previous hospitalization. Please specify the illness and date.');
        }

        const surg = document.querySelector('input[name="ppr-q-surg"]:checked')?.value;
        if (surg === 'Yes' && (!safeVal('ppr-surg-type') || !safeVal('ppr-surg-when'))) {
            return show('You selected "Yes" for previous surgery. Please specify the type and date.');
        }
    }

    // ==========================================
    // STEP 4: Females Only Conditional Validation
    // ==========================================
    if (pprStep === 4 && safeVal('ppr-sex') === 'Female') {
        const regular = document.querySelector('input[name="ppr-q-regular"]:checked')?.value;
        if (regular === 'No' && !safeVal('ppr-irregular-spec')) {
            return show('Since you indicated an irregular menstrual cycle, please specify the details.');
        }
    }

    // ==========================================
    // STEP 5: Final Validation & Submission
    // ==========================================
    if (pprStep === PPR_TOTAL_STEPS) {
        if (!safeVal('ppr-pattype')) return show('Please select your Account Type (Student or Faculty).');
        
        // 1. Strict ID Format
        const newId = safeVal('ppr-studid');
        if (!isValidId(newId)) return show('Student / Faculty ID must follow the format 20XX-XXXXX (e.g., 2024-00987).');
        
        // 2. Strict Email Match
        const origEmail = safeVal('ppr-email');
        const emailConf = safeVal('ppr-email-confirm');
        if (!emailConf || emailConf !== origEmail || !isUsepEmail(emailConf)) {
            return show('Confirmation Email must exactly match the @usep.edu.ph email provided in Step 1.');
        }
        
        // 3. Signature ALL CAPS
        const sig = safeVal('ppr-signature');
        if (!sig || !isAllCaps(sig)) return show('Digital signature must be your full name typed in ALL CAPITAL LETTERS.');
        
        // 4. Exact Today's Date
        const signDate = safeVal('ppr-sign-date');
        const localDate = new Date();
        const todayStr = localDate.getFullYear() + '-' + String(localDate.getMonth() + 1).padStart(2, '0') + '-' + String(localDate.getDate()).padStart(2, '0');
        if (signDate !== todayStr) return show('Date of signing must be exactly today\'s date.');

        if (!document.getElementById('ppr-sworn-chk').checked) return show('Please check the confirmation box to declare the truthfulness of your data.');
        if (!document.getElementById('ppr-privacy-chk').checked) return show('Please accept the Data Privacy Act consent box.');

        const infChecked = Array.from(document.querySelectorAll('.ppr-inf-chk:checked')).map(cb => cb.value).join(', ');

        const u = {
            email: emailConf,
            role: 'patient',
            patientId: newId,
            demographics: {
                fname: safeVal('ppr-firstname'), mname: safeVal('ppr-midname'), lname: safeVal('ppr-surname'),
                age: safeVal('ppr-age'), sex: safeVal('ppr-sex'), civil: safeVal('ppr-status'), religion: safeVal('ppr-religion'),
                dob: safeVal('ppr-birthdate'), birthplace: safeVal('ppr-birthplace'), nationality: safeVal('ppr-nationality'),
                address: safeVal('ppr-city-address'), provAddress: safeVal('ppr-prov-address'),
                contact: safeVal('ppr-contact'), emname: safeVal('ppr-emname'), emcontact: safeVal('ppr-emcontact'), emrel: safeVal('ppr-emrel')
            },
            healthRecord: {
                genAppearance: safeVal('ppr-gen-appearance'), height: safeVal('ppr-height'), weight: safeVal('ppr-weight'),
                pr: safeVal('ppr-pr'), rr: safeVal('ppr-rr'), temp: safeVal('ppr-temp'), bp: safeVal('ppr-bp'),
                crRest: safeVal('ppr-cr-rest'), crActivity: safeVal('ppr-cr-activity'),
                infectious: safeVal('ppr-infectious'), socialHx: safeVal('ppr-social-hx'), familyHx: safeVal('ppr-family-hx'),
                srSkin: safeVal('ppr-sr-skin'), srLymph: safeVal('ppr-sr-lymph'), srIntegument: safeVal('ppr-sr-integument'),
                srCirculatory: safeVal('ppr-sr-circulatory'), srEndocrine: safeVal('ppr-sr-endocrine'), srAllergic: safeVal('ppr-sr-allergic'),
                srHeent: safeVal('ppr-sr-heent'), srMouth: safeVal('ppr-sr-mouth'), srBreast: safeVal('ppr-sr-breast'),
                srRespiratory: safeVal('ppr-sr-respiratory'), srCardiovascular: safeVal('ppr-sr-cardiovascular'),
                srGastrointestinal: safeVal('ppr-sr-gastrointestinal'), srGenitourinary: safeVal('ppr-sr-genitourinary'),
                srPsychiatric: safeVal('ppr-sr-psychiatric')
            },
            questionnaire: {
                hosp: document.querySelector('input[name="ppr-q-hosp"]:checked')?.value, hospIllness: safeVal('ppr-hosp-illness'),
                hospWhen: safeVal('ppr-hosp-when'), surg: document.querySelector('input[name="ppr-q-surg"]:checked')?.value,
                surgType: safeVal('ppr-surg-type'), surgWhen: safeVal('ppr-surg-when'), infectiousList: infChecked,
                syncope: document.querySelector('input[name="ppr-q-syncope"]:checked')?.value,
                female: safeVal('ppr-sex') === 'Female' ? {
                    menarche: safeVal('ppr-menarche'), periodsYr: safeVal('ppr-periods-year'),
                    regular: document.querySelector('input[name="ppr-q-regular"]:checked')?.value,
                    irregularSpec: safeVal('ppr-irregular-spec'),
                    dysmenorrhea: document.querySelector('input[name="ppr-q-dysmenorrhea"]:checked')?.value,
                    symptoms: safeVal('ppr-menstrual-symptoms')
                } : null
            },
            permanent: {
                pattype: safeVal('ppr-pattype'), dept: safeVal('ppr-course'), yearLevel: safeVal('ppr-yearlevel')
            }
        };

        try {
            let response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(u)
            });
            let data = await response.json();
            if (data.status === 'success') {
                toast('Registration complete! You can now log in using your Email and ID.', 'success');
                setTimeout(() => showPage('page-login'), 1500);
            } else {
                show(data.message);
            }
        } catch (error) {
            show('Server connection failed. Please try again later.');
            console.error(error);
        }
        return;
    }

    pprStep++;
    renderPPR();
}