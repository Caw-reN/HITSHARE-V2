<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminPlanController extends Controller
{
    /**
     * List all plans (admin view)
     */
    public function index(): JsonResponse
    {
        $plans = Plan::orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json($plans);
    }

    /**
     * Create a new plan
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label'          => 'required|string|max:100',
            'plan'           => 'nullable|string|max:50|unique:plans,plan',
            'amount'         => 'required|integer|min:1000',
            'duration_days'  => 'required|integer|min:1',
            'original_price' => 'nullable|integer|min:0',
            'badge'          => 'nullable|string|max:50',
            'description'    => 'nullable|string|max:255',
            'is_active'      => 'nullable|boolean',
            'sort_order'     => 'nullable|integer',
        ], [
            'label.required'         => 'Nama / label paket wajib diisi',
            'amount.required'        => 'Harga paket wajib diisi',
            'duration_days.required' => 'Durasi hari wajib diisi',
            'plan.unique'            => 'Kode paket ini sudah digunakan',
        ]);

        // Auto-generate plan slug if empty
        if (empty($validated['plan'])) {
            $slug = Str::slug($validated['label']);
            $count = Plan::where('plan', 'LIKE', "{$slug}%")->count();
            $validated['plan'] = $count > 0 ? "{$slug}-" . ($count + 1) : $slug;
        } else {
            $validated['plan'] = Str::slug($validated['plan']);
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? (Plan::max('sort_order') + 1));
        $validated['original_price'] = (int) ($validated['original_price'] ?? 0);

        $plan = Plan::create($validated);

        return response()->json([
            'message' => 'Paket langganan berhasil ditambahkan',
            'plan'    => $plan,
        ], 201);
    }

    /**
     * Update an existing plan
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $plan = Plan::findOrFail($id);

        $validated = $request->validate([
            'label'          => 'required|string|max:100',
            'plan'           => 'required|string|max:50|unique:plans,plan,' . $plan->id,
            'amount'         => 'required|integer|min:1000',
            'duration_days'  => 'required|integer|min:1',
            'original_price' => 'nullable|integer|min:0',
            'badge'          => 'nullable|string|max:50',
            'description'    => 'nullable|string|max:255',
            'is_active'      => 'nullable|boolean',
            'sort_order'     => 'nullable|integer',
        ], [
            'label.required'         => 'Nama / label paket wajib diisi',
            'amount.required'        => 'Harga paket wajib diisi',
            'duration_days.required' => 'Durasi hari wajib diisi',
            'plan.unique'            => 'Kode paket ini sudah digunakan',
        ]);

        $validated['plan'] = Str::slug($validated['plan']);
        $validated['is_active'] = $request->has('is_active') ? $request->boolean('is_active') : $plan->is_active;
        $validated['original_price'] = (int) ($validated['original_price'] ?? 0);
        $validated['sort_order'] = (int) ($validated['sort_order'] ?? $plan->sort_order);

        $plan->update($validated);

        return response()->json([
            'message' => 'Paket langganan berhasil diperbarui',
            'plan'    => $plan,
        ]);
    }

    /**
     * Delete a plan
     */
    public function destroy(int $id): JsonResponse
    {
        $plan = Plan::findOrFail($id);

        // Keep at least 1 plan active in system
        if (Plan::count() <= 1) {
            return response()->json([
                'error' => 'Tidak dapat menghapus. Sistem harus memiliki minimal 1 paket langganan.',
            ], 422);
        }

        $plan->delete();

        return response()->json([
            'message' => 'Paket langganan berhasil dihapus',
        ]);
    }

    /**
     * Toggle active status
     */
    public function toggle(int $id): JsonResponse
    {
        $plan = Plan::findOrFail($id);
        $plan->is_active = !$plan->is_active;
        $plan->save();

        return response()->json([
            'message'   => $plan->is_active ? 'Paket diaktifkan' : 'Paket dinonaktifkan',
            'is_active' => $plan->is_active,
        ]);
    }
}
