<?php

namespace App\Http\Controllers;

use App\Models\PprPermanent;
use App\Http\Requests\StorePprPermanentRequest;
use App\Http\Requests\UpdatePprPermanentRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Actions\CloneRecordAction;

class PprPermanentController extends Controller
{
    public function index()
    {
        $permanents = PprPermanent::with('user')->orderBy('permanent_id', 'desc')->get();
        return Inertia::render('PprPermanents/Index', ['permanents' => $permanents]);
    }

    public function create()
    {
        return Inertia::render('PprPermanents/Create');
    }

    public function store(StorePprPermanentRequest $request)
    {
        PprPermanent::create($request->validated());
        return redirect()->route('ppr-permanents.index')->with('success', 'Permanent medical record created.');
    }

    public function edit(PprPermanent $pprPermanent)
    {
        return Inertia::render('PprPermanents/Update', ['permanent' => $pprPermanent]);
    }

    public function update(UpdatePprPermanentRequest $request, PprPermanent $pprPermanent)
    {
    $pprPermanent->update($request->validated());
    return redirect()->route('ppr-permanents.index')->with('success', 'Permanent medical record updated.');
    }

    public function clone(PprPermanent $pprPermanent, CloneRecordAction $cloner)
    {
        $cloner->execute($pprPermanent);
        return redirect()->route('ppr-permanents.index')->with('success', 'Permanent medical record cloned.');
    }

    public function destroy(PprPermanent $pprPermanent)
    {
        $pprPermanent->delete();
        return redirect()->route('ppr-permanents.index')->with('success', 'Permanent medical record deleted.');
    }
}