import { build,loadEnv } from 'vite';
import { validatePublicConfig } from './public-config.mjs';
validatePublicConfig(loadEnv('production',process.cwd(),'VITE_'));
await build();
