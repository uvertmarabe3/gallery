const C = CONFIG,
    B = 'gallery-photos',
    db = supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY),
    $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : b < 1073741824 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1073741824).toFixed(2) + ' GB';
const isVideo = p => String(p.file_type || '').startsWith('video/');
const thumb = p => isVideo(p) ? `<video src="${p.url||''}" muted playsinline preload="metadata"></video>` : `<img loading="lazy" src="${p.url||''}" alt="${esc(p.file_name)}">`;
const uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
const toast = (m, e) => {
    const t = document.createElement('div');
    t.className = 'toast' + (e ? ' err' : '');
    t.textContent = m;
    $('#toasts').append(t);
    setTimeout(() => t.remove(), 3500)
};
const themeOptions = ['system', 'light', 'dark', 'autumn', 'winter', 'summer', 'spring'].map(t => `<option value="${t}">${t[0].toUpperCase() + t.slice(1)}</option>`).join('');
const setTheme = t => {
    localStorage.setItem('theme', t);
    document.documentElement.dataset.theme = t === 'system' ? (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light') : t;
    [$('#theme'), $('#theme-mobile')].forEach(s => { if (s) s.value = t })
};
setTheme(localStorage.getItem('theme') || 'system');
matchMedia('(prefers-color-scheme:dark)').addEventListener('change', () => localStorage.getItem('theme') === 'system' && setTheme('system'));
let user, view = 'dashboard',
    trashReady = false,
    F = { q: '', sort: 'desc', type: '', album: '', layout: localStorage.getItem('layout') || 'grid' },
    P = [],
    page = 0,
    more = false,
    sel = new Set(),
    idx = 0;
const err = (e, m) => { if (e) { toast(m || e.message, 1); return 1 } };
const live = q => trashReady ? q.is('deleted_at', null) : q;
async function detectTrash() { const { error } = await db.from('photos').select('deleted_at').limit(1); trashReady = !error }
async function stats() {
    const { data, error } = await db.from('photos').select(trashReady ? 'file_size,deleted_at' : 'file_size');
    const quota = C.QUOTA_MB * 1048576;
    if (err(error)) return { used: 0, quota, n: 0, trash: 0, albums: 0, pct: 0 };
    const { count } = await db.from('albums').select('*', { count: 'exact', head: true });
    const rows = data || [];
    const used = rows.reduce((a, p) => a + (Number(p.file_size) || 0), 0);
    const n = rows.filter(p => !p.deleted_at).length;
    return { used, quota, n, trash: rows.length - n, albums: count || 0, pct: quota ? used / quota * 100 : 0 }
}
async function sign(rows) {
    if (!rows.length) return;
    const { data } = await db.storage.from(B).createSignedUrls(rows.map(r => r.file_path), 3600);
    rows.forEach((r, i) => r.url = data?.[i]?.signedUrl)
}
async function albumsList() { const { data } = await db.from('albums').select('*').order('created_at'); return data || [] }
async function load(reset, favs) {
    if (reset) {
        page = 0;
        P = [];
        sel.clear();
        more = false
    }
    let q = live(db.from('photos').select('*')).order('created_at', { ascending: F.sort === 'asc' }).range(page * C.PAGE_SIZE, (page + 1) * C.PAGE_SIZE - 1);
    if (F.q) q = q.ilike('file_name', '%' + F.q.replace(/[%,]/g, '') + '%');
    if (F.type) q = q.eq('file_type', F.type);
    if (F.album) q = q.eq('album_id', F.album);
    if (favs) q = q.eq('favorite', true);
    const { data, error } = await q;
    if (err(error)) return;
    await sign(data || []);
    P = P.concat(data || []);
    more = (data || []).length === C.PAGE_SIZE;
    page++
}

function photoHTML(p, i) { return `<div class="ph" data-i="${i}"><input type="checkbox" class="ck" ${sel.has(p.id)?'checked':''} data-id="${p.id}">${thumb(p)}${isVideo(p)?'<span class="play">▶</span>':''}${F.layout==='list'?`<div><b>${esc(p.file_name)}</b><br><span class="muted">${fmt(p.file_size)} · ${new Date(p.created_at).toLocaleDateString()}</span></div>`:''}</div>`}
function bindPhotos(root){root.querySelectorAll('.ph').forEach(el=>el.onclick=e=>{if(e.target.classList.contains('ck')){e.target.checked?sel.add(e.target.dataset.id):sel.delete(e.target.dataset.id);return}openLB(+el.dataset.i)})}
async function render(v){view=v||view;document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.dataset.v===view));const m=$('#main');m.innerHTML='<div class="card sk"></div>';await R[view](m)}
const meter=s=>{const pct=Number(s.pct)||0;return`${pct>=95?'<div class="warn crit">⚠️ Critical: storage is over 95% full.</div>':pct>=80?'<div class="warn">Storage is over 80% full.</div>':''}<div class="prog"><i style="width:${Math.min(100,Math.max(0,pct))}%"></i></div>`};
const statCards=s=>`<div class="stats"><div class="card"><b>${fmt(s.used)}</b>Used</div><div class="card"><b>${fmt(s.quota)}</b>Configured quota</div><div class="card"><b>${fmt(Math.max(0,s.quota-s.used))}</b>Remaining</div><div class="card"><b>${(Number(s.pct)||0).toFixed(1)}%</b>Usage</div><div class="card"><b>${s.n}</b>Photos / files</div><div class="card"><b>${s.albums}</b>Albums</div></div>`;
const R={
async dashboard(m){const s=await stats();const{data:rp}=await live(db.from('photos').select('*')).order('created_at',{ascending:false}).limit(8);await sign(rp||[]);const al=(await albumsList()).slice(-4).reverse();
 const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toDateString()});const {data:all}=await live(db.from('photos').select('created_at')).gte('created_at',new Date(Date.now()-7*864e5).toISOString());
 const cnt=days.map(d=>(all||[]).filter(p=>new Date(p.created_at).toDateString()===d).length),mx=Math.max(1,...cnt);
 m.innerHTML=`<h2>Dashboard</h2><div class="mobile-theme"><span>🎨 Theme</span><select id="theme-mobile" aria-label="Theme">${themeOptions}</select></div>${meter(s)}${statCards(s)}<div class="card"><b>Uploads, last 7 days</b><svg viewBox="0 0 140 50" width="100%" height="110">${cnt.map((c,i)=>`<rect x="${i*20+4}" y="${45-c/mx*40}" width="12" height="${c/mx*40}" rx="3" fill="var(--ac)"/><text x="${i*20+10}" y="49" font-size="5" text-anchor="middle" fill="var(--mu)">${c}</text>`).join('')}</svg></div><h3>Recent photos</h3><div class="grid">${(rp||[]).map(p=>`<div class="ph">${thumb(p)}${isVideo(p)?'<span class="play">▶</span>':''}</div>`).join('')||'<p class="muted">No photos or videos yet.</p>'}</div><h3>Recent albums</h3><p>${al.map(a=>`<span class="card" style="margin-right:8px">📁 ${esc(a.name)}</span>`).join('')||'<span class="muted">None yet.</span>'}</p>`;
 const tm=$('#theme-mobile');if(tm){tm.value=localStorage.getItem('theme')||'system';tm.onchange=()=>setTheme(tm.value)}},
