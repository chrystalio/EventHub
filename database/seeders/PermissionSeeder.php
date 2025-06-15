<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Artisan::call('sync:permissions');

        $this->command->info('Permissions have been synchronized successfully.');

        $adminRole = Role::findByName('System Administrator');
        $allPermissions = Permission::all();

        if ($allPermissions->isNotEmpty()) {
            $adminRole->syncPermissions($allPermissions);
            $this->command->info('All permissions have been assigned to the System Administrator role.');
        } else {
            $this->command->error('System Administrator role not found or no permissions exist.');
        }
    }
}
