import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

export default function Login({ status }: { status?: string }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        clinic_id: '',
        password: '',
        remember: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#5b0b18] px-4 py-12">
            <Head title="UCIMS - Sign In" />

            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="bg-[#760000] px-8 py-7 text-center text-white">
                    <img src="/assets/img/logo.png" alt="USeP logo" className="mx-auto mb-3 h-14 w-14 object-contain" />
                    <p className="text-xs font-semibold tracking-[0.2em] text-white/75 uppercase">University of Southeastern Philippines</p>
                    <h1 className="mt-2 text-2xl font-bold">UCIMS Portal</h1>
                </div>
                <div className="space-y-6 p-8">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">Sign in to your clinic account</h2>
                    <p className="mt-2 text-sm text-gray-600">One secure login for patients and clinic staff.</p>
                </div>

                {status && (
                    <div className="text-sm font-medium text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-center">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="mt-8 space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                            Clinic ID or Email
                        </label>
                        <input
                            type="text"
                            value={data.clinic_id}
                            autoFocus
                            placeholder="e.g. D-001 or user@usep.edu.ph"
                            onChange={(e) => setData('clinic_id', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white placeholder-gray-400 focus:border-[#760000] focus:outline-none focus:ring-2 focus:ring-[#760000]/20 transition-all"
                        />
                        {errors.clinic_id && <p className="mt-1 text-xs font-semibold text-red-600">{errors.clinic_id}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={data.password}
                            placeholder="••••••••"
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white placeholder-gray-400 focus:border-[#760000] focus:outline-none focus:ring-2 focus:ring-[#760000]/20 transition-all"
                        />
                        {errors.password && <p className="mt-1 text-xs font-semibold text-red-600">{errors.password}</p>}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mr-2"
                            />
                            Remember me
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-[#760000] text-white rounded-lg px-4 py-3.5 font-semibold hover:bg-[#5b0b18] focus:outline-none focus:ring-4 focus:ring-[#760000]/20 transition-all disabled:opacity-50 shadow-sm shadow-[#760000]/30"
                    >
                        {processing ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
                </div>
            </div>
        </div>
    );
}