// ══════════════════════════════════════════════
// CONFIG - Supabaseの情報をここに入れる
// ══════════════════════════════════════════════
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
const S = {
  apiKey: '',
  count: 3,
  selectedFixColors: [],
  myPalette: [],
  savedPalettes: [],
  palettes: [],
  selectedSwatchIdx: -1,
  pickedHex: '',
  loading: false,
};

// スライダーラベル
const WARM_LABELS  = ['とても暖かい','暖かめ','ニュートラル','冷ため','とても冷たい'];
const BRIGHT_LABELS = ['とても明るい','明るめ','ミドル','暗め','とても暗い'];
const SOFT_LABELS  = ['とても柔らかい','柔らかめ','バランス','硬め','とても硬い'];

// ══════════════════════════════════════════════
// SUPABASE
// ══════════════════════════════════════════════
async function sbFetch(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(SUPABASE_URL + path, opts);
  if (!res.ok) throw new Error('Supabase error: ' + res.status);
  return method === 'DELETE' ? null : res.json();
}

async function loadMyPalette() {
  try {
    const data = await sbFetch('/rest/v1/my_colors?order=created_at.asc');
    S.myPalette = data || [];
  } catch(e) {
    console.warn('Supabase未設定のためローカルデータを使用');
    S.myPalette = JSON.parse(localStorage.getItem('my_palette') || '[]');
  }
  renderMyPalette();
  renderFixChips();
}

async function saveColorToDb(color) {
  try {
    await sbFetch('/rest/v1/my_colors', 'POST', color);
  } catch(e) {
    // fallback to localStorage
    const arr = JSON.parse(localStorage.getItem('my_palette') || '[]');
    arr.push(color);
    localStorage.setItem('my_palette', JSON.stringify(arr));
  }
}

async function deleteColorFromDb(id) {
  try {
    await sbFetch(`/rest/v1/my_colors?id=eq.${id}`, 'DELETE');
  } catch(e) {
    const arr = JSON.parse(localStorage.getItem('my_palette') || '[]');
    localStorage.setItem('my_palette', JSON.stringify(arr.filter(c => c.id !== id)));
  }
}

async function updateColorName(id, name) {
  try {
    await sbFetch(`/rest/v1/my_colors?id=eq.${id}`, 'PATCH', { name });
  } catch(e) {
    const arr = JSON.parse(localStorage.getItem('my_palette') || '[]');
    const c = arr.find(c => c.id === id);
    if (c) c.name = name;
    localStorage.setItem('my_palette', JSON.stringify(arr));
  }
}

async function loadSavedPalettes() {
  try {
    const data = await sbFetch('/rest/v1/saved_palettes?order=created_at.desc');
    S.savedPalettes = (data || []).map(r => ({ ...JSON.parse(r.data), dbId: r.id }));
  } catch(e) {
    S.savedPalettes = JSON.parse(localStorage.getItem('saved_palettes') || '[]');
  }
}

async function savePaletteToDb(palette) {
  try {
    await sbFetch('/rest/v1/saved_palettes', 'POST', { data: JSON.stringify(palette) });
  } catch(e) {
    const arr = JSON.parse(localStorage.getItem('saved_palettes') || '[]');
    arr.unshift(palette);
    localStorage.setItem('saved_palettes', JSON.stringify(arr));
  }
}

async function deletePaletteFromDb(dbId) {
  try {
    await sbFetch(`/rest/v1/saved_palettes?id=eq.${dbId}`, 'DELETE');
  } catch(e) {
    const arr = JSON.parse(localStorage.getItem('saved_palettes') || '[]');
    localStorage.setItem('saved_palettes', JSON.stringify(arr.filter((_,i) => i !== dbId)));
  }
}

// ══════════════════════════════════════════════
// API KEY
// ══════════════════════════════════════════════
function saveApiKey() {
  const v = document.getElementById('api-key-input').value.trim();
  if (!v.startsWith('AIza')) { setStatus('❌ Gemini APIキーは AIza... から始まります', 'var(--red)'); return; }
  S.apiKey = v;
  localStorage.setItem('ps_gemini_key', v);
  setStatus('✓ 保存済み', '#27ae60');
  document.getElementById('api-key-input').value = '••••••••••••' + v.slice(-4);
}

