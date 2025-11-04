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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_uuid');
            $table->uuid('event_uuid');
            $table->string('order_id')->unique();
            $table->unsignedBigInteger('total_amount');
            $table->string('status')->default('pending');
            $table->string('transaction_id')->nullable();
            $table->json('payment_details')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('user_uuid')->references('uuid')->on('users')->onDelete('cascade');
            $table->foreign('event_uuid')->references('uuid')->on('events')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
