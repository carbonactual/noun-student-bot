const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function authConfig(){
  if(!SUPABASE_URL || !SERVICE_KEY) throw new Error('Supabase auth is not configured');
  return { base: SUPABASE_URL + '/auth/v1', key: SERVICE_KEY };
}

async function supa(path, options = {}){
  const {base,key}=authConfig();
  const headers={
    'Content-Type':'application/json',
    apikey:key,
    Authorization: options.authorization || 'Bearer '+key,
    ...(options.headers||{})
  };
  const r=await fetch(base+path,{...options,headers});
  const data=await r.json().catch(()=>null);
  if(!r.ok){
    const e=new Error((data&&data.msg)||(data&&data.error_description)||(data&&data.message)||'Supabase Auth request failed');
    e.status=r.status;e.data=data;throw e;
  }
  return data;
}

function bearer(req){
  const h=String(req.headers?.authorization||'');
  return h.startsWith('Bearer ')?h.slice(7).trim():'';
}

async function createUser({email,password,metadata,phone}){
  return supa('/admin/users',{
    method:'POST',
    body:JSON.stringify({
      email,password,
      email_confirm:true,
      phone:phone||undefined,
      user_metadata:metadata||{}
    })
  });
}

async function signIn(email,password){
  return supa('/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
}

async function getUser(accessToken){
  if(!accessToken) throw new Error('Authentication required');
  return supa('/user',{method:'GET',authorization:'Bearer '+accessToken});
}

async function refreshSession(refreshToken){
  return supa('/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:refreshToken})});
}

async function recover(email,redirectTo){
  return supa('/recover',{method:'POST',body:JSON.stringify({email,redirect_to:redirectTo})});
}

async function updatePassword(accessToken,password){
  return supa('/user',{method:'PUT',authorization:'Bearer '+accessToken,body:JSON.stringify({password})});
}

async function logout(accessToken){
  return supa('/logout',{method:'POST',authorization:'Bearer '+accessToken});
}

module.exports={bearer,createUser,signIn,getUser,refreshSession,recover,updatePassword,logout};
