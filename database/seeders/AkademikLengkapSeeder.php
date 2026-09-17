<?php

namespace Database\Seeders;

use App\Models\Absensi;
use App\Models\CourseMeeting;
use App\Models\Dosen;
use App\Models\GradeScale;
use App\Models\JadwalKelasKuliah;
use App\Models\JadwalKuliah;
use App\Models\KategoriMataKuliah;
use App\Models\KelasKuliah;
use App\Models\KelasKuliahPengajar;
use App\Models\KelompokMataKuliah;
use App\Models\Kurikulum;
use App\Models\KurikulumMataKuliah;
use App\Models\Mahasiswa;
use App\Models\MataKuliah;
use App\Models\MbkmActivity;
use App\Models\MbkmApplication;
use App\Models\MbkmAssessment;
use App\Models\MbkmParticipant;
use App\Models\MbkmPartner;
use App\Models\MbkmPlacement;
use App\Models\MbkmProgram;
use App\Models\MbkmProgramTarget;
use App\Models\MbkmProgramType;
use App\Models\MbkmRecognition;
use App\Models\MbkmSupervisor;
use App\Models\ObeAssessment;
use App\Models\ObeAssessmentMapping;
use App\Models\ObeAssessmentScore;
use App\Models\ObeCpl;
use App\Models\ObeCplCourseMapping;
use App\Models\ObeCpmk;
use App\Models\ObeCpmkCplMapping;
use App\Models\ObeSubCpmk;
use App\Models\ObeTaxonomyLevel;
use App\Models\Penilaian;
use App\Models\PeriodeKrs;
use App\Models\Prodi;
use App\Models\Ruangan;
use App\Models\Semester;
use App\Models\StudentCourseRegistration;
use App\Models\StudentCourseRegistrationItem;
use App\Models\StudentStudyResult;
use App\Models\StudentStudyResultItem;
use App\Models\Survey;
use App\Models\SurveyAnswer;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Models\TahunAjaran;
use App\Models\Thesis;
use App\Models\ThesisDocument;
use App\Models\ThesisEvent;
use App\Models\ThesisRevision;
use App\Models\ThesisSetting;
use App\Models\ThesisSupervisionSession;
use App\Models\ThesisSupervisor;
use App\Models\ThesisTitleSubmission;
use App\Models\ThesisType;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AkademikLengkapSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first() ?? User::first();
        $semester = Semester::where('status', 'aktif')->first() ?? Semester::first();
        $tahunAjaran = TahunAjaran::where('status', 'aktif')->first() ?? TahunAjaran::first();

        if (! $admin || ! $semester || ! $tahunAjaran) {
            $this->command->warn('AkademikLengkapSeeder membutuhkan data User, Semester, dan TahunAjaran.');

            return;
        }

        $categories = collect([
            ['code' => 'WAJIB-DEMO', 'name' => 'Wajib Demo'],
            ['code' => 'PILIHAN-DEMO', 'name' => 'Pilihan Demo'],
        ])->mapWithKeys(fn (array $data) => [$data['code'] => KategoriMataKuliah::firstOrCreate(
            ['code' => $data['code']],
            ['name' => $data['name'], 'description' => 'Kategori data demo akademik.', 'is_active' => true],
        )]);
        $kelompok = KelompokMataKuliah::firstOrCreate(
            ['code' => 'PRODI-DEMO'],
            ['name' => 'Mata Kuliah Program Studi Demo', 'description' => 'Kelompok untuk kurikulum demo.', 'is_active' => true],
        );

        $kurikulums = $this->seedKurikulums($semester, $kelompok, $categories);
        $rooms = $this->seedRooms();
        [$classes, $legacySchedules] = $this->seedClasses($kurikulums, $semester, $rooms);
        $periode = PeriodeKrs::updateOrCreate(
            ['nama_periode' => 'KRS Demo '.$semester->nama_semester.' '.$tahunAjaran->nama_tahun_ajaran],
            [
                'tahun_ajaran_id' => $tahunAjaran->id,
                'semester_id' => $semester->id,
                'tanggal_mulai' => now()->subWeek()->toDateString(),
                'tanggal_selesai' => now()->addWeeks(3)->toDateString(),
                'status' => 'aktif',
                'keterangan' => 'Periode KRS terbuka untuk data demo.',
                'krs_status' => 'open',
                'revisi_mulai' => now()->toDateString(),
                'revisi_selesai' => now()->addWeeks(4)->toDateString(),
                'wajib_persetujuan_pa' => true,
                'minimal_sks' => 0,
                'maksimal_sks' => 24,
            ],
        );

        [$registrations, $items, $penilaians] = $this->seedRegistrationsAndResults(
            $kurikulums, $classes, $legacySchedules, $periode, $admin,
        );
        $this->seedSurvey($periode, $registrations);
        $this->seedAttendance($classes, $items, $legacySchedules, $periode, $admin);
        $this->seedMbkm($semester, $kurikulums, $registrations, $admin);
        $this->seedTheses($semester, $kurikulums, $admin);
        $this->seedObe($kurikulums, $classes, $items, $penilaians, $admin);
    }

    private function seedKurikulums(Semester $semester, KelompokMataKuliah $kelompok, $categories): array
    {
        $kurikulums = [];
        foreach (Prodi::where('status', 'aktif')->get() as $prodi) {
            $courses = MataKuliah::where('prodi_id', $prodi->id)->where('status', 'aktif')->orderBy('semester')->get();

            $kurikulum = Kurikulum::updateOrCreate(
                ['kode' => 'KUR-'.$prodi->kode_prodi.'-DEMO'],
                [
                    'nama' => 'Kurikulum Demo '.$prodi->nama_prodi,
                    'deskripsi' => 'Kurikulum aktif untuk melengkapi data demo akademik.',
                    'prodi_id' => $prodi->id,
                    'semester_mulai_id' => $semester->id,
                    'semester_selesai_id' => null,
                    'total_sks_wajib' => $courses->sum('sks'),
                    'status' => 'aktif',
                ],
            );

            foreach ($courses as $index => $course) {
                $isWajib = $course->jenis !== 'pilihan';
                MataKuliah::updateOrCreate(
                    ['id' => $course->id],
                    ['kategori_mata_kuliah_id' => ($isWajib ? $categories['WAJIB-DEMO'] : $categories['PILIHAN-DEMO'])->id],
                );
                KurikulumMataKuliah::updateOrCreate(
                    ['kurikulum_id' => $kurikulum->id, 'mata_kuliah_id' => $course->id],
                    [
                        'semester' => max(1, (int) $course->semester),
                        'kelompok_mata_kuliah_id' => $kelompok->id,
                        'is_wajib' => $isWajib,
                        'sks_override' => $course->sks,
                        'nilai_minimum' => 'C',
                        'sort_order' => $index + 1,
                    ],
                );
            }
            $kurikulums[] = $kurikulum;
        }

        return $kurikulums;
    }

    private function seedRooms(): array
    {
        return collect([
            ['kode' => 'A-101', 'nama' => 'Ruang Kuliah A-101', 'gedung' => 'Gedung A', 'lantai' => '1', 'kapasitas' => 40, 'tipe' => 'kelas'],
            ['kode' => 'LAB-01', 'nama' => 'Laboratorium Komputer 01', 'gedung' => 'Gedung B', 'lantai' => '1', 'kapasitas' => 32, 'tipe' => 'laboratorium'],
            ['kode' => 'DARING-01', 'nama' => 'Kelas Daring', 'gedung' => 'Virtual', 'lantai' => null, 'kapasitas' => 100, 'tipe' => 'online'],
        ])->mapWithKeys(fn (array $data) => [$data['kode'] => Ruangan::updateOrCreate(
            ['kode' => $data['kode']],
            $data + ['status' => 'aktif'],
        )])->all();
    }

    private function seedClasses(array $kurikulums, Semester $semester, array $rooms): array
    {
        $lecturers = Dosen::orderBy('id')->get();
        if ($lecturers->isEmpty()) {
            return [collect(), collect()];
        }

        $classes = collect();
        $legacySchedules = collect();
        foreach ($kurikulums as $kurikulum) {
            foreach (KurikulumMataKuliah::where('kurikulum_id', $kurikulum->id)->with('mataKuliah')->get() as $index => $mapping) {
                $course = $mapping->mataKuliah;
                $lecturer = $lecturers[$index % $lecturers->count()];
                $room = $index % 3 === 1 ? $rooms['LAB-01'] : $rooms['A-101'];
                $code = sprintf('A%02d', $index + 1);
                $class = KelasKuliah::withTrashed()->updateOrCreate(
                    ['mata_kuliah_id' => $course->id, 'semester_id' => $semester->id, 'kode_kelas' => $code],
                    ['kurikulum_id' => $kurikulum->id, 'nama_kelas' => 'Reguler '.$code, 'kapasitas' => $room->kapasitas, 'tipe_kelas' => $room->tipe === 'laboratorium' ? 'praktikum' : 'reguler', 'status' => 'dibuka'],
                );
                $class->restore();
                KelasKuliahPengajar::updateOrCreate(
                    ['kelas_kuliah_id' => $class->id, 'dosen_id' => $lecturer->id],
                    ['peran' => 'utama', 'status' => 'aktif'],
                );
                $hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'][$index % 5];
                $schedule = JadwalKelasKuliah::updateOrCreate(
                    ['kelas_kuliah_id' => $class->id, 'hari' => $hari, 'jam_mulai' => sprintf('%02d:00:00', 8 + ($index % 4) * 2)],
                    ['jam_selesai' => sprintf('%02d:00:00', 10 + ($index % 4) * 2), 'ruangan_id' => $room->id, 'tipe_pertemuan' => 'tatap_muka', 'status' => 'dipublikasikan', 'catatan' => 'Jadwal data demo.'],
                );
                $legacySchedules[$class->id] = JadwalKuliah::updateOrCreate(
                    ['hari' => $hari, 'jam_mulai' => $schedule->jam_mulai, 'ruangan' => 'DEMO-'.$room->kode],
                    ['mata_kuliah_id' => $course->id, 'dosen_id' => $lecturer->id, 'semester_id' => $semester->id, 'jam_selesai' => $schedule->jam_selesai, 'kapasitas' => $room->kapasitas, 'keterangan' => 'Jadwal penghubung data demo.', 'status' => 'aktif'],
                );
                $classes->push($class);
            }
        }

        return [$classes, $legacySchedules];
    }

    private function seedRegistrationsAndResults(array $kurikulums, $classes, $legacySchedules, PeriodeKrs $periode, User $admin): array
    {
        $registrations = collect();
        $items = collect();
        $penilaians = collect();
        foreach ($kurikulums as $kurikulum) {
            $students = Mahasiswa::where('prodi_id', $kurikulum->prodi_id)->orderBy('id')->take(3)->get();
            $courseClasses = $classes->where('kurikulum_id', $kurikulum->id)->take(3);
            foreach ($students as $studentIndex => $student) {
                $registration = StudentCourseRegistration::updateOrCreate(
                    ['mahasiswa_id' => $student->id, 'periode_krs_id' => $periode->id],
                    ['kurikulum_id' => $kurikulum->id, 'status' => 'approved', 'submitted_at' => now()->subDays(3), 'approved_at' => now()->subDays(2), 'approved_by' => $admin->id],
                );
                $registrations->push($registration);
                $resultItems = [];
                foreach ($courseClasses as $courseIndex => $class) {
                    $mapping = KurikulumMataKuliah::where('kurikulum_id', $kurikulum->id)->where('mata_kuliah_id', $class->mata_kuliah_id)->first();
                    $item = StudentCourseRegistrationItem::updateOrCreate(
                        ['registration_id' => $registration->id, 'kelas_kuliah_id' => $class->id],
                        ['mata_kuliah_id' => $class->mata_kuliah_id, 'kurikulum_mata_kuliah_id' => $mapping?->id, 'sks_snapshot' => $mapping?->sks_override ?? $class->mataKuliah->sks, 'status' => 'active'],
                    );
                    $items->push($item);
                    $score = 88 - ($studentIndex * 3) - ($courseIndex * 2);
                    $penilaian = Penilaian::updateOrCreate(
                        ['mahasiswa_id' => $student->id, 'jadwal_kuliah_id' => $legacySchedules[$class->id]->id, 'periode_krs_id' => $periode->id],
                        ['nilai_tugas' => $score, 'nilai_uts' => $score - 2, 'nilai_uas' => $score + 1, 'nilai_akhir' => $score, 'nilai_huruf' => $score >= 85 ? 'A' : 'B+', 'nilai_angka' => $score >= 85 ? 4 : 3.75, 'status' => 'final', 'catatan' => 'Nilai demo final.'],
                    );
                    $penilaians->put($item->id, $penilaian);
                    $resultItems[] = [$item, $penilaian, $score];
                }
                $credits = collect($resultItems)->sum(fn ($data) => $data[0]->sks_snapshot);
                $gpa = collect($resultItems)->avg(fn ($data) => $data[2] >= 85 ? 4 : 3.75);
                $result = StudentStudyResult::updateOrCreate(
                    ['mahasiswa_id' => $student->id, 'periode_krs_id' => $periode->id],
                    ['kurikulum_id' => $kurikulum->id, 'status' => 'published', 'total_courses' => count($resultItems), 'total_credits' => $credits, 'earned_credits' => $credits, 'semester_gpa' => $gpa, 'cumulative_gpa' => $gpa, 'published_at' => now()->subDay(), 'published_by' => $admin->id],
                );
                foreach ($resultItems as [$item, $penilaian, $score]) {
                    StudentStudyResultItem::updateOrCreate(
                        ['study_result_id' => $result->id, 'penilaian_id' => $penilaian->id],
                        ['registration_item_id' => $item->id, 'mata_kuliah_id' => $item->mata_kuliah_id, 'kelas_kuliah_id' => $item->kelas_kuliah_id, 'jadwal_kuliah_id' => $penilaian->jadwal_kuliah_id, 'credits' => $item->sks_snapshot, 'grade_numeric' => $score, 'grade' => $score >= 85 ? 'A' : 'B+', 'grade_point' => $score >= 85 ? 4 : 3.75, 'status' => 'published'],
                    );
                }
            }
        }

        foreach ([['A', 85, 100, 4], ['B+', 80, 84.99, 3.75], ['B', 75, 79.99, 3], ['C', 60, 74.99, 2], ['D', 50, 59.99, 1], ['E', 0, 49.99, 0]] as [$code, $min, $max, $point]) {
            GradeScale::updateOrCreate(['code' => $code], ['name' => 'Nilai '.$code, 'minimum_score' => $min, 'maximum_score' => $max, 'grade_point' => $point, 'is_passing' => $point >= 2, 'is_active' => true]);
        }

        return [$registrations, $items, $penilaians];
    }

    private function seedSurvey(PeriodeKrs $periode, $registrations): void
    {
        $survey = Survey::updateOrCreate(
            ['title' => 'Evaluasi Pembelajaran Demo '.$periode->nama_periode],
            ['description' => 'Survei evaluasi pembelajaran untuk data demo.', 'survey_type' => 'academic_evaluation', 'periode_krs_id' => $periode->id, 'start_at' => now()->subDays(2), 'end_at' => now()->addWeeks(2), 'is_required' => true, 'status' => 'published'],
        );
        $questions = collect([
            ['sort_order' => 1, 'question' => 'Bagaimana kualitas pembelajaran pada semester ini?', 'question_type' => 'rating'],
            ['sort_order' => 2, 'question' => 'Saran untuk peningkatan pembelajaran.', 'question_type' => 'text'],
        ])->mapWithKeys(fn (array $data) => [$data['sort_order'] => SurveyQuestion::updateOrCreate(
            ['survey_id' => $survey->id, 'sort_order' => $data['sort_order']], $data + ['is_required' => true, 'description' => null],
        )]);
        foreach ($registrations->take(3) as $registration) {
            $response = SurveyResponse::updateOrCreate(['survey_id' => $survey->id, 'mahasiswa_id' => $registration->mahasiswa_id], ['submitted_at' => now()->subDay()]);
            SurveyAnswer::updateOrCreate(['survey_response_id' => $response->id, 'survey_question_id' => $questions[1]->id], ['answer' => '4']);
            SurveyAnswer::updateOrCreate(['survey_response_id' => $response->id, 'survey_question_id' => $questions[2]->id], ['answer' => 'Materi dan diskusi sangat membantu.']);
        }
    }

    private function seedAttendance($classes, $items, $legacySchedules, PeriodeKrs $periode, User $admin): void
    {
        foreach ($classes->take(3) as $index => $class) {
            $schedule = $class->jadwals()->first();
            if (! $schedule) {
                continue;
            }
            $startTime = $schedule->getRawOriginal('jam_mulai');
            $endTime = $schedule->getRawOriginal('jam_selesai');
            foreach ([1 => 'completed', 2 => 'open'] as $number => $status) {
                $meeting = CourseMeeting::updateOrCreate(
                    ['kelas_kuliah_id' => $class->id, 'meeting_number' => $number],
                    ['jadwal_kelas_kuliah_id' => $schedule->id, 'meeting_date' => now()->subWeeks(2 - $number)->toDateString(), 'start_time' => $startTime, 'end_time' => $endTime, 'topic' => 'Pertemuan '.$number.' '.$class->mataKuliah->nama_mata_kuliah, 'description' => 'Pertemuan data demo.', 'status' => $status, 'created_by' => $admin->id, 'updated_by' => $admin->id],
                );
                foreach ($items->where('kelas_kuliah_id', $class->id) as $item) {
                    Absensi::updateOrCreate(
                        ['jadwal_kuliah_id' => $legacySchedules[$class->id]->id, 'mahasiswa_id' => $item->registration->mahasiswa_id, 'tanggal' => $meeting->getRawOriginal('meeting_date')],
                        ['periode_krs_id' => $periode->id, 'jam_mulai' => $startTime, 'jam_selesai' => $endTime, 'status' => 'hadir', 'keterangan' => 'Presensi data demo.', 'created_by' => $admin->id, 'course_meeting_id' => $meeting->id, 'registration_item_id' => $item->id, 'attendance_status' => 'present', 'check_in_at' => Carbon::parse($meeting->meeting_date->toDateString().' '.$startTime), 'recorded_by' => $admin->id],
                    );
                }
            }
        }
    }

    private function seedMbkm(Semester $semester, array $kurikulums, $registrations, User $admin): void
    {
        $types = collect([['code' => 'MAGANG', 'name' => 'Magang/Praktik Kerja'], ['code' => 'PERTUKARAN', 'name' => 'Pertukaran Pelajar'], ['code' => 'RISET', 'name' => 'Riset']])->mapWithKeys(fn ($type) => [$type['code'] => MbkmProgramType::updateOrCreate(['code' => $type['code']], $type + ['description' => 'Program MBKM data demo.', 'is_active' => true])]);
        $partner = MbkmPartner::updateOrCreate(['name' => 'PT Teknologi Nusantara'], ['partner_type' => 'Industri', 'email' => 'mbkm@teknologinusantara.test', 'phone' => '021-5550101', 'address' => 'Jl. Inovasi No. 1', 'city' => 'Bogor', 'country' => 'Indonesia', 'status' => 'active', 'notes' => 'Mitra data demo.']);
        $kurikulum = $kurikulums[0] ?? null;
        $student = $registrations->first()?->mahasiswa;
        if (! $kurikulum || ! $student) {
            return;
        }
        $program = MbkmProgram::updateOrCreate(
            ['code' => 'MBKM-MAGANG-DEMO'],
            ['name' => 'Magang Industri Demo', 'mbkm_program_type_id' => $types['MAGANG']->id, 'semester_id' => $semester->id, 'mbkm_partner_id' => $partner->id, 'prodi_id' => $kurikulum->prodi_id, 'registration_start' => now()->subWeek()->toDateString(), 'registration_end' => now()->addWeeks(2)->toDateString(), 'implementation_start' => now()->addMonth()->toDateString(), 'implementation_end' => now()->addMonths(4)->toDateString(), 'quota' => 20, 'credit_limit' => 20, 'status' => 'registration_open', 'requirements' => ['minimum_gpa' => 2.75], 'created_by' => $admin->id],
        );
        MbkmProgramTarget::updateOrCreate(['mbkm_program_id' => $program->id, 'prodi_id' => $kurikulum->prodi_id], ['minimum_semester' => 5, 'maximum_semester' => 8, 'minimum_gpa' => 2.75, 'minimum_credits' => 80, 'student_status' => 'aktif']);
        $application = MbkmApplication::updateOrCreate(['mbkm_program_id' => $program->id, 'mahasiswa_id' => $student->id], ['application_number' => 'MBKM-DEMO-'.$student->nim, 'status' => 'accepted', 'motivation' => 'Mengembangkan pengalaman profesional.', 'notes' => 'Aplikasi data demo.', 'submitted_at' => now()->subDays(4)]);
        $participant = MbkmParticipant::updateOrCreate(['mbkm_application_id' => $application->id], ['mahasiswa_id' => $student->id, 'status' => 'active', 'accepted_at' => now()->subDays(2)->toDateString()]);
        $placement = MbkmPlacement::updateOrCreate(['mbkm_participant_id' => $participant->id], ['mbkm_partner_id' => $partner->id, 'title' => 'Pengembangan Aplikasi Web', 'status' => 'active', 'start_date' => now()->subWeek()->toDateString(), 'end_date' => now()->addMonths(3)->toDateString(), 'description' => 'Penempatan magang data demo.']);
        $lecturer = Dosen::first();
        if ($lecturer) {
            MbkmSupervisor::updateOrCreate(['mbkm_placement_id' => $placement->id, 'dosen_id' => $lecturer->id, 'role' => 'academic'], ['name' => $lecturer->nama_lengkap, 'email' => $lecturer->email]);
        }
        MbkmActivity::updateOrCreate(['mbkm_placement_id' => $placement->id, 'activity_date' => now()->subDays(2)->toDateString(), 'title' => 'Orientasi proyek'], ['description' => 'Mempelajari kebutuhan proyek.', 'hours' => 8, 'status' => 'approved', 'approved_by' => $admin->id, 'approved_at' => now()->subDay()]);
        MbkmAssessment::updateOrCreate(['mbkm_placement_id' => $placement->id, 'assessment_type' => 'Pembimbing Akademik'], ['dosen_id' => $lecturer?->id, 'score' => 88, 'grade' => 'A', 'feedback' => 'Progres sangat baik.', 'status' => 'final']);
        $course = MataKuliah::where('prodi_id', $kurikulum->prodi_id)->first();
        if ($course) {
            MbkmRecognition::updateOrCreate(['mbkm_participant_id' => $participant->id, 'mata_kuliah_id' => $course->id], ['recognized_credits' => min(3, $course->sks), 'score' => 88, 'grade' => 'A', 'status' => 'draft']);
        }
    }

    private function seedTheses(Semester $semester, array $kurikulums, User $admin): void
    {
        $lecturers = Dosen::take(2)->get();
        foreach ($kurikulums as $kurikulum) {
            $type = ThesisType::updateOrCreate(['prodi_id' => $kurikulum->prodi_id, 'code' => 'SKRIPSI-DEMO'], ['name' => 'Skripsi', 'description' => 'Jenis tugas akhir data demo.', 'is_active' => true]);
            ThesisSetting::updateOrCreate(['prodi_id' => $kurikulum->prodi_id], ['minimum_credits' => 110, 'minimum_gpa' => 2.5, 'supervisor_capacity' => 10]);
            foreach (Mahasiswa::where('prodi_id', $kurikulum->prodi_id)->take(3)->get() as $index => $student) {
                $statuses = ['under_review', 'research', 'completed'];
                $thesis = Thesis::updateOrCreate(
                    ['mahasiswa_id' => $student->id, 'thesis_type_id' => $type->id],
                    ['prodi_id' => $kurikulum->prodi_id, 'semester_id' => $semester->id, 'kurikulum_id' => $kurikulum->id, 'title' => 'Pengembangan Sistem Akademik Berbasis Web', 'abstract' => 'Data tugas akhir demo.', 'keywords' => 'sistem akademik, web', 'status' => $statuses[$index], 'final_grade' => $index === 2 ? 'A' : null, 'final_grade_point' => $index === 2 ? 4 : null, 'started_at' => now()->subMonths(3), 'completed_at' => $index === 2 ? now()->subDays(3) : null, 'finalized_at' => $index === 2 ? now()->subDay() : null],
                );
                $submission = ThesisTitleSubmission::updateOrCreate(['thesis_id' => $thesis->id, 'version' => 1], ['title' => 'Rancang Bangun Sistem Akademik', 'alternate_titles' => ['Sistem Informasi Akademik Terintegrasi'], 'background' => 'Kebutuhan integrasi data akademik.', 'problem_statement' => 'Data belum terintegrasi.', 'objective' => 'Membangun sistem akademik.', 'topic' => 'Sistem informasi', 'method' => 'Waterfall', 'description' => 'Pengajuan judul awal.', 'status' => 'revision', 'review_comment' => 'Perjelas ruang lingkup.', 'reviewed_by' => $admin->id, 'reviewed_at' => now()->subMonths(2)]);
                ThesisTitleSubmission::updateOrCreate(['thesis_id' => $thesis->id, 'version' => 2], ['title' => $thesis->title, 'alternate_titles' => [], 'background' => 'Kebutuhan integrasi data akademik.', 'problem_statement' => 'Data belum terintegrasi.', 'objective' => 'Membangun sistem akademik.', 'topic' => 'Sistem informasi', 'method' => 'Waterfall', 'description' => 'Revisi pengajuan judul.', 'status' => $index === 0 ? 'submitted' : 'approved', 'review_comment' => $index === 0 ? null : 'Judul disetujui.', 'reviewed_by' => $index === 0 ? null : $admin->id, 'reviewed_at' => $index === 0 ? null : now()->subMonths(1)]);
                foreach ($lecturers as $lecturerIndex => $lecturer) {
                    $supervisor = ThesisSupervisor::updateOrCreate(['thesis_id' => $thesis->id, 'dosen_id' => $lecturer->id, 'role' => $lecturerIndex === 0 ? 'pembimbing_1' : 'pembimbing_2'], ['status' => 'active', 'appointed_at' => now()->subMonths(2), 'appointed_by' => $admin->id]);
                    ThesisSupervisionSession::updateOrCreate(['thesis_id' => $thesis->id, 'thesis_supervisor_id' => $supervisor->id, 'meeting_date' => now()->subWeek()->toDateString()], ['topic' => 'Pembahasan Bab III', 'discussion' => 'Membahas rancangan penelitian.', 'student_notes' => 'Akan memperbaiki rancangan.', 'feedback' => 'Lanjutkan pengumpulan data.', 'status' => 'reviewed', 'reviewed_by' => $admin->id, 'reviewed_at' => now()->subDays(6)]);
                }
                ThesisDocument::updateOrCreate(['thesis_id' => $thesis->id, 'type' => 'proposal', 'version' => 1], ['file_path' => 'demo/thesis/'.$thesis->id.'/proposal-v1.pdf', 'original_name' => 'proposal-demo.pdf', 'uploaded_by' => $admin->id]);
                ThesisEvent::updateOrCreate(['thesis_id' => $thesis->id, 'kind' => 'seminar_proposal'], ['scheduled_at' => now()->addWeek(), 'ends_at' => now()->addWeek()->addHours(2), 'examiner_ids' => $lecturers->pluck('id')->all(), 'status' => 'scheduled', 'notes' => 'Jadwal seminar data demo.', 'scheduled_by' => $admin->id]);
                ThesisRevision::updateOrCreate(['thesis_id' => $thesis->id, 'status' => 'submitted'], ['items' => ['Perbaiki latar belakang', 'Lengkapi metodologi'], 'review_comment' => 'Mohon perbaiki sesuai catatan.', 'reviewed_by' => $admin->id, 'reviewed_at' => now()->subDays(5)]);
            }
        }
    }

    private function seedObe(array $kurikulums, $classes, $items, $penilaians, User $admin): void
    {
        $levels = collect([['code' => 'C1', 'name' => 'Mengingat', 'sequence' => 1], ['code' => 'C2', 'name' => 'Memahami', 'sequence' => 2], ['code' => 'C3', 'name' => 'Menerapkan', 'sequence' => 3], ['code' => 'C4', 'name' => 'Menganalisis', 'sequence' => 4], ['code' => 'C5', 'name' => 'Mengevaluasi', 'sequence' => 5], ['code' => 'C6', 'name' => 'Mencipta', 'sequence' => 6]])->mapWithKeys(fn ($level) => [$level['code'] => ObeTaxonomyLevel::updateOrCreate(['code' => $level['code']], $level + ['category' => 'Bloom Kognitif', 'description' => 'Taksonomi Bloom data demo.', 'status' => 'aktif'])]);
        foreach ($kurikulums as $kurikulum) {
            $cpls = collect([['code' => 'CPL-01', 'name' => 'Sikap profesional', 'domain' => 'Sikap'], ['code' => 'CPL-02', 'name' => 'Penguasaan pengetahuan', 'domain' => 'Pengetahuan'], ['code' => 'CPL-03', 'name' => 'Keterampilan khusus', 'domain' => 'Keterampilan']])->mapWithKeys(fn ($cpl, $i) => [$cpl['code'] => ObeCpl::updateOrCreate(['kurikulum_id' => $kurikulum->id, 'code' => $cpl['code']], $cpl + ['prodi_id' => $kurikulum->prodi_id, 'description' => 'Capaian pembelajaran lulusan data demo.', 'sequence' => $i + 1, 'status' => 'aktif', 'created_by' => $admin->id])]);
            foreach (KurikulumMataKuliah::where('kurikulum_id', $kurikulum->id)->take(3)->get() as $courseIndex => $mapping) {
                $course = $mapping->mataKuliah;
                foreach ($cpls as $cpl) {
                    ObeCplCourseMapping::updateOrCreate(['cpl_id' => $cpl->id, 'mata_kuliah_id' => $course->id, 'kurikulum_id' => $kurikulum->id], ['contribution_level' => 'tinggi', 'weight' => 0.3333]);
                }
                $cpmk = ObeCpmk::updateOrCreate(['mata_kuliah_id' => $course->id, 'kurikulum_id' => $kurikulum->id, 'code' => 'CPMK-01'], ['title' => 'Menerapkan konsep '.$course->nama_mata_kuliah, 'description' => 'CPMK data demo.', 'taxonomy_level_id' => $levels['C3']->id, 'sequence' => 1, 'status' => 'aktif', 'created_by' => $admin->id]);
                $sub = ObeSubCpmk::updateOrCreate(['obe_cpmk_id' => $cpmk->id, 'code' => 'SUB-01'], ['title' => 'Menyelesaikan studi kasus dasar', 'description' => 'Sub-CPMK data demo.', 'taxonomy_level_id' => $levels['C3']->id, 'sequence' => 1, 'status' => 'aktif']);
                foreach ($cpls as $cpl) {
                    ObeCpmkCplMapping::updateOrCreate(['cpmk_id' => $cpmk->id, 'cpl_id' => $cpl->id], ['weight' => 0.3333]);
                }
                $class = $classes->first(fn ($item) => $item->kurikulum_id === $kurikulum->id && $item->mata_kuliah_id === $course->id);
                $assessment = ObeAssessment::updateOrCreate(['mata_kuliah_id' => $course->id, 'kelas_kuliah_id' => $class?->id, 'type' => 'tugas', 'title' => 'Tugas Studi Kasus'], ['description' => 'Asesmen OBE data demo.', 'max_score' => 100, 'weight' => 0.3, 'status' => 'aktif', 'created_by' => $admin->id]);
                ObeAssessmentMapping::updateOrCreate(['assessment_id' => $assessment->id, 'cpmk_id' => $cpmk->id], ['sub_cpmk_id' => $sub->id, 'weight' => 1]);
                foreach ($items->where('kelas_kuliah_id', $class?->id) as $item) {
                    ObeAssessmentScore::updateOrCreate(['assessment_id' => $assessment->id, 'mahasiswa_id' => $item->registration->mahasiswa_id], ['penilaian_id' => $penilaians->get($item->id)?->id, 'score' => 88, 'recorded_by' => $admin->id]);
                }
            }
        }
    }
}