function loadApiKey() {
  const k = localStorage.getItem('ps_gemini_key');
  if (k) {
    S.apiKey = k;
    document.getElementById('api-key-input').value = '••••••••••••' + k.slice(-4);
    setStatus('✓ 保存済み', '#27ae60');
  }
}

function setStatus(msg, color) {
  const el = document.getElementById('api-status');
  el.textContent = msg; el.style.color = color;
}

// ══════════════════════════════════════════════
// GEMINI API
// ══════════════════════════════════════════════
async function callGemini(prompt) {
  if (!S.apiKey) throw new Error('APIキーを入力して保存してください');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${S.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1500 }
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error('Gemini API エラー: ' + res.status + ' — ' + t.slice(0, 120));
  }
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
  // JSON抽出
  try { return JSON.parse(text); } catch(_) {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch(_) {} }
  throw new Error('レスポンスのパースに失敗: ' + text.slice(0, 80));
}

// ══════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════
function hexToRgb(h) { return { r: parseInt(h.slice(1,3),16), g: parseInt(h.slice(3,5),16), b: parseInt(h.slice(5,7),16) }; }
function lum({r,g,b}) { const s=c=>{const v=c/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*s(r)+.7152*s(g)+.0722*s(b); }
function contrast(h1,h2) { const l1=lum(hexToRgb(h1)),l2=lum(hexToRgb(h2));return((Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)).toFixed(2); }
function grade(r) { if(r>=7)return{l:'AAA',c:'#27ae60'};if(r>=4.5)return{l:'AA',c:'#2980b9'};if(r>=3)return{l:'AA Large',c:'#e67e22'};return{l:'Fail',c:'#c0392b'}; }
function textOn(bg) { const{r,g,b}=hexToRgb(bg);return r*.299+g*.587+b*.114>128?'#1a1816':'#f8f7f5'; }
function isHex(h) { return /^#[0-9A-Fa-f]{6}$/.test(h); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

// ══════════════════════════════════════════════
// SLIDERS
// ══════════════════════════════════════════════
function updateSliderLabel() {
  const w = WARM_LABELS[document.getElementById('sl-warm').value];
  const b = BRIGHT_LABELS[document.getElementById('sl-bright').value];
  const s = SOFT_LABELS[document.getElementById('sl-soft').value];
  document.getElementById('mood-preview').textContent = `${w} / ${b} / ${s}`;
}

function getMoodDesc() {
  const w = parseInt(document.getElementById('sl-warm').value);
  const b = parseInt(document.getElementById('sl-bright').value);
  const s = parseInt(document.getElementById('sl-soft').value);
  const warmDesc  = ['very warm and cozy', 'warm', 'neutral temperature', 'cool', 'very cool and cold'][w];
  const brightDesc = ['very bright and light', 'bright', 'medium brightness', 'dark', 'very dark'][b];
  const softDesc  = ['very soft and gentle', 'soft', 'balanced', 'sharp', 'very hard and bold'][s];
  return `${warmDesc}, ${brightDesc}, ${softDesc}`;
}

// ══════════════════════════════════════════════
// GENERATE
// ══════════════════════════════════════════════
function buildPrompt() {
  const mood = getMoodDesc();
  const fixedColors = S.selectedFixColors.length
    ? `Must include these colors: ${S.selectedFixColors.join(', ')}.` : '';

  return `You are a professional color designer. Generate 3 beautiful color palette combinations.

Mood/atmosphere: ${mood}
Number of colors per palette: ${S.count}
${fixedColors}

Requirements:
- Each palette has exactly ${S.count} colors
- Always include one color with role "background" and one with role "text"
- Other colors use role "point" or "accent"
- Use sophisticated, harmonious hex color codes that match the mood
- name: short poetic 2-4 character Japanese name
- mood: one evocative Japanese sentence description

Return ONLY this JSON, no other text:
{"palettes":[{"name":"静寂","mood":"静かな朝の光を感じさせる","colors":[{"hex":"#F2EDE8","role":"background"},{"hex":"#2C2825","role":"text"},{"hex":"#8B9E8A","role":"point"}]}]}`;
}

async function generate() {
  if (!S.apiKey) { showError('Gemini APIキーを入力して保存してください'); return; }
  S.loading = true;
  hideError();
  renderLoading();
  try {
    const r = await callGemini(buildPrompt());
    S.palettes = r.palettes || [];
    if (!S.palettes.length) throw new Error('パレットデータが空です');
    renderPalettes();
  } catch(e) {
    showError(e.message);
    renderEmpty();
  }
  S.loading = false;
}

// ══════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════
function renderLoading() {
  document.getElementById('content-area').innerHTML =
    '<div class="loading-wrap"><div class="loader"></div><div class="loading-text">GENERATING</div></div>';
}

function renderEmpty() {
  document.getElementById('content-area').innerHTML =
    '<div class="empty-state"><div class="empty-icon">◈</div><div class="empty-text">スライダーを動かしてGENERATEを押してください</div></div>';
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg; el.style.display = 'block';
}
function hideError() {
  const el = document.getElementById('error-msg');
  if (el) el.style.display = 'none';
}

function renderPalettes() {
  if (!S.palettes.length) { renderEmpty(); return; }
  document.getElementById('content-area').innerHTML = `
    <div class="results-header">
      <span class="results-label">RESULT — ${S.palettes.length} PALETTES</span>
      <button class="regen-btn" onclick="generate()">別の候補 →</button>
    </div>
    <div class="palette-grid">${S.palettes.map((p,i) => cardHTML(p,i)).join('')}</div>`;
}

function cardHTML(p, idx) {
  if (!p?.colors?.length) return '';
  const bg = p.colors.find(c=>c.role==='background')?.hex || p.colors[0].hex;
  const tx = p.colors.find(c=>c.role==='text')?.hex || textOn(bg);
  const pt = p.colors.find(c=>c.role==='point'||c.role==='accent')?.hex || p.colors.at(-1).hex;
  const ratio = contrast(bg,tx);
  const g = grade(parseFloat(ratio));
  const stripes = p.colors.map(c=>`
    <div class="stripe" style="background:${c.hex}" onclick="copyStripe('${c.hex}',this)">
      <div class="stripe-badge">✓ ${c.hex}</div>
    </div>`).join('');
  const swatches = p.colors.map(c=>`
    <div class="ci">
      <div class="cswatch" style="background:${c.hex}" onclick="copySwatch('${c.hex}',this)">
        <div class="cswatch-badge">✓</div>
      </div>
      <div class="chex">${c.hex}</div>
      <div class="crole">${c.role}</div>
    </div>`).join('');
  const isSaved = S.savedPalettes.some(f=>f.name===p.name);
  return `
    <div class="pcard">
      <div class="pcard-stripes">${stripes}</div>
      <div class="pcard-body">
        <div class="pcard-head">
          <div><div class="pcard-name">${p.name}</div><div class="pcard-mood">${p.mood}</div></div>
          <button class="star-btn ${isSaved?'saved':''}" onclick="savePalette(${idx})">★</button>
        </div>
        <div class="color-row">${swatches}</div>
        <div class="contrast-row">
          <div class="contrast-badge" style="background:${g.c};color:white">${g.l}</div>
          <span style="font-size:10px;color:var(--text3)">コントラスト比 ${ratio}:1</span>
        </div>
      </div>
      <div class="mockup">
        <div class="mk-label">PREVIEW</div>
        <div class="mk-inner" style="background:${bg}">
          <div class="mk-heading" style="color:${tx}">見出しテキスト</div>
          <div class="mk-body" style="color:${tx}">本文テキストのサンプルです。</div>
          <div class="mk-btn" style="background:${pt};color:${textOn(pt)}">ボタン</div>
        </div>
      </div>
    </div>`;
}

function renderSaved() {
  const c = document.getElementById('content-area');
  if (!S.savedPalettes.length) {
    c.innerHTML = '<div class="fav-empty"><div class="fav-empty-icon">★</div><p class="hint" style="line-height:1.9">生成した配色の ★ をクリックして<br>保存できます。</p></div>';
    return;
  }
  c.innerHTML = `<div class="palette-grid">${S.savedPalettes.map((p,i)=>savedCardHTML(p,i)).join('')}</div>`;
}

function savedCardHTML(p, idx) {
  if (!p?.colors?.length) return '';
  const bg = p.colors.find(c=>c.role==='background')?.hex||p.colors[0].hex;
  const tx = p.colors.find(c=>c.role==='text')?.hex||textOn(bg);
  const pt = p.colors.find(c=>c.role==='point'||c.role==='accent')?.hex||p.colors.at(-1).hex;
  const stripes = p.colors.map(c=>`<div class="stripe" style="background:${c.hex}"></div>`).join('');
  const swatches = p.colors.map(c=>`
    <div class="ci">
      <div class="cswatch" style="background:${c.hex}" onclick="copySwatch('${c.hex}',this)"><div class="cswatch-badge">✓</div></div>
      <div class="chex">${c.hex}</div>
    </div>`).join('');
  return `
    <div class="pcard">
      <div class="pcard-stripes">${stripes}</div>
      <div class="pcard-body">
        <div class="pcard-head">
          <div><div class="pcard-name">${p.name}</div><div class="pcard-mood">${p.mood}</div></div>
          <button class="tbtn danger" onclick="deleteSaved(${idx})" style="font-size:9px;padding:3px 7px">削除</button>
        </div>
        <div class="color-row">${swatches}</div>
      </div>
      <div class="mockup">
        <div class="mk-label">PREVIEW</div>
        <div class="mk-inner" style="background:${bg}">
          <div class="mk-heading" style="color:${tx}">見出しテキスト</div>
          <div class="mk-body" style="color:${tx}">本文テキストサンプル</div>
          <div class="mk-btn" style="background:${pt};color:${textOn(pt)}">ボタン</div>
        </div>
      </div>
    </div>`;
}

function renderMyPalette() {
  const grid = document.getElementById('my-swatch-grid');
  if (!grid) return;
  if (!S.myPalette.length) {
    grid.innerHTML = '<span class="hint">まだ色がありません</span>';
  } else {
    grid.innerHTML = S.myPalette.map((c,i) => `
      <div class="sw-item" onclick="selectSwatch(${i})">
        <div class="sw-color ${S.selectedSwatchIdx===i?'selected':''}" style="background:${c.hex}"></div>
        <div class="sw-name">${c.name}</div>
      </div>`).join('');
  }
  const bar = document.getElementById('action-bar');
  if (!bar) return;
  const i = S.selectedSwatchIdx;
  if (i >= 0 && S.myPalette[i]) {
    const c = S.myPalette[i];
    bar.innerHTML = `
      <div style="width:20px;height:20px;background:${c.hex};border:1px solid var(--line);flex-shrink:0"></div>
      <span style="font-size:11px;color:var(--text2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.name}</span>
      <button class="tbtn" onclick="editSwatch()">編集</button>
      <button class="tbtn danger" onclick="deleteSwatch()">削除</button>
      <button class="tbtn" onclick="S.selectedSwatchIdx=-1;renderMyPalette()">✕</button>`;
  } else {
    bar.innerHTML = '<span class="hint">色をタップして選択 → 編集・削除</span>';
  }
}

function renderFixChips() {
  const wrap = document.getElementById('fix-chips');
  if (!wrap) return;
  if (!S.myPalette.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = S.myPalette.map(c => `
    <button class="fix-chip ${S.selectedFixColors.includes(c.hex)?'active':''}" onclick="toggleFixColor('${c.hex}')">
      <span class="dot" style="background:${c.hex};${S.selectedFixColors.includes(c.hex)?'outline:1px solid rgba(255,255,255,.5)':''}"></span>
      ${c.name}
    </button>`).join('');
}

// ══════════════════════════════════════════════
// ACTIONS
// ══════════════════════════════════════════════
function switchTab(tab) {
  ['generate','mypalette','saved'].forEach((t,i) => {
    document.querySelectorAll('.tab')[i].classList.toggle('active', t===tab);
    document.getElementById(`sb-${t}`).style.display = t===tab ? '' : 'none';
  });
  if (tab==='mypalette') { renderMyPalette(); renderEmpty(); }
  else if (tab==='saved') { loadSavedPalettes().then(()=>renderSaved()); }
  else renderEmpty();
}

function setCount(n) {
  S.count = n;
  document.querySelectorAll('.cbtn').forEach(b=>b.classList.remove('active'));
  document.getElementById(`count-${n}`)?.classList.add('active');
}

function toggleFixColor(hex) {
  S.selectedFixColors = S.selectedFixColors.includes(hex)
    ? S.selectedFixColors.filter(c=>c!==hex)
    : [...S.selectedFixColors, hex];
  renderFixChips();
}

function copyStripe(hex, el) {
  navigator.clipboard.writeText(hex).catch(()=>{});
  el.classList.add('copying');
  setTimeout(()=>el.classList.remove('copying'), 900);
}

function copySwatch(hex, el) {
  navigator.clipboard.writeText(hex).catch(()=>{});
  el.classList.add('copying');
  setTimeout(()=>el.classList.remove('copying'), 900);
}

async function savePalette(idx) {
  const p = S.palettes[idx];
  if (!p || S.savedPalettes.some(f=>f.name===p.name)) return;
  S.savedPalettes.unshift(p);
  await savePaletteToDb(p);
  renderPalettes();
}

async function deleteSaved(idx) {
  const p = S.savedPalettes[idx];
  if (!p) return;
  S.savedPalettes.splice(idx,1);
  if (p.dbId) await deletePaletteFromDb(p.dbId);
  renderSaved();
}

function selectSwatch(i) {
  S.selectedSwatchIdx = S.selectedSwatchIdx===i ? -1 : i;
  renderMyPalette();
}

async function editSwatch() {
  const i = S.selectedSwatchIdx;
  if (i < 0) return;
  const newName = prompt('新しい名前を入力', S.myPalette[i].name);
  if (newName === null) return;
  const name = newName.trim() || S.myPalette[i].hex;
  S.myPalette[i].name = name;
  await updateColorName(S.myPalette[i].id, name);
  S.selectedSwatchIdx = -1;
  renderMyPalette();
  renderFixChips();
}

async function deleteSwatch() {
  const i = S.selectedSwatchIdx;
  if (i < 0) return;
  const id = S.myPalette[i].id;
  S.myPalette.splice(i,1);
  S.selectedFixColors = S.selectedFixColors.filter(h => S.myPalette.some(c=>c.hex===h));
  await deleteColorFromDb(id);
  S.selectedSwatchIdx = -1;
  renderMyPalette();
  renderFixChips();
}

function syncPicker() {
  const v = document.getElementById('picker-color').value;
  document.getElementById('hex-input').value = v;
}
function syncHex() {
  const v = document.getElementById('hex-input').value;
  if (isHex(v)) document.getElementById('picker-color').value = v;
}

async function addColor() {
  const hex = (document.getElementById('hex-input').value || '').trim();
  const name = (document.getElementById('name-input').value || '').trim();
  if (!isHex(hex)) return;
  const color = { id: uid(), hex, name: name || hex };
  S.myPalette.push(color);
  await saveColorToDb(color);
  document.getElementById('hex-input').value = '';
  document.getElementById('name-input').value = '';
  renderMyPalette();
  renderFixChips();
}

// ══════════════════════════════════════════════
// IMAGE COLOR PICKER
// ══════════════════════════════════════════════
let _pickerCtx = null;

function openPickerModal(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = document.getElementById('picker-img');
    img.src = ev.target.result;
    img.onload = () => {
      const offscreen = document.createElement('canvas');
      offscreen.width = img.naturalWidth;
      offscreen.height = img.naturalHeight;
      _pickerCtx = offscreen.getContext('2d');
      _pickerCtx.drawImage(img, 0, 0);
      document.getElementById('picker-modal').classList.add('open');
      document.getElementById('picked-hex').textContent = '画像をスライドして色をピック';
      document.getElementById('picked-swatch').style.background = '';
      S.pickedHex = '';
    };
  };
  reader.readAsDataURL(file);
}

function closePickerModal() {
  document.getElementById('picker-modal').classList.remove('open');
  document.getElementById('lupe').style.display = 'none';
  // inputをリセット（同じファイルを再選択できるように）
  const inputs = document.querySelectorAll('input[type=file]');
  inputs.forEach(i => i.value = '');
}

async function addPickedColor() {
  if (!S.pickedHex) return;
  const color = { id: uid(), hex: S.pickedHex, name: S.pickedHex };
  if (!S.myPalette.some(c=>c.hex===S.pickedHex)) {
    S.myPalette.push(color);
    await saveColorToDb(color);
    renderMyPalette();
    renderFixChips();
  }
  closePickerModal();
}

function getImgCoords(e, imgEl) {
  const rect = imgEl.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    ix: Math.max(0, Math.min(imgEl.naturalWidth-1,  Math.floor((clientX-rect.left) * imgEl.naturalWidth  / rect.width))),
    iy: Math.max(0, Math.min(imgEl.naturalHeight-1, Math.floor((clientY-rect.top)  * imgEl.naturalHeight / rect.height))),
    cx: clientX - rect.left,
    cy: clientY - rect.top,
  };
}

function doPickColor(e) {
  e.preventDefault();
  if (!_pickerCtx) return;
  const img = document.getElementById('picker-img');
  const { ix, iy, cx, cy } = getImgCoords(e, img);

  // 3×3平均色
  let r=0,g=0,b=0,n=0;
  for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) {
    const px = _pickerCtx.getImageData(Math.max(0,ix+dx), Math.max(0,iy+dy), 1, 1).data;
    r+=px[0]; g+=px[1]; b+=px[2]; n++;
  }
  r=Math.round(r/n); g=Math.round(g/n); b=Math.round(b/n);
  const hex = '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
  S.pickedHex = hex;
  document.getElementById('picked-swatch').style.background = hex;
  document.getElementById('picked-hex').textContent = hex;

  // ルーペ
  updateLupe(cx, cy, ix, iy, img);
}

