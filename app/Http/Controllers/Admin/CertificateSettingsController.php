<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\CertificateSetting;
use App\Models\CertificateTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CertificateSettingsController extends Controller
{
    public function index(): Response
    {
        $settings = [
            'global_start_number' => CertificateSetting::getGlobalStartNumber(),
            'current_next_number' => $this->getNextCertificateNumber(),
            'total_issued' => Certificate::count(),
        ];

        return Inertia::render('admin/CertificateSettings/index', compact('settings'));
    }

    public function update(Request $request)
    {
        $request->validate([
            'global_start_number' => 'required|integer|min:1'
        ]);

        CertificateSetting::setGlobalStartNumber($request->global_start_number);

        return back()->with('success', 'Certificate settings updated successfully');
    }

    public function downloadTemplate(): StreamedResponse
    {
        // Find master template record in database
        $masterTemplate = \App\Models\CertificateTemplate::where('name', 'Master Certificate Template')->first();

        if (!$masterTemplate || !$masterTemplate->file_path) {
            return back()->with('error', 'Master template not found. Please upload the master template first.');
        }

        // Check if file exists using Storage facade
        if (!Storage::exists($masterTemplate->file_path)) {
            return back()->with('error', 'Master template file not found on disk.');
        }

        return Storage::download($masterTemplate->file_path, 'certificate_template.docx');
    }


    public function uploadMasterTemplate(Request $request)
    {
        $request->validate([
            'master_template' => 'required|file|mimes:docx|max:5120'
        ]);

        $file = $request->file('master_template');
        $filePath = $file->storeAs('certificate-templates', 'master_certificate_template.docx');

        // Update or create the master template record in database
        CertificateTemplate::updateOrCreate(
            ['name' => 'Master Certificate Template'],
            [
                'name' => 'Master Certificate Template',
                'theme' => 'master',
                'file_path' => $filePath,
                'config' => json_encode([])
            ]
        );

        return back()->with('success', 'Master template uploaded successfully');
    }


    private function getNextCertificateNumber()
    {
        $globalStart = CertificateSetting::getGlobalStartNumber();
        $totalIssued = Certificate::count();
        return $globalStart + $totalIssued;
    }
}
