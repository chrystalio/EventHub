<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->boolean('certificate_enabled')->default(false)->after('price');
            $table->unsignedBigInteger('certificate_template_id')->nullable()->after('questionnaire_category_id');
            $table->string('certificate_number_format')->nullable()->after('certificate_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['certificate_enabled', 'certificate_template_id', 'certificate_number_format']);
        });
    }
};
