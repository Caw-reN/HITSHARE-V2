<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;
use ZipArchive;

class AdminUploadController extends Controller
{
    /**
     * Upload brand image (logo or favicon)
     */
    public function uploadBrand(string $type, Request $request): JsonResponse
    {
        if (!in_array($type, ['logo', 'favicon'])) {
            return response()->json(['error' => 'Tipe tidak valid. Gunakan logo atau favicon.'], 400);
        }

        $validator = Validator::make($request->all(), [
            'file' => [
                'required',
                'file',
                'mimes:png,jpg,jpeg,gif,webp,ico,svg',
                'max:5120',
            ],
        ], [
            'file.required' => 'Tidak ada file yang diupload',
            'file.mimes'    => 'Format file tidak diizinkan. Hanya PNG, JPG, JPEG, GIF, WEBP, ICO, dan SVG yang diperbolehkan.',
            'file.max'      => 'Ukuran file maksimal 5 MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $file = $request->file('file');
        $allowed = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'];
        $ext = strtolower($file->getClientOriginalExtension());

        // Extra security: sanitize SVG against XSS
        if ($ext === 'svg') {
            $content = file_get_contents($file->getRealPath());
            if (preg_match('/<script|javascript:|onload|onerror|onclick|onmouseover/i', $content)) {
                return response()->json(['error' => 'File SVG terdeteksi mengandung skrip yang tidak aman'], 422);
            }
        }

        $uploadsDir = public_path('uploads');
        if (!File::exists($uploadsDir)) {
            File::makeDirectory($uploadsDir, 0755, true);
        }

        // Remove old file with different ext
        foreach ($allowed as $oldExt) {
            $oldPath = "{$uploadsDir}/{$type}.{$oldExt}";
            if (File::exists($oldPath)) {
                File::delete($oldPath);
            }
        }

        $filename = "{$type}.{$ext}";
        $file->move($uploadsDir, $filename);

        $fileUrl = "/uploads/{$filename}";
        $key = $type === 'favicon' ? 'favicon_url' : 'logo_url';
        Setting::set($key, $fileUrl);

        return response()->json([
            'message' => ($type === 'favicon' ? 'Favicon' : 'Logo') . ' berhasil diupload',
            'url'     => $fileUrl,
        ]);
    }

    /**
     * Delete brand image
     */
    public function deleteBrand(string $type): JsonResponse
    {
        if (!in_array($type, ['logo', 'favicon'])) {
            return response()->json(['error' => 'Tipe tidak valid'], 400);
        }

        $uploadsDir = public_path('uploads');
        $allowed = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'];

        foreach ($allowed as $ext) {
            $filePath = "{$uploadsDir}/{$type}.{$ext}";
            if (File::exists($filePath)) {
                File::delete($filePath);
            }
        }

        $key = $type === 'favicon' ? 'favicon_url' : 'logo_url';
        Setting::where('key', $key)->delete();

        return response()->json([
            'message' => ($type === 'favicon' ? 'Favicon' : 'Logo') . ' berhasil dihapus',
        ]);
    }

    /**
     * Upload website icon image
     */
    public function uploadWebsiteIcon(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => [
                'required',
                'file',
                'mimes:png,jpg,jpeg,gif,webp,ico,svg',
                'max:5120',
            ],
        ], [
            'file.required' => 'Tidak ada file yang diupload. Pastikan field name adalah "file".',
            'file.mimes'    => 'Format file tidak diizinkan. Hanya PNG, JPG, JPEG, GIF, WEBP, ICO, dan SVG yang diperbolehkan.',
            'file.max'      => 'Ukuran file maksimal 5 MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());

        if ($ext === 'svg') {
            $content = file_get_contents($file->getRealPath());
            if (preg_match('/<script|javascript:|onload|onerror|onclick|onmouseover/i', $content)) {
                return response()->json(['error' => 'File SVG terdeteksi mengandung skrip yang tidak aman'], 422);
            }
        }

        $iconsDir = public_path('uploads/icons');
        if (!File::exists($iconsDir)) {
            File::makeDirectory($iconsDir, 0755, true);
        }

        $filename = 'icon_' . time() . '_' . uniqid() . '.' . $ext;
        $file->move($iconsDir, $filename);

        $fileUrl = "/uploads/icons/{$filename}";

        return response()->json([
            'message' => 'Icon website berhasil diupload',
            'url'     => $fileUrl,
        ]);
    }

    /**
     * Upload extension ZIP
     */
    public function uploadExtension(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => [
                'required',
                'file',
                'mimes:zip',
                'max:51200',
            ],
        ], [
            'file.required' => 'Tidak ada file yang diupload. Pastikan field name adalah "file".',
            'file.mimes'    => 'Hanya file format ZIP yang diizinkan untuk ekstensi.',
            'file.max'      => 'Ukuran file ZIP maksimal 50 MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $file = $request->file('file');
        $downloadsDir = public_path('downloads');
        if (!File::exists($downloadsDir)) {
            File::makeDirectory($downloadsDir, 0755, true);
        }

        $filename = 'extension.zip';
        $fileSizeMb = number_format($file->getSize() / 1024 / 1024, 2);

        $targetZipPath = "{$downloadsDir}/{$filename}";
        $file->move($downloadsDir, $filename);
        $fileUrl = '/downloads/extension.zip';

        Setting::set('extension_download_url', $fileUrl);
        Setting::set('extension_updated_at', now()->toISOString());
        Setting::set('extension_file_size', "{$fileSizeMb} MB");

        // Priority 1: User explicitly input a version override
        // Priority 2: Auto-detect from manifest.json inside uploaded ZIP
        $newVersion = null;
        if ($request->filled('version')) {
            $newVersion = trim($request->input('version'));
        } else {
            $newVersion = $this->extractVersionFromZip($targetZipPath);
        }

        if ($newVersion) {
            Setting::set('extension_version', $newVersion);
        }

        $activeVersion = Setting::get('extension_version', '2.0.0');

        return response()->json([
            'message' => "File ekstensi berhasil diupload (Versi {$activeVersion})",
            'url'     => $fileUrl,
            'size'    => "{$fileSizeMb} MB",
            'version' => $activeVersion,
        ]);
    }

    /**
     * Extract extension version from manifest.json inside ZIP
     */
    private function extractVersionFromZip(string $zipPath): ?string
    {
        // 1. PHP ZipArchive (portable, secure, avoids shell exec)
        if (class_exists(ZipArchive::class)) {
            try {
                $zip = new ZipArchive();
                if ($zip->open($zipPath) === true) {
                    for ($i = 0; $i < $zip->numFiles; $i++) {
                        $name = $zip->getNameIndex($i);
                        $trimmed = trim((string) $name);
                        if ($trimmed === 'manifest.json' || str_ends_with($trimmed, '/manifest.json') || str_ends_with($trimmed, '\\manifest.json')) {
                            $content = $zip->getFromIndex($i);
                            if ($content) {
                                $manifest = json_decode($content, true);
                                if (!empty($manifest['version'])) {
                                    $zip->close();
                                    return trim((string) $manifest['version']);
                                }
                            }
                        }
                    }
                    $zip->close();
                }
            } catch (\Throwable $e) {}
        }

        // 2. Fallback: search binary string for "version": "x.y.z"
        try {
            $raw = file_get_contents($zipPath);
            if ($raw && preg_match('/"version"\s*:\s*"([0-9.]+)"/', $raw, $matches)) {
                return $matches[1];
            }
        } catch (\Throwable $e) {}

        return null;
    }

    /**
     * Delete extension ZIP
     */
    public function deleteExtension(): JsonResponse
    {
        $filePath = public_path('downloads/extension.zip');
        if (File::exists($filePath)) {
            File::delete($filePath);
        }

        Setting::whereIn('key', ['extension_download_url', 'extension_updated_at', 'extension_file_size'])->delete();

        return response()->json(['message' => 'File extension berhasil dihapus']);
    }
}
