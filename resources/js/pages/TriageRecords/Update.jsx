import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { sanitizeVital, validateVital, validateBloodPressure } from '@/lib/triage-validation.mjs';

const bpWhenPresent = (value) => (String(value ?? '').trim() ? validateBloodPressure(value) : null);

export default function Update({ triageRecord }) {
    const { data, setData, put, processing, errors } = useForm({
        temperature: triageRecord?.temperature || '',
        blood_pressure: triageRecord?.blood_pressure || '',
        pulse_rate: triageRecord?.pulse_rate || '',
        notes: triageRecord?.notes || '',
    });
    const [touched, setTouched] = useState({});

    const markTouched = (name) => () => setTouched((previous) => ({ ...previous, [name]: true }));
    const updateVital = (name, value) => {
        setData(name, sanitizeVital(name, value));
        setTouched((previous) => ({ ...previous, [name]: true }));
    };
    const inlineError = (name, message) => (touched[name] ? message : null);

    const temperatureError = inlineError('temperature', validateVital('temperature', data.temperature));
    const bloodPressureError = inlineError('blood_pressure', bpWhenPresent(data.blood_pressure));
    const pulseError = inlineError('pulse_rate', validateVital('pulse_rate', data.pulse_rate));

    const submit = (e) => {
        e.preventDefault();
        put(`/triage-records/${triageRecord.id}`);
    };

    return (
        <AppLayout>
            <Head title="Edit Triage Record" />
            <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow border border-gray-100 mt-6">
                <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Triage Entry</h1>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Temperature (°C)</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            maxLength={4}
                            autoComplete="off"
                            value={data.temperature}
                            onChange={(e) => updateVital('temperature', e.target.value)}
                            onBlur={markTouched('temperature')}
                            aria-invalid={Boolean(temperatureError) || undefined}
                            aria-describedby={temperatureError ? 'temperature-inline-error' : undefined}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-600/20"
                        />
                        {temperatureError && <p id="temperature-inline-error" role="alert" className="text-xs text-red-600 mt-1">{temperatureError}</p>}
                        {errors.temperature && <p className="text-xs text-red-600 mt-1">{errors.temperature}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Blood Pressure</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={7}
                            autoComplete="off"
                            value={data.blood_pressure}
                            onChange={(e) => updateVital('blood_pressure', e.target.value)}
                            onBlur={markTouched('blood_pressure')}
                            aria-invalid={Boolean(bloodPressureError) || undefined}
                            aria-describedby={bloodPressureError ? 'bp-inline-error' : undefined}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-600/20"
                        />
                        {bloodPressureError && <p id="bp-inline-error" role="alert" className="text-xs text-red-600 mt-1">{bloodPressureError}</p>}
                        {errors.blood_pressure && <p className="text-xs text-red-600 mt-1">{errors.blood_pressure}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Pulse Rate</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={3}
                            autoComplete="off"
                            value={data.pulse_rate}
                            onChange={(e) => updateVital('pulse_rate', e.target.value)}
                            onBlur={markTouched('pulse_rate')}
                            aria-invalid={Boolean(pulseError) || undefined}
                            aria-describedby={pulseError ? 'pulse-inline-error' : undefined}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-600/20"
                        />
                        {pulseError && <p id="pulse-inline-error" role="alert" className="text-xs text-red-600 mt-1">{pulseError}</p>}
                        {errors.pulse_rate && <p className="text-xs text-red-600 mt-1">{errors.pulse_rate}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Notes</label>
                        <textarea
                            maxLength={1000}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-600/20 min-h-[90px]"
                        />
                        {errors.notes && <p className="text-xs text-red-600 mt-1">{errors.notes}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={processing || Boolean(bpWhenPresent(data.blood_pressure)) || Boolean(validateVital('pulse_rate', data.pulse_rate)) || Boolean(validateVital('temperature', data.temperature))}
                        className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Update Triage Record
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}
