<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use JsonException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ExportPermissions extends Command
{
    protected $signature = 'export:permissions';
    protected $description = 'Export all permissions and role-permission mappings to JSON files';

    /**
     * @throws JsonException
     */
    public function handle(): int
    {
        // Export permissions
        $permissions = Permission::select('name', 'shortname', 'guard_name')->get();

        file_put_contents(
            base_path('permissions/permissions.json'),
            json_encode($permissions, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        $this->info('✅ Permissions exported to permissions/permissions.json');

        // Export role-permission mappings
        $roles = Role::with('permissions:name')->get();
        $rolePermissions = [];

        foreach ($roles as $role) {
            $permissionNames = $role->permissions->pluck('name')->toArray();
            $rolePermissions[$role->name] = $permissionNames;
        }

        file_put_contents(
            base_path('permissions/role_permissions.json'),
            json_encode($rolePermissions, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        $this->info('✅ Role-permission mappings exported to permissions/role_permissions.json');
        $this->newLine();
        $this->info('Export complete!');

        return 0;
    }
}

