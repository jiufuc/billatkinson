import adapter from '@sveltejs/adapter-cloudflare';
import path from "path";
import { preprocessMeltUI, sequence } from '@melt-ui/pp'

const config = {
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
    paths: {
      relative: false
    }
	},
  preprocess: sequence([
    preprocessMeltUI() 
  ])
};

export default config;