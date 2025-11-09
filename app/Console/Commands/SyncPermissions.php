<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class SyncPermissions extends Command
{
    protected $signature = 'sync:permissions';
    protected $description = 'Sync permissions and role-permission mappings from JSON files into the database';

    /**
     * @throws \JsonException
     */
    public function handle(): int
    {
        // Sync permissions
        $this->info('📥 Syncing permissions...');
        $this->syncPermissionsFromJson();

        // Sync role-permission mappings
        $this->newLine();
        $this->info('📥 Syncing role-permission mappings...');
        $this->syncRolePermissionsFromJson();

        $this->newLine();
        $this->info('✔️ Sync complete!');
        return self::SUCCESS;
    }

    /**
     * Sync permissions from permissions.json
     *
     * @throws \JsonException
     */
    protected function syncPermissionsFromJson(): void
    {
        $path = base_path('permissions/permissions.json');

        if (!file_exists($path)) {
            $this->warn('⚠️  permissions.json file not found. Skipping permission sync.');
            return;
        }

        $data = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        if (!is_array($data)) {
            $this->error('Invalid JSON structure in permissions.json');
            return;
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
                $this->info("  ✅ Created: {$permission->name}");
            } else {
                $this->line("  ℹ️  Exists: {$permission->name}");
            }
        }
    }

    /**
     * Sync role-permission mappings from role_permissions.json
     *
     * @throws \JsonException
     */
    protected function syncRolePermissionsFromJson(): void
    {
        $path = base_path('permissions/role_permissions.json');

        if (!file_exists($path)) {
            $this->warn('⚠️  role_permissions.json file not found. Skipping role-permission sync.');
            return;
        }

        $data = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        if (!is_array($data)) {
            $this->error('Invalid JSON structure in role_permissions.json');
            return;
        }

        foreach ($data as $roleName => $permissionNames) {
            $role = Role::findByName($roleName);

            if (!$role) {
                $this->warn("  ⚠️  Role '{$roleName}' not found. Skipping.");
                continue;
            }

            if (!is_array($permissionNames)) {
                $this->warn("  ⚠️  Invalid permissions for role '{$roleName}'. Skipping.");
                continue;
            }

            // Get actual permission models
            $permissions = Permission::whereIn('name', $permissionNames)->get();

            // Sync permissions to role
            $role->syncPermissions($permissions);

            $count = count($permissionNames);
            $this->info("  ✅ {$roleName}: {$count} permission(s) assigned");
        }
    }
}
