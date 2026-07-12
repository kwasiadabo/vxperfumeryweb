import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const apiOrigin = (env.VITE_API_URL || 'https://vxperfumery.onrender.com/api').replace(/\/api\/?$/, '');

	return {
		plugins: [react(), tailwindcss()],
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
