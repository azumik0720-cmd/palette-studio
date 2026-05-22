// ══════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
const S = {
  apiKey: '',
  count: 3,
  currentSubTab: 'image',
  palettes: [],
  fixedColors: [],
  savedPalettes: [],
  history: [],
  myPalette: [],
  selectedSwatchIdx: -1,
  pickedHex: '',
  generateImageBase64: null,
  selectedMyColors: [],
  themeColorFixed: false,
};

// ══════════════════════════════════════════════
// TAG DATA
// ══════════════════════════════════════════════
const WORD_TAGS = {
  '場所・空間': ['ホテル','野外フェス','海外の市場','植物園','美術館','アトリエ','古書店','フラワーマーケット','ギャラリー','アーケード'],
  '時代・カルチャー': ['レトロ','70年代','80年代','90年代','シティポップ','ヴィンテージ','アンティーク','ローファイ','フィルムカメラ','喫茶店'],
  'ライフスタイル': ['ミニマル','ナチュラル','ストリート','オーガニック','アウトドア','クリーンガール','スキンケアビューティ','デジタルミニマル','スローライフ','サステナブル'],
  '食・香り・質感': ['コーヒー','チョコレート','フルーツ','シトラス','バニラ','キャラメル','ハーブティー','スパイス','焼き菓子','発酵'],
  '感情・トーン': ['落ち着いた','儚い','優しい','クール','無機質','温かみ','ノスタルジック','メランコリック','エアリー','ノーブル'],
  'カラー印象': ['くすみ','クリーン','パステル','スモーキー','テラコッタ','オリーブ','バーガンディ','ニュアンスカラー','アーシー','モノトーン'],
  '国・地域': ['フランス','イタリア','モロッコ','韓国','アメリカ西海岸','北欧','京都','ポルトガル','ギリシャ','メキシコ'],
  'インテリア': ['ジャパンディ','インダストリアル','フレンチシック','クラシカル','モダンラグジュアリー','ミッドセンチュリー','テラコッタインテリア','ナチュラルモダン','ワビサビ','アーバンジャングル'],
  'ファッション・エディトリアル': ['エディトリアル','ハイファッション','カルチャー','アート系','ビューティ','プレミアム感','透明感','柔らかさ','力強さ','信頼感','親しみやすさ','先進性'],
  'アート・デザイン': ['バウハウス','ポップアート','水彩','モノクロ','コラージュ','イラスト','グラフィック','和モダン','アールデコ','ストリートアート'],
  '自然・季節': ['春','夏','秋','冬','夕焼け','朝','夜','森','海','砂漠','雪','草原','滝','湖','山','花畑','紅葉','新緑','朝靄','星空'],
};

const COLOR_TAGS = {
  '暖色系': ['レッド','ピンク','オレンジ','イエロー','コーラル','テラコッタ','バーガンディ'],
  '寒色系': ['ブルー','ネイビー','スカイブルー','ターコイズ','パープル','ラベンダー'],
  '中間・自然系': ['グリーン','オリーブ','カーキ','ブラウン','ベージュ','キャメル'],
  '無彩色・ニュアンス系': ['ホワイト','グレー','ブラック','オフホワイト','グレージュ','チャコール'],
  '印象・トーン系': ['パステル','くすみ','ビビッド','ダーク','スモーキー','ニュアンス'],
};

const BRAND_TAGS = {
  'カフェ・パティスリー': ['スターバックス','ブルーボトルコーヒー','ラデュレ','ピエールエルメ','ポール','アンジェリーナ'],
  'ファッション（マス）': ['ZARA','H&M','UNIQLO','COS','Mango','Massimo Dutti','ARKET'],
  'ファッション（ラグジュアリー）': ['シャネル','ルイヴィトン','エルメス','セリーヌ','ボッテガヴェネタ','バレンシアガ','グッチ','プラダ','ロエベ','ジルサンダー','マルジェラ','フェンディ','ディオール','Acne Studios','クロエ'],
  'ファッション（ストリート）': ['Supreme','Nike','New Balance','Carhartt','Stussy','Aime Leon Dore'],
  'セレクトショップ': ['BEAMS','ロンハーマン','United Arrows','Ships'],
  'コスメ・ビューティ': ['NARS','MAC','イソップ','Glossier','THREE','Charlotte Tilbury','Tatcha'],
  'インテリア・生活雑貨': ['IKEA','HAY','Cassina','フランフラン','actus','Herman Miller','Artek','MARUNI','Muuto','Fritz Hansen','Vitra'],
  'アウトドア': ['Patagonia','Arc\'teryx','Snow Peak'],
  '日本ブランド': ['ジェラートピケ','snidel','BEAMS','Auralee','Comoli'],
  '雑誌': ['Kinfolk','Numero','Monocle','Cereal','Wallpaper'],
  'ホテル': ['Ace Hotel','Soho House','The Standard','Hoxton'],
  'キャラクター・IP': ['サンリオ','ジブリ','ディズニー','ミッフィー','Snoopy','KAWS','ムーミン'],
};

