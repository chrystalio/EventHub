<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Role::firstOrCreate(['name' => 'System Administrator']);
        Role::firstOrCreate(['name' => 'user']);
        Role::firstOrCreate(['name' => 'guest']);
        Role::firstOrCreate(['name' => 'super-admin']);
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'editor']);
        Role::firstOrCreate(['name' => 'viewer']);
        Role::firstOrCreate(['name' => 'contributor']);
        Role::firstOrCreate(['name' => 'moderator']);
        Role::firstOrCreate(['name' => 'support']);
        Role::firstOrCreate(['name' => 'manager']);
        Role::firstOrCreate(['name' => 'developer']);
        Role::firstOrCreate(['name' => 'analyst']);
        Role::firstOrCreate(['name' => 'designer']);
        Role::firstOrCreate(['name' => 'tester']);
        Role::firstOrCreate(['name' => 'sales']);
        Role::firstOrCreate(['name' => 'marketing']);
        Role::firstOrCreate(['name' => 'hr']);
        Role::firstOrCreate(['name' => 'finance']);
        Role::firstOrCreate(['name' => 'legal']);
        Role::firstOrCreate(['name' => 'operations']);
        Role::firstOrCreate(['name' => 'support-agent']);
    }
}
