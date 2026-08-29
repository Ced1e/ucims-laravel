<?php

namespace App\Http\Controllers;

use App\Models\LabRequest;
use App\Http\Requests\StoreLabRequestRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LabRequestController extends Controller
{
    public function index()
    {
        $requests = LabRequest::with('endorsed')->orderBy('lab_id', 'desc')->get();
        return Inertia::render('LabRequests/Index', ['requests' => $requests]);
    }

    public function create()
    {
        return Inertia::render('LabRequests/Create');
    }

    public function store(StoreLabRequestRequest $request)
    {
        LabRequest::create($request->validated());
        return redirect()->route('lab-requests.index')->with('success', 'Lab request created.');
    }

    public function edit(LabRequest $labRequest)
    {
        return Inertia::render('LabRequests/Update', ['labRequest' => $labRequest]);
    }

    public function update(Request $request, LabRequest $labRequest)
    {
        $labRequest->update($request->all());
        return redirect()->route('lab-requests.index')->with('success', 'Lab request updated.');
    }

    public function clone(LabRequest $labRequest)
    {
        $clone = $labRequest->replicate();
        $clone->save();
        return redirect()->route('lab-requests.index')->with('success', 'Lab request cloned.');
    }

    public function destroy(LabRequest $labRequest)
    {
        $labRequest->delete();
        return redirect()->route('lab-requests.index')->with('success', 'Lab request deleted.');
    }
}