// ══════════════════════════════════════════════
// SUPABASE
// ══════════════════════════════════════════════
async function sbFetch(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
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
    S.myPalette = JSON.parse(localStorage.getItem('my_palette') || '[]');
  }
  renderMyPalette();
  renderMyColorGrid();
}

async function saveColorToDb(color) {
  try { await sbFetch('/rest/v1/my_colors', 'POST', color); }
  catch(e) { const a = JSON.parse(localStorage.getItem('my_palette')||'[]'); a.push(color); localStorage.setItem('my_palette', JSON.stringify(a)); }
}

async function deleteColorFromDb(id) {
  try { await sbFetch(`/rest/v1/my_colors?id=eq.${id}`, 'DELETE'); }
  catch(e) { const a = JSON.parse(localStorage.getItem('my_palette')||'[]'); localStorage.setItem('my_palette', JSON.stringify(a.filter(c=>c.id!==id))); }
}

async function updateColorName(id, name) {
  try { await sbFetch(`/rest/v1/my_colors?id=eq.${id}`, 'PATCH', { name }); }
  catch(e) { const a = JSON.parse(localStorage.getItem('my_palette')||'[]'); const c=a.find(c=>c.id===id); if(c) c.name=name; localStorage.setItem('my_palette', JSON.stringify(a)); }
}

async function loadSavedPalettes() {
  try {
    const data = await sbFetch('/rest/v1/saved_palettes?order=created_at.desc');
    S.savedPalettes = (data||[]).map(r=>({...JSON.parse(r.data), dbId: r.id}));
  } catch(e) {
    S.savedPalettes = JSON.parse(localStorage.getItem('saved_palettes')||'[]');
  }
}

async function savePaletteToDb(palette) {
  try { await sbFetch('/rest/v1/saved_palettes', 'POST', { data: JSON.stringify(palette) }); }
  catch(e) { const a = JSON.parse(localStorage.getItem('saved_palettes')||'[]'); a.unshift(palette); localStorage.setItem('saved_palettes', JSON.stringify(a)); }
}

async function deletePaletteFromDb(dbId) {
  try { await sbFetch(`/rest/v1/saved_palettes?id=eq.${dbId}`, 'DELETE'); }
  catch(e) {}
}

// ══════════════════════════════════════════════
// API KEY
// ══════════════════════════════════════════════
function saveApiKey() {
  const v = document.getElementById('api-key-input').value.trim();
  if (!v.startsWith('gsk_')) { setStatus('❌ GroqのAPIキーは gsk_ から始まります', 'var(--red)'); return; }
  S.apiKey = v;
  localStorage.setItem('ps_groq_key', v);
  setStatus('✓ 保存済み', '#27ae60');
  document.getElementById('api-key-input').value = '••••••••••••' + v.slice(-4);
}

function loadApiKey() {
  const k = localStorage.getItem('ps_groq_key');
  if (k) { S.apiKey = k; document.getElementById('api-key-input').value = '••••••••••••' + k.slice(-4); setStatus('✓ 保存済み', '#27ae60'); }
}

function setStatus(msg, color) {
  const el = document.getElementById('api-status');
  el.textContent = msg; el.style.color = color;
}

