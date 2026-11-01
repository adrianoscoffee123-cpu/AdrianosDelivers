export function validatePublicConfig(env){
  const allowed=new Set(['VITE_SUPABASE_URL','VITE_SUPABASE_PUBLISHABLE_KEY']);
  for(const name of Object.keys(env))if(name.startsWith('VITE_')&&!allowed.has(name))throw new Error(`Unexpected browser environment key: ${name}. Review before publishing.`);
  const url=env.VITE_SUPABASE_URL;const key=env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if(!url&&!key)return;
  if(!url||!key)throw new Error('Both public Supabase settings are required to connect a build.');
  let parsed;try{parsed=new URL(url);}catch{throw new Error('Invalid Supabase project URL.');}
  if(parsed.protocol!=='https:'||!parsed.hostname.endsWith('.supabase.co')||parsed.username||parsed.password||parsed.search||parsed.hash||parsed.pathname!=='/')throw new Error('Use the HTTPS Supabase project URL without credentials, path, or query.');
  if(key.startsWith('sb_publishable_'))return;
  try{const claim=JSON.parse(Buffer.from(key.split('.')[1],'base64url'));if(claim.role==='anon')return;}catch{}
  throw new Error('Only a Supabase publishable key or legacy anon key is allowed in the browser build.');
}
