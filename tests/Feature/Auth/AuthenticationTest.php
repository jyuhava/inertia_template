<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_mahasiswa_can_authenticate_using_nim(): void
    {
        $user = User::factory()->create([
            'role' => 'mahasiswa',
            'password' => bcrypt('secret123'),
        ]);

        \App\Models\Mahasiswa::create([
            'user_id' => $user->id,
            'nim' => '20241001',
            'nama_lengkap' => 'Mahasiswa Test',
            'program_studi' => 'Pendidikan Agama Islam',
            'jenis_kelamin' => 'L',
            'tempat_lahir' => 'Bogor',
            'tanggal_lahir' => '2000-01-01',
            'alamat' => 'Bogor',
            'no_hp' => '08123456789',
            'angkatan' => 2024,
            'status' => 'aktif',
        ]);

        $response = $this->post('/login', [
            'email' => '20241001',
            'password' => 'secret123',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_mahasiswa_can_not_authenticate_with_invalid_password_using_nim(): void
    {
        $user = User::factory()->create([
            'role' => 'mahasiswa',
            'password' => bcrypt('secret123'),
        ]);

        \App\Models\Mahasiswa::create([
            'user_id' => $user->id,
            'nim' => '20241002',
            'nama_lengkap' => 'Mahasiswa Test 2',
            'program_studi' => 'Pendidikan Agama Islam',
            'jenis_kelamin' => 'L',
            'tempat_lahir' => 'Bogor',
            'tanggal_lahir' => '2000-01-01',
            'alamat' => 'Bogor',
            'no_hp' => '08123456789',
            'angkatan' => 2024,
            'status' => 'aktif',
        ]);

        $this->post('/login', [
            'email' => '20241002',
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
