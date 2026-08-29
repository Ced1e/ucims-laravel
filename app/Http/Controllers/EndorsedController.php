<?php

namespace App\Http\Controllers;

use App\Models\Endorsed;
use App\Http\Requests\StoreEndorsedRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EndorsedController extends Controller
{
    public function index()
    {
        $endorsements = Endorsed::with(['queue', 'doctor'])->orderBy('endorsed_id', 'desc')->get();
        return Inertia::render('Endorsed/Index', ['endorsements' => $endorsements]);
    }

    public function create()
    {
        return Inertia::render('Endorsed/Create');
    }

    public function store(StoreEndorsedRequest $request)
    {
        Endorsed::create($request->validated());
        return redirect()->route('endorsed.index')->with('success', 'Consultation record saved.');
    }

    public function edit(Endorsed $endorsed)
    {
        return Inertia::render('Endorsed/Update', ['endorsed' => $endorsed]);
    }

    public function update(Request $request, Endorsed $endorsed)
    {
        $endorsed->update($request->all());
        return redirect()->route('endorsed.index')->with('success', 'Consultation record updated.');
    }

    public function clone(Endorsed $endorsed)
    {
        $clone = $endorsed->replicate();
        $clone->save();
        return redirect()->route('endorsed.index')->with('success', 'Consultation record cloned.');
    }

    public function destroy(Endorsed $endorsed)
    {
        $endorsed->delete();
        return redirect()->route('endorsed.index')->with('success', 'Consultation record deleted.');
    }
}