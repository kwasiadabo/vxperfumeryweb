import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const apiOrigin = (env.VITE_API_URL || 'https://vxperfumery.onrender.com/api').replace(/\/api\/?$/, '');

	return {
		plugins: [
			react(),
			tailwindcss(),
			VitePWA({
				registerType: 'autoUpdate',
				pwaAssets: {
					config: true,
					image: 'public/favicon.svg',
					overrideManifestIcons: true,
				},
				manifest: {
					name: 'VX Perfumery',
					short_name: 'VX Perfumery',
					description: 'Curated fine fragrances from the world\'s finest houses.',
					theme_color: '#1a1714',
					background_color: '#faf7f2',
					display: 'standalone',
					start_url: '/',
					scope: '/',
				},
				workbox: {
					navigateFallback: '/index.html',
					cleanupOutdatedCaches: true,
					runtimeCaching: [
						{
							urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
							handler: 'CacheFirst',
							options: {
								cacheName: 'google-fonts-stylesheets',
								expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
								cacheableResponse: { statuses: [0, 200] },
							},
						},
						{
							urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
							handler: 'CacheFirst',
							options: {
								cacheName: 'google-fonts-webfonts',
								expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
								cacheableResponse: { statuses: [0, 200] },
							},
						},
					],
				},
			}),
		],
		server: {
			port: 5199,
			strictPort: true,
			proxy: {
				'/api': apiOrigin,
				'/uploads': apiOrigin,
			},
		},
	};
});
