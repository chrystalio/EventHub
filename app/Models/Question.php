<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'questionnaire_category_id',
        'label',
        'type',
        'options',
        'order_column',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
        ];
    }


    public function questionnaireCategory(): BelongsTo
    {
        return $this->belongsTo(QuestionnaireCategory::class, 'questionnaire_category_id');
    }
}
