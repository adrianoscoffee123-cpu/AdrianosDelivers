import { build } from 'vite';
const prefix='VITE_';
const allowed=new Set(['VITE_SUPABASE_URL','VITE_SUPABASE_PUBLISHABLE_KEY']);
for(const [name,value] of Object.entries(process.env)){
  if(name.startsWith(prefix) && !allowed.has(name))throw new Error(`Unexpected browser environment key: ${name}. Review before publishing.`);
  if(name=== 'VITE_SUPABASE_PUBLISHABLE_KEY' && value && (value.startsWith('sb_secret_') || (()=>{try{return JSON.parse(Buffer.from(value.split('.')[1],'base64url')).role==='service_role';}catch{return false;}})()))throw new Error('A privileged Supabase key cannot be included in the browser build.');
}
await build();
