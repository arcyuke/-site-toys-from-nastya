const OWNER='arcyuke';
const REPO='-';
const BRANCH='main';
const FILE_PATH='assets/data/products.json';
const SESSION_KEY='nastusha-toys-admin';
let session={token:'',login:'',sha:'',products:[],dirty:false};

function api(path=''){return `https://api.github.com/repos/${OWNER}/${REPO}${path}`}
function headers(){return{'Accept':'application/vnd.github+json','Authorization':`Bearer ${session.token}`,'X-GitHub-Api-Version':'2022-11-28'}}
function encodeUtf8(value){const bytes=new TextEncoder().encode(value);let binary='';bytes.forEach(byte=>binary+=String.fromCharCode(byte));return btoa(binary)}
function decodeUtf8(value){const binary=atob(value.replace(/\n/g,''));const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));return new TextDecoder().decode(bytes)}
async function request(url,options={}){const response=await fetch(url,{...options,headers:{...headers(),...(options.headers||{})},cache:'no-store'});let payload=null;try{payload=await response.json()}catch{}if(!response.ok){const error=new Error(payload?.message||`GitHub: ${response.status}`);error.status=response.status;throw error}return payload}
function message(id,text,type=''){const node=document.getElementById(id);if(!node)return;node.textContent=text;node.className=`admin-message ${type}`}
function busy(button,state,text='сохранение…'){if(!button)return;if(state){button.dataset.label=button.textContent;button.textContent=text;button.disabled=true}else{button.textContent=button.dataset.label||button.textContent;button.disabled=false}}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}
function slugify(value){return String(value||'toy').toLowerCase().trim().replace(/[^a-z0-9а-яё]+/gi,'-').replace(/^-|-$/g,'').replace(/[а-яё]/gi,char=>({а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'}[char.toLowerCase()]))}

async function verifyAccess(){const user=await request('https://api.github.com/user');if((user.login||'').toLowerCase()!==OWNER)throw new Error(`Token принадлежит ${user.login||'другому аккаунту'}, а нужен ${OWNER}`);const repo=await request(api());if(!(repo.permissions?.admin||repo.permissions?.maintain||repo.permissions?.push))throw new Error('У этого token нет права записи в репозиторий');session.login=user.login}
async function loadCatalog(){const file=await request(api(`/contents/${FILE_PATH}?ref=${encodeURIComponent(BRANCH)}`));session.sha=file.sha;session.products=JSON.parse(decodeUtf8(file.content));session.dirty=false}
function showEditor(){document.getElementById('login-panel').hidden=true;document.getElementById('editor').hidden=false;document.getElementById('editor-status').textContent=`${session.login} · ${OWNER}/${REPO}`;renderEditor()}
async function login(){const button=document.getElementById('login');session.token=document.getElementById('token').value.trim();if(!session.token)return message('login-message','Введите GitHub token','error');busy(button,true,'проверяем…');message('login-message','Проверяем доступ…');try{await verifyAccess();await loadCatalog();sessionStorage.setItem(SESSION_KEY,JSON.stringify({token:session.token}));message('login-message','');showEditor()}catch(error){console.error(error);sessionStorage.removeItem(SESSION_KEY);session.token='';message('login-message',error.message||'Не удалось войти','error')}finally{busy(button,false)}}
function logout(){sessionStorage.removeItem(SESSION_KEY);session={token:'',login:'',sha:'',products:[],dirty:false};document.getElementById('editor').hidden=true;document.getElementById('login-panel').hidden=false;document.getElementById('product-editor').innerHTML='';document.getElementById('token').value='';message('login-message','Вы вышли из админки')}

function photoMarkup(image,index){return `<div class="photo-card" data-photo="${index}"><img src="${escapeHtml(image)}" alt="Фото товара"><div class="photo-card-controls"><button type="button" data-photo-move="-1" ${index===0?'disabled':''}>← раньше</button><button type="button" data-photo-move="1">позже →</button><button class="remove-photo" type="button" data-photo-remove>удалить фото</button></div></div>`}
function variantMarkup(size,index){return `<div class="variant-row" data-variant="${index}"><div class="field"><label>Название варианта<input data-variant-field="label" value="${escapeHtml(size.label)}" placeholder="обычный"></label></div><div class="field"><label>Остаток<input data-variant-field="stock" type="number" min="0" step="1" value="${Math.max(0,Number(size.stock)||0)}"></label></div><button class="danger-button" type="button" data-remove-variant>удалить</button></div>`}
function productMarkup(product,index){
  const madeToOrder=Boolean(product.madeToOrder);
  return `<article class="product-editor-card" data-product="${index}">
    <div class="product-card-head"><h2>${escapeHtml(product.name||'Новая игрушка')}</h2><button class="danger-button" type="button" data-delete-product>удалить товар</button></div>
    <div class="editor-grid">
      <div class="field span-2"><label>Название<input data-field="name" value="${escapeHtml(product.name)}"></label></div>
      <div class="field"><label>ID для ссылки<input data-field="id" value="${escapeHtml(product.id)}"></label></div>
      <div class="field"><label>Категория<input data-field="category" value="${escapeHtml(product.category||'игрушки')}" placeholder="котики"></label></div>
      <div class="field"><label>Цена, ₽<input data-field="price" type="number" min="0" step="1" value="${product.price??0}" ${madeToOrder?'disabled':''}></label></div>
      <div class="field"><label>Текст вместо цены<input data-field="priceText" value="${escapeHtml(product.priceText||'')}" placeholder="договорная"></label></div>
      <div class="field"><label>Бейдж<input data-field="badge" value="${escapeHtml(product.badge)}" placeholder="новинка"></label></div>
      <div class="field span-2"><label>Короткое описание<textarea data-field="description">${escapeHtml(product.description)}</textarea></label></div>
      <div class="field span-3"><label>Характеристики — каждая с новой строки<textarea data-field="characteristics">${escapeHtml((product.characteristics||[]).join('\n'))}</textarea></label></div>
      <div class="field span-3"><label>История игрушки<textarea data-field="philosophy">${escapeHtml(product.philosophy||'')}</textarea></label></div>
    </div>
    <div class="check-row">
      <label><input data-field="visible" type="checkbox" ${product.visible!==false?'checked':''}> показывать в каталоге</label>
      <label><input data-field="madeToOrder" type="checkbox" ${madeToOrder?'checked':''}> индивидуальный заказ</label>
    </div>
    <section class="variant-zone" ${madeToOrder?'hidden':''}>
      <div class="variant-heading"><h3>Варианты и остатки</h3><button class="admin-button soft" type="button" data-add-variant>+ вариант</button></div>
      <div class="variant-list">${(product.sizes||[]).map(variantMarkup).join('')}</div>
    </section>
    <section class="photo-zone"><h3>Фотографии <span class="code-note">(первая будет главной)</span></h3><div class="photo-actions"><input class="photo-input" data-photo-input type="file" accept="image/jpeg,image/png,image/webp" multiple><button class="admin-button soft" data-upload type="button">загрузить</button><span class="upload-status" data-upload-status></span></div><div class="photo-grid">${product.images?.length?product.images.map(photoMarkup).join(''):'<p class="empty-photos">Фотографий пока нет. Можно загрузить JPG, PNG или WebP.</p>'}</div></section>
  </article>`
}
function renderEditor(){const root=document.getElementById('product-editor');root.innerHTML=session.products.map(productMarkup).join('');bindEditor()}
function bindEditor(){
  const root=document.getElementById('product-editor');
  root.querySelectorAll('input,textarea,select').forEach(input=>input.addEventListener('input',()=>{session.dirty=true;message('save-message','Есть несохранённые изменения')}));
  root.querySelectorAll('[data-field="madeToOrder"]').forEach(input=>input.addEventListener('change',()=>{collect(false);renderEditor()}));
  root.querySelectorAll('[data-delete-product]').forEach(button=>button.onclick=()=>{const card=button.closest('[data-product]');const index=Number(card.dataset.product);if(confirm(`Удалить товар «${session.products[index].name}»? Фотографии останутся в репозитории.`)){collect(false);session.products.splice(index,1);session.dirty=true;renderEditor()}});
  root.querySelectorAll('[data-add-variant]').forEach(button=>button.onclick=()=>{collect(false);const index=Number(button.closest('[data-product]').dataset.product);session.products[index].sizes.push({label:'',stock:0});session.dirty=true;renderEditor()});
  root.querySelectorAll('[data-remove-variant]').forEach(button=>button.onclick=()=>{collect(false);const card=button.closest('[data-product]');session.products[Number(card.dataset.product)].sizes.splice(Number(button.closest('[data-variant]').dataset.variant),1);session.dirty=true;renderEditor()});
  root.querySelectorAll('[data-upload]').forEach(button=>button.onclick=()=>uploadPhotos(button.closest('[data-product]')));
  root.querySelectorAll('[data-photo-remove]').forEach(button=>button.onclick=()=>{collect(false);const card=button.closest('[data-product]');const product=session.products[Number(card.dataset.product)];product.images.splice(Number(button.closest('[data-photo]').dataset.photo),1);session.dirty=true;renderEditor()});
  root.querySelectorAll('[data-photo-move]').forEach(button=>button.onclick=()=>{collect(false);const card=button.closest('[data-product]');const product=session.products[Number(card.dataset.product)];const from=Number(button.closest('[data-photo]').dataset.photo);const to=from+Number(button.dataset.photoMove);if(to<0||to>=product.images.length)return;[product.images[from],product.images[to]]=[product.images[to],product.images[from]];session.dirty=true;renderEditor()});
}

function collect(showErrors=true){
  try{
    const next=[];
    document.querySelectorAll('[data-product]').forEach(card=>{
      const previous=session.products[Number(card.dataset.product)]||{};
      const get=name=>card.querySelector(`[data-field="${name}"]`);
      const name=get('name').value.trim();
      if(!name)throw new Error('У каждого товара должно быть название');
      const id=slugify(get('id').value||name);
      const madeToOrder=get('madeToOrder').checked;
      const price=madeToOrder?null:Math.round(Number(get('price').value));
      if(!madeToOrder&&(!Number.isFinite(price)||price<0))throw new Error(`Проверьте цену товара «${name}»`);
      const sizes=[...card.querySelectorAll('[data-variant]')].map(row=>({
        label:row.querySelector('[data-variant-field="label"]').value.trim().toLowerCase(),
        stock:Math.max(0,Math.trunc(Number(row.querySelector('[data-variant-field="stock"]').value)||0))
      }));
      if(!madeToOrder&&sizes.some(size=>!size.label))throw new Error(`У товара «${name}» есть вариант без названия`);
      const labels=sizes.map(size=>size.label);
      if(new Set(labels).size!==labels.length)throw new Error(`У товара «${name}» повторяются варианты`);
      next.push({
        ...previous,id,name,
        category:get('category').value.trim().toLowerCase()||'игрушки',
        badge:get('badge').value.trim(),
        price,
        priceText:get('priceText').value.trim()||(madeToOrder?'договорная':''),
        description:get('description').value.trim(),
        characteristics:get('characteristics').value.split('\n').map(item=>item.trim()).filter(Boolean),
        philosophy:get('philosophy').value.trim(),
        sizes:madeToOrder?[]:sizes,
        visible:get('visible').checked,
        madeToOrder,
        images:previous.images||[]
      });
    });
    const ids=next.map(item=>item.id);
    if(new Set(ids).size!==ids.length)throw new Error('У двух товаров одинаковый ID — сделайте их разными');
    session.products=next;
    if(showErrors)message('save-message','');
    return true;
  }catch(error){if(showErrors)message('save-message',error.message,'error');return false}
}
function addProduct(){
  collect(false);
  const id=`new-toy-${Date.now().toString().slice(-6)}`;
  session.products.unshift({id,name:'Новая игрушка',category:'игрушки',badge:'новинка',price:0,priceText:'',description:'',characteristics:[],philosophy:'',images:[],sizes:[{label:'обычный',stock:1}],visible:false,madeToOrder:false});
  session.dirty=true;
  renderEditor();
  scrollTo({top:document.getElementById('product-editor').offsetTop-130,behavior:'smooth'});
}

function imageToJpegBase64(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error('Не удалось прочитать фото'));reader.onload=()=>{const image=new Image();image.onerror=()=>reject(new Error(`Не удалось открыть ${file.name}`));image.onload=()=>{const max=1800;const scale=Math.min(1,max/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.86).split(',')[1])};image.src=reader.result};reader.readAsDataURL(file)})}
async function uploadPhotos(card){if(!collect(true))return;const index=Number(card.dataset.product);const product=session.products[index];const input=card.querySelector('[data-photo-input]');const files=[...input.files];const button=card.querySelector('[data-upload]');const status=card.querySelector('[data-upload-status]');if(!files.length){status.textContent='Сначала выберите фото';return}busy(button,true,'загрузка…');try{for(let i=0;i<files.length;i++){status.textContent=`Фото ${i+1} из ${files.length}…`;const content=await imageToJpegBase64(files[i]);const filename=`${product.id}-${Date.now()}-${i+1}.jpg`;const path=`assets/images/products/${filename}`;await request(api(`/contents/${path}`),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:`Добавить фото ${product.name}`,content,branch:BRANCH})});product.images.push(path)}session.dirty=true;renderEditor();message('save-message','Фотографии загружены. Нажмите «сохранить всё», чтобы они появились у товара.','success')}catch(error){console.error(error);status.textContent=`Ошибка: ${error.message}`}finally{busy(button,false)}}

