<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DokumenPmb;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DokumenPmbController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = DokumenPmb::orderBy('urutan')->orderBy('nama_dokumen');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_dokumen', 'like', "%{$search}%")
                  ->orWhere('kode_dokumen', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        $dokumenPmb = $query->paginate(10)->withQueryString();

        return Inertia::render('Admin/DokumenPmb/Index', [
            'dokumenPmb' => $dokumenPmb,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/DokumenPmb/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Custom validation for comma-separated file types
        $allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
        $jenisFileArray = explode(',', $request->jenis_file);
        $jenisFileArray = array_map('trim', $jenisFileArray); // Remove whitespace
        $jenisFileArray = array_filter($jenisFileArray); // Remove empty values
        
        $invalidTypes = array_diff($jenisFileArray, $allowedTypes);
        if (!empty($invalidTypes)) {
            return back()->withErrors([
                'jenis_file' => 'Jenis file tidak valid: ' . implode(', ', $invalidTypes)
            ]);
        }

        $request->validate([
            'nama_dokumen' => 'required|string|max:255',
            'kode_dokumen' => 'required|string|max:50|unique:dokumen_pmb,kode_dokumen',
            'deskripsi' => 'nullable|string',
            'jenis_file' => 'required|string', // Changed to string to accept comma-separated values
            'max_size_kb' => 'required|integer|min:1|max:10240', // Max 10MB
            'wajib' => 'required|boolean',
            'urutan' => 'required|integer|min:0',
        ]);

        DokumenPmb::create($request->all());

        return redirect()->route('admin.dokumen-pmb.index')
            ->with('success', 'Dokumen PMB berhasil ditambahkan!');
    }

    /**
     * Display the specified resource.
     */
    public function show(DokumenPmb $dokumenPmb)
    {
        $dokumenPmb->loadCount('uploadDokumen');
        
        return Inertia::render('Admin/DokumenPmb/Show', [
            'dokumenPmb' => $dokumenPmb,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(DokumenPmb $dokumenPmb)
    {
        return Inertia::render('Admin/DokumenPmb/Edit', [
            'dokumenPmb' => $dokumenPmb,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DokumenPmb $dokumenPmb)
    {
        // Custom validation for comma-separated file types
        $allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
        $jenisFileArray = explode(',', $request->jenis_file);
        $jenisFileArray = array_map('trim', $jenisFileArray); // Remove whitespace
        $jenisFileArray = array_filter($jenisFileArray); // Remove empty values
        
        $invalidTypes = array_diff($jenisFileArray, $allowedTypes);
        if (!empty($invalidTypes)) {
            return back()->withErrors([
                'jenis_file' => 'Jenis file tidak valid: ' . implode(', ', $invalidTypes)
            ]);
        }

        $request->validate([
            'nama_dokumen' => 'required|string|max:255',
            'kode_dokumen' => 'required|string|max:50|unique:dokumen_pmb,kode_dokumen,' . $dokumenPmb->id,
            'deskripsi' => 'nullable|string',
            'jenis_file' => 'required|string', // Changed to string to accept comma-separated values
            'max_size_kb' => 'required|integer|min:1|max:10240',
            'wajib' => 'required|boolean',
            'urutan' => 'required|integer|min:0',
        ]);

        $dokumenPmb->update($request->all());

        return redirect()->route('admin.dokumen-pmb.index')
            ->with('success', 'Dokumen PMB berhasil diperbarui!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(DokumenPmb $dokumenPmb)
    {
        try {
            // Check if document has uploads
            if ($dokumenPmb->uploadDokumen()->count() > 0) {
                return back()->with('error', 'Tidak dapat menghapus dokumen yang sudah memiliki upload!');
            }

            $dokumenPmb->delete();

            return redirect()->route('admin.dokumen-pmb.index')
                ->with('success', 'Dokumen PMB berhasil dihapus!');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal menghapus dokumen PMB!');
        }
    }

    /**
     * Toggle active status
     */
    public function toggleStatus(DokumenPmb $dokumenPmb)
    {
        $dokumenPmb->update(['aktif' => !$dokumenPmb->aktif]);

        $status = $dokumenPmb->aktif ? 'diaktifkan' : 'dinonaktifkan';
        return back()->with('success', "Dokumen PMB berhasil {$status}!");
    }
}
