import { isCalendarDate } from './registration-validation.mjs';

export function requestError(error, fallback='Please check the entered information and try again.') {
    const errors=error?.response?.data?.errors;
    if (errors && typeof errors==='object') {
        const messages=Object.values(errors).flat().filter(message=>typeof message==='string');
        if (messages.length) return [...new Set(messages)].join(' ');
    }
    return error?.response?.data?.message || fallback;
}
export function certificateRequestError(reason, from, to) {
    if (!String(reason).trim()) return 'Please provide a reason for your request.';
    if (String(reason).trim().length>255) return 'Keep the reason within 255 characters.';
    if (from && !isCalendarDate(from)) return 'Enter a valid start date.';
    if (to && !isCalendarDate(to)) return 'Enter a valid end date.';
    if (from && to && to<from) return 'End date must be on or after start date.';
    return null;
}
export function prescriptionError(rows, otherLab='') {
    if (otherLab.trim().length>255) return 'Keep the laboratory request within 255 characters.';
    for (let i=0;i<rows.length;i++) {
        const row=rows[i];
        const filled=Object.entries(row).some(([key,value])=>!['id','route'].includes(key) && String(value??'').trim());
        if (!filled) continue;
        if (!String(row.drug_name??'').trim()) return `Prescription ${i+1}: enter a medicine name or remove the empty row.`;
        for (const [field,max] of Object.entries({drug_name:255,dosage:100,frequency:100,duration:100,route:100})) {
            if ([...String(row[field]??'').trim()].length>max) return `Prescription ${i+1}: ${field.replaceAll('_',' ')} must be ${max} characters or fewer.`;
        }
        if (row.route && !['Oral','Topical','IV','IM','Inhaled'].includes(row.route)) return `Prescription ${i+1}: choose a listed route.`;
    }
    return null;
}
