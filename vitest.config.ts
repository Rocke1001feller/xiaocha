import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'#imports': path.resolve(__dirname, './tests/mocks/wxt-imports.ts'),
		},
	},
	test: {
		exclude: ['**/node_modules/**', '**/dist/**'],
	},
});
