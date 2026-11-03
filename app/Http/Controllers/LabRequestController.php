<?php

namespace App\Http\Controllers;

use App\Models\LabRequest;
use App\Http\Requests\StoreLabRequestRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Requests\UpdateLabRequestRequest;
use App\Actions\CloneRecordAction;
use Illuminate\Support\Facades\Gate;

class LabRequestController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', LabRequest::class);

        $query = LabRequest::with(['endorsed.queue.patient'])->orderBy('lab_request_id', 'desc');

        if ($request->boolean('pending')) {
            $query->whereNull('attachments');
        }

        $requests = $query->get();

        if ($request->wantsJson()) {
            return response()->json($requests);
        }

        return Inertia::render('LabRequests/Index', ['requests' => $requests]);
    }

    public function create()
    {
        Gate::authorize('create', LabRequest::class);

        return Inertia::render('LabRequests/Create');
    }

    public function store(StoreLabRequestRequest $request)
    {
        Gate::authorize('create', LabRequest::class);

        $labRequest = LabRequest::create($request->validated());

        if ($request->wantsJson()) {
            return response()->json($labRequest, 201);
        }

        return redirect()->route('lab-requests.index')->with('success', 'Lab request created.');
    }

    public function edit(LabRequest $labRequest)
    {
        Gate::authorize('update', $labRequest);

        return Inertia::render('LabRequests/Update', ['labRequest' => $labRequest]);
    }

    public function update(UpdateLabRequestRequest $request, LabRequest $labRequest)
    {
        Gate::authorize('update', $labRequest);

        $labRequest->update($request->validated());

        if ($request->wantsJson()) {
            return response()->json($labRequest->fresh());
        }

        return redirect()->route('lab-requests.index')->with('success', 'Lab request updated.');
    }

    public function clone(LabRequest $labRequest, CloneRecordAction $cloner)
    {
    Gate::authorize('create', LabRequest::class);

    $cloner->execute($labRequest);
    return redirect()->route('lab-requests.index')->with('success', 'Lab request cloned.');
    }

    public function destroy(Request $request, LabRequest $labRequest)
    {
        Gate::authorize('delete', $labRequest);

        $labRequest->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Lab request deleted.']);
        }

        return redirect()->route('lab-requests.index')->with('success', 'Lab request deleted.');
    }
}