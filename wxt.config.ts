import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
	manifest: {
		name: '__MSG_extensionName__',
		description: '__MSG_extensionDescription__',
		default_locale: 'zh_CN',
		icons: {
			16: 'icon/16.png',
			32: 'icon/32.png',
			48: 'icon/48.png',
			96: 'icon/96.png',
			128: 'icon/128.png',
		},
		action: {
			default_icon: {
				16: 'icon/16.png',
				32: 'icon/32.png',
				48: 'icon/48.png',
			},
		},
		permissions: ['storage', 'scripting'],
		host_permissions: ['<all_urls>'],
	},
	outDir: 'dist',
	outDirTemplate: '{{browser}}-mv{{manifestVersion}}',
	webExt: {
		disabled: true,
	},
	vite: () => ({
		plugins: [tailwindcss()],
		build: {
			// Chrome >= 151 refuses to reuse chrome-extension:// resources across DOM
			// worlds (CVE-2026-17728). Vite's injected modulepreload links on
			// extension pages can therefore never be consumed: they trigger
			// "cross-world extension resource mismatch" and "preloaded but not used"
			// warnings, and every shared chunk gets fetched twice. Disable JS
			// modulepreload injection; stylesheet links are still emitted.
			modulePreload: false,
		},
	}),
});
