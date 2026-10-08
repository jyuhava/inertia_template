/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{vue,ts,js}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
                mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
            },
            colors: {
                // Warna identitas STIT Al Wafi (selaras dengan SIAKAD existing)
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
            fontSize: {
                '2xs': ['0.6875rem', { lineHeight: '1rem' }],
            },
        },
    },
    plugins: [],
};
