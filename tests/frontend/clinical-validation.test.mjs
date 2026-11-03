import test from 'node:test';
import assert from 'node:assert/strict';
import { certificateRequestError, prescriptionError, requestError } from '../../resources/js/lib/clinical-validation.mjs';
test('certificate inputs reject malformed and reversed dates before creating a queue',()=>{
 assert.equal(certificateRequestError('Class excuse','2026-02-30',''), 'Enter a valid start date.');
 assert.equal(certificateRequestError('Class excuse','2026-11-03','2026-11-02'),'End date must be on or after start date.');
 assert.equal(certificateRequestError('Class excuse','2026-11-02','2026-11-03'),null);
 assert.ok(certificateRequestError('  ','',''));
});
test('prescription replacement is validated before any existing rows are deleted',()=>{
 assert.ok(prescriptionError([{drug_name:'Paracetamol',dosage:'x'.repeat(101)}],''));
 assert.ok(prescriptionError([{drug_name:' ',dosage:'500 mg'}],''));
 assert.equal(prescriptionError([{drug_name:'Paracetamol',dosage:'500 mg',route:'Oral'}],''),null);
 assert.equal(prescriptionError([{drug_name:'',dosage:'',route:'Oral'}],''),null);
 assert.ok(prescriptionError([],'x'.repeat(256)));
});
test('server field errors reach users without losing their messages',()=>{
 assert.equal(requestError({response:{data:{message:'Validation failed',errors:{dob:['Invalid birthdate.'],mobile_no:['Invalid mobile.']}}}},'Save failed'),'Invalid birthdate. Invalid mobile.');
 assert.equal(requestError({},'Save failed'),'Save failed');
});
