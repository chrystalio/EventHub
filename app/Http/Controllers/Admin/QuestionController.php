<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\QuestionnaireCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function store(Request $request, QuestionnaireCategory $questionnaireCategory): RedirectResponse
    {
        $validated = $request->validate([
            'label' => 'required|string|max:500',
            'type' => 'required|string|in:open,likert',
            'options' => 'nullable|array',
            'options.*' => 'string|max:255',
        ]);

        $maxOrder = $questionnaireCategory->questions()->max('order_column') ?? 0;

        $question = $questionnaireCategory->questions()->create([
            'label' => $validated['label'],
            'type' => $validated['type'],
            'options' => $validated['options'] ?? null,
            'order_column' => $maxOrder + 1,
        ]);

        return redirect()->back()->with('success', 'Question added successfully.');
    }

    public function update(Request $request, QuestionnaireCategory $questionnaireCategory, Question $question): RedirectResponse
    {
        $validated = $request->validate([
            'label' => 'required|string|max:500',
            'type' => 'required|string|in:open,likert',
            'options' => 'nullable|array',
            'options.*' => 'string|max:255',
        ]);

        $question->update($validated);

        return redirect()->back()->with('success', 'Question updated successfully.');
    }

    public function destroy(QuestionnaireCategory $questionnaireCategory, Question $question): RedirectResponse
    {
        $deletedOrder = $question->order_column;
        $categoryId = $question->questionnaire_category_id;

        $question->delete();

        Question::where('questionnaire_category_id', $categoryId)
            ->where('order_column', '>', $deletedOrder)
            ->decrement('order_column');

        return redirect()->back()->with('success', 'Question deleted successfully.');
    }

}
