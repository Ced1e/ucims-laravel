/* data.js - Global state, data sync, and DB interaction (no localStorage session) */
const DATA_VERSION = 'v13';
const LOGO = "assets/img/logo.png";

let signupStep = 1;
const SIGNUP_STEPS = 4;
let activeQ = null;
let rxCount = 0;

// Global state arrays (populated from PostgreSQL)
let users = [];
let queue = [];
let dailyLog = [];
let queueCounter = 0;

// Global current user (in memory only - NOT stored in localStorage)
let currentUser = null;

// Global DB caches for admin/record management
window.dbPatients = [];
window.dbStaff = [];

// ==========================================
// SIDEBAR NOTIFICATION COUNTERS
// ==========================================
function updateSidebarCounters() {
    if (typeof todayStr !== 'function') return;
    const today = todayStr();
    const nurseCount = queue.filter(q => q.date === today && !q.finalized).length;
    const nnQueue = document.getElementById('nn-queue');
    if (nnQueue) {
        nnQueue.innerHTML = `<i class="bi bi-people nav-icon"></i> Queue Monitoring (${nurseCount})`;
    }
    const docCount = queue.filter(q => q.date === today && q.status === 'with-doctor').length;
    const dnConsult = document.getElementById('dn-consult');
    if (dnConsult) {
        dnConsult.innerHTML = `<i class="bi bi-heart-pulse nav-icon"></i> Active Consultations (${docCount})`;
    }
}

// ==========================================
// LOAD QUEUE & DAILY LOG FROM POSTGRESQL
// ==========================================
async function syncLoad() {
    try {
        let res = await fetch('/api/sync/load', { cache: 'no-store' });
        let data = await res.json();
        if (data.status === 'success') {
            queue = data.queue || [];
            dailyLog = data.dailyLog || [];
            const today = todayStr();
            // Compute the highest queue number used today (active + done)
            const todayQueueNums = queue.filter(q => q.date === today).map(q => q.queueNum);
            const todayDoneNums = dailyLog.filter(l => l.date === today).map(l => l.queueNum);
            const allNums = [...todayQueueNums, ...todayDoneNums];
            queueCounter = allNums.length > 0 ? Math.max(...allNums) : 0;
            if (document.getElementById('log-tbody')) filterLogTable();
            updateSidebarCounters();
        } else {
            console.error("Load error:", data.message);
        }
    } catch(e) {
        console.error("Database Load Error:", e);
    }
}

// ==========================================
// SAVE QUEUE & DAILY LOG TO POSTGRESQL (returns a Promise)
// ==========================================
function saveData() {
    updateSidebarCounters();
    return fetch('/api/sync/save', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json' 
        },
        body: JSON.stringify({ queue: queue, dailyLog: dailyLog })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'error') {
            console.error("DB Rejections:", data.errors);
            // Show a detailed alert to help debugging
            const errorMsg = data.errors ? data.errors.join("\n") : data.message;
            alert("❌ DATABASE ERROR:\n" + errorMsg);
            throw new Error(errorMsg);
        }
        return data;
    })
    .catch(e => {
        console.error("Fetch Error:", e);
        alert("❌ Network error: Could not connect to server.\n" + e.message);
        throw e;
    });
}

// ==========================================
// FETCH ALL PATIENTS FROM DB (for record management)
// ==========================================
async function fetchAllPatients() {
    try {
        let res = await fetch('/api/records/patients', { headers: { 'Accept': 'application/json' } });
        let data = await res.json();
        if (data.status === 'success') {
            window.dbPatients = data.patients || [];
            window.dbPatients.forEach(p => {
                let existing = users.find(u => u.id == p.id);
                if (!existing) users.push(p);
            });
        } else {
            console.error("Fetch patients error:", data.message);
        }
    } catch(e) {
        console.error("Fetch patients error:", e);
    }
}

// ==========================================
// FETCH ALL STAFF FROM DB (for admin)
// ==========================================
async function fetchAllStaff() {
    try {
        let res = await fetch('/api/records/staff', { headers: { 'Accept': 'application/json' } });
        let data = await res.json();
        if (data.status === 'success') {
            window.dbStaff = data.staff || [];
        } else {
            console.error("Fetch staff error:", data.message);
        }
    } catch(e) {
        console.error("Fetch staff error:", e);
    }
}

// ==========================================
// HELPER: GET PATIENT BY ID FROM LOCAL CACHE OR DB
// ==========================================
function getUserById(uid) {
    let found = users.find(u => u.id == uid || u.patientId == uid);
    if (found) return found;
    found = window.dbPatients?.find(p => p.id == uid || p.patientId == uid);
    if (found) {
        // Ensure univ_id is present (use patientId as fallback)
        if (!found.univ_id && found.patientId) found.univ_id = found.patientId;
        return found;
    }
    return null;
}

function getDoctorNameById(docId) {
    if (!docId) return 'Doctor';
    let doc = users.find(u => u.id == docId);
    return doc ? doc.name : 'Doctor';
}

function getNurseNameById(nurseId) {
    if (!nurseId) return 'Nurse';
    let nurse = users.find(u => u.id == nurseId);
    return nurse ? nurse.name : 'Nurse';
}