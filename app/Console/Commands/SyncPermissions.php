<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;

class SyncPermissions extends Command
{
    protected $signature = 'sync:permissions';
    protected $description = 'Sync permissions from storage/app/permission.json into the database';

    /**
     * @throws \JsonException
     */
    public function handle(): int
    {
        $path = base_path('permissions/permission.json');

        if (!file_exists($path)) {
            $this->error('permission.json file not found.');
            return self::FAILURE;
        }

        $data = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        if (!is_array($data)) {
            $this->error('Invalid JSON structure.');
            return self::FAILURE;
        }

        foreach ($data as $item) {
            $permission = Permission::firstOrCreate(
                [
                    'name' => $item['name'],
                    'guard_name' => $item['guard_name'] ?? config('auth.defaults.guard'),
                ],
                [
                    'shortname' => $item['shortname'] ?? null,
                ]
            );

            if ($permission->wasRecentlyCreated) {
                $this->info("✅ Created: {$permission->name}");
            } else {
                $this->line("ℹ️  Exists: {$permission->name}");
            }
        }

        $this->info('✔️ Sync complete.');
        return self::SUCCESS;
    }
}