async function save(){if(!collect(true))return;const button=document.getElementById('save');busy(button,true);message('save-message','Проверяем и сохраняем…');try{await verifyAccess();const latest=await request(api(`/contents/${FILE_PATH}?ref=${encodeURIComponent(BRANCH)}`));if(latest.sha!==session.sha)throw new Error('Каталог уже изменился в другой вкладке. Обновите страницу и войдите заново.');const content=`${JSON.stringify(session.products,null,2)}\n`;const result=await request(api(`/contents/${FILE_PATH}`),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Обновить каталог магазина игрушек',content:encodeUtf8(content),sha:session.sha,branch:BRANCH})});session.sha=result.content.sha;session.dirty=false;message('save-message','Готово! Каталог и остатки сохранены ♡','success')}catch(error){console.error(error);message('save-message',`Ошибка: ${error.message}`,'error');if(error.status===401||error.status===403)setTimeout(logout,1200)}finally{busy(button,false)}}

window.addEventListener('beforeunload',event=>{if(session.dirty){event.preventDefault();event.returnValue=''}});
document.addEventListener('DOMContentLoaded',()=>{try{const saved=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');if(saved?.token)document.getElementById('token').value=saved.token}catch{sessionStorage.removeItem(SESSION_KEY)}document.getElementById('login').onclick=login;document.getElementById('token').addEventListener('keydown',event=>{if(event.key==='Enter')login()});document.getElementById('add-product').onclick=addProduct;document.getElementById('save').onclick=save;document.getElementById('logout').onclick=logout});
