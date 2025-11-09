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
        // Indexes for registrations table
        Schema::table('registrations', function (Blueprint $table) {
            // Single column indexes for common lookups
            $table->index('event_uuid', 'idx_registrations_event_uuid');
            $table->index('user_uuid', 'idx_registrations_user_uuid');
            $table->index('status', 'idx_registrations_status');

            // Composite indexes for common query patterns
            $table->index(['event_uuid', 'status'], 'idx_registrations_event_status');
            $table->index(['user_uuid', 'event_uuid'], 'idx_registrations_user_event');
        });

        // Indexes for registrations_attendees table
        Schema::table('registrations_attendees', function (Blueprint $table) {
            // registration_id should already have FK index, but add explicit index
            $table->index('registration_id', 'idx_attendees_registration_id');

            // For attendance filtering and queries
            $table->index('attended_at', 'idx_attendees_attended_at');

            // Composite indexes for common query patterns
            $table->index(['registration_id', 'attended_at'], 'idx_attendees_registration_attendance');
            $table->index(['attended_at', 'attendee_type'], 'idx_attendees_attended_type');
        });

        // Covering index for events table (optional but recommended)
        Schema::table('events', function (Blueprint $table) {
            // uuid already has unique index, but add covering index with start_time
            // This allows check-in time window validation without table lookup
            $table->index(['uuid', 'start_time'], 'idx_events_uuid_start');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropIndex('idx_registrations_event_uuid');
            $table->dropIndex('idx_registrations_user_uuid');
            $table->dropIndex('idx_registrations_status');
            $table->dropIndex('idx_registrations_event_status');
            $table->dropIndex('idx_registrations_user_event');
        });

        Schema::table('registrations_attendees', function (Blueprint $table) {
            $table->dropIndex('idx_attendees_registration_id');
            $table->dropIndex('idx_attendees_attended_at');
            $table->dropIndex('idx_attendees_registration_attendance');
            $table->dropIndex('idx_attendees_attended_type');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('idx_events_uuid_start');
        });
    }
};
