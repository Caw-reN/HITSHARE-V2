<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminVoucherController extends Controller
{
    /**
     * List all vouchers
     */
    public function index(): JsonResponse
    {
        $vouchers = Voucher::withCount('usages')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($vouchers);
    }

    /**
     * Create voucher
     */
    public function store(Request $request): JsonResponse
    {
        $code = strtoupper(trim($request->input('code', '')));
        $discountValue = (int) $request->input('discount_value', 0);
        $discountType = $request->input('discount_type', 'percent');

        if (!$code) {
            return response()->json(['error' => 'Kode voucher harus diisi'], 400);
        }

        if ($discountValue <= 0) {
            return response()->json(['error' => 'Nilai diskon harus lebih dari 0'], 400);
        }

        if ($discountType === 'percent' && $discountValue > 100) {
            return response()->json(['error' => 'Diskon persen maksimal 100%'], 400);
        }

        if (Voucher::where('code', $code)->exists()) {
            return response()->json(['error' => 'Kode voucher sudah ada'], 400);
        }

        $validUntil = $request->input('valid_until');
        $validFrom = $request->input('valid_from');

        $validPlans = array_unique(array_merge(['all', 'monthly', '6months', 'yearly'], \App\Models\Plan::pluck('plan')->toArray()));
        $appliesToInput = $request->input('applies_to', 'all');
        $appliesTo = in_array($appliesToInput, $validPlans) ? $appliesToInput : 'all';

        $voucher = Voucher::create([
            'code'           => $code,
            'description'    => (string) ($request->input('description') ?? ''),
            'discount_type'  => in_array($discountType, ['percent', 'fixed']) ? $discountType : 'percent',
            'discount_value' => $discountValue,
            'max_uses'       => (int) $request->input('max_uses', 0),
            'min_amount'     => (int) $request->input('min_amount', 0),
            'applies_to'     => $appliesTo,
            'valid_from'     => $validFrom ? Carbon::parse($validFrom) : null,
            'valid_until'    => $validUntil ? Carbon::parse($validUntil) : null,
            'is_active'      => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'id'      => $voucher->id,
            'message' => 'Voucher berhasil ditambahkan',
        ]);
    }

    /**
     * Update voucher
     */
    public function update($id, Request $request): JsonResponse
    {
        $voucher = Voucher::find($id);
        if (!$voucher) {
            return response()->json(['error' => 'Voucher tidak ditemukan'], 404);
        }

        if ($request->has('code')) {
            $code = strtoupper(trim($request->input('code', '')));
            if (!$code) {
                return response()->json(['error' => 'Kode voucher tidak boleh kosong'], 400);
            }
            if (Voucher::where('code', $code)->where('id', '!=', $id)->exists()) {
                return response()->json(['error' => 'Kode voucher sudah digunakan oleh voucher lain'], 400);
            }
            $voucher->code = $code;
        }

        if ($request->has('description')) {
            $voucher->description = (string) ($request->input('description') ?? '');
        }
        if ($request->has('discount_type')) {
            $voucher->discount_type = in_array($request->input('discount_type'), ['percent', 'fixed']) ? $request->input('discount_type') : 'percent';
        }
        if ($request->has('discount_value')) {
            $discountValue = (int) $request->input('discount_value');
            if ($discountValue <= 0) {
                return response()->json(['error' => 'Nilai diskon harus lebih dari 0'], 400);
            }
            if ($voucher->discount_type === 'percent' && $discountValue > 100) {
                return response()->json(['error' => 'Diskon persen maksimal 100%'], 400);
            }
            $voucher->discount_value = $discountValue;
        }
        if ($request->has('max_uses')) {
            $voucher->max_uses = max(0, (int) $request->input('max_uses', 0));
        }
        if ($request->has('min_amount')) {
            $voucher->min_amount = max(0, (int) $request->input('min_amount', 0));
        }
        if ($request->has('applies_to')) {
            $validPlans = array_unique(array_merge(['all', 'monthly', '6months', 'yearly'], \App\Models\Plan::pluck('plan')->toArray()));
            $appliesToInput = $request->input('applies_to');
            $voucher->applies_to = in_array($appliesToInput, $validPlans) ? $appliesToInput : 'all';
        }
        if ($request->has('valid_from')) {
            $voucher->valid_from = $request->input('valid_from') ? Carbon::parse($request->input('valid_from')) : null;
        }
        if ($request->has('valid_until')) {
            $voucher->valid_until = $request->input('valid_until') ? Carbon::parse($request->input('valid_until')) : null;
        }
        if ($request->has('is_active')) {
            $voucher->is_active = $request->boolean('is_active');
        }

        $voucher->save();

        return response()->json([
            'message' => 'Voucher berhasil diperbarui',
            'voucher' => $voucher,
        ]);
    }

    /**
     * Delete voucher
     */
    public function destroy($id): JsonResponse
    {
        $voucher = Voucher::find($id);
        if (!$voucher) {
            return response()->json(['error' => 'Voucher tidak ditemukan'], 404);
        }

        $voucher->delete();

        return response()->json(['message' => 'Voucher berhasil dihapus']);
    }
}
