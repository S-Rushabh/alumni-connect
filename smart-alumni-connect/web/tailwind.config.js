/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
                heading: ['"Playfair Display"', 'Georgia', 'serif'],
            },
            colors: {
                // Primary Brand Colors
                oxford: '#002147',
                gold: '#D4AF37',
                // Interface Surfaces
                surface: {
                    DEFAULT: '#FDFDFD',
                    card: '#FFFFFF',
                    secondary: '#F8FAFC',
                    tertiary: '#F1F5F9',
                },
                // Functional Colors
                action: '#2563EB',
                success: '#10B981',
                alert: '#EF4444',
                warning: '#F59E0B',
                // Text Colors
                'text-primary': '#1A1A1A',
                'text-secondary': '#64748B',
                'text-muted': '#94A3B8',
            },
            boxShadow: {
                'glass': '0 8px 32px rgba(0, 33, 71, 0.08)',
                'card': '0 4px 24px rgba(0, 33, 71, 0.06)',
                'premium': '0 20px 50px rgba(0, 33, 71, 0.12)',
            },
            backdropBlur: {
                'glass': '12px',
            },
        },
    },
    plugins: [],
}
