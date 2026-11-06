{{-- Kept inline so the loading screen still works when Vite/CSS/JS is unavailable. --}}
<style>
    html[data-ui-loading] #app { visibility: hidden !important; }
    html[data-ui-loading] body { overflow: hidden; }
    html:not([data-ui-loading]) #app { animation: ucims-reveal .16s ease-out; }
    @keyframes ucims-reveal { from { opacity: 0; } to { opacity: 1; } }
    html[data-ui-loading], html[data-ui-loading].dark { background: #f8f5f2 !important; }
    #ucims-loading { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; background: #f8f5f2; color: #650d1c; font: 16px/1.6 Arial, sans-serif; text-align: center; padding: 24px; }
    html:not([data-ui-loading]) #ucims-loading { display: none; }
    #ucims-loading strong { display: block; font-size: 22px; letter-spacing: -.02em; }
    #ucims-loading p { margin: 10px 0 18px; color: #6c6267; font-size: 14px; }
    #ucims-loading a { display: inline-block; color: #650d1c; border: 1px solid #cbb9bb; border-radius: 8px; padding: 9px 20px; text-decoration: none; }
    #ucims-loading a:hover { background: #eee4e4; }
    #ucims-loading a:focus-visible { outline: 3px solid #b68b34; outline-offset: 4px; }
    #ucims-loading [hidden] { display: none !important; }
    #ucims-loading .loading-line { width: 100px; height: 3px; margin: 18px auto; overflow: hidden; background: #e7dedc; border-radius: 3px; }
    #ucims-loading .loading-line::after { content: ''; display: block; width: 45%; height: 100%; background: #8a2534; animation: ucims-load 1.4s ease-in-out infinite alternate; }
    @keyframes ucims-load { to { transform: translateX(125%); } }
    @media (prefers-reduced-motion: reduce) { #ucims-loading .loading-line::after { animation: none; width: 100%; } }
    @media (prefers-reduced-motion: reduce) { html:not([data-ui-loading]) #app { animation: none; } }
</style>
<script>
(() => {
    const root = document.documentElement;
    let scheduled = false;
    let timeout;
    let waitingSince = Date.now();
    function check() {
        scheduled = false;
        const app = document.getElementById('app');
        const baseReady = getComputedStyle(root).getPropertyValue('--ucims-base-ready').trim() === '1';
        const page = app?.querySelector('.hp, .clinic-entry');
        const pageReady = !page || getComputedStyle(page).getPropertyValue('--ucims-page-ready').trim() === '1';
        const queue = app?.querySelector('.q-board');
        const queueReady = !queue || getComputedStyle(queue).getPropertyValue('--ucims-queue-ready').trim() === '1';
        // Legacy pages attach their own same-origin styles through Inertia Head.
        const linksReady = [...document.querySelectorAll('link[rel="stylesheet"]')].every(link =>
            new URL(link.href, location.href).origin !== location.origin || !!link.sheet
        );
        const legacyPage = ['admin/analytics', 'doctor/consultation', 'nurse/dashboard', 'patient/register', 'patient/portal'].includes(root.getAttribute('data-ui-page'));
        const legacyReady = !legacyPage || [...document.querySelectorAll('link[rel="stylesheet"]')].some(link =>
            new URL(link.href, location.href).pathname === '/assets/css/main.css' && !!link.sheet
        );
        const ready = !!app?.firstElementChild && baseReady && pageReady && queueReady && linksReady && legacyReady;
        if (ready) {
            if (root.hasAttribute('data-ui-loading')) root.removeAttribute('data-ui-loading');
            clearTimeout(timeout);
            timeout = undefined;
            waitingSince = 0;
        } else {
            if (!root.hasAttribute('data-ui-loading')) root.setAttribute('data-ui-loading', '');
            if (!waitingSince) waitingSince = Date.now();
            const failed = Date.now() - waitingSince >= 10000;
            const message = document.getElementById('ucims-loading-message');
            const retry = document.getElementById('ucims-loading-retry');
            const text = failed ? 'This page is taking longer to load. Please try again.' : 'Preparing your page…';
            if (message && message.textContent !== text) message.textContent = text;
            if (retry && retry.hidden === failed) retry.hidden = !failed;
            if (!timeout && !failed) timeout = setTimeout(() => { timeout = undefined; schedule(); }, 10000);
        }
    }
    function schedule() {
        if (!scheduled) { scheduled = true; requestAnimationFrame(check); }
    }
    new MutationObserver(schedule).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'rel', 'data-ui-page'] });
    document.addEventListener('load', schedule, true);
    document.addEventListener('error', schedule, true);
    document.addEventListener('DOMContentLoaded', schedule);
    window.addEventListener('pageshow', schedule);
    schedule();
})();
</script>
