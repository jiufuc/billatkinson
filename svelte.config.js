import adapter from '@sveltejs/adapter-cloudflare';
import path from "path";

export default {
	kit: {
		adapter: adapter({
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			},
			platformProxy: {
				configPath: 'wrangler.toml',
				environment: undefined,
				persist: true
			}
		}),
    alias: {
      $lib: path.resolve("./src/lib"),
    },
	}
};