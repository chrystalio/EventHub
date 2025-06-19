<?php

namespace Database\Seeders;

use App\Models\Building;
use App\Models\Room;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        $btpBuilding = Building::where('code', 'A')->first()->id;
        $itebaBuilding = Building::where('code', 'B')->first()->id;


        $rooms = [
            [
                'code' => 'B302',
                'name' => 'ITEBA B302',
                'building_id' => $itebaBuilding,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'B304',
                'name' => 'ITEBA B304',
                'building_id' => $itebaBuilding,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'B314',
                'name' => 'ITEBA B314',
                'building_id' => $itebaBuilding,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'Auditorium',
                'name' => 'Auditorium',
                'building_id' => $itebaBuilding,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'E203',
                'name' => 'Natuna',
                'building_id' => $btpBuilding,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'B102',
                'name' => 'Demo Kitchen',
                'building_id' => $btpBuilding,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'B201',
                'name' => 'Restaurant',
                'building_id' => $btpBuilding,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'B202',
                'name' => 'Barista Lab',
                'building_id' => $btpBuilding,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'B204',
                'name' => 'Mixology Lab',
                'building_id' => $btpBuilding,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'LAB-KOMP-BTP',
                'name' => 'Computer Lab BTP',
                'building_id' => $btpBuilding,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'A306',
                'name' => 'BTP A306',
                'building_id' => $btpBuilding,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'A309',
                'name' => 'BTP A309',
                'building_id' => $btpBuilding,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'LAB-PIZZA-BTP',
                'name' => 'Pizza Lab BTP',
                'building_id' => $btpBuilding,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'PASTRY-BTP',
                'name' => 'Pastry Bakery Lab BTP',
                'building_id' => $btpBuilding,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        Room::upsert($rooms, ['code'], ['name', 'building_id', 'updated_at']);
    }
}