async gallery(m,favs){const als=await albumsList();await load(1,favs);
 m.innerHTML=`<h2>${favs?'Favorites':'Photos'}</h2><div class="drop" id="drop">Drag & drop photos or videos here or click to browse</div><div class="bar"><input id="q" placeholder="Search filename" value="${esc(F.q)}"><select id="sort"><option value="desc">Newest</option><option value="asc">Oldest</option></select><select id="type"><option value="">All types</option>${[['image/jpeg','JPEG'],['image/png','PNG'],['image/webp','WEBP'],['image/gif','GIF'],['video/mp4','MP4'],['video/webm','WEBM'],['video/quicktime','MOV']].map(([v,n])=>`<option value="${v}">${n}</option>`).join('')}</select><select id="alb"><option value="">All albums</option>${als.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select><select id="lay">${['grid','masonry','list'].map(l=>`<option>${l}</option>`).join('')}</select></div>
 <div class="bar"><select id="mv"><option value="">Move selected to…</option><option value="none">No album</option>${als.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select><button class="btn red" id="bd">Delete selected</button></div><div id="ph" class="${F.layout}"></div><button class="btn ghost" id="more" hidden>Load more</button>`;
 $('#sort').value=F.sort;$('#type').value=F.type;$('#alb').value=F.album;$('#lay').value=F.layout;
 const draw=()=>{const h=$('#ph');h.innerHTML=P.map(photoHTML).join('')||'<p class="muted">Nothing here yet — upload some photos.</p>';bindPhotos(h);$('#more').hidden=!more};draw();
 $('#drop').onclick=()=>$('#file').click();$('#drop').ondragover=e=>{e.preventDefault();$('#drop').classList.add('over')};$('#drop').ondragleave=()=>$('#drop').classList.remove('over');$('#drop').ondrop=e=>{e.preventDefault();upload([...e.dataTransfer.files])};
 let t;$('#q').oninput=e=>{clearTimeout(t);t=setTimeout(async()=>{F.q=e.target.value;await load(1,favs);draw()},300)};
 for(const[id,k]of[['sort','sort'],['type','type'],['alb','album']])$('#'+id).onchange=async e=>{F[k]=e.target.value;await load(1,favs);draw()};
 $('#lay').onchange=e=>{F.layout=e.target.value;localStorage.setItem('layout',F.layout);$('#ph').className=F.layout;draw()};
 $('#more').onclick=async()=>{await load(0,favs);draw()};
 $('#mv').onchange=async e=>{if(!sel.size||!e.target.value)return;const{error}=await db.from('photos').update({album_id:e.target.value==='none'?null:e.target.value}).in('id',[...sel]);if(!err(error)){toast('Moved');sel.clear();render()}};
 $('#bd').onclick=async()=>{if(sel.size&&confirm(`Move ${sel.size} photo(s) to Recently deleted?`)){await del(P.filter(p=>sel.has(p.id)));sel.clear();render()}}},
