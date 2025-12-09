<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * NOTE: Role-permission assignments are now handled by the sync:permissions command
     * which is called in PermissionSeeder. This seeder is kept for backwards compatibility
     * but does nothing as the sync happens automatically from role_permissions.json.
     *
     * To modify role-permission assignments:
     * 1. Update permissions in the UI or database
     * 2. Run: php artisan export:permissions
     * 3. Commit the updated permissions/role_permissions.json file
     * 4. On fresh seed, permissions are automatically assigned from JSON
     */
    public function run(): void
    {
        $this->command->info('Role-permission assignments are handled by sync:permissions command (called in PermissionSeeder).');
        $this->command->info('Check permissions/role_permissions.json for current mappings.');
    }
}
