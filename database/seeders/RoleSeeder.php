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
        Role::firstOrCreate(['name' => 'Akademik']);
        Role::firstOrCreate(['name' => 'Panitia']);
        Role::firstOrCreate(['name' => 'Peserta']);
    }
}
