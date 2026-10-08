<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCategoryController extends Controller
{
    /**
     * List all categories
     */
    public function index(): JsonResponse
    {
        $categories = Category::withCount('websites')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    /**
     * Create category
     */
    public function store(Request $request): JsonResponse
    {
        $name = trim($request->input('name', ''));
        $icon = $request->input('icon', '');
        $sortOrder = (int) $request->input('sort_order', 0);

        if (!$name) {
            return response()->json(['error' => 'Nama kategori harus diisi'], 400);
        }

        $category = Category::create([
            'name'       => $name,
            'icon'       => $icon,
            'sort_order' => $sortOrder,
        ]);

        return response()->json([
            'id'      => $category->id,
            'message' => 'Kategori berhasil ditambahkan',
        ]);
    }

    /**
     * Update category
     */
    public function update($id, Request $request): JsonResponse
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['error' => 'Kategori tidak ditemukan'], 404);
        }

        if ($request->has('name')) {
            $category->name = trim($request->input('name'));
        }
        if ($request->has('icon')) {
            $category->icon = $request->input('icon', '');
        }
        if ($request->has('sort_order')) {
            $category->sort_order = (int) $request->input('sort_order', 0);
        }

        $category->save();

        return response()->json(['message' => 'Kategori berhasil diperbarui']);
    }

    /**
     * Delete category
     */
    public function destroy($id): JsonResponse
    {
        $category = Category::withCount('websites')->find($id);
        if (!$category) {
            return response()->json(['error' => 'Kategori tidak ditemukan'], 404);
        }

        if ($category->websites_count > 0) {
            return response()->json([
                'error' => "Kategori masih memiliki {$category->websites_count} website. Hapus website terlebih dahulu.",
            ], 400);
        }

        $category->delete();

        return response()->json(['message' => 'Kategori berhasil dihapus']);
    }
}