// ══════════════════════════════════════════════
// GROQ API
// ══════════════════════════════════════════════
async function callGroq(prompt) {
  if (!S.apiKey) throw new Error('APIキーを入力して保存してください');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${S.apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 2000
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error('Groq API エラー: ' + res.status + ' — ' + t.slice(0, 120));
  }
  const data = await res.json();
  const text = (data.choices?.[0]?.message?.content || '').trim();
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
// TABS
// ══════════════════════════════════════════════
function switchMainTab(tab) {
  ['generate','mypalette','saved','history'].forEach((t,i) => {
    document.querySelectorAll('.main-tab')[i].classList.toggle('active', t===tab);
    document.getElementById(`tab-${t}`).style.display = t===tab ? '' : 'none';
  });
  if (tab==='mypalette') renderMyPalette();
  else if (tab==='saved') loadSavedPalettes().then(()=>renderSaved());
  else if (tab==='history') renderHistory();
}

function switchSubTab(tab) {
  S.currentSubTab = tab;
  ['image','word','color','brand','mycolor'].forEach(t => {
    document.getElementById(`sub-${t}`).style.display = t===tab ? '' : 'none';
  });
  document.querySelectorAll('.sub-tab').forEach((el, i) => {
    el.classList.toggle('active', ['image','word','color','brand','mycolor'][i]===tab);
  });
  if (tab==='mycolor') renderMyColorGrid();
}

function setCount(n) {
  S.count = n;
  document.querySelectorAll('.cbtn').forEach(b=>b.classList.remove('active'));
  document.getElementById(`count-${n}`)?.classList.add('active');
}

// ══════════════════════════════════════════════
// TAG RENDERING
// ══════════════════════════════════════════════
const selectedWordTags = new Set();
const selectedColorTags = new Set();
const selectedBrandTags = new Set();
const selectedTrendTags = new Set();

function renderTagCategories(containerId, tagData, selectedSet) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = Object.entries(tagData).map(([cat, tags]) => `
    <div class="tag-category">
      <div class="tag-category-header" onclick="toggleCategory(this)">
        <span class="tag-category-name">${cat}</span>
        <span class="tag-category-arrow">▼</span>
      </div>
      <div class="tag-list">
        ${tags.map(tag => `
          <button class="tag ${selectedSet.has(tag)?'active':''}" onclick="toggleTag(this,'${containerId}','${tag.replace(/'/g,'')}')">${tag}</button>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function toggleCategory(header) {
  header.parentElement.classList.toggle('open');
}

function toggleTag(el, containerId, tag) {
  el.classList.toggle('active');
  const sets = { 'word-tags': selectedWordTags, 'color-tags': selectedColorTags, 'brand-tags': selectedBrandTags };
  const s = sets[containerId];
  if (!s) return;
  if (el.classList.contains('active')) s.add(tag);
  else s.delete(tag);
}

function toggleTrendTag(el, tag) {
  el.classList.toggle('active');
  if (el.classList.contains('active')) selectedTrendTags.add(tag);
  else selectedTrendTags.delete(tag);
}

// ══════════════════════════════════════════════
// TREND GENERATION
// ══════════════════════════════════════════════
async function generateTrends() {
  const btn = document.querySelector('.trend-btn');
  btn.textContent = '生成中...';
  btn.disabled = true;
  try {
    const prompt = `You are a trend analyst. Generate 10 trending aesthetic/mood keywords popular on Pinterest and Instagram in 2025-2026.
Return ONLY valid JSON, no markdown:
{"trends":["ワード1","ワード2","ワード3","ワード4","ワード5","ワード6","ワード7","ワード8","ワード9","ワード10"]}
Use Japanese keywords trendy for design, fashion, and lifestyle.`;
    const r = await callGroq(prompt);
    const trends = r.trends || [];
    const wrap = document.getElementById('trend-tags');
    selectedTrendTags.clear();
    wrap.innerHTML = trends.map(t => `
      <button class="tag" onclick="toggleTrendTag(this,'${t}')">${t}</button>
    `).join('');
  } catch(e) {
    showError('トレンド生成に失敗しました: ' + e.message);
  }
  btn.textContent = '✦ トレンドワードを生成';
  btn.disabled = false;
}

// ══════════════════════════════════════════════
// IMAGE HANDLING
// ══════════════════════════════════════════════
function handleGenerateImage(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    S.generateImageBase64 = ev.target.result;
    document.getElementById('img-upload-area').style.display = 'none';
    const preview = document.getElementById('img-preview-wrap');
    preview.style.display = 'block';
    document.getElementById('img-preview').src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function removeGenerateImage() {
  S.generateImageBase64 = null;
  document.getElementById('img-upload-area').style.display = 'block';
  document.getElementById('img-preview-wrap').style.display = 'none';
  document.getElementById('img-preview').src = '';
}

function extractColorsFromImage(base64) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 100;
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      const colors = [];
      const step = 400;
      for (let i = 0; i < data.length; i += step) {
        const r = data[i], g = data[i+1], b = data[i+2];
        colors.push('#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join(''));
      }
      resolve([...new Set(colors)].slice(0, 12));
    };
    img.src = base64;
  });
}

// ══════════════════════════════════════════════
// COLOR THEME PICKER
// ══════════════════════════════════════════════
function syncThemePicker() {
  const v = document.getElementById('theme-picker').value;
  document.getElementById('theme-hex').value = v;
  S.themeColorFixed = true;
}
function syncThemeHex() {
  const v = document.getElementById('theme-hex').value;
  if (isHex(v)) { document.getElementById('theme-picker').value = v; S.themeColorFixed = true; }
}
function clearThemeColor() {
  document.getElementById('theme-hex').value = '';
  S.themeColorFixed = false;
}

