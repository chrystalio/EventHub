<?php

namespace App\Console\Commands;

use App\Models\Registration;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class MarkMissedRegistrations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'registrations:mark-missed';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Marks registrations as "missed" if the check-in window has passed and no attendees have checked in.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for missed registrations...');

        $now = Carbon::now();

        // Find all registrations that are still 'approved' or 'pending_payment'
        // for events where the check-in window (start_time + 1 hour) has passed.
        $missedRegistrations = Registration::whereIn('status', ['approved', 'pending_payment'])
            ->whereHas('event', function ($query) use ($now) {
                // The check-in window is considered closed 1 hour after the event starts.
                $query->where('start_time', '<', $now->copy()->subHour());
            })
            ->whereDoesntHave('attendees', function ($query) {
                // And where no attendee has a check-in timestamp.
                $query->whereNotNull('attended_at');
            })
            ->get();

        if ($missedRegistrations->isEmpty()) {
            $this->info('No registrations to mark as missed.');
            return 0;
        }

        $count = $missedRegistrations->count();
        $this->info("Found {$count} registration(s) to mark as missed. Updating...");

        foreach ($missedRegistrations as $registration) {
            $registration->update(['status' => 'missed']);
        }

        Log::info("Successfully marked {$count} registrations as missed.");
        $this->info("Successfully marked {$count} registrations as missed.");

        return 0;
    }
}
