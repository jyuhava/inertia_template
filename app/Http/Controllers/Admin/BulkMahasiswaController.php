<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Models\Prodi;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BulkMahasiswaController extends Controller
{
    public function index()
    {
        $prodis = Prodi::where('status', 'aktif')->get(['id', 'kode_prodi', 'nama_prodi']);
        
        return Inertia::render('Admin/BulkMahasiswa/Index', [
            'prodis' => $prodis
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'prodi_id' => 'required|exists:prodis,id',
            'csv_file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $prodi = Prodi::findOrFail($request->prodi_id);
        $file = $request->file('csv_file');
        
        // Auto-detect CSV delimiter
        $fileContent = file($file->getRealPath());
        $firstLine = $fileContent[0] ?? '';
        
        // Detect delimiter by counting occurrences
        $commaCount = substr_count($firstLine, ',');
        $semicolonCount = substr_count($firstLine, ';');
        
        $delimiter = ($semicolonCount > $commaCount) ? ';' : ',';
        
        // Read CSV file with detected delimiter
        $csvData = [];
        foreach ($fileContent as $line) {
            $csvData[] = str_getcsv($line, $delimiter);
        }
        
        $header = array_shift($csvData); // Remove header row
        
        // Clean header from BOM and whitespace
        $header = array_map(function($h) {
            return trim(str_replace("\xEF\xBB\xBF", '', $h));
        }, $header);

        // Validate CSV header
        $expectedHeaders = ['nim', 'nama_lengkap', 'jenis_kelamin', 'no_ktp', 'tempat_lahir', 'tanggal_lahir', 'no_hp', 'alamat'];
        $headerLower = array_map('strtolower', $header);
        
        if ($headerLower !== $expectedHeaders) {
            return back()->withErrors([
                'csv_file' => 'Format CSV tidak sesuai. Header yang diharapkan: ' . implode(', ', $expectedHeaders) . 
                           '. Ditemukan: ' . implode(', ', $header) . 
                           '. Delimiter terdeteksi: "' . $delimiter . '"'
            ]);
        }

        $successCount = 0;
        $errorCount = 0;
        $errors = [];

        DB::beginTransaction();
        
        try {
            foreach ($csvData as $index => $row) {
                $rowNumber = $index + 2; // +2 because index starts from 0 and we removed header
                
                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                // Validate row data
                if (count($row) !== count($expectedHeaders)) {
                    $errors[] = "Baris {$rowNumber}: Jumlah kolom tidak sesuai";
                    $errorCount++;
                    continue;
                }

                $data = array_combine($expectedHeaders, $row);
                
                // Validate required fields
                if (empty($data['nim']) || empty($data['nama_lengkap'])) {
                    $errors[] = "Baris {$rowNumber}: NIM dan Nama tidak boleh kosong";
                    $errorCount++;
                    continue;
                }

                // Validate jenis_kelamin
                if (!in_array(strtoupper($data['jenis_kelamin']), ['L', 'P'])) {
                    $errors[] = "Baris {$rowNumber}: Jenis kelamin harus L atau P";
                    $errorCount++;
                    continue;
                }

                // Generate email from name
                $email = $this->generateEmail($data['nama_lengkap']);
                
                // Check if NIM already exists
                if (Mahasiswa::where('nim', $data['nim'])->exists()) {
                    $errors[] = "Baris {$rowNumber}: NIM {$data['nim']} sudah ada";
                    $errorCount++;
                    continue;
                }

                // Check if NIK (no_ktp) already exists
                if (!empty($data['no_ktp']) && Mahasiswa::where('no_ktp', $data['no_ktp'])->exists()) {
                    $errors[] = "Baris {$rowNumber}: NIK {$data['no_ktp']} sudah ada";
                    $errorCount++;
                    continue;
                }

                // Check if email already exists
                if (User::where('email', $email)->exists()) {
                    $errors[] = "Baris {$rowNumber}: Email {$email} sudah ada";
                    $errorCount++;
                    continue;
                }

                // Parse tanggal_lahir
                $tanggalLahir = null;
                if (!empty($data['tanggal_lahir'])) {
                    try {
                        $tanggalLahir = date('Y-m-d', strtotime($data['tanggal_lahir']));
                    } catch (\Exception $e) {
                        $errors[] = "Baris {$rowNumber}: Format tanggal lahir tidak valid";
                        $errorCount++;
                        continue;
                    }
                }

                // Create user account
                $user = User::create([
                    'name' => $data['nama_lengkap'],
                    'email' => $email,
                    'password' => Hash::make('password'),
                    'role' => 'mahasiswa',
                    'email_verified_at' => now(),
                ]);

                // Create mahasiswa record
                Mahasiswa::create([
                    'user_id' => $user->id,
                    'nim' => $data['nim'],
                    'nama_lengkap' => $data['nama_lengkap'],
                    'jenis_kelamin' => strtoupper($data['jenis_kelamin']),
                    'no_ktp' => !empty($data['no_ktp']) ? $data['no_ktp'] : null,
                    'tempat_lahir' => $data['tempat_lahir'] ?? 'Bogor',
                    'tanggal_lahir' => $tanggalLahir ?? '2000-01-01',
                    'alamat' => $data['alamat'] ?? 'Bogor, Jawa Barat',
                    'no_hp' => $data['no_hp'] ?? '08123456789',
                    'prodi_id' => $prodi->id,
                    'program_studi' => $prodi->nama_prodi,
                    'angkatan' => date('Y'),
                    'status' => 'aktif',
                ]);

                $successCount++;
            }

            DB::commit();

            $message = "Import berhasil! {$successCount} mahasiswa berhasil ditambahkan";
            if ($errorCount > 0) {
                $message .= ", {$errorCount} data gagal diimport";
            }

            return back()->with('success', $message)->with('import_errors', $errors);

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['csv_file' => 'Terjadi kesalahan: ' . $e->getMessage()]);
        }
    }

    public function downloadTemplate(Request $request)
    {
        $delimiter = $request->get('delimiter', ','); // Default comma
        $delimiterName = ($delimiter === ';') ? 'semicolon' : 'comma';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="template_mahasiswa_' . $delimiterName . '.csv"',
        ];

        $csvHeader = ['nim', 'nama_lengkap', 'jenis_kelamin', 'no_ktp', 'tempat_lahir', 'tanggal_lahir', 'no_hp', 'alamat'];
        $sampleData = [
            '2024001001',
            'Ahmad Rizki Pratama',
            'L',
            '3201012345678901',
            'Bogor',
            '2005-01-15',
            '081234567890',
            'Jl. Raya Bogor No. 123, Bogor'
        ];

        $callback = function() use ($csvHeader, $sampleData, $delimiter) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $csvHeader, $delimiter);
            fputcsv($file, $sampleData, $delimiter);
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function generateEmail($namaLengkap)
    {
        // Remove common titles and clean name
        $cleanName = str_replace(['Muhammad ', 'Siti ', 'Cut ', 'Dr. ', 'Prof. '], '', $namaLengkap);
        $cleanName = Str::slug($cleanName, '.');
        return strtolower($cleanName) . '@alwafi.ac.id';
    }
}
