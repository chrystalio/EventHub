<?php

namespace App\Console\Commands;

use App\Models\Registration;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;


class RejectPrivatePendingRegistrations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'registrations:reject-private-pending';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Rejects pending registrations for private events when the event has started.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for pending private registrations to reject...');

        $now = Carbon::now();

        $pendingToReject = Registration::where('status', 'pending')
            ->whereHas('event', function ($query) use ($now) {
                $query->where('type', 'private')
                    ->where('start_time', '<=', $now);
            })
            ->get();

        if ($pendingToReject->isEmpty()) {
            $this->info("No pending private registrations to reject.");
            return 0;
        }

        $rejectCount = $pendingToReject->count();
        $this->info("Found {$rejectCount} pending registration(s) to reject. Updating...");

        foreach ($pendingToReject as $registration) {
            $registration->update(['status' => 'rejected']);
        }

        Log::info("Successfully rejected {$rejectCount} pending private registrations.");
        $this->info("Successfully rejected {$rejectCount} pending private registrations.");

        return 0;
    }
}
