import type { Config } from "tailwindcss";

const config = {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		extend: {
			screens: {
				m: "460px",
				sm: "584px",
				md: "768px",
				lg: "1024px",
				xl: "1280px",
				"2xl": "1536px",
				"3xl": "1780px",
			},
			fontFamily: {
				default: ["Helvetica", "sans-serif"],
			},
			colors: {
				dark: {
					1: "#1C1F2E",
					2: "#161925",
					3: "#252A41",
					4: "#1E2757",
				},
				blue: {
					1: "#0E78F9",
				},
				green: {
					1: "#50A65C",
				},
				sky: {
					1: "#C9DDFF",
					2: "#ECF0FF",
					3: "#F5FCFF",
				},
				orange: {
					1: "#FF742E",
				},
				purple: {
					1: "#830EF9",
				},
				yellow: {
					1: "#F9A90E",
				},
			},
			boxShadow: {
				"bottom-right": "10px 10px 0px rgba(0, 0, 0, 0.1)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				enterFromRight: {
					"0%": { opacity: "0", transform: "translateX(100%)" },
					"100%": { opacity: "1", transform: "translateX(0)" },
				},
				exitToLeft: {
					"0%": { opacity: "1", transform: "translateX(0)" },
					"100%": { opacity: "0", transform: "translateX(-100%)" },
				},
				enterFromLeft: {
					"0%": { opacity: "0", transform: "translateX(-100%)" },
					"100%": { opacity: "1", transform: "translateX(0)" },
				},
				exitToRight: {
					"0%": { opacity: "1", transform: "translateX(0)" },
					"100%": { opacity: "0", transform: "translateX(100%)" },
				},
				enterFromBottom: {
					"0%": { opacity: "0", transform: "translateY(100%)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
				enterFromTop: {
					"0%": { opacity: "0", transform: "translateY(-100%)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				enterFromRight: "enterFromRight 1s ease-in-out forwards",
				exitToLeft: "exitToLeft 1s ease-in-out forwards",
				enterFromLeft: "enterFromLeft 1s ease-in-out forwards",
				exitToRight: "exitToRight 1s ease-in-out forwards",
				enterFromBottom: "enterFromBottom 1s ease-in-out forwards",
				enterFromTop: "enterFromTop 1s ease-in-out forwards",
			},
			backgroundImage: {
				hero: "url('/images/hero-background.png')",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
