<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminAuthController extends Controller
{
    /**
     * Admin Login
     */
    public function login(Request $request): JsonResponse
    {
        $username = trim($request->input('username', ''));
        $password = $request->input('password');

        if (!$username || !$password) {
            return response()->json(['error' => 'Username dan password harus diisi'], 400);
        }

        $admin = Admin::where('username', $username)->first();

        if (!$admin || !Hash::check($password, $admin->password)) {
            return response()->json(['error' => 'Username atau password salah'], 401);
        }

        $admin->tokens()->where('name', 'admin-token')->delete();
        $token = $admin->createToken('admin-token')->plainTextToken;

        return response()->json([
            'token'    => $token,
            'username' => $admin->username,
            'role'     => $admin->role ?? 'operator',
        ]);
    }

    /**
     * Change own password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $currentPassword = $request->input('currentPassword');
        $newPassword = $request->input('newPassword');

        if (!$currentPassword || !$newPassword) {
            return response()->json(['error' => 'Password lama dan baru harus diisi'], 400);
        }

        if (strlen($newPassword) < 6) {
            return response()->json(['error' => 'Password baru minimal 6 karakter'], 400);
        }

        $admin = $request->user();

        if (!Hash::check($currentPassword, $admin->password)) {
            return response()->json(['error' => 'Password lama tidak sesuai'], 401);
        }

        $admin->password = $newPassword; // Casted as hashed in model
        // SEC FIX (AUD2-HIGH-04): Revoke all existing tokens to invalidate compromised sessions
        $admin->tokens()->delete();
        $admin->save();

        $newToken = $admin->createToken('admin-token')->plainTextToken;

        return response()->json([
            'message' => 'Password berhasil diubah. Seluruh sesi lain telah dicabut demi keamanan.',
            'token'   => $newToken,
        ]);
    }

    /**
     * Superadmin: List all admins
     */
    public function list(): JsonResponse
    {
        $admins = Admin::select('id', 'username', 'role', 'created_at')
            ->orderBy('created_at')
            ->get();

        return response()->json($admins);
    }

    /**
     * Superadmin: Create new admin
     */
    public function create(Request $request): JsonResponse
    {
        $username = trim($request->input('username', ''));
        $password = $request->input('password');
        $role = $request->input('role', 'operator');

        if (!$username || !$password) {
            return response()->json(['error' => 'Username dan password harus diisi'], 400);
        }

        if (strlen($password) < 6) {
            return response()->json(['error' => 'Password minimal 6 karakter'], 400);
        }

        $validRoles = ['superadmin', 'operator'];
        $adminRole = in_array($role, $validRoles) ? $role : 'operator';

        if (Admin::where('username', $username)->exists()) {
            return response()->json(['error' => 'Username sudah digunakan'], 400);
        }

        $admin = Admin::create([
            'username' => $username,
            'password' => $password,
            'role'     => $adminRole,
        ]);

        return response()->json([
            'id'      => $admin->id,
            'message' => 'Admin berhasil ditambahkan',
        ]);
    }

    /**
     * Superadmin: Delete admin
     */
    public function destroy($id, Request $request): JsonResponse
    {
        $currentAdmin = $request->user();
        if ($currentAdmin->id == $id) {
            return response()->json(['error' => 'Tidak dapat menghapus akun sendiri'], 400);
        }

        $target = Admin::find($id);
        if (!$target) {
            return response()->json(['error' => 'Admin tidak ditemukan'], 404);
        }

        $target->delete();

        return response()->json(['message' => 'Admin berhasil dihapus']);
    }
}
