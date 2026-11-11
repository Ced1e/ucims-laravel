import { Head, Link, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';

export default function Login({ status }: { status?: string }) {
    const [showPassword, setShowPassword] = useState(false);
    const heartbeatPath = 'M10 70H130L155 42 185 108 225 18 264 120 295 55 320 70H470';
    const { data, setData, post, processing, errors, reset } = useForm({
        clinic_id: '',
        password: '',
        remember: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => {
                reset('password');
                setShowPassword(false);
            },
        });
    };

    return (
        <main className="clinic-entry clinic-entry-silk">
            <Head title="UCIMS - Login" />
            <section className="clinic-entry-visual" aria-labelledby="clinic-entry-title">
                <Link href="/" className="clinic-entry-brand" aria-label="UCIMS home">
                    <img src="/assets/img/University of Southeastern Philippines Seal.png" alt="USeP logo" />
                    <span className="clinic-entry-wordmark"><span>University of<br />Southeastern Philippines</span><small>University Clinic</small></span>
                </Link>
                <div className="clinic-entry-story">
                    <p className="clinic-entry-eyebrow">YOUR UNIVERSITY. YOUR HEALTH.</p>
                    <h1 id="clinic-entry-title">Care for today.<br /><span>Ready for tomorrow.</span></h1>
                    <p className="clinic-entry-description">Your connection to the university clinic, from your first visit to your next step forward.</p>
                    <div className="clinic-entry-art clinic-heartbeat">
                        <svg viewBox="0 0 480 135" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path className="clinic-heartbeat-base" d={heartbeatPath} />
                            <path className="clinic-heartbeat-trace clinic-heartbeat-halo" pathLength="100" d={heartbeatPath} />
                            <path className="clinic-heartbeat-trace" pathLength="100" d={heartbeatPath} />
                            <circle className="clinic-heartbeat-light" r="4" fill="#fff0bd" stroke="none" />
                        </svg>
                    </div>
                </div>
                <p className="clinic-entry-visual-footer">University Clinic Information Management System</p>
            </section>
            <section className="clinic-entry-panel" aria-labelledby="login-title">
                <Link href="/" className="clinic-entry-back"><span aria-hidden="true">←</span> Back to home</Link>
                <div className="clinic-entry-form-wrap">
                    <p className="clinic-entry-kicker">WELCOME TO UCIMS</p>
                    <h2 id="login-title">Welcome back.</h2>
                    <p className="clinic-entry-intro">Log in to access your clinic account.</p>
                    {status && <div className="clinic-entry-status" role="status">{status}</div>}
                    <form onSubmit={submit} className="clinic-entry-form" aria-busy={processing}>
                        <div className="clinic-entry-field">
                            <label htmlFor="clinic-id">Clinic ID</label>
                            <input id="clinic-id" name="clinic_id" type="text" autoCapitalize="characters" maxLength={10} value={data.clinic_id} autoComplete="username" required placeholder="e.g. 2024-00001 or N-001" onChange={(e) => setData('clinic_id', e.target.value.toUpperCase())} aria-invalid={Boolean(errors.clinic_id)} aria-describedby={errors.clinic_id ? 'clinic-id-hint clinic-id-error' : 'clinic-id-hint'} />
                            <p id="clinic-id-hint" className="clinic-entry-hint">Use the Clinic ID assigned to your account (e.g. 2024-00001 or N-001).</p>
                            {errors.clinic_id && <p id="clinic-id-error" className="clinic-entry-error" role="alert">{errors.clinic_id}</p>}
                        </div>
                        <div className="clinic-entry-field">
                            <label htmlFor="password">Password</label>
                            <div className="clinic-entry-password">
                                <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={data.password} autoComplete="current-password" required placeholder="Enter your password" onChange={(e) => setData('password', e.target.value)} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? 'Hide' : 'Show'}</button>
                            </div>
                            {errors.password && <p id="password-error" className="clinic-entry-error" role="alert">{errors.password}</p>}
                        </div>
                        <label className="clinic-entry-remember" htmlFor="remember">
                            <input id="remember" name="remember" type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} />
                            Remember me
                        </label>
                        <button type="submit" disabled={processing} className="clinic-entry-submit">{processing ? 'Logging in…' : 'Login'}<span aria-hidden="true">→</span></button>
                    </form>
                    <p className="clinic-entry-register">New to the clinic? <Link href="/register">Register</Link></p>
                    <p className="clinic-entry-help">Need help with your account? Contact the university clinic.</p>
                </div>
                <p className="clinic-entry-panel-footer">USeP · University Clinic</p>
            </section>
        </main>
    );
}




