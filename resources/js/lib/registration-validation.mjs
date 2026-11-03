// Input formats and storage limits shared by the patient wizard.
export const registrationLimits = {
    firstname:100, middlename:100, lastname:100, religion:100, nationality:100,
    college_dept:150, birthplace:255, city_address:255, prov_address:255,
    contact_no:20, em_name:100, em_contact:20, em_rel:50,
    gen_appearance:1000, infectious_diseases:1000, social_hx:1000, family_hx:1000,
    hosp_illness:255, hosp_when:100, surg_type:255, surg_when:100,
    female_irregular_spec:1000, female_symptoms:1000, usep_email:150,
    usep_email_confirmation:150, clinic_id:10, signature:150,
};
export function validName(value) {
    return /^[\p{L}][\p{L}\p{M} .'’\-]*$/u.test(String(value ?? '').trim());
}
export function isCalendarDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
    const [y,m,d] = value.split('-').map(Number);
    const date = new Date(y,m-1,d);
    return date.getFullYear()===y && date.getMonth()===m-1 && date.getDate()===d;
}
export function localToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function normalizePhone(value) {
    // Accept spacing/dashes for readability, never silently turn letters into digits.
    return String(value ?? '').trim().replace(/[ ()-]/g,'');
}
export function lengthErrors(data, keys) {
    const errors={};
    for (const key of keys) {
        const max=key.startsWith('sr_') ? 100 : registrationLimits[key];
        if (max && [...String(data[key] ?? '').trim()].length>max) errors[key]=`Use ${max} characters or fewer.`;
    }
    return errors;
}
export function prepareRegistration(data) {
    const result={...data};
    for (const [key,value] of Object.entries(result)) {
        if (typeof value==='string' && !key.startsWith('password')) result[key]=value.trim();
    }
    result.contact_no=normalizePhone(result.contact_no);
    result.em_contact=normalizePhone(result.em_contact);
    for (const key of ['usep_email','usep_email_confirmation']) if (typeof result[key]==='string') result[key]=result[key].toLowerCase();
    if (result.sex!=='Female') for (const key of Object.keys(result)) if (key.startsWith('female_')) delete result[key];
    if (result.hosp_admitted==='No') result.hosp_illness=result.hosp_when='';
    if (result.surgery==='No') result.surg_type=result.surg_when='';
    return result;
}