favorites:m=>R.gallery(m,true),
 async trash(m){if(!trashReady){m.innerHTML=`<h2>Recently deleted</h2><div class="card"><p>This backup feature needs a one-time database update.</p><p class="muted">Run <code>trash.sql</code> in the Supabase SQL editor, then reload this page.</p></div>`;return}
  const{data,error}=await db.from('photos').select('*').not('deleted_at','is',null).order('deleted_at',{ascending:false}).limit(500);if(err(error))return;const rows=data||[];await sign(rows);
  const card=p=>`<div class="card"><div class="ph" style="aspect-ratio:4/3;cursor:default">${thumb(p)}${isVideo(p)?'<span class="play">▶</span>':''}</div><b>${esc(p.file_name)}</b><div class="muted">${fmt(p.file_size)} · deleted ${new Date(p.deleted_at).toLocaleString()}</div><div class="bar" style="margin:8px 0 0"><button class="btn ghost" data-r="${p.id}">Restore</button><button class="btn red" data-x="${p.id}">Delete forever</button></div></div>`;
  m.innerHTML=`<h2>Recently deleted</h2><p class="muted">Deleted photos are kept as a backup until you permanently delete them.</p>${rows.length?`<div class="bar"><button class="btn ghost" id="ra">Restore all (${rows.length})</button><button class="btn red" id="xa">Delete all forever</button></div><div class="grid">${rows.map(card).join('')}</div>`:'<p class="muted">Nothing here — deleted photos will appear here.</p>'}`;
  m.querySelectorAll('[data-r]').forEach(e=>e.onclick=()=>restore([e.dataset.r]));
  m.querySelectorAll('[data-x]').forEach(e=>e.onclick=()=>{const p=rows.find(r=>r.id===e.dataset.x);if(p&&confirm(`Permanently delete "${p.file_name}"? This cannot be undone.`))purge([p])});
  if(rows.length){$('#ra').onclick=()=>confirm(`Restore all ${rows.length} photo(s)?`)&&restore(rows.map(p=>p.id));$('#xa').onclick=()=>confirm(`Permanently delete all ${rows.length} photo(s)? This cannot be undone.`)&&purge(rows)}},
 async albums(m){const als=await albumsList();const{data:ph}=await live(db.from('photos').select('album_id,file_path,created_at')).order('created_at',{ascending:false});const cover={};const cnt={};(ph||[]).forEach(p=>{if(!p.album_id)return;cnt[p.album_id]=(cnt[p.album_id]||0)+1;cover[p.album_id]??=p});const cv=Object.values(cover);await sign(cv);
 m.innerHTML=`<h2>Albums</h2><div class="bar"><input id="an" placeholder="New album name"><button class="btn" id="ac">Create</button><button class="btn ghost" id="as">Add samples</button></div><div class="grid">${als.map(a=>`<div class="card"><div class="ph" data-a="${a.id}" style="aspect-ratio:4/3">${cover[a.id]?`${thumb(cover[a.id])}${isVideo(cover[a.id])?'<span class="play">▶</span>':''}`:'<p style="text-align:center;padding-top:30%">📁</p>'}</div><b>${esc(a.name)}</b><div class="muted">${cnt[a.id]||0} photos</div><button class="btn ghost" data-r="${a.id}">Rename</button> <button class="btn red" data-d="${a.id}">Delete</button></div>`).join('')}</div>`;
 const add=async n=>{const{error}=await db.from('albums').insert(n.map(name=>({name})));if(!err(error))render()};
 $('#ac').onclick=()=>$('#an').value.trim()&&add([$('#an').value.trim()]);$('#as').onclick=()=>add(['Personal','Family','Travel','Memories','Work','Favorites']);
 m.querySelectorAll('[data-a]').forEach(e=>e.onclick=()=>{F.album=e.dataset.a;render('gallery')});
 m.querySelectorAll('[data-r]').forEach(e=>e.onclick=async()=>{const n=prompt('New name');if(n){await db.from('albums').update({name:n}).eq('id',e.dataset.r);render()}});
 m.querySelectorAll('[data-d]').forEach(e=>e.onclick=async()=>{if(confirm('Delete album? Photos are kept.')){const{error}=await db.from('albums').delete().eq('id',e.dataset.d);if(!err(error)){if(F.album===e.dataset.d)F.album='';render()}}})},
