<?php

namespace Database\Seeders;

use App\Models\Building;
use Illuminate\Database\Seeder;

class BuildingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $buildings = [
            [
                'code' => 'A',
                'name' => 'BTP',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'B',
                'name' => 'ITEBA',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ];

        Building::upsert($buildings, ['code'], ['name', 'updated_at']);
    }
}
