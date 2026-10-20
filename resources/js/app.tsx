import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name: string) => {
        const pages = {
            ...import.meta.glob('./pages/**/*.tsx'),
            ...import.meta.glob('./pages/**/*.jsx'),
        };
        
        let path = `./pages/${name}.tsx`;
        if (!pages[path]) {
            const lowerPath = `./pages/${name.toLowerCase()}.tsx`;
            const foundKey = Object.keys(pages).find((key) => key.toLowerCase() === lowerPath);
            if (foundKey) path = foundKey;
        }

        if (!pages[path]) {
            const jsxPath = `./pages/${name}.jsx`;
            const lowerPath = `./pages/${name.toLowerCase()}.jsx`;
            const foundKey = Object.keys(pages).find((key) => key.toLowerCase() === lowerPath);
            path = foundKey ?? jsxPath;
        }

        return resolvePageComponent(path, pages) as Promise<any>;
    },
    layout: (name) => {
        const lowerName = name.toLowerCase();
        switch (true) {
            case lowerName === 'welcome':
                return null;
            case lowerName.startsWith('auth/'):
                return AuthLayout;
            case lowerName.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            case lowerName.startsWith('nurse/'):
            case lowerName.startsWith('doctor/'):
            case lowerName.startsWith('admin/'):
            case lowerName.startsWith('patient/'):
                // Role dashboards bring their own full-page legacy-styled
                // sidebar/layout, so they must not be nested inside AppLayout.
                return null;
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();
