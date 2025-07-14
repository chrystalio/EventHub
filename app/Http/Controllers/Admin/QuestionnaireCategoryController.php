<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuestionnaireCategoryRequest;
use App\Http\Requests\UpdateQuestionnaireCategoryRequest;
use App\Models\QuestionnaireCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuestionnaireCategoryController extends Controller
{
    public function index(): Response
    {
        $questionnaireCategories = QuestionnaireCategory::withCount('questions')
            ->latest()
            ->get();

        return Inertia::render('admin/questionnaire-categories/index', [
            'questionnaireCategories' => $questionnaireCategories,
        ]);
    }

    public function store(StoreQuestionnaireCategoryRequest $request): RedirectResponse
    {
        QuestionnaireCategory::create($request->validated());

        return redirect()->route('admin.questionnaire-categories.index')
            ->with('success', 'Questionnaire category created successfully.');
    }

    public function update(UpdateQuestionnaireCategoryRequest $request, QuestionnaireCategory $questionnaireCategory): RedirectResponse
    {
        $questionnaireCategory->update($request->validated());

        return redirect()->route('admin.questionnaire-categories.index')
            ->with('success', 'Questionnaire category updated successfully.');
    }

    public function show(QuestionnaireCategory $questionnaireCategory): Response
    {
        $questionnaireCategory->load(['questions' => function ($query) {
            $query->orderBy('order_column');
        }]);

        return Inertia::render('admin/questionnaire-categories/show', [
            'questionnaireCategory' => $questionnaireCategory,
            'questions' => $questionnaireCategory->questions,
        ]);
    }

    public function destroy(QuestionnaireCategory $questionnaireCategory): RedirectResponse
    {
        $questionnaireCategory->delete();

        return redirect()->route('admin.questionnaire-categories.index')
            ->with('success', 'Questionnaire category deleted successfully.');
    }
}