// ══════════════════════════════════════════════
// MY COLOR GRID
// ══════════════════════════════════════════════
function renderMyColorGrid() {
  const grid = document.getElementById('mycolor-grid');
  if (!grid) return;
  if (!S.myPalette.length) {
    grid.innerHTML = '<span class="hint">My Paletteに色を登録してください</span>';
    return;
  }
  grid.innerHTML = S.myPalette.map((c, i) => {
    const sel = S.selectedMyColors.find(s => s.hex === c.hex);
    return `
      <div class="mycolor-item" onclick="toggleMyColor(${i})">
        <div class="mycolor-swatch ${sel?'selected':''}" style="background:${c.hex}">
          ${sel && sel.role ? `<span class="role-badge">${sel.role.slice(0,2)}</span>` : ''}
        </div>
        <div class="mycolor-name">${c.name}</div>
      </div>`;
  }).join('');
  renderMyColorRoleSelect();
}

function toggleMyColor(i) {
  const c = S.myPalette[i];
  const idx = S.selectedMyColors.findIndex(s => s.hex === c.hex);
  if (idx >= 0) S.selectedMyColors.splice(idx, 1);
  else S.selectedMyColors.push({ hex: c.hex, name: c.name, role: null });
  renderMyColorGrid();
}

function renderMyColorRoleSelect() {
  const wrap = document.getElementById('mycolor-role-wrap');
  const select = document.getElementById('mycolor-role-select');
  if (!wrap || !select) return;
  if (!S.selectedMyColors.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  const roles = ['background', 'text', 'point', 'accent'];
  select.innerHTML = S.selectedMyColors.map((c, i) => `
    <div style="margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        <div style="width:16px;height:16px;background:${c.hex};border-radius:2px;flex-shrink:0"></div>
        <span style="font-size:10px;color:var(--text2)">${c.name}</span>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        ${roles.map(r => `
          <button class="role-btn ${c.role===r?'active':''}" onclick="setMyColorRole(${i},'${r}')">${r}</button>
        `).join('')}
        <button class="role-btn ${!c.role?'active':''}" onclick="setMyColorRole(${i},null)">任意</button>
      </div>
    </div>
  `).join('');
}

function setMyColorRole(i, role) {
  S.selectedMyColors[i].role = role;
  renderMyColorGrid();
}

// ══════════════════════════════════════════════
// BUILD PROMPT
// ══════════════════════════════════════════════
function getRolesByCount(count) {
  if (count === 2) return ['background', 'text'];
  if (count === 3) return ['background', 'text', 'point'];
  return ['background', 'text', 'point', 'accent'];
}

async function buildPrompt() {
  const roles = getRolesByCount(S.count);
  const fixedPart = S.fixedColors.length
    ? `Fixed colors (must include): ${S.fixedColors.map(f=>`${f.hex}${f.role?` as ${f.role}`:''}`).join(', ')}.` : '';

  let inputDesc = '';

  if (S.currentSubTab === 'image' && S.generateImageBase64) {
    const extracted = await extractColorsFromImage(S.generateImageBase64);
    const memo = document.getElementById('image-memo').value.trim();
    inputDesc = `The user uploaded an image. Extracted dominant colors: ${extracted.join(', ')}. Use these as inspiration to create harmonious palettes matching the image's mood.${memo ? ` Additional note: ${memo}` : ''}`;
  } else if (S.currentSubTab === 'word') {
    const tags = [...selectedWordTags, ...selectedTrendTags];
    const free = document.getElementById('word-free').value.trim();
    const words = [...tags, free].filter(Boolean).join(', ');
    inputDesc = `Theme: ${words}.
Think deeply about the specific visual and emotional qualities of these words — the textures, materials, lighting, and atmosphere they evoke.
Examples: フランス → dusty stone walls, café au lait, faded terracotta, sage green shutters, aged parchment.
北欧 → birch white, slate grey, forest green, midnight blue, raw linen.
Do NOT create generic palettes. Translate the true essence into specific, evocative color values.`;
  } else if (S.currentSubTab === 'color') {
    const tags = [...selectedColorTags];
    const free = document.getElementById('color-free').value.trim();
    const fixedHex = S.themeColorFixed ? document.getElementById('theme-hex').value.trim() : '';
    inputDesc = `Color theme: ${[...tags, free].filter(Boolean).join(', ')}.${fixedHex ? ` Must incorporate: ${fixedHex}.` : ''}`;
  } else if (S.currentSubTab === 'brand') {
    const tags = [...selectedBrandTags];
    const free = document.getElementById('brand-free').value.trim();
    const brands = [...tags, free].filter(Boolean).join(', ');
    inputDesc = `Brand inspiration: ${brands}.
Deeply evoke each brand's actual color DNA — their specific palette, tone, and visual language.
Examples: エルメス → warm burnt orange, natural saddle leather, cream, deep chocolate.
Kinfolk → warm off-white, dusty sage, muted terracotta, linen beige.
スターバックス → deep forest green, warm cream, earthy brown.
Do NOT create generic palettes. Capture the brand's true visual identity.`;
  } else if (S.currentSubTab === 'mycolor') {
    const free = document.getElementById('mycolor-free').value.trim();
    const colorDesc = S.selectedMyColors.map(c => `${c.hex}${c.role ? ` as ${c.role}` : ''}`).join(', ');
    inputDesc = `Must use these colors: ${colorDesc}. Fill remaining ${S.count - S.selectedMyColors.length} color(s) harmoniously.${free ? ` Note: ${free}` : ''}`;
  } else {
    inputDesc = 'Create a beautiful, harmonious palette.';
  }

  return `You are a professional color designer. Generate 3 beautiful color palette combinations.

Input: ${inputDesc}
${fixedPart}

Requirements:
- Each palette has exactly ${S.count} colors with roles: ${roles.join(', ')}
- The 3 palettes must have clearly different approaches
- Background and text colors must have contrast ratio of at least 4.5
- name: short poetic 2-4 character Japanese name (e.g. 夕凪、霧雨、黎明)
- mood: one evocative Japanese sentence

Return ONLY valid JSON, no markdown. Example structure for ${S.count} colors:
${JSON.stringify({palettes:[{name:"夕凪",mood:"穏やかな夕暮れのような温もり",colors:roles.map((r,i)=>({hex:["#F2EDE8","#2C2825","#C1674A","#8B9E8A"].slice(0,roles.length)[i],role:r}))}]})}`;
}

// ══════════════════════════════════════════════
// GENERATE
// ══════════════════════════════════════════════
async function generate() {
  if (!S.apiKey) { showError('GroqのAPIキーを入力して保存してください'); return; }
  hideError();
  renderLoading();
  try {
    const prompt = await buildPrompt();
    const r = await callGroq(prompt);
    S.palettes = r.palettes || [];
    if (!S.palettes.length) throw new Error('パレットデータが空です');
    addToHistory(S.palettes);
    renderPalettes();
  } catch(e) {
    showError(e.message);
    renderEmpty();
  }
}

async function generateToday() {
  if (!S.apiKey) { showError('GroqのAPIキーを入力して保存してください'); return; }
  hideError();
  renderLoading();
  try {
    const prompt = `You are a professional color designer. Generate 3 beautiful random color palettes for today. Each should have a different mood.
Number of colors per palette: 3. Roles: background, text, point.
Background and text must have contrast ratio of at least 4.5.
name: short poetic 2-4 character Japanese name. mood: one evocative Japanese sentence.
Return ONLY valid JSON, no markdown:
{"palettes":[{"name":"夕凪","mood":"穏やかな夕暮れ","colors":[{"hex":"#F2EDE8","role":"background"},{"hex":"#2C2825","role":"text"},{"hex":"#C1674A","role":"point"}]}]}`;
    const r = await callGroq(prompt);
    S.palettes = r.palettes || [];
    if (!S.palettes.length) throw new Error('パレットデータが空です');
    addToHistory(S.palettes);
    renderPalettes();
  } catch(e) {
    showError(e.message);
    renderEmpty();
  }
}

// ══════════════════════════════════════════════
// FIX COLORS
// ══════════════════════════════════════════════
function toggleFixColor(paletteIdx, colorHex, role) {
  const exists = S.fixedColors.findIndex(f => f.hex === colorHex);
  if (exists >= 0) S.fixedColors.splice(exists, 1);
  else S.fixedColors.push({ hex: colorHex, role });
  renderPalettes();
}

// ══════════════════════════════════════════════
// HISTORY
// ══════════════════════════════════════════════
function addToHistory(palettes) {
  S.history.unshift({ palettes, timestamp: Date.now(), tab: S.currentSubTab });
  if (S.history.length > 50) S.history.pop();
  localStorage.setItem('ps_history', JSON.stringify(S.history));
}

function loadHistory() {
  S.history = JSON.parse(localStorage.getItem('ps_history') || '[]');
}

function renderHistory() {
  const content = document.getElementById('content-area');
  if (!S.history.length) {
    content.innerHTML = '<div class="empty-state"><div class="empty-icon">◈</div><div class="empty-text">まだ生成履歴がありません</div></div>';
    return;
  }
  const list = S.history.map((entry, i) => {
    const p = entry.palettes[0];
    if (!p) return '';
    const stripes = p.colors.map(c => `<div class="history-stripe" style="background:${c.hex}"></div>`).join('');
    const date = new Date(entry.timestamp).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="history-item" onclick="restoreHistory(${i})">
        <div class="history-stripes">${stripes}</div>
        <div class="history-info">
          <div class="history-name">${p.name}</div>
          <div class="history-meta">${date} · ${entry.palettes.length}パレット</div>
        </div>
        <div class="history-restore">復元 →</div>
      </div>`;
  }).join('');
  content.innerHTML = `
    <div class="results-header">
      <span class="results-label">History — ${S.history.length} 件</span>
      <button class="btn-ghost" onclick="clearHistory()">すべて削除</button>
    </div>
    <div class="history-list">${list}</div>`;
}

function restoreHistory(i) {
  S.palettes = S.history[i].palettes;
  switchMainTab('generate');
  renderPalettes();
}

function clearHistory() {
  S.history = [];
  localStorage.removeItem('ps_history');
  renderHistory();
}

// ══════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════
function renderLoading() {
  document.getElementById('content-area').innerHTML =
    '<div class="loading-wrap"><div class="loader"></div><div class="loading-text">Generating</div></div>';
}

function renderEmpty() {
  document.getElementById('content-area').innerHTML =
    '<div class="empty-state"><div class="empty-icon">◈</div><div class="empty-text">入口を選んで<br>Generateを押してください</div></div>';
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function hideError() {
  const el = document.getElementById('error-msg');
  if (el) el.style.display = 'none';
}

function renderPalettes() {
  if (!S.palettes.length) { renderEmpty(); return; }
  const hasFixed = S.fixedColors.length > 0;
  document.getElementById('content-area').innerHTML = `
    <div class="results-header">
      <span class="results-label">Result — ${S.palettes.length} Palettes${hasFixed ? ` · ${S.fixedColors.length}色固定中` : ''}</span>
      <div style="display:flex;gap:8px">
        ${hasFixed ? `<button class="btn-ghost" onclick="S.fixedColors=[];renderPalettes()">固定解除</button>` : ''}
        <button class="btn-ghost" onclick="generate()">再生成 →</button>
      </div>
    </div>
    <div class="palette-grid">${S.palettes.map((p,i) => cardHTML(p,i)).join('')}</div>`;
}

function cardHTML(p, idx) {
  if (!p?.colors?.length) return '';
  const bg = p.colors.find(c=>c.role==='background')?.hex || p.colors[0].hex;
  const tx = p.colors.find(c=>c.role==='text')?.hex || textOn(bg);
  const pt = p.colors.find(c=>c.role==='point'||c.role==='accent')?.hex || p.colors.at(-1).hex;
  const ratio = contrast(bg, tx);
  const g = grade(parseFloat(ratio));
  const isSaved = S.savedPalettes.some(f => f.name === p.name);

  const stripes = p.colors.map(c => `
    <div class="stripe" style="background:${c.hex}" onclick="copyStripe('${c.hex}',this)">
      <div class="stripe-badge">✓ ${c.hex}</div>
    </div>`).join('');

  const swatches = p.colors.map(c => {
    const isFixed = S.fixedColors.some(f => f.hex === c.hex);
    return `
    <div class="ci">
      <div class="cswatch ${isFixed?'fixed':''}" style="background:${c.hex}" onclick="copySwatch('${c.hex}',this)">
        <div class="cswatch-badge">✓</div>
      </div>
      <div class="chex">${c.hex}</div>
      <div class="crole">${c.role}</div>
      <button class="fix-toggle ${isFixed?'active':''}" onclick="toggleFixColor(${idx},'${c.hex}','${c.role}')">
        ${isFixed ? '🔒固定中' : '固定'}
      </button>
    </div>`;
  }).join('');

  return `
    <div class="pcard">
      <div class="pcard-stripes">${stripes}</div>
      <div class="pcard-body">
        <div class="pcard-head">
          <div>
            <div class="pcard-name">${p.name}</div>
            <div class="pcard-mood">${p.mood}</div>
          </div>
          <div class="pcard-actions">
            <button class="star-btn ${isSaved?'saved':''}" onclick="savePalette(${idx})">★</button>
          </div>
        </div>
        <div class="color-row">${swatches}</div>
        <div class="contrast-row">
          <div class="contrast-badge" style="background:${g.c};color:white">${g.l}</div>
          <span style="font-size:10px;color:var(--text3)">コントラスト比 ${ratio}:1</span>
        </div>
      </div>
      <div class="pcard-footer">
        <button class="export-btn" onclick="showCssModal(${idx})">CSS</button>
        <button class="export-btn" onclick="exportImage(${idx})">画像保存</button>
        <button class="export-btn" onclick="addToMyPaletteFromCard(${idx})">マイパレット追加</button>
      </div>
      <div class="mockup">
        <div class="mk-label">Preview</div>
        <div class="mk-inner" style="background:${bg}">
          <div class="mk-heading" style="color:${tx}">見出しテキスト</div>
          <div class="mk-body" style="color:${tx}">本文テキストのサンプルです。</div>
          <div class="mk-btn" style="background:${pt};color:${textOn(pt)}">ボタン</div>
        </div>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════
// SAVED
// ══════════════════════════════════════════════
function renderSaved() {
  const content = document.getElementById('content-area');
  if (!S.savedPalettes.length) {
    content.innerHTML = '<div class="fav-empty"><div class="fav-empty-icon">★</div><p class="hint" style="line-height:1.9">生成した配色の ★ をクリックして<br>保存できます。</p></div>';
    return;
  }
  const gallery = S.savedPalettes.map((p, i) => {
    const stripes = p.colors.map(c => `<div class="saved-thumb-stripe" style="background:${c.hex}"></div>`).join('');
    return `
      <div class="saved-thumb" onclick="expandSaved(${i})">
        <div class="saved-thumb-stripes">${stripes}</div>
        <div class="saved-thumb-body">
          <div class="saved-thumb-name">${p.name}</div>
          <div class="saved-thumb-mood">${p.mood}</div>
        </div>
      </div>`;
  }).join('');
  content.innerHTML = `
    <div class="results-header">
      <span class="results-label">Saved — ${S.savedPalettes.length} Palettes</span>
    </div>
    <div class="saved-gallery">${gallery}</div>`;
}

function expandSaved(idx) {
  S.palettes = [S.savedPalettes[idx]];
  switchMainTab('generate');
  renderPalettes();
}

async function savePalette(idx) {
  const p = S.palettes[idx];
  if (!p || S.savedPalettes.some(f => f.name === p.name)) return;
  S.savedPalettes.unshift(p);
  await savePaletteToDb(p);
  renderPalettes();
}

// ══════════════════════════════════════════════
// CSS EXPORT
// ══════════════════════════════════════════════
function showCssModal(idx) {
  const p = S.palettes[idx];
  if (!p) return;
  const css = `:root {\n${p.colors.map(c => `  --color-${c.role}: ${c.hex};`).join('\n')}\n}`;
  document.getElementById('css-code').textContent = css;
  document.getElementById('css-modal').classList.add('open');
}

function closeCssModal() {
  document.getElementById('css-modal').classList.remove('open');
}

function copyCssCode() {
  const text = document.getElementById('css-code').textContent;
  navigator.clipboard.writeText(text).catch(()=>{});
  const btn = document.querySelector('.css-modal-footer .btn-ghost');
  const orig = btn.textContent;
  btn.textContent = 'コピー済み ✓';
  setTimeout(() => btn.textContent = orig, 1500);
}

// ══════════════════════════════════════════════
// IMAGE EXPORT
// ══════════════════════════════════════════════
function exportImage(idx) {
  const p = S.palettes[idx];
  if (!p) return;
  const canvas = document.createElement('canvas');
  canvas.width = 800; canvas.height = 200;
  const ctx = canvas.getContext('2d');
  const w = canvas.width / p.colors.length;
  p.colors.forEach((c, i) => {
    ctx.fillStyle = c.hex;
    ctx.fillRect(i * w, 0, w, 160);
    ctx.fillStyle = textOn(c.hex);
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(c.hex, i * w + w / 2, 140);
    ctx.font = '10px monospace';
    ctx.fillText(c.role, i * w + w / 2, 155);
  });
  ctx.fillStyle = '#F5F3EF';
  ctx.fillRect(0, 160, canvas.width, 40);
  ctx.fillStyle = '#1A1816';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(p.name + ' — ' + p.mood, 16, 184);
  const a = document.createElement('a');
  a.download = `palette-${p.name}.png`;
  a.href = canvas.toDataURL();
  a.click();
}

// ══════════════════════════════════════════════
// ADD TO MY PALETTE FROM CARD
// ══════════════════════════════════════════════
async function addToMyPaletteFromCard(idx) {
  const p = S.palettes[idx];
  if (!p) return;
  let added = 0;
  for (const c of p.colors) {
    if (!S.myPalette.some(m => m.hex === c.hex)) {
      const color = { id: uid(), hex: c.hex, name: c.role };
      S.myPalette.push(color);
      await saveColorToDb(color);
      added++;
    }
  }
  alert(`「${p.name}」から${added}色をマイパレットに追加しました`);
}

// ══════════════════════════════════════════════
// COPY
// ══════════════════════════════════════════════
function copyStripe(hex, el) {
  navigator.clipboard.writeText(hex).catch(()=>{});
  el.classList.add('copying');
  setTimeout(() => el.classList.remove('copying'), 900);
}

function copySwatch(hex, el) {
  navigator.clipboard.writeText(hex).catch(()=>{});
  el.classList.add('copying');
  setTimeout(() => el.classList.remove('copying'), 900);
}

// ══════════════════════════════════════════════
// MY PALETTE TAB
// ══════════════════════════════════════════════
function renderMyPalette() {
  const grid = document.getElementById('my-swatch-grid');
  if (!grid) return;
  if (!S.myPalette.length) {
    grid.innerHTML = '<span class="hint">まだ色がありません</span>';
  } else {
    grid.innerHTML = S.myPalette.map((c, i) => `
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
      <div style="width:20px;height:20px;background:${c.hex};border:1px solid var(--line);border-radius:2px;flex-shrink:0"></div>
      <span style="font-size:11px;color:var(--text2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.name}</span>
      <button class="tbtn" onclick="editSwatch()">編集</button>
      <button class="tbtn danger" onclick="deleteSwatch()">削除</button>
      <button class="tbtn" onclick="S.selectedSwatchIdx=-1;renderMyPalette()">✕</button>`;
  } else {
    bar.innerHTML = '<span class="hint">色をタップして選択 → 編集・削除</span>';
  }
}

function selectSwatch(i) {
  S.selectedSwatchIdx = S.selectedSwatchIdx === i ? -1 : i;
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
}

async function deleteSwatch() {
  const i = S.selectedSwatchIdx;
  if (i < 0) return;
  const id = S.myPalette[i].id;
  S.myPalette.splice(i, 1);
  await deleteColorFromDb(id);
  S.selectedSwatchIdx = -1;
  renderMyPalette();
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
}

// ══════════════════════════════════════════════
// IMAGE COLOR PICKER（マイパレット用）
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
      offscreen.width = img.naturalWidth; offscreen.height = img.naturalHeight;
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
  document.querySelectorAll('input[type=file]').forEach(i => i.value = '');
}

async function addPickedColor() {
  if (!S.pickedHex) return;
  const color = { id: uid(), hex: S.pickedHex, name: S.pickedHex };
  if (!S.myPalette.some(c => c.hex === S.pickedHex)) {
    S.myPalette.push(color);
    await saveColorToDb(color);
    renderMyPalette();
  }
  closePickerModal();
}

function getImgCoords(e, imgEl) {
  const rect = imgEl.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    ix: Math.max(0, Math.min(imgEl.naturalWidth-1, Math.floor((clientX-rect.left) * imgEl.naturalWidth / rect.width))),
    iy: Math.max(0, Math.min(imgEl.naturalHeight-1, Math.floor((clientY-rect.top) * imgEl.naturalHeight / rect.height))),
    cx: clientX - rect.left,
    cy: clientY - rect.top,
  };
}

function doPickColor(e) {
  e.preventDefault();
  if (!_pickerCtx) return;
  const img = document.getElementById('picker-img');
  const { ix, iy, cx, cy } = getImgCoords(e, img);
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
  lupeCtx.drawImage(_pickerCtx.canvas, Math.max(0,ix-AREA/2), Math.max(0,iy-AREA/2), AREA, AREA, 0, 0, D, D);
  lupeCtx.restore();
}

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const wrap = document.getElementById('picker-img-wrap');
  wrap.addEventListener('mousemove', doPickColor, { passive: false });
  wrap.addEventListener('touchmove', doPickColor, { passive: false });
  wrap.addEventListener('touchstart', doPickColor, { passive: false });
  wrap.addEventListener('click', doPickColor, { passive: false });
  wrap.addEventListener('mouseleave', () => { document.getElementById('lupe').style.display = 'none'; });

  renderTagCategories('word-tags', WORD_TAGS, selectedWordTags);
  renderTagCategories('color-tags', COLOR_TAGS, selectedColorTags);
  renderTagCategories('brand-tags', BRAND_TAGS, selectedBrandTags);
});

loadApiKey();
loadMyPalette();
loadHistory();
