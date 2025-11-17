// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ilamyCalendarPath = path.resolve(__dirname, './ilamy-calendar/src');

// https://astro.build/config
export default defineConfig({
	integrations: [react()],
	vite: {
		resolve: {
			alias: {
				// Résoudre les alias internes d'ilamy-calendar (@/ -> ilamy-calendar/src/)
				'@': ilamyCalendarPath,
			}
		},
		optimizeDeps: {
			include: ['rrule'],
			esbuildOptions: {
				// Handle CommonJS modules
				mainFields: ['module', 'main'],
			}
		},
		ssr: {
			noExternal: ['rrule']
		}
	}
});
