// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
	integrations: [react()],
	vite: {
		resolve: {
			alias: {
				'@/services': path.resolve(__dirname, './src/services'),
				'@/components': path.resolve(__dirname, './src/components'),
				'@/types': path.resolve(__dirname, './src/components/ProviderCalendars/types')
			}
		}
	}
});
