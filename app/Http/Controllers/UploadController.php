<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function ckeditorUpload(Request $request)
    {
        $request->validate([
            'upload' => 'required|image|max:5120', // max 5MB
        ]);

        $path = $request->file('upload')->store('uploads/ckeditor', 'public');

        return response()->json([
            // Return relative URL so it always follows current host:port.
            'url' => '/storage/' . $path,
        ]);
    }
}
