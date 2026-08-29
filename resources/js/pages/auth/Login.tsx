import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

export default function Login({ status }: { status?: string }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
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
        <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
            <Head title="UCIMS - Sign In" />

            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-2xl border border-gray-100">
                <div className="text-center">
                    <span className="inline-block px-3 py-1 mb-2 text-xs font-bold tracking-wider text-blue-700 uppercase bg-blue-50 rounded-full">
                        USeP Health Services
                    </span>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">UCIMS Portal</h2>
                    <p className="mt-2 text-sm text-gray-600">Enter your Clinic ID or Institutional Email</p>
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
                            value={data.email}
                            autoFocus
                            placeholder="e.g. D-001 or user@usep.edu.ph"
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                        />
                        {errors.email && <p className="mt-1 text-xs font-semibold text-red-600">{errors.email}</p>}
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
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
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
                        className="w-full bg-blue-600 text-white rounded-lg px-4 py-3.5 font-semibold hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/20 transition-all disabled:opacity-50 shadow-sm shadow-blue-600/30"
                    >
                        {processing ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}