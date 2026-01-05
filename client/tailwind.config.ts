import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Dark, serious, system-like palette
                background: {
                    DEFAULT: '#0a0a0a',
                    card: '#121212',
                    hover: '#1a1a1a',
                },
                border: {
                    DEFAULT: '#2a2a2a',
                    subtle: '#1f1f1f',
                },
                text: {
                    primary: '#e0e0e0',
                    secondary: '#999999',
                    tertiary: '#666666',
                },
                accent: {
                    DEFAULT: '#00ccff',
                    muted: '#0099cc',
                },
                status: {
                    active: '#00cc66',
                    banned: '#cc0000',
                }
            },
            fontFamily: {
                // Typography-first: monospace primary
                mono: ['Courier New', 'monospace'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            spacing: {
                // Calm spacing for reading-first interface
                18: '4.5rem',
                88: '22rem',
            },
            borderRadius: {
                subtle: '2px',
            }
        },
    },
    plugins: [],
};

export default config;
