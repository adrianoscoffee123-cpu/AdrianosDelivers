import { build,loadEnv } from 'vite';
import { validatePublicConfig } from './public-config.mjs';
const env=loadEnv('production',process.cwd(),'VITE_');
validatePublicConfig(env);
await build({
  envPrefix:[],
  define:{
    'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(env.VITE_SUPABASE_URL||''),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY||''),
  },
});
