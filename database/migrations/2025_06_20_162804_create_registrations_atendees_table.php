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
        Schema::create('registrations_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained('registrations')->onDelete('cascade');
            $table->string('attendee_type');
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('qr_code')->unique();
            $table->timestamp('attended_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registrations_attendees');
    }
};
