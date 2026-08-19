<template>
    <AdminLayout>
        <div class="container mx-auto px-4 py-6">
            <div class="max-w-4xl mx-auto">
                <!-- Header -->
                <div class="mb-6">
                    <h1 class="text-2xl font-bold text-gray-900 mb-2">Import Mahasiswa Bulk</h1>
                    <p class="text-gray-600">Upload file CSV untuk menambahkan mahasiswa secara massal</p>
                </div>

                <!-- Success Message -->
                <div v-if="$page.props.flash.success" class="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {{ $page.props.flash.success }}
                </div>

                <!-- Import Errors -->
                <div v-if="$page.props.flash.import_errors && $page.props.flash.import_errors.length > 0" class="mb-6 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    <h4 class="font-bold mb-2">Beberapa data gagal diimport:</h4>
                    <ul class="list-disc list-inside max-h-40 overflow-y-auto">
                        <li v-for="error in $page.props.flash.import_errors" :key="error" class="text-sm">{{ error }}</li>
                    </ul>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Import Form -->
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h2 class="text-lg font-semibold mb-4">Import Data Mahasiswa</h2>
                        
                        <form @submit.prevent="importMahasiswa" enctype="multipart/form-data">
                            <!-- Pilih Prodi -->
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Program Studi <span class="text-red-500">*</span>
                                </label>
                                <select 
                                    v-model="form.prodi_id" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Pilih Program Studi</option>
                                    <option v-for="prodi in prodis" :key="prodi.id" :value="prodi.id">
                                        {{ prodi.kode_prodi }} - {{ prodi.nama_prodi }}
                                    </option>
                                </select>
                                <div v-if="errors.prodi_id" class="text-red-500 text-sm mt-1">{{ errors.prodi_id }}</div>
                            </div>

                            <!-- Upload File -->
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    File CSV <span class="text-red-500">*</span>
                                </label>
                                <input 
                                    type="file" 
                                    @change="handleFileChange"
                                    accept=".csv,.txt"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <div v-if="errors.csv_file" class="text-red-500 text-sm mt-1">{{ errors.csv_file }}</div>
                                <p class="text-xs text-gray-500 mt-1">Format yang didukung: CSV (max 2MB)</p>
                            </div>

                            <!-- Submit Button -->
                            <div class="flex gap-3">
                                <button 
                                    type="submit" 
                                    :disabled="processing"
                                    class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    <svg v-if="processing" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Import Mahasiswa
                                </button>
                                
                                <a 
                                    :href="route('admin.bulk-mahasiswa.template')"
                                    class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                                >
                                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    Download Template
                                </a>
                            </div>
                        </form>
                    </div>

                    <!-- Instructions -->
                    <div class="bg-blue-50 rounded-lg p-6">
                        <h2 class="text-lg font-semibold text-blue-900 mb-4">Petunjuk Penggunaan</h2>
                        
                        <div class="space-y-4 text-sm text-blue-800">
                            <div>
                                <h3 class="font-medium mb-1">1. Download Template</h3>
                                <p>Klik tombol "Download Template" untuk mendapatkan file contoh CSV dengan format yang benar.</p>
                            </div>
                            
                            <div>
                                <h3 class="font-medium mb-1">2. Format File CSV</h3>
                                <p>File CSV harus memiliki kolom berikut (urutan harus sesuai):</p>
                                <ul class="list-disc list-inside ml-2 mt-1">
                                    <li>nim</li>
                                    <li>nama_lengkap</li>
                                    <li>jenis_kelamin (L/P)</li>
                                    <li>no_ktp</li>
                                    <li>tempat_lahir</li>
                                    <li>tanggal_lahir (YYYY-MM-DD)</li>
                                    <li>no_hp</li>
                                    <li>alamat</li>
                                </ul>
                            </div>
                            
                            <div>
                                <h3 class="font-medium mb-1">3. Data Otomatis</h3>
                                <ul class="list-disc list-inside ml-2">
                                    <li><strong>Email:</strong> Dibuat otomatis dari nama dengan domain @alwafi.ac.id</li>
                                    <li><strong>Password:</strong> Default "password" untuk semua mahasiswa</li>
                                    <li><strong>Angkatan:</strong> Tahun saat ini</li>
                                    <li><strong>Status:</strong> Aktif</li>
                                </ul>
                            </div>
                            
                            <div class="bg-yellow-100 border border-yellow-300 rounded p-3">
                                <h3 class="font-medium text-yellow-800 mb-1">⚠️ Perhatian</h3>
                                <p class="text-yellow-700">NIM dan email yang sudah ada akan dilewati. Pastikan data belum pernah diimport sebelumnya.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AdminLayout>
</template>

<script>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { useForm } from '@inertiajs/vue3'

export default {
    components: {
        AdminLayout,
    },
    
    props: {
        prodis: Array,
        errors: Object,
    },
    
    setup() {
        const form = useForm({
            prodi_id: '',
            csv_file: null,
        })
        
        const handleFileChange = (event) => {
            form.csv_file = event.target.files[0]
        }
        
        const importMahasiswa = () => {
            form.post(route('admin.bulk-mahasiswa.import'), {
                forceFormData: true,
            })
        }
        
        return {
            form,
            handleFileChange,
            importMahasiswa,
            processing: form.processing,
        }
    }
}
</script>
