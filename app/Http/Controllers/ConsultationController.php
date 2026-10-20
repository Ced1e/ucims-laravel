<?php

namespace App\Http\Controllers;

use App\Models\Consultation;
use App\Http\Requests\StoreConsultationRequest;
use App\Http\Requests\UpdateConsultationRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Actions\CloneRecordAction;

class ConsultationController extends Controller
{
    public function index()
    {
        $consultations = Consultation::with(['queue', 'doctor'])->orderBy('consultation_id', 'desc')->get();
        return Inertia::render('Consultations/Index', ['consultations' => $consultations]);
    }

    public function create()
    {
        return Inertia::render('Consultations/Create');
    }

    public function store(StoreConsultationRequest $request)
    {
        $data = $request->validated();
        $data['consultation_date'] = $data['consultation_date'] ?? now()->format('Y-m-d');

        Consultation::create($data);
        return redirect()->route('consultations.index')->with('success', 'Consultation created.');
    }

    public function edit(Consultation $consultation)
    {
        return Inertia::render('Consultations/Update', ['consultation' => $consultation]);
    }

    public function update(UpdateConsultationRequest $request, Consultation $consultation)
    {
        $consultation->update($request->validated());
        return redirect()->route('consultations.index')->with('success', 'Consultation updated.');
    }

    public function clone(Consultation $consultation, CloneRecordAction $cloner)
    {
        $overrides = [];
        if ($consultation->diagnosis) {
            $overrides['diagnosis'] = $consultation->diagnosis.' (Copy)';
        }

        $cloner->execute($consultation, $overrides);
        return redirect()->route('consultations.index')->with('success', 'Consultation cloned.');
    }

    public function destroy(Consultation $consultation)
    {
        $consultation->delete();
        return redirect()->route('consultations.index')->with('success', 'Consultation deleted.');
    }
}