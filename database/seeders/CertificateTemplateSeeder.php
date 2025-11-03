<?php

namespace Database\Seeders;

use App\Models\CertificateTemplate;
use Illuminate\Database\Seeder;

class CertificateTemplateSeeder extends Seeder
{
    public function run(): void
    {
        CertificateTemplate::create([
            'name' => 'ITEBA Professional',
            'theme' => 'iteba_professional',
            'config' => [
                'primary_color' => '#0056b3',
                'font_family' => 'Times New Roman',
            ]
        ]);
    }
}
