<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureRole::class,
        ]);

        // HandleInertiaRequests shares the logged-in user (auth.user) and
        // validation errors with every Inertia page. It was never registered
        // before, which is why sidebars could not show the user's name.
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\EnsureAccountActive::class,
        ]);

        $middleware->redirectUsersTo(fn ($request) => match ($request->user()?->role) {
            'admin' => route('admin.dashboard'),
            'doctor' => route('doctor.dashboard'),
            'nurse' => route('nurse.dashboard'),
            'patient' => route('patient.dashboard'),
            default => route('dashboard'),
        });
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