async storage(m){const s=await stats();m.innerHTML=`<h2>Storage</h2>${meter(s)}${statCards(s)}<p class="muted">Figures are the sum of real file sizes stored in your database. The quota (${C.QUOTA_MB} MB) is set in config.js and is separate from the account-wide limit of your Supabase plan.</p>`},
};
async function upload(files){if(!files.length)return;const s=await stats();let used=s.used,ok=0;
 for(const[i,f]of files.entries()){const video=/^video\/(mp4|webm|quicktime|ogg)$/.test(f.type);
  if(!video&&!/^image\/(jpeg|png|webp|gif)$/.test(f.type)){toast(`${f.name}: unsupported format`,1);continue}
  const maxMB=video?C.MAX_VIDEO_MB:C.MAX_FILE_MB;
  if(f.size>maxMB*1048576){toast(`${f.name}: over ${maxMB} MB`,1);continue}
  if(used+f.size>s.quota){toast(`${f.name}: would exceed your storage quota`,1);continue}
  toast(`Uploading ${i+1}/${files.length}: ${f.name} (${fmt(f.size)})`);const path=`${user.id}/${uid()}-${f.name.replace(/[^\w.\-]/g,'_')}`;
  const{error}=await db.storage.from(B).upload(path,f,{contentType:f.type});if(err(error,`${f.name}: ${error?.message}`))continue;
  const{error:e2}=await db.from('photos').insert({file_name:f.name,file_path:path,file_size:f.size,file_type:f.type,album_id:F.album||null});
  if(e2){await db.storage.from(B).remove([path]);err(e2);continue}used+=f.size;ok++}
 if(ok)toast(`${ok} photo(s) uploaded`);render()}
