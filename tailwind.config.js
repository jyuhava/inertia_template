import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // Warna identitas STIT Al Wafi Bogor (diambil dari logo: #D1AA4E)
                brand: {
                    50: '#FBF7EC',
                    100: '#F5EDD6',
                    200: '#EADCB0',
                    300: '#DFC888',
                    400: '#D6B96A',
                    500: '#D1AA4E',
                    600: '#B08A2E',
                    700: '#8A6A18',
                    800: '#6B5212',
                    900: '#47360B',
                },
            },
        },
    },

    plugins: [forms],
};
