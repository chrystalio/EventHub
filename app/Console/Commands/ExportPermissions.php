<?php

// app/Console/Commands/ExportPermissions.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use JsonException;
use Spatie\Permission\Models\Permission;

class ExportPermissions extends Command
{
    protected $signature = 'export:permissions';
    protected $description = 'Export all permissions to a JSON file';

    /**
     * @throws JsonException
     */
    public function handle(): int
    {
        $permissions = Permission::select('name', 'shortname', 'guard_name')->get();

        file_put_contents(
            base_path('permissions/permission.json'),
            json_encode($permissions, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        $this->info('Permissions exported successfully.');
        return 0;
    }
}