async function del(rows){if(!rows.length)return;
 if(!trashReady){const{error}=await db.storage.from(B).remove(rows.map(r=>r.file_path));if(err(error))return;
  const{error:e2}=await db.from('photos').delete().in('id',rows.map(r=>r.id));if(!err(e2))toast('Deleted (run trash.sql to enable backups)');return}
 const{error}=await db.from('photos').update({deleted_at:new Date().toISOString()}).in('id',rows.map(r=>r.id));if(!err(error))toast(`${rows.length} photo(s) moved to Recently deleted`)}
async function restore(ids){if(!ids.length)return;const{error}=await db.from('photos').update({deleted_at:null}).in('id',ids);if(!err(error)){toast(`${ids.length} photo(s) restored`);render()}}
async function purge(rows){if(!rows.length)return;const{error}=await db.storage.from(B).remove(rows.map(r=>r.file_path));if(err(error))return;
 const{error:e2}=await db.from('photos').delete().in('id',rows.map(r=>r.id));if(!err(e2)){toast('Deleted forever');render()}}
function openLB(i){idx=i;const p=P[i],l=$('#lb');l.hidden=false;
 const media=isVideo(p)?`<video id="li" src="${p.url}" controls playsinline></video>`:`<img id="li" src="${p.url}">`;
 l.innerHTML=`${media}<div><b>${esc(p.file_name)}</b> · ${fmt(p.file_size)} · ${new Date(p.created_at).toLocaleString()}<br>${esc(p.description)}</div><div class="row"><button class="btn" id="pv">◀</button><button class="btn" id="nx">▶</button><button class="btn" id="fv">${p.favorite?'★':'☆'}</button><button class="btn" id="ed">Edit description</button><button class="btn" id="dl2">Download</button><button class="btn" id="cp">Copy link (1h)</button><button class="btn red" id="rm">Delete</button><button class="btn ghost" id="cl">✕</button></div>`;
 const li=$('#li');if(li&&li.tagName==='IMG')li.onclick=e=>e.target.classList.toggle('z');$('#cl').onclick=()=>l.hidden=true;$('#pv').onclick=()=>openLB((i-1+P.length)%P.length);$('#nx').onclick=()=>openLB((i+1)%P.length);
 $('#fv').onclick=async()=>{p.favorite=!p.favorite;await db.from('photos').update({favorite:p.favorite}).eq('id',p.id);openLB(i)};
 $('#ed').onclick=async()=>{const d=prompt('Description',p.description);if(d!==null){p.description=d;await db.from('photos').update({description:d}).eq('id',p.id);openLB(i)}};
 $('#dl2').onclick=async()=>{const{data,error}=await db.storage.from(B).download(p.file_path);if(err(error))return;const a=document.createElement('a'),u=URL.createObjectURL(data);a.href=u;a.download=p.file_name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)};
 $('#cp').onclick=()=>{const done=()=>toast('Temporary signed link copied');if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(p.url).then(done).catch(()=>prompt('Copy this link:',p.url));else prompt('Copy this link:',p.url)};
 $('#rm').onclick=async()=>{if(confirm('Move this photo to Recently deleted?')){await del([p]);l.hidden=true;render()}}}
document.addEventListener('keydown',e=>{if($('#lb').hidden)return;if(e.key==='Escape')$('#lb').hidden=true;if(e.key==='ArrowRight')openLB((idx+1)%P.length);if(e.key==='ArrowLeft')openLB((idx-1+P.length)%P.length)});
(async()=>{const{data:{session}}=await db.auth.getSession();if(!session){location.replace('login.html');return}user=session.user;
 const ts=$('#theme');ts.value=localStorage.getItem('theme')||'system';ts.onchange=()=>setTheme(ts.value);
 document.querySelectorAll('nav a').forEach(a=>a.onclick=()=>{F.album='';render(a.dataset.v)});
  $('#fab').onclick=()=>$('#file').click();$('#file').onchange=e=>{upload([...e.target.files]);e.target.value=''};await detectTrash();render('dashboard')})();