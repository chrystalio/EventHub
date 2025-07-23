<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('event_staff', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['event_id']);

            $table->dropColumn(['user_id', 'event_id']);

            $table->uuid('event_uuid')->after('id');
            $table->uuid('user_uuid')->after('event_uuid');

            $table->foreign('event_uuid')->references('uuid')->on('events')->onDelete('cascade');
            $table->foreign('user_uuid')->references('uuid')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_staff', function (Blueprint $table) {
            $table->dropColumn(['event_uuid', 'user_uuid']);

            $table->unsignedBigInteger('user_id')->after('id');
            $table->unsignedBigInteger('event_id')->after('user_id');

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
        });
    }
};
