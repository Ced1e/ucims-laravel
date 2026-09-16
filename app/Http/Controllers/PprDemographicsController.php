<?php

namespace App\Http\Controllers;

use App\Models\PprDemographic;
use App\Http\Requests\StorePprDemographicRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PprDemographicsController extends Controller
{
    public function index()
    {
        $demographics = PprDemographic::with('user')->orderBy('demo_id', 'desc')->get();
        return Inertia::render('PprDemographics/Index', ['demographics' => $demographics]);
    }

    public function create()
    {
        return Inertia::render('PprDemographics/Create');
    }

    public function store(StorePprDemographicRequest $request)
    {
        PprDemographic::create($request->validated());
        return redirect()->route('ppr-demographics.index')->with('success', 'Demographics created.');
    }

    public function edit(PprDemographic $pprDemographic)
    {
        return Inertia::render('PprDemographics/Update', ['demographic' => $pprDemographic]);
    }

    public function update(Request $request, PprDemographic $pprDemographic)
    {
        $pprDemographic->update($request->all());
        return redirect()->route('ppr-demographics.index')->with('success', 'Demographics updated.');
    }

    public function clone(PprDemographic $pprDemographic)
    {
        $clone = $pprDemographic->replicate();
        $clone->save();
        return redirect()->route('ppr-demographics.index')->with('success', 'Demographics cloned.');
    }

    public function destroy(PprDemographic $pprDemographic)
    {
        $pprDemographic->delete();
        return redirect()->route('ppr-demographics.index')->with('success', 'Demographics deleted.');
    }
}
