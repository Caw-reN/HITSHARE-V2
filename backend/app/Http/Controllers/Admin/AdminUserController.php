<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminUserController extends Controller
{
    /**
     * List all users
     */
    public function index(Request $request): JsonResponse
    {
        $search = trim($request->input('search', ''));
        $query = User::orderBy('created_at', 'desc');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->has('page') || $request->has('per_page')) {
            $perPage = min(100, max(1, (int) $request->input('per_page', 25)));
            $paginator = $query->paginate($perPage);
            $paginator->getCollection()->transform(function ($u) {
                return [
                    'id'         => $u->id,
                    'name'       => $u->name ?? '',
                    'email'      => $u->email,
                    'phone'      => $u->phone,
                    'device_id'  => $u->device_id,
                    'is_active'  => $u->is_active,
                    'status'     => $u->effectiveStatus(),
                    'expires_at' => $u->expires_at?->toISOString(),
                    'created_at' => $u->created_at?->toISOString(),
                    'days_left'  => $u->daysLeft(),
                ];
            });
            return response()->json($paginator);
        }

        $users = $query->limit(500)->get()->map(function ($u) {
            return [
                'id'         => $u->id,
                'name'       => $u->name ?? '',
                'email'      => $u->email,
                'phone'      => $u->phone,
                'device_id'  => $u->device_id,
                'is_active'  => $u->is_active,
                'status'     => $u->effectiveStatus(),
                'expires_at' => $u->expires_at?->toISOString(),
                'created_at' => $u->created_at?->toISOString(),
                'days_left'  => $u->daysLeft(),
            ];
        });

        return response()->json($users);
    }

    /**
     * Show single user
     */
    public function show($id): JsonResponse
    {
        $user = User::with(['orders' => function ($q) {
            $q->orderBy('created_at', 'desc')->limit(10);
        }])->find($id);

        if (!$user) {
            return response()->json(['error' => 'User tidak ditemukan'], 404);
        }

        return response()->json([
            'id'             => $user->id,
            'name'           => $user->name ?? '',
            'email'          => $user->email,
            'phone'          => $user->phone,
            'device_id'      => $user->device_id,
            'is_active'      => $user->is_active,
            'status'         => $user->effectiveStatus(),
            'expires_at'     => $user->expires_at?->toISOString(),
            'created_at'     => $user->created_at?->toISOString(),
            'days_left'      => $user->daysLeft(),
            'recent_orders'  => $user->orders,
        ]);
    }

    /**
     * Create user manually
     */
    public function store(Request $request): JsonResponse
    {
        $name = trim($request->input('name', ''));
        $email = trim(strtolower($request->input('email', '')));
        $phone = $request->input('phone');
        $password = $request->input('password');
        $status = $request->input('status', 'active');
        $expiresAt = $request->input('expires_at');

        if (!$email || !$phone || !$password) {
            return response()->json(['error' => 'Email, phone, dan password harus diisi'], 400);
        }

        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'Email sudah terdaftar'], 400);
        }

        $validStatuses = ['pending', 'active', 'expired', 'inactive'];
        $userStatus = in_array($status, $validStatuses) ? $status : 'active';

        $user = User::create([
            'name'       => $name ?: null,
            'email'      => $email,
            'phone'      => $phone,
            'password'   => $password,
            'is_active'  => ($userStatus === 'active'),
            'status'     => $userStatus,
            'expires_at' => $expiresAt ? Carbon::parse($expiresAt) : null,
        ]);

        return response()->json([
            'id'      => $user->id,
            'message' => 'User berhasil ditambahkan',
        ]);
    }

    /**
     * Update user
     */
    public function update($id, Request $request): JsonResponse
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User tidak ditemukan'], 404);
        }

        $validStatuses = ['pending', 'active', 'expired', 'inactive'];
        $status = $request->input('status', $user->status ?? 'active');
        $newStatus = in_array($status, $validStatuses) ? $status : 'active';

        if ($request->has('name')) {
            $user->name = trim((string) $request->input('name'));
        }
        if ($request->has('email')) {
            $user->email = trim(strtolower($request->input('email')));
        }
        if ($request->has('phone')) {
            $user->phone = $request->input('phone');
        }
        if ($request->filled('password')) {
            $user->password = $request->input('password');
        }
        if ($request->has('expires_at')) {
            $user->expires_at = $request->input('expires_at') ? Carbon::parse($request->input('expires_at')) : null;
        } elseif ($newStatus === 'active' && (!$user->expires_at || $user->expires_at->isPast())) {
            $user->expires_at = Carbon::now()->addDays(30);
        }

        $user->status = $newStatus;
        $user->is_active = ($newStatus === 'active');
        $user->save();

        return response()->json(['message' => 'User berhasil diperbarui']);
    }

    /**
     * Delete user
     */
    public function destroy($id): JsonResponse
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User tidak ditemukan'], 404);
        }

        $user->delete();

        return response()->json(['message' => 'User berhasil dihapus']);
    }

    /**
     * Reset device ID
     */
    public function resetDevice($id): JsonResponse
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User tidak ditemukan'], 404);
        }

        $user->device_id = null;
        $user->device_reset_count = 0;
        $user->save();

        return response()->json(['message' => "Device ID untuk {$user->email} berhasil direset."]);
    }

    /**
     * Export users CSV
     */
    public function export(): StreamedResponse
    {
        $users = User::orderBy('created_at', 'desc')->get();
        $filename = 'HitShare-users-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($users) {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, ['ID', 'Email', 'Phone', 'Status', 'Expired', 'Terdaftar']);

            $mapStatus = [
                'pending'  => 'Menunggu',
                'active'   => 'Aktif',
                'expired'  => 'Kadaluwarsa',
                'inactive' => 'Tidak Aktif',
            ];

            foreach ($users as $u) {
                $status = $mapStatus[$u->effectiveStatus()] ?? $u->effectiveStatus();
                $expiredStr = $u->expires_at ? $u->expires_at->format('d/m/Y') : '-';
                $createdStr = $u->created_at ? $u->created_at->format('d/m/Y') : '-';

                fputcsv($handle, [$u->id, $u->email, $u->phone, $status, $expiredStr, $createdStr]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type'        => 'text/csv; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
