

export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(222.2 84% 4.9%)",
                foreground: "hsl(210 40% 98%)",
                primary: {
                    DEFAULT: "hsl(210 40% 98%)",
                    foreground: "hsl(222.2 47.4% 11.2%)",
                },
                secondary: {
                    DEFAULT: "hsl(217.2 32.6% 17.5%)",
                    foreground: "hsl(210 40% 98%)",
                },
                accent: {
                    DEFAULT: "hsl(217.2 32.6% 17.5%)",
                    foreground: "hsl(210 40% 98%)",
                },
                destructive: {
                    DEFAULT: "hsl(0 62.8% 30.6%)",
                    foreground: "hsl(210 40% 98%)",
                },
                muted: {
                    DEFAULT: "hsl(217.2 32.6% 17.5%)",
                    foreground: "hsl(215 20.2% 65.1%)",
                },
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease-out",
                "scale-in": "scaleIn 0.3s ease-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                scaleIn: {
                    "0%": { transform: "scale(0.95)", opacity: "0" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },
            },
        },
    },
    plugins: [],
}
