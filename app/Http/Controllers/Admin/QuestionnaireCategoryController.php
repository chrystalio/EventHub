<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuestionnaireCategoryRequest;
use App\Http\Requests\UpdateQuestionnaireCategoryRequest;
use App\Models\QuestionnaireCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuestionnaireCategoryController extends Controller
{
    public function index()
    {
        $questionnaireCategories = QuestionnaireCategory::latest()->get();

        $questionnaireCategories->each(function ($category) {
            $category->questions_count = 0;
        });

        return Inertia::render('admin/questionnaire-categories/index', [
            'questionnaireCategories' => $questionnaireCategories,
        ]);
    }


    public function store(StoreQuestionnaireCategoryRequest $request): RedirectResponse
    {
        QuestionnaireCategory::create($request->validated());

        return redirect()->route('admin.questionnaire-categories.index')->with('success', 'Questionnaire category created successfully.');
    }

    public function update(UpdateQuestionnaireCategoryRequest $request, QuestionnaireCategory $questionnaireCategory): RedirectResponse
    {
        $questionnaireCategory->update($request->validated());

        return redirect()->route('admin.questionnaire-categories.index')
            ->with('success', 'Questionnaire category updated successfully.');
    }

    public function destroy(QuestionnaireCategory $questionnaireCategory): RedirectResponse
    {
        $questionnaireCategory->delete();

        return redirect()->route('admin.questionnaire-categories.index')
            ->with('success', 'Questionnaire category deleted successfully.');
    }

}