function updateLupe(cx, cy, ix, iy, imgEl) {
  const lupe = document.getElementById('lupe');
  const lupeCanvas = document.getElementById('lupe-canvas');
  const lupeCtx = lupeCanvas.getContext('2d');
  const D = 88; const AREA = 16;

  const wrap = document.getElementById('picker-img-wrap');
  const wRect = wrap.getBoundingClientRect();
  const iRect = imgEl.getBoundingClientRect();
  const relX = cx + (iRect.left - wRect.left);
  const relY = cy + (iRect.top - wRect.top);
  let lx = relX + 18, ly = relY - D - 18;
  if (lx + D > wRect.width) lx = relX - D - 18;
  if (ly < 0) ly = relY + 18;
  lupe.style.left = lx+'px'; lupe.style.top = ly+'px'; lupe.style.display='block';

  lupeCtx.clearRect(0,0,D,D);
  lupeCtx.save();
  lupeCtx.beginPath(); lupeCtx.arc(D/2,D/2,D/2,0,Math.PI*2); lupeCtx.clip();
  lupeCtx.imageSmoothingEnabled = false;
  lupeCtx.drawImage(_pickerCtx.canvas,
    Math.max(0, ix-AREA/2), Math.max(0, iy-AREA/2), AREA, AREA,
    0, 0, D, D);
  lupeCtx.restore();
}

// イベント登録
document.addEventListener('DOMContentLoaded', () => {
  const wrap = document.getElementById('picker-img-wrap');
  wrap.addEventListener('mousemove', doPickColor, { passive: false });
  wrap.addEventListener('touchmove', doPickColor, { passive: false });
  wrap.addEventListener('touchstart', doPickColor, { passive: false });
  wrap.addEventListener('click', doPickColor, { passive: false });
  wrap.addEventListener('mouseleave', () => {
    document.getElementById('lupe').style.display = 'none';
  });
});

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
loadApiKey();
loadMyPalette();
updateSliderLabel();
