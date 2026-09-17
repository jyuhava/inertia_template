<?php

namespace App\Http\Controllers\Admin\Dosen;

use App\Http\Controllers\Controller;
use App\Models\Dosen;
use App\Models\DosenAlamat;
use App\Models\DosenHomebaseHistory;
use App\Models\DosenJabatanAkademikHistory;
use App\Models\DosenPangkatGolongan;
use App\Models\DosenRiwayatPendidikan;
use App\Models\DosenSertifikasi;
use App\Models\DosenStatusHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DetailController extends Controller
{
    public function storeAlamat(Request $request, Dosen $dosen)
    {
        $data = $request->validate(['jenis' => 'required|in:ktp,domisili', 'jalan' => 'required|string', 'dusun' => 'nullable|string|max:100', 'rt' => 'nullable|string|max:5', 'rw' => 'nullable|string|max:5', 'kelurahan' => 'nullable|string|max:150', 'kecamatan' => 'nullable|string|max:150', 'kabupaten_kota' => 'nullable|string|max:150', 'provinsi' => 'nullable|string|max:150', 'kode_pos' => 'nullable|string|max:10', 'wilayah_id' => 'nullable|string|max:50']);
        $dosen->alamats()->updateOrCreate(['jenis' => $data['jenis']], $data);

        return back()->with('success', 'Alamat berhasil disimpan.');
    }

    public function storeStatus(Request $request, Dosen $dosen)
    {
        $data = $request->validate(['status' => 'required|in:aktif,nonaktif,pensiun,mengundurkan_diri,meninggal,pindah', 'tanggal_berlaku' => 'required|date', 'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_berlaku', 'alasan' => 'nullable|string|max:255', 'keterangan' => 'nullable|string', 'dokumen_pendukung' => 'nullable|string|max:255']);
        DB::transaction(function () use ($data, $dosen, $request) {
            $dosen->statusHistories()->create($data + ['created_by' => $request->user()->id]);
            $dosen->update(['status' => $data['status']]);
        });

        return back()->with('success', 'Riwayat status berhasil dicatat.');
    }

    public function storeHomebase(Request $request, Dosen $dosen)
    {
        $data = $request->validate(['prodi_id' => 'required|exists:prodis,id', 'tanggal_mulai' => 'required|date', 'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_mulai', 'status' => 'required|in:aktif,nonaktif', 'alasan' => 'nullable|string|max:255', 'dokumen_pendukung' => 'nullable|string|max:255']);
        DB::transaction(function () use ($data, $dosen, $request) {
            if ($data['status'] === 'aktif') {
                $dosen->homebaseHistories()->where('status', 'aktif')->update(['status' => 'nonaktif', 'tanggal_selesai' => $data['tanggal_mulai']]);
            } $dosen->homebaseHistories()->create($data + ['created_by' => $request->user()->id]);
        });

        return back()->with('success', 'Riwayat homebase berhasil dicatat.');
    }

    public function storePendidikan(Request $request, Dosen $dosen)
    {
        $data = $request->validate(['jenjang' => 'required|string|max:20', 'perguruan_tinggi' => 'required|string|max:255', 'program_studi' => 'required|string|max:255', 'gelar' => 'nullable|string|max:100', 'nomor_ijazah' => 'nullable|string|max:100', 'tahun_masuk' => 'nullable|integer|min:1900|max:'.(date('Y') + 1), 'tahun_lulus' => 'nullable|integer|min:1900|max:'.(date('Y') + 1), 'tanggal_lulus' => 'nullable|date', 'negara' => 'nullable|string|max:100', 'status_pendidikan' => 'required|in:lulus,berjalan']);
        $dosen->riwayatPendidikans()->create($data);

        return back()->with('success', 'Riwayat pendidikan berhasil ditambahkan.');
    }

    public function storeJabatan(Request $request, Dosen $dosen)
    {
        $data = $request->validate(['jabatan_akademik' => 'required|in:Asisten Ahli,Lektor,Lektor Kepala,Profesor', 'tanggal_berlaku' => 'required|date', 'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_berlaku', 'nomor_sk' => 'nullable|string|max:100', 'tanggal_sk' => 'nullable|date', 'file_sk' => 'nullable|string|max:255']);
        DB::transaction(function () use ($data, $dosen, $request) {
            $dosen->jabatanAkademikHistories()->create($data + ['created_by' => $request->user()->id]);
            $dosen->update(['jabatan_akademik' => $data['jabatan_akademik']]);
        });

        return back()->with('success', 'Riwayat jabatan akademik berhasil ditambahkan.');
    }

    public function storePangkat(Request $request, Dosen $dosen)
    {
        $data = $request->validate(['pangkat' => 'nullable|string|max:100', 'golongan' => 'nullable|string|max:30', 'tanggal_berlaku' => 'nullable|date', 'nomor_sk' => 'nullable|string|max:100', 'tanggal_sk' => 'nullable|date']);
        $dosen->pangkatGolongans()->create($data);

        return back()->with('success', 'Pangkat/golongan berhasil ditambahkan.');
    }

    public function storeSertifikasi(Request $request, Dosen $dosen)
    {
        $data = $request->validate(['jenis' => 'required|string|max:100', 'nomor_sertifikat' => 'nullable|string|max:100', 'penerbit' => 'nullable|string|max:255', 'tanggal_terbit' => 'nullable|date', 'berlaku_sampai' => 'nullable|date', 'file_path' => 'nullable|string|max:255']);
        $dosen->sertifikasis()->create($data);

        return back()->with('success', 'Sertifikasi berhasil ditambahkan.');
    }

    public function destroy(Request $request, Dosen $dosen, string $type, int $id)
    {
        $models = ['alamat' => DosenAlamat::class, 'status' => DosenStatusHistory::class, 'homebase' => DosenHomebaseHistory::class, 'pendidikan' => DosenRiwayatPendidikan::class, 'jabatan' => DosenJabatanAkademikHistory::class, 'pangkat' => DosenPangkatGolongan::class, 'sertifikasi' => DosenSertifikasi::class];
        abort_unless(isset($models[$type]), 404);
        $models[$type]::where('dosen_id', $dosen->id)->findOrFail($id)->delete();

        return back()->with('success', 'Data berhasil dihapus.');
    }
}
