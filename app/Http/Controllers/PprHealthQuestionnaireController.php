<?php

namespace App\Http\Controllers;

use App\Models\PprHealthQuestionnaire;
use App\Http\Requests\StorePprHealthQuestionnaireRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PprHealthQuestionnaireController extends Controller
{
    public function index()
    {
        $questionnaires = PprHealthQuestionnaire::with('user')->orderBy('questionnaire_id', 'desc')->get();
        return Inertia::render('PprHealthQuestionnaires/Index', ['questionnaires' => $questionnaires]);
    }

    public function create()
    {
        return Inertia::render('PprHealthQuestionnaires/Create');
    }

    public function store(StorePprHealthQuestionnaireRequest $request)
    {
        PprHealthQuestionnaire::create($request->validated());
        return redirect()->route('ppr-health-questionnaires.index')->with('success', 'Health questionnaire created.');
    }

    public function edit(PprHealthQuestionnaire $pprHealthQuestionnaire)
    {
        return Inertia::render('PprHealthQuestionnaires/Update', ['questionnaire' => $pprHealthQuestionnaire]);
    }

    public function update(Request $request, PprHealthQuestionnaire $pprHealthQuestionnaire)
    {
        $pprHealthQuestionnaire->update($request->all());
        return redirect()->route('ppr-health-questionnaires.index')->with('success', 'Health questionnaire updated.');
    }

    public function clone(PprHealthQuestionnaire $pprHealthQuestionnaire)
    {
        $clone = $pprHealthQuestionnaire->replicate();
        $clone->save();
        return redirect()->route('ppr-health-questionnaires.index')->with('success', 'Health questionnaire cloned.');
    }

    public function destroy(PprHealthQuestionnaire $pprHealthQuestionnaire)
    {
        $pprHealthQuestionnaire->delete();
        return redirect()->route('ppr-health-questionnaires.index')->with('success', 'Health questionnaire deleted.');
    }
}