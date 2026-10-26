/* ============================================================
   MELEĞİN TAKI DÜNYASI — YÖNETİM PANELİ
   ============================================================ */
const $ = (s, k = document) => k.querySelector(s);
const $$ = (s, k = document) => [...k.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const para = n => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n || 0)) + ' ₺';
const tarihYaz = iso => new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const gunYaz = iso => new Date(iso + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' });

const DURUM = {
  yeni: 'Yeni', hazirlaniyor: 'Hazırlanıyor', kargoda: 'Kargoda', teslim: 'Teslim edildi', iptal: 'İptal'
};
const ODEME = { havale: 'Havale / EFT' };

const IKON = {
  panel: '<path d="M3 12 12 4l9 8M5 10v10h5v-6h4v6h5V10"/>',
  siparis: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>',
  urun: '<path d="M12 3l8 5v8l-8 5-8-5V8zM12 12l8-4M12 12v9M12 12 4 8"/>',
  stok: '<path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  bulten: '<path d="M4 4h16v16H4zM4 7l8 6 8-6"/>',
  ayar: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  zil: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
  cikis: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  hediye: '<path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/>',
  gorsel: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  ses: '<path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  sesKapali: '<path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/>'
};
const svg = (ad, b = 18) => `<svg viewBox="0 0 24 24" width="${b}" height="${b}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IKON[ad]}</svg>`;

/* ---------- durum ---------- */
const D = {
  urunler: [], hediyeler: [], siparisler: [], ozet: null, ayar: null, bulten: [],
  rota: 'panel', siparisFiltre: 'hepsi', siparisAra: '', urunAra: '', urunKat: '', urunFiltre: 'hepsi',
  sesAcik: localStorage.getItem('ar_ses') !== '0', sonNo: null, uyarilanlar: new Set(), sifreDegistir: false, ilkYuk: true
};

/* ---------- API ---------- */
async function api(yol, yontem = 'GET', govde) {
  const y = await fetch('/api/admin' + yol, {
    method: yontem, headers: govde ? { 'Content-Type': 'application/json' } : {},
    body: govde ? JSON.stringify(govde) : undefined, credentials: 'same-origin'
  });
  if (y.status === 401 && yol !== '/giris') { girisGoster(); throw new Error('oturum'); }
  const v = await y.json().catch(() => ({}));
  if (!y.ok) throw new Error(v.hata || 'Bir hata oluştu.');
  return v;
}

/* ---------- toast & ses ---------- */
function toast(baslik, metin = '', tur = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + tur;
  el.innerHTML = `<div><b>${esc(baslik)}</b>${metin ? `<span>${esc(metin)}</span>` : ''}</div>`;
  $('#toastlar').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, tur === 'yeni' ? 9000 : 4200);
}
function bip() {
  if (!D.sesAcik) return;
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    [[880, 0], [1174, .16], [1568, .32]].forEach(([f, t]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0, ac.currentTime + t);
      g.gain.linearRampToValueAtTime(.18, ac.currentTime + t + .02);
      g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + t + .3);
      o.start(ac.currentTime + t); o.stop(ac.currentTime + t + .32);
    });
  } catch { /* ses yoksa sessiz geç */ }
}

/* ---------- giriş ---------- */
function girisGoster() {
  clearInterval(D.zamanlayici);
  $('#uygulama').innerHTML = `
    <div class="giris"><div class="kart kutu">
      <div class="logo">${logoSvg()}<div style="text-align:left"><b>MELEĞİN TAKI DÜNYASI</b><small>YÖNETİM PANELİ</small></div></div>
      <form id="girisForm" class="form" style="text-align:left">
        <div class="alan"><label for="sifre">Şifre</label><input id="sifre" type="password" autocomplete="current-password" autofocus required></div>
        <div class="hata-yazi" id="girisHata"></div>
        <button class="btn btn--altin" type="submit">Giriş yap</button>
      </form>
    </div></div>`;
  $('#girisForm').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      const v = await api('/giris', 'POST', { sifre: $('#sifre').value });
      D.sifreDegistir = v.sifreDegistir;
      baslat();
    } catch (er) { $('#girisHata').textContent = er.message; }
  });
}
const logoSvg = () => `<svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#EBD08C"/><stop offset="52%" stop-color="#C9A24D"/><stop offset="100%" stop-color="#9C7A2A"/></linearGradient></defs><path d="M20 3 L34 14 L20 37 L6 14 Z" fill="none" stroke="url(#lg)" stroke-width="1.8"/><path d="M6 14 L34 14 M20 3 L13 14 L20 37 L27 14 Z" fill="none" stroke="url(#lg)" stroke-width="1.1" opacity=".75"/></svg>`;

/* ---------- iskelet ---------- */
const BASLIK = { panel: 'Genel Bakış', siparisler: 'Siparişler', urunler: 'Ürünler', hediyeler: 'Hediyeler (kargo limiti üstü)', stok: 'Stok Takibi', bulten: 'Bülten Aboneleri', ayarlar: 'Ayarlar' };

function iskeletCiz() {
  $('#uygulama').innerHTML = `
  <div class="kabuk">
    <aside class="yan" id="yan">
      <div class="logo">${logoSvg()}<div><b>MELEĞİN TAKI DÜNYASI</b><small>YÖNETİM</small></div></div>
      ${[['panel', 'Genel Bakış'], ['siparisler', 'Siparişler'], ['urunler', 'Ürünler'], ['hediyeler', 'Hediyeler'], ['stok', 'Stok Takibi'], ['bulten', 'Bülten'], ['ayarlar', 'Ayarlar']]
        .map(([k, a]) => `<button class="nav" data-rota="${k}">${svg(k === 'panel' ? 'panel' : k === 'siparisler' ? 'siparis' : k === 'urunler' ? 'urun' : k === 'hediyeler' ? 'hediye' : k === 'stok' ? 'stok' : k === 'bulten' ? 'bulten' : 'ayar', 18)}<span>${a}</span><span class="sayac" id="say-${k}" hidden></span></button>`).join('')}
      <div class="alt">
        <a class="nav" href="/" target="_blank" rel="noopener">${svg('gorsel')}<span>Siteyi gör</span></a>
        <button class="nav" data-act="cikis">${svg('cikis')}<span>Çıkış yap</span></button>
      </div>
    </aside>
    <div class="ana">
      <div class="ust">
        <button class="ikon menu-ac" data-act="menu" aria-label="Menü">${svg('menu')}</button>
        <h1 id="sayfaBaslik"></h1>
        <button class="ikon" data-act="ses" id="sesBtn" aria-label="Bildirim sesi" title="Bildirim sesi"></button>
        <button class="ikon" data-act="bildirim" aria-label="Tarayıcı bildirimleri" title="Tarayıcı bildirimlerini aç">${svg('zil')}</button>
      </div>
      <main class="icerik" id="icerik"></main>
    </div>
  </div>`;
  sesBtnGuncelle();
}
const sesBtnGuncelle = () => { const b = $('#sesBtn'); if (b) b.innerHTML = svg(D.sesAcik ? 'ses' : 'sesKapali'); };

/* ---------- veri ---------- */
async function veriYenile(hepsi = true) {
  const [ozet, urunler, hediyeler] = await Promise.all([api('/ozet'), api('/urunler'), api('/hediyeler')]);
  D.ozet = ozet; D.urunler = urunler; D.hediyeler = hediyeler;
  if (hepsi) D.siparisler = await api('/siparisler');
  sayaclar();
  stokUyarilari();
}
function sayaclar() {
  const o = D.ozet; if (!o) return;
  const set = (k, n, sari) => { const e = $('#say-' + k); if (!e) return; e.hidden = !n; e.textContent = n; e.classList.toggle('sari', !!sari); };
  set('siparisler', o.yeniSayisi);
  set('stok', o.azKalan.length + o.tukenen.length, o.tukenen.length === 0);
  document.title = (o.yeniSayisi ? `(${o.yeniSayisi}) ` : '') + 'Meleğin Takı Dünyası · Yönetim Paneli';
}
function stokUyarilari() {
  const o = D.ozet;
  const hepsi = [...o.tukenen.map(u => ({ ...u, tur: 'tukendi' })), ...o.azKalan.map(u => ({ ...u, tur: 'az' }))];
  const yeniler = hepsi.filter(u => !D.uyarilanlar.has(u.id + ':' + u.stok));
  hepsi.forEach(u => D.uyarilanlar.add(u.id + ':' + u.stok));
  if (!yeniler.length) return;
  if (D.ilkYuk) {
    toast('Stok uyarısı', `${o.azKalan.length} üründe stok azaldı, ${o.tukenen.length} ürün tükendi.`, 'uyari');
  } else {
    yeniler.forEach(u => toast(u.tur === 'tukendi' ? 'Ürün tükendi' : 'Stok azaldı', `${u.ad} — ${u.tur === 'tukendi' ? 'stok bitti' : u.stok + ' adet kaldı'}`, 'uyari'));
  }
}

/* ---------- yönlendirme ---------- */
function git(rota) {
  D.rota = rota;
  $$('.nav[data-rota]').forEach(b => b.classList.toggle('aktif', b.dataset.rota === rota));
  $('#sayfaBaslik').textContent = BASLIK[rota];
  $('#yan').classList.remove('acik');
  if (location.hash !== '#' + rota) history.replaceState(null, '', '#' + rota);
  ciz();
  scrollTo(0, 0);
}
async function ciz() {
  const f = { panel: panelCiz, siparisler: siparisCiz, urunler: () => urunCiz(false), hediyeler: hediyeCiz, stok: () => urunCiz(true), bulten: bultenCiz, ayarlar: ayarCiz }[D.rota];
  await f();
}

/* ---------- ortak parçalar ---------- */
const durumRozet = d => `<span class="rozet r-${d}">${DURUM[d]}</span>`;
const stokDurum = u => u.stok <= 0 ? 'tukendi' : (u.stok <= (u.azEsik ?? 3) ? 'az' : 'tamam');
const stokRozet = u => { const d = stokDurum(u); return `<span class="rozet r-${d}">${{ tukendi: 'Tükendi', az: 'Az kaldı', tamam: 'Yeterli' }[d]}</span>`; };
const mini = u => u.gorsel ? `<img class="mini" src="${esc(u.gorsel)}" alt="">` : `<span class="mini">${svg('gorsel', 20)}</span>`;
const musteri = s => esc(s.teslimat.adSoyad);

/* ---------- 1. PANEL ---------- */
function panelCiz() {
  const o = D.ozet;
  const en = Math.max(...o.son7.map(g => g.ciro), 1);
  const uyariVar = o.azKalan.length || o.tukenen.length;
  $('#icerik').innerHTML = `
    ${uyariVar ? `<div class="uyari-kutu ${o.tukenen.length ? 'kritik' : ''}">
      ${svg('stok', 22)}
      <div style="flex:1">
        <b>Stok uyarısı</b> — ${o.tukenen.length ? `${o.tukenen.length} ürün tükendi` : ''}${o.tukenen.length && o.azKalan.length ? ', ' : ''}${o.azKalan.length ? `${o.azKalan.length} üründe stok azaldı` : ''}.
        <div class="uyari-liste">
          ${[...o.tukenen.map(u => ({ ...u, t: 1 })), ...o.azKalan].slice(0, 8).map(u => `
          <div class="uyari-satir">
            ${u.gorsel ? `<img class="mini" style="width:34px;height:34px" src="${esc(u.gorsel)}" alt="">` : ''}
            <span class="ad">${esc(u.ad)}</span>
            <span class="rozet r-${u.t ? 'tukendi' : 'az'}">${u.t ? 'Tükendi' : u.stok + ' adet kaldı'}</span>
            <input class="stok-giris" type="number" min="0" value="${u.stok}" data-stok="${esc(u.id)}" aria-label="${esc(u.ad)} stok">
          </div>`).join('')}
        </div>
      </div>
    </div>` : ''}

    <div class="kpi">
      <div class="kart k"><small>Bugünkü sipariş</small><b>${o.bugunSiparis}</b></div>
      <div class="kart k"><small>Bugünkü ciro</small><b>${para(o.bugunCiro)}</b></div>
      <div class="kart k ${o.yeniSayisi ? 'kritik' : ''}"><small>Yeni (işlenmemiş)</small><b>${o.yeniSayisi}</b></div>
      <div class="kart k ${uyariVar ? 'uyari' : ''}"><small>Stok uyarısı</small><b>${o.azKalan.length + o.tukenen.length}</b></div>
    </div>

    <div class="ikili">
      <section class="kart">
        <header><h2>Son 7 gün</h2><span class="ipucu">İptal edilenler hariç</span></header>
        <div class="govde"><div class="cubuk-grafik">
          ${o.son7.map(g => `<div class="cubuk" title="${g.adet} sipariş">
            <em>${g.ciro ? para(g.ciro) : ''}</em>
            <i class="${g.ciro ? '' : 'sifir'}" style="height:${g.ciro ? Math.max(6, g.ciro / en * 130) : 3}px"></i>
            <small>${gunYaz(g.gun)}</small></div>`).join('')}
        </div></div>
      </section>
      <section class="kart">
        <header><h2>Özet</h2></header>
        <div class="govde liste-ozet">
          <div><span>Toplam sipariş</span><b>${o.toplamSiparis}</b></div>
          <div><span>Hazırlanan</span><b>${o.hazirlanan}</b></div>
          <div><span>Toplam ciro</span><b>${para(o.toplamCiro)}</b></div>
          <div><span>Ürün sayısı</span><b>${o.urunSayisi}</b></div>
        </div>
      </section>
    </div>

    <section class="kart">
      <header><h2>Son siparişler</h2><button class="btn btn--kucuk" data-rota-git="siparisler">Tümünü gör</button></header>
      ${o.sonSiparisler.length ? siparisTablo(o.sonSiparisler) : `<div class="bos">Henüz sipariş yok. Müşteriler sipariş verdiğinde burada görünecek.</div>`}
    </section>`;
}

/* ---------- 2. SİPARİŞLER ---------- */
function siparisTablo(liste) {
  return `<div class="tablo-kap"><table>
    <thead><tr><th>Sipariş</th><th>Tarih</th><th>Müşteri</th><th>Ödeme</th><th class="sag">Tutar</th><th>Durum</th></tr></thead>
    <tbody>${liste.map(s => `<tr class="tikla ${s.durum === 'yeni' ? 'yeni-satir' : ''}" data-siparis="${esc(s.no)}">
      <td><b>${esc(s.no)}</b></td><td>${tarihYaz(s.tarih)}</td><td>${musteri(s)}<br><small style="color:var(--metin-2)">${esc(s.teslimat.il)}</small></td>
      <td>${ODEME[s.odeme.yontem] || 'Havale / EFT'}${s.odemeAlindi ? ' <span class="rozet r-teslim">Alındı</span>' : ''}</td>
      <td class="sag tutar"><b>${para(s.toplam)}</b></td><td style="white-space:nowrap">${durumRozet(s.durum)} <button class="btn btn--kucuk btn--tehlike" data-siparis-sil="${esc(s.no)}" aria-label="Siparişi sil">Sil</button></td></tr>`).join('')}</tbody></table></div>`;
}
async function siparisCiz() {
  D.siparisler = await api('/siparisler');
  const say = d => d === 'hepsi' ? D.siparisler.length : D.siparisler.filter(s => s.durum === d).length;
  const q = D.siparisAra.toLocaleLowerCase('tr-TR');
  const liste = D.siparisler.filter(s => (D.siparisFiltre === 'hepsi' || s.durum === D.siparisFiltre) &&
    (!q || [s.no, s.teslimat.adSoyad, s.teslimat.telefon, s.teslimat.il].join(' ').toLocaleLowerCase('tr-TR').includes(q)));
  $('#icerik').innerHTML = `
    <section class="kart">
      <header>
        <div class="sekmeler">${['hepsi', 'yeni', 'hazirlaniyor', 'kargoda', 'teslim', 'iptal'].map(d =>
          `<button class="sekme ${D.siparisFiltre === d ? 'aktif' : ''}" data-sfiltre="${d}">${d === 'hepsi' ? 'Tümü' : DURUM[d]}<b>${say(d)}</b></button>`).join('')}</div>
        <input class="ara" id="sAra" type="search" placeholder="Sipariş no, isim, telefon…" value="${esc(D.siparisAra)}" style="max-width:260px;margin-left:auto">
        <a class="btn btn--kucuk" href="/api/admin/siparisler.csv">Excel'e aktar (CSV)</a>
      </header>
      ${liste.length ? siparisTablo(liste) : `<div class="bos">${D.siparisler.length ? 'Bu filtreye uyan sipariş yok.' : 'Henüz sipariş yok.'}</div>`}
    </section>`;
  const a = $('#sAra'); a.addEventListener('input', e => { D.siparisAra = e.target.value; const p = e.target.selectionStart; siparisCiz().then(() => { const n = $('#sAra'); n.focus(); n.setSelectionRange(p, p); }); });
}

function telNormal(t) {
  const d = String(t).replace(/\D/g, '');
  if (d.startsWith('90') && d.length >= 12) return d;
  if (d.startsWith('0')) return '90' + d.slice(1);
  return d.length === 10 ? '90' + d : d;
}
function wpMesaj(s) {
  const ad = s.teslimat.adSoyad.split(' ')[0];
  const m = {
    yeni: `Merhaba ${ad}, ${s.no} numaralı siparişin bize ulaştı, teşekkür ederiz. En kısa sürede hazırlayacağız.`,
    hazirlaniyor: `Merhaba ${ad}, ${s.no} numaralı siparişin hazırlanıyor.`,
    kargoda: `Merhaba ${ad}, ${s.no} numaralı siparişin kargoya verildi.${s.takipNo ? ' Takip numaran: ' + s.takipNo : ''}`,
    teslim: `Merhaba ${ad}, ${s.no} numaralı siparişin teslim edildi. Keyifle kullanmanı dileriz!`,
    iptal: `Merhaba ${ad}, ${s.no} numaralı siparişin iptal edildi. Detay için bize yazabilirsin.`
  };
  return m[s.durum];
}
function siparisDetayAc(no) {
  const s = D.siparisler.find(x => x.no === no);
  if (!s) return;
  const t = s.teslimat;
  modalAc(`
  <div class="perde sag-kayan" data-kapat-perde>
    <div class="cekmece" role="dialog" aria-label="Sipariş ${esc(s.no)}">
      <header><div><h2>${esc(s.no)}</h2><small style="color:var(--metin-2)">${tarihYaz(s.tarih)}</small></div>
        <span style="margin-left:auto"></span><button class="ikon" data-kapat aria-label="Kapat">✕</button></header>
      <div class="govde">
        <div class="alan"><label for="sDurum">Sipariş durumu</label>
          <select id="sDurum">${Object.entries(DURUM).map(([k, v]) => `<option value="${k}" ${s.durum === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
          ${s.durum !== 'iptal' ? `<span class="ipucu">İptal seçersen ürünler stoğa geri eklenir.</span>` : ''}</div>

        <div><div class="bolum-b">Müşteri</div><div class="bilgi-kutu">
          <b>${esc(t.adSoyad)}</b>
          <span>📞 <a href="tel:${esc(t.telefon)}">${esc(t.telefon)}</a></span>
          ${t.eposta ? `<span>✉ ${esc(t.eposta)}</span>` : ''}
          <span>📍 ${esc(t.adres)}, ${esc(t.ilce)} / ${esc(t.il)}</span>
          ${t.notu ? `<span style="color:var(--altin)"><b>Müşteri notu:</b> ${esc(t.notu)}</span>` : ''}
        </div></div>

        <div><div class="bolum-b">Ürünler</div>
          ${s.urunler.map(u => `<div class="urun-satir">${u.gorsel ? `<img class="mini" src="${esc(u.gorsel)}" alt="">` : `<span class="mini">${svg('gorsel', 18)}</span>`}
            <div style="flex:1;min-width:0"><b style="font-weight:500">${esc(u.ad)}</b><br><small style="color:var(--metin-2)">${u.adet} × ${para(u.birim)}</small></div>
            <b class="tutar">${para(u.birim * u.adet)}</b></div>`).join('')}
          <div class="liste-ozet" style="margin-top:12px">
            <div><span>Ara toplam</span><span>${para(s.araToplam)}</span></div>
            <div><span>Kargo</span><span>${s.kargo.ucret ? para(s.kargo.ucret) : 'Ücretsiz'}</span></div>
            <div class="toplam"><span>Toplam</span><span>${para(s.toplam)}</span></div>
          </div></div>

        ${s.hediye ? `<div><div class="bolum-b">Seçilen hediye 🎁</div>
          <div class="urun-satir">${s.hediye.gorsel ? `<img class="mini" src="${esc(s.hediye.gorsel)}" alt="">` : `<span class="mini">${svg('hediye', 18)}</span>`}
            <div style="flex:1;min-width:0"><b style="font-weight:500">${esc(s.hediye.ad)}</b><br><small style="color:var(--metin-2)">Siparişle birlikte gönderilecek hediye</small></div></div></div>` : ''}

        <div><div class="bolum-b">Ödeme</div>
          <div class="arac" style="justify-content:space-between"><span>${ODEME[s.odeme.yontem] || 'Havale / EFT'}</span>
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer"><span class="ipucu">Ödeme alındı</span>
              <span class="anahtar"><input type="checkbox" id="sOdeme" ${s.odemeAlindi ? 'checked' : ''}><span></span></span></label></div></div>

        <div class="satir2">
          <div class="alan"><label for="sTakip">Kargo takip no</label><input id="sTakip" value="${esc(s.takipNo)}" placeholder="Takip numarası"></div>
        </div>
        <div class="alan"><label for="sNot">Yönetim notu (müşteri görmez)</label><textarea id="sNot" placeholder="Not ekle…">${esc(s.yonetimNotu)}</textarea></div>
      </div>
      <footer>
        <button class="btn btn--tehlike" data-siparis-sil="${esc(s.no)}">Sil</button>
        <button class="btn" data-act="yazdir" data-no="${esc(s.no)}">Yazdır</button>
        <a class="btn" id="wpBtn" target="_blank" rel="noopener" href="https://wa.me/${telNormal(t.telefon)}?text=${encodeURIComponent(wpMesaj(s))}">WhatsApp ile yaz</a>
        <button class="btn btn--altin" data-act="siparisKaydet" data-no="${esc(s.no)}">Kaydet</button>
      </footer>
    </div>
  </div>`);
}
async function siparisKaydet(no) {
  try {
    const v = await api('/siparisler/' + no, 'PATCH', {
      durum: $('#sDurum').value, takipNo: $('#sTakip').value, yonetimNotu: $('#sNot').value, odemeAlindi: $('#sOdeme').checked
    });
    const i = D.siparisler.findIndex(x => x.no === no); if (i >= 0) D.siparisler[i] = v.siparis;
    modalKapat(); toast('Kaydedildi', `${no} güncellendi.`);
    await veriYenile(true); ciz();
  } catch (e) { toast('Hata', e.message, 'hata'); }
}
function siparisYazdir(no) {
  const s = D.siparisler.find(x => x.no === no); if (!s) return;
  const t = s.teslimat;
  const w = window.open('', '_blank', 'width=720,height=900'); if (!w) { toast('Pencere engellendi', 'Açılır pencerelere izin ver.', 'uyari'); return; }
  w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(s.no)}</title>
  <style>body{font:14px/1.5 Georgia,serif;padding:32px;color:#222}h1{font-size:22px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin:16px 0}td,th{padding:7px 4px;border-bottom:1px solid #ddd;text-align:left}.s{text-align:right}.k{border:1px solid #ccc;padding:12px 14px;margin:12px 0}</style>
  <h1>MELEĞİN TAKI DÜNYASI — Sipariş ${esc(s.no)}</h1><div>${tarihYaz(s.tarih)}</div>
  <div class="k"><b>${esc(t.adSoyad)}</b><br>${esc(t.telefon)}<br>${esc(t.adres)}<br>${esc(t.ilce)} / ${esc(t.il)}${t.notu ? '<br><i>Not: ' + esc(t.notu) + '</i>' : ''}</div>
  <table><tr><th>Ürün</th><th class="s">Adet</th><th class="s">Tutar</th></tr>
  ${s.urunler.map(u => `<tr><td>${esc(u.ad)}</td><td class="s">${u.adet}</td><td class="s">${para(u.birim * u.adet)}</td></tr>`).join('')}</table>
  ${s.hediye ? `<div class="s">Hediye: ${esc(s.hediye.ad)}</div>` : ''}<div class="s">Kargo: ${s.kargo.ucret ? para(s.kargo.ucret) : 'Ücretsiz'}</div>
  <h2 class="s">Toplam: ${para(s.toplam)}</h2><div>Ödeme: ${ODEME[s.odeme.yontem] || 'Havale / EFT'}${s.odemeAlindi ? ' (alındı)' : ''}</div>
  <script>onload=()=>print()<\/script>`);
  w.document.close();
}

/* ---------- 3. ÜRÜNLER / STOK ---------- */
function urunCiz(stokModu) {
  const kategoriler = [...new Set(D.urunler.map(u => u.kategori))].sort();
  const q = D.urunAra.toLocaleLowerCase('tr-TR');
  const filtre = stokModu ? 'sorunlu' : D.urunFiltre;
  let liste = D.urunler.filter(u => (!q || (u.ad + ' ' + u.kategori).toLocaleLowerCase('tr-TR').includes(q)) && (!D.urunKat || u.kategori === D.urunKat));
  if (filtre === 'sorunlu') liste = liste.filter(u => stokDurum(u) !== 'tamam').sort((a, b) => a.stok - b.stok);
  if (filtre === 'gizli') liste = liste.filter(u => u.aktif === false);
  const sorunlu = D.urunler.filter(u => stokDurum(u) !== 'tamam').length;

  $('#icerik').innerHTML = `
    ${stokModu ? `<div class="uyari-kutu ${D.ozet.tukenen.length ? 'kritik' : ''}">${svg('stok', 22)}<div><b>Stok takibi</b><br><span class="ipucu">Stok, her üründe belirlediğin eşiğin (boşsa genel eşik: ${D.ayar?.azStokLimiti ?? 3} adet) altına inince burada uyarı olarak görünür. Sayıyı değiştirip başka bir yere tıkladığında otomatik kaydedilir.</span></div></div>` : ''}
    <section class="kart">
      <header>
        <input class="ara" id="uAra" type="search" placeholder="Ürün ara…" value="${esc(D.urunAra)}">
        <select id="uKat"><option value="">Tüm kategoriler</option>${kategoriler.map(k => `<option ${D.urunKat === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select>
        ${stokModu ? '' : `<div class="sekmeler">
          <button class="sekme ${filtre === 'hepsi' ? 'aktif' : ''}" data-ufiltre="hepsi">Tümü<b>${D.urunler.length}</b></button>
          <button class="sekme ${filtre === 'sorunlu' ? 'aktif' : ''}" data-ufiltre="sorunlu">Az kalanlar<b>${sorunlu}</b></button>
          <button class="sekme ${filtre === 'gizli' ? 'aktif' : ''}" data-ufiltre="gizli">Yayında değil</button></div>`}
        <button class="btn btn--altin" data-act="urunYeni" style="margin-left:auto">+ Yeni ürün</button>
      </header>
      ${liste.length ? `<div class="tablo-kap"><table>
        <thead><tr><th>Ürün</th><th>Kategori</th><th class="sag">Fiyat</th><th>Stok</th><th>Durum</th><th>Yayında</th><th></th></tr></thead>
        <tbody>${liste.map(u => `<tr class="${{ az: 'az-satir', tukendi: 'tukendi-satir' }[stokDurum(u)] || ''}">
          <td><div class="hucre">${mini(u)}<div style="min-width:0"><b>${esc(u.ad)}</b>${u.rozet ? `<small>${esc(u.rozet)}</small>` : ''}</div></div></td>
          <td>${esc(u.kategori)}</td>
          <td class="sag tutar">${para(u.fiyat)}${u.eski ? `<br><small style="color:var(--metin-2)"><s>${para(u.eski)}</s></small>` : ''}</td>
          <td><input class="stok-giris" type="number" min="0" value="${u.stok}" data-stok="${esc(u.id)}" aria-label="${esc(u.ad)} stok"></td>
          <td>${stokRozet(u)}</td>
          <td><label class="anahtar"><input type="checkbox" data-aktif="${esc(u.id)}" ${u.aktif !== false ? 'checked' : ''}><span></span></label></td>
          <td class="sag" style="white-space:nowrap"><button class="btn btn--kucuk" data-urun-duzenle="${esc(u.id)}">Düzenle</button>
            <button class="btn btn--kucuk btn--tehlike" data-urun-sil="${esc(u.id)}">Sil</button></td></tr>`).join('')}</tbody></table></div>`
        : `<div class="bos">${stokModu ? 'Harika! Stok sorunu olan ürün yok. 🎉' : (D.urunler.length ? 'Bu filtreye uyan ürün yok.' : 'Henüz ürün eklemedin.')}</div>`}
    </section>`;
  $('#uAra').addEventListener('input', e => { D.urunAra = e.target.value; const p = e.target.selectionStart; urunCiz(stokModu); const n = $('#uAra'); n.focus(); n.setSelectionRange(p, p); });
  $('#uKat').addEventListener('change', e => { D.urunKat = e.target.value; urunCiz(stokModu); });
}

async function stokKaydet(input) {
  const id = input.dataset.stok, deger = Math.max(0, Math.floor(+input.value || 0));
  try {
    const v = await api('/urunler/' + id, 'PATCH', { stok: deger });
    const u = D.urunler.find(x => x.id === id); if (u) u.stok = v.urun.stok;
    input.classList.add('kaydedildi'); setTimeout(() => input.classList.remove('kaydedildi'), 1200);
    await veriYenile(false); if (D.rota === 'urunler' || D.rota === 'stok') { /* yerinde bırak: kullanıcı yazıyor olabilir */ }
    if (D.rota === 'stok' || D.rota === 'panel') ciz();
  } catch (e) { toast('Hata', e.message, 'hata'); }
}

/* ---- ürün formu ---- */
let form = null;
function urunFormAc(u) {
  const yeni = !u;
  form = { id: u?.id || null, gorsel: u?.gorsel || '', gorselVeri: null, gorselKaldir: false };
  const kats = [...new Set(D.urunler.map(x => x.kategori))];
  const g = u || { ad: '', kategori: '', fiyat: '', eski: 0, stok: 1, stokUyari: 0, rozet: '', aciklama: '', aktif: true, tip: 'yuzuk', metal: 'altin', tas: 'beyaz' };
  modalAc(`
  <div class="perde" data-kapat-perde>
    <div class="modal" role="dialog" aria-label="${yeni ? 'Yeni ürün' : 'Ürünü düzenle'}">
      <header><h2>${yeni ? 'Yeni ürün ekle' : 'Ürünü düzenle'}</h2><button class="ikon" data-kapat aria-label="Kapat">✕</button></header>
      <div class="govde">
        <div><div class="bolum-b">Ürün görseli</div>
          <div class="yukle-alan" id="yukleAlan">
            <div class="on" id="onizleme">${g.gorsel ? `<img src="${esc(g.gorsel)}" alt="">` : svg('gorsel', 34)}</div>
            <div style="display:grid;gap:8px">
              <div class="arac"><button class="btn btn--kucuk" type="button" data-act="dosyaSec">Bilgisayardan seç</button>
                <button class="btn btn--kucuk btn--tehlike" type="button" data-act="gorselKaldir" id="gKaldir" ${g.gorsel ? '' : 'hidden'}>Kaldır</button></div>
              <span class="ipucu">veya görseli buraya sürükle. JPG, PNG ya da WEBP. Otomatik küçültülür.<br>Görsel eklemezsen sitede ürün için çizim gösterilir.</span>
              <input type="file" id="dosya" accept="image/png,image/jpeg,image/webp" hidden>
            </div></div></div>

        <div class="alan"><label for="fAd">Ürün adı *</label><input id="fAd" value="${esc(g.ad)}" maxlength="120" placeholder="Örn. Nur Tek Taş Yüzük"></div>
        <div class="satir2">
          <div class="alan"><label for="fKat">Kategori</label><input id="fKat" list="katListe" value="${esc(g.kategori)}" placeholder="Yüzük, Kolye…"><datalist id="katListe">${kats.map(k => `<option value="${esc(k)}">`).join('')}</datalist></div>
          <div class="alan"><label for="fRozet">Etiket (isteğe bağlı)</label><input id="fRozet" value="${esc(g.rozet)}" maxlength="24" placeholder="Yeni, Çok satan…"></div>
        </div>
        <div class="satir3">
          <div class="alan"><label for="fFiyat">Fiyat (₺) *</label><input id="fFiyat" type="number" min="0" value="${g.fiyat}"></div>
          <div class="alan"><label for="fEski">Eski fiyat (₺)</label><input id="fEski" type="number" min="0" value="${g.eski || ''}" placeholder="İndirim için"></div>
          <div class="alan"><label for="fStok">Stok adedi *</label><input id="fStok" type="number" min="0" value="${g.stok}"></div>
        </div>
        <div class="alan"><label for="fUyari">Stok uyarı eşiği</label><input id="fUyari" type="number" min="0" value="${g.stokUyari || ''}" placeholder="Boşsa genel eşik (${D.ayar?.azStokLimiti ?? 3}) kullanılır">
          <span class="ipucu">Stok bu sayıya veya altına inince panelde uyarı alırsın.</span></div>
        <div class="alan"><label for="fAcik">Açıklama</label><textarea id="fAcik" maxlength="800" placeholder="Malzeme, ölçü, taş bilgisi…">${esc(g.aciklama)}</textarea></div>
        <label style="display:flex;align-items:center;gap:12px;cursor:pointer"><span class="anahtar"><input type="checkbox" id="fAktif" ${g.aktif !== false ? 'checked' : ''}><span></span></span><span>Sitede yayında</span></label>

        <details><summary style="cursor:pointer;color:var(--metin-2);font-size:.88rem">Gelişmiş: görsel yoksa kullanılan çizim</summary>
          <div class="satir3" style="margin-top:12px">
            <div class="alan"><label for="fTip">Şekil</label><select id="fTip">${[['yuzuk', 'Yüzük'], ['kolye', 'Kolye'], ['kupe', 'Küpe'], ['bileklik', 'Bileklik'], ['halhal', 'Halhal'], ['inci', 'İnci kolye'], ['set', 'Set']].map(([k, v]) => `<option value="${k}" ${g.tip === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
            <div class="alan"><label for="fMetal">Metal</label><select id="fMetal">${[['altin', 'Altın rengi'], ['rose', 'Rose renk'], ['gumus', 'Gümüş rengi']].map(([k, v]) => `<option value="${k}" ${g.metal === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
            <div class="alan"><label for="fTas">Taş</label><select id="fTas">${[['beyaz', 'Beyaz taş'], ['yakut', 'Kırmızı taş'], ['zumrut', 'Yeşil taş'], ['safir', 'Mavi taş'], ['ametist', 'Mor taş'], ['inci', 'İnci görünümlü'], ['kehribar', 'Kehribar rengi taş']].map(([k, v]) => `<option value="${k}" ${g.tas === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          </div></details>
      </div>
      <footer><button class="btn" data-kapat>Vazgeç</button><button class="btn btn--altin" data-act="urunKaydet" id="urunKaydetBtn">${yeni ? 'Ürünü ekle' : 'Kaydet'}</button></footer>
    </div>
  </div>`);

  const dosya = $('#dosya'), alan = $('#yukleAlan');
  dosya.addEventListener('change', () => dosya.files[0] && gorselIsle(dosya.files[0]));
  ['dragenter', 'dragover'].forEach(o => alan.addEventListener(o, e => { e.preventDefault(); alan.classList.add('surukle'); }));
  ['dragleave', 'drop'].forEach(o => alan.addEventListener(o, e => { e.preventDefault(); alan.classList.remove('surukle'); }));
  alan.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) gorselIsle(f); });
}

/* görseli tarayıcıda küçült → base64 (sunucu 6 MB'a kadar kabul eder) */
function gorselIsle(dosya) {
  if (!/^image\/(png|jpe?g|webp)$/.test(dosya.type)) { toast('Desteklenmeyen dosya', 'JPG, PNG veya WEBP seç.', 'hata'); return; }
  const url = URL.createObjectURL(dosya);
  const img = new Image();
  img.onload = () => {
    const MAX = 1400, oran = Math.min(1, MAX / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * oran); c.height = Math.round(img.height * oran);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);   // şeffaf PNG'ler beyaz zemine
    ctx.drawImage(img, 0, 0, c.width, c.height);
    form.gorselVeri = c.toDataURL('image/jpeg', .86);
    form.gorselKaldir = false;
    $('#onizleme').innerHTML = `<img src="${form.gorselVeri}" alt="">`;
    $('#gKaldir').hidden = false;
    URL.revokeObjectURL(url);
  };
  img.onerror = () => toast('Görsel açılamadı', 'Başka bir dosya dene.', 'hata');
  img.src = url;
}

async function urunKaydet() {
  const btn = $('#urunKaydetBtn');
  const ad = $('#fAd').value.trim();
  if (!ad) { toast('Ürün adı gerekli', '', 'hata'); $('#fAd').focus(); return; }
  if ($('#fFiyat').value === '' || +$('#fFiyat').value < 0) { toast('Geçerli bir fiyat yaz', '', 'hata'); $('#fFiyat').focus(); return; }
  btn.disabled = true; btn.textContent = 'Kaydediliyor…';
  try {
    let gorsel = form.gorsel;
    if (form.gorselVeri) gorsel = (await api('/gorsel', 'POST', { veri: form.gorselVeri })).url;
    else if (form.gorselKaldir) gorsel = '';
    const veri = {
      ad, kategori: $('#fKat').value, rozet: $('#fRozet').value, fiyat: +$('#fFiyat').value, eski: +$('#fEski').value || 0,
      stok: +$('#fStok').value || 0, stokUyari: +$('#fUyari').value || 0, aciklama: $('#fAcik').value, aktif: $('#fAktif').checked,
      tip: $('#fTip').value, metal: $('#fMetal').value, tas: $('#fTas').value, gorsel
    };
    if (form.id) await api('/urunler/' + form.id, 'PUT', veri); else await api('/urunler', 'POST', veri);
    modalKapat(); toast(form.id ? 'Ürün güncellendi' : 'Ürün eklendi', ad);
    await veriYenile(false); ciz();
  } catch (e) { toast('Kaydedilemedi', e.message, 'hata'); btn.disabled = false; btn.textContent = 'Tekrar dene'; }
}

function urunSilOnay(id) {
  const u = D.urunler.find(x => x.id === id); if (!u) return;
  modalAc(`
  <div class="perde" data-kapat-perde><div class="modal dar" role="alertdialog">
    <header><h2>Ürün silinsin mi?</h2></header>
    <div class="govde"><div class="hucre">${mini(u)}<div><b>${esc(u.ad)}</b><small>${esc(u.kategori)} · ${para(u.fiyat)}</small></div></div>
      <p style="margin:0;color:var(--metin-2)">Bu ürün ve görseli kalıcı olarak silinir, <b>geri alınamaz</b>. Eski siparişlerdeki kayıtlar korunur. Sadece satıştan kaldırmak istiyorsan silmek yerine “Yayında” anahtarını kapat.</p></div>
    <footer><button class="btn" data-kapat>Vazgeç</button><button class="btn btn--tehlike-dolu" data-act="urunSilOnayla" data-id="${esc(id)}">Evet, sil</button></footer>
  </div></div>`);
}

/* ---------- HEDİYELER ---------- */
function hediyeCiz() {
  const liste = D.hediyeler;
  const gorunen = liste.filter(h => h.aktif !== false && h.stok > 0).length;
  $('#icerik').innerHTML = `
    <div class="uyari-kutu ${gorunen === 5 ? '' : ''}">${svg('hediye', 22)}<div>
      <b>Hediye seçimi</b><br><span class="ipucu">Sepet tutarı ${para(D.ayar?.kargoBedavaLimit ?? 1000)} ve üzerine çıkınca müşteri ödemeye geçerken bu listeden <b>sadece 1 hediye</b> seçer. Sitede yalnızca “Yayında” olan ve stoğu biten olmayan hediyeler görünür. Müşteriye şu an <b>${gorunen}</b> hediye gösteriliyor (önerilen: 5). Hiç hediye yayında değilse hediye adımı hiç çıkmaz.</span>
    </div></div>
    <section class="kart">
      <header><h2>Hediye listesi</h2><button class="btn btn--altin" data-act="hediyeYeni" style="margin-left:auto">+ Yeni hediye</button></header>
      ${liste.length ? `<div class="tablo-kap"><table>
        <thead><tr><th>Hediye</th><th>Stok</th><th>Durum</th><th>Yayında</th><th></th></tr></thead>
        <tbody>${liste.map(h => `<tr>
          <td><div class="hucre">${mini(h)}<div style="min-width:0"><b>${esc(h.ad)}</b>${h.aciklama ? `<small>${esc(h.aciklama)}</small>` : ''}</div></div></td>
          <td><input class="stok-giris" type="number" min="0" value="${h.stok}" data-hstok="${esc(h.id)}" aria-label="${esc(h.ad)} stok"></td>
          <td>${stokRozet({ stok: h.stok, azEsik: 5 })}</td>
          <td><label class="anahtar"><input type="checkbox" data-haktif="${esc(h.id)}" ${h.aktif !== false ? 'checked' : ''}><span></span></label></td>
          <td class="sag" style="white-space:nowrap"><button class="btn btn--kucuk" data-hediye-duzenle="${esc(h.id)}">Düzenle</button>
            <button class="btn btn--kucuk btn--tehlike" data-hediye-sil="${esc(h.id)}">Sil</button></td></tr>`).join('')}</tbody></table></div>`
        : '<div class="bos">Henüz hediye eklemedin. “+ Yeni hediye” ile ekle.</div>'}
    </section>`;
}
function hediyeFormAc(h) {
  const yeni = !h;
  form = { id: h?.id || null, gorsel: h?.gorsel || '', gorselVeri: null, gorselKaldir: false };
  const g = h || { ad: '', aciklama: '', stok: 20, aktif: true, tip: 'yuzuk', metal: 'altin', tas: 'beyaz' };
  modalAc(`
  <div class="perde" data-kapat-perde>
    <div class="modal" role="dialog" aria-label="${yeni ? 'Yeni hediye' : 'Hediyeyi düzenle'}">
      <header><h2>${yeni ? 'Yeni hediye ekle' : 'Hediyeyi düzenle'}</h2><button class="ikon" data-kapat aria-label="Kapat">✕</button></header>
      <div class="govde">
        <div><div class="bolum-b">Hediye görseli</div>
          <div class="yukle-alan" id="yukleAlan">
            <div class="on" id="onizleme">${g.gorsel ? `<img src="${esc(g.gorsel)}" alt="">` : svg('gorsel', 34)}</div>
            <div style="display:grid;gap:8px">
              <div class="arac"><button class="btn btn--kucuk" type="button" data-act="dosyaSec">Bilgisayardan seç</button>
                <button class="btn btn--kucuk btn--tehlike" type="button" data-act="gorselKaldir" id="gKaldir" ${g.gorsel ? '' : 'hidden'}>Kaldır</button></div>
              <span class="ipucu">JPG, PNG ya da WEBP. Görsel eklemezsen sitede çizim gösterilir.</span>
              <input type="file" id="dosya" accept="image/png,image/jpeg,image/webp" hidden>
            </div></div></div>
        <div class="alan"><label for="hAd">Hediye adı *</label><input id="hAd" value="${esc(g.ad)}" maxlength="100" placeholder="Örn. Mini Halka Küpe"></div>
        <div class="alan"><label for="hAcik">Kısa açıklama</label><input id="hAcik" value="${esc(g.aciklama || '')}" maxlength="200" placeholder="Müşteriye kartta görünür"></div>
        <div class="alan"><label for="hStok">Stok adedi *</label><input id="hStok" type="number" min="0" value="${g.stok}"></div>
        <label style="display:flex;align-items:center;gap:12px;cursor:pointer"><span class="anahtar"><input type="checkbox" id="hAktif" ${g.aktif !== false ? 'checked' : ''}><span></span></span><span>Müşteriye gösterilsin (yayında)</span></label>
        <details><summary style="cursor:pointer;color:var(--metin-2);font-size:.88rem">Gelişmiş: görsel yoksa kullanılan çizim</summary>
          <div class="satir3" style="margin-top:12px">
            <div class="alan"><label for="fTip">Şekil</label><select id="fTip">${[['yuzuk', 'Yüzük'], ['kolye', 'Kolye'], ['kupe', 'Küpe'], ['bileklik', 'Bileklik'], ['halhal', 'Halhal'], ['inci', 'İnci kolye'], ['set', 'Set']].map(([k, v]) => `<option value="${k}" ${g.tip === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
            <div class="alan"><label for="fMetal">Metal</label><select id="fMetal">${[['altin', 'Altın rengi'], ['rose', 'Rose renk'], ['gumus', 'Gümüş rengi']].map(([k, v]) => `<option value="${k}" ${g.metal === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
            <div class="alan"><label for="fTas">Taş</label><select id="fTas">${[['beyaz', 'Beyaz taş'], ['yakut', 'Kırmızı taş'], ['zumrut', 'Yeşil taş'], ['safir', 'Mavi taş'], ['ametist', 'Mor taş'], ['inci', 'İnci görünümlü'], ['kehribar', 'Kehribar rengi taş']].map(([k, v]) => `<option value="${k}" ${g.tas === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          </div></details>
      </div>
      <footer><button class="btn" data-kapat>Vazgeç</button><button class="btn btn--altin" data-act="hediyeKaydet" id="hediyeKaydetBtn">${yeni ? 'Hediyeyi ekle' : 'Kaydet'}</button></footer>
    </div>
  </div>`);
  const dosya = $('#dosya'), alan = $('#yukleAlan');
  dosya.addEventListener('change', () => dosya.files[0] && gorselIsle(dosya.files[0]));
  ['dragenter', 'dragover'].forEach(o => alan.addEventListener(o, e => { e.preventDefault(); alan.classList.add('surukle'); }));
  ['dragleave', 'drop'].forEach(o => alan.addEventListener(o, e => { e.preventDefault(); alan.classList.remove('surukle'); }));
  alan.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) gorselIsle(f); });
}
async function hediyeKaydet() {
  const btn = $('#hediyeKaydetBtn');
  const ad = $('#hAd').value.trim();
  if (!ad) { toast('Hediye adı gerekli', '', 'hata'); $('#hAd').focus(); return; }
  btn.disabled = true; btn.textContent = 'Kaydediliyor…';
  try {
    let gorsel = form.gorsel;
    if (form.gorselVeri) gorsel = (await api('/gorsel', 'POST', { veri: form.gorselVeri })).url;
    else if (form.gorselKaldir) gorsel = '';
    const veri = { ad, aciklama: $('#hAcik').value, stok: +$('#hStok').value || 0, aktif: $('#hAktif').checked,
      tip: $('#fTip').value, metal: $('#fMetal').value, tas: $('#fTas').value, gorsel };
    const duzenleme = !!form.id;
    if (duzenleme) await api('/hediyeler/' + form.id, 'PUT', veri); else await api('/hediyeler', 'POST', veri);
    modalKapat(); toast(duzenleme ? 'Hediye güncellendi' : 'Hediye eklendi', ad);
    await veriYenile(false); ciz();
  } catch (e) { toast('Kaydedilemedi', e.message, 'hata'); btn.disabled = false; btn.textContent = 'Tekrar dene'; }
}
function hediyeSilOnay(id) {
  const h = D.hediyeler.find(x => x.id === id); if (!h) return;
  modalAc(`
  <div class="perde" data-kapat-perde><div class="modal dar" role="alertdialog">
    <header><h2>Hediye silinsin mi?</h2></header>
    <div class="govde"><div class="hucre">${mini(h)}<div><b>${esc(h.ad)}</b></div></div>
      <p style="margin:0;color:var(--metin-2)">Bu hediye kalıcı olarak silinir, <b>geri alınamaz</b>. Eski siparişlerdeki hediye kayıtları korunur. Sadece gizlemek istiyorsan “Yayında” anahtarını kapat.</p></div>
    <footer><button class="btn" data-kapat>Vazgeç</button><button class="btn btn--tehlike-dolu" data-act="hediyeSilOnayla" data-id="${esc(id)}">Evet, sil</button></footer>
  </div></div>`);
}
function siparisSilOnay(no) {
  const s = D.siparisler.find(x => x.no === no); if (!s) return;
  const stokGelir = ['yeni', 'hazirlaniyor'].includes(s.durum);
  modalAc(`
  <div class="perde" data-kapat-perde><div class="modal dar" role="alertdialog">
    <header><h2>Sipariş silinsin mi?</h2></header>
    <div class="govde"><div><b>${esc(s.no)}</b><br><small style="color:var(--metin-2)">${esc(s.teslimat.adSoyad)} · ${para(s.toplam)} · ${DURUM[s.durum]}</small></div>
      <p style="margin:0;color:var(--metin-2)">Sipariş kayıtlarından kalıcı olarak silinir, <b>geri alınamaz</b>.${stokGelir ? ' Sipariş henüz gönderilmediği için ürün ve hediye stokları geri eklenir.' : ''}</p></div>
    <footer><button class="btn" data-kapat>Vazgeç</button><button class="btn btn--tehlike-dolu" data-act="siparisSilOnayla" data-no="${esc(no)}">Evet, sil</button></footer>
  </div></div>`);
}

/* ---------- 4. BÜLTEN ---------- */
async function bultenCiz() {
  D.bulten = await api('/bulten');
  $('#icerik').innerHTML = `<section class="kart"><header><h2>${D.bulten.length} abone</h2>
    ${D.bulten.length ? `<button class="btn btn--kucuk" data-act="bultenKopyala">E-postaları kopyala</button>` : ''}</header>
    ${D.bulten.length ? `<div class="tablo-kap"><table><thead><tr><th>E-posta</th><th>Ad</th><th>Tarih</th></tr></thead>
    <tbody>${D.bulten.map(b => `<tr><td>${esc(b.eposta)}</td><td>${esc(b.ad)}</td><td>${tarihYaz(b.tarih)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="bos">Henüz abone yok.</div>'}</section>`;
}

/* ---------- 5. AYARLAR ---------- */
async function ayarCiz() {
  D.ayar = await api('/ayarlar');
  const a = D.ayar;
  const alan = (id, et, deger, tip = 'text', ek = '') => `<div class="alan"><label for="${id}">${et}</label><input id="${id}" type="${tip}" value="${esc(deger)}" ${ek}></div>`;
  $('#icerik').innerHTML = `
  <div class="ikili">
    <section class="kart"><header><h2>Mağaza ayarları</h2></header>
      <form class="govde form" id="ayarForm">
        <div class="bolum-b">Kargo & stok</div>
        <div class="satir3">
          ${alan('aLimit', 'Ücretsiz kargo + hediye limiti (₺)', a.kargoBedavaLimit, 'number', 'min="0"')}
          ${alan('aKargo', 'Standart kargo ücreti (₺)', a.kargoUcreti, 'number', 'min="0"')}
          ${alan('aAz', 'Genel az stok eşiği (adet)', a.azStokLimiti, 'number', 'min="0"')}
        </div>
        <span class="ipucu">Sepet tutarı bu limite ulaşınca kargo bedava olur ve müşteri hediyelerden birini seçer (sitedeki yazılar otomatik güncellenir).</span>
        <div class="bolum-b" style="margin-top:8px">İletişim & ödeme bilgileri</div>
        <div class="satir2">${alan('aMarka', 'Marka adı', a.marka)}${alan('aTel', 'Telefon', a.telefon)}</div>
        <div class="satir2">${alan('aWp', 'WhatsApp (905… biçiminde)', a.whatsapp)}${alan('aEposta', 'E-posta', a.eposta, 'email')}</div>
        <div class="satir2">${alan('aIban', 'IBAN', a.iban)}${alan('aIbanSahip', 'Hesap sahibi', a.ibanSahibi)}</div>
        <div><button class="btn btn--altin" type="submit">Ayarları kaydet</button></div>
      </form></section>
    <section class="kart"><header><h2>Şifre değiştir</h2></header>
      <form class="govde form" id="sifreForm">
        ${alan('sEski', 'Mevcut şifre', '', 'password', 'autocomplete="current-password"')}
        ${alan('sYeni', 'Yeni şifre (en az 8 karakter)', '', 'password', 'autocomplete="new-password"')}
        <div><button class="btn" type="submit">Şifreyi güncelle</button></div>
      </form></section>
  </div>`;
  $('#ayarForm').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      const v = await api('/ayarlar', 'PUT', {
        kargoBedavaLimit: $('#aLimit').value, kargoUcreti: $('#aKargo').value,
        azStokLimiti: $('#aAz').value, marka: $('#aMarka').value, telefon: $('#aTel').value,
        whatsapp: $('#aWp').value, eposta: $('#aEposta').value, iban: $('#aIban').value, ibanSahibi: $('#aIbanSahip').value
      });
      D.ayar = v.ayar; toast('Ayarlar kaydedildi'); await veriYenile(false);
    } catch (er) { toast('Hata', er.message, 'hata'); }
  });
  $('#sifreForm').addEventListener('submit', async e => {
    e.preventDefault();
    try { await api('/sifre', 'POST', { eski: $('#sEski').value, yeni: $('#sYeni').value }); e.target.reset(); toast('Şifre güncellendi'); }
    catch (er) { toast('Hata', er.message, 'hata'); }
  });
}

/* ---------- ilk şifre değişimi (zorunlu) ---------- */
function zorunluSifre() {
  modalAc(`
  <div class="perde"><div class="modal dar" role="dialog">
    <header><h2>Şifreni belirle</h2></header>
    <form id="zSifre"><div class="govde form">
      <p style="margin:0;color:var(--metin-2)">Güvenliğin için varsayılan şifreyi değiştirmelisin.</p>
      <div class="alan"><label for="zEski">Mevcut (varsayılan) şifre</label><input id="zEski" type="password" required autocomplete="current-password"></div>
      <div class="alan"><label for="zYeni">Yeni şifre (en az 8 karakter)</label><input id="zYeni" type="password" required minlength="8" autocomplete="new-password"></div>
      <div class="hata-yazi" id="zHata"></div></div>
      <footer><button class="btn btn--altin" type="submit">Şifreyi kaydet</button></footer></form>
  </div></div>`);
  $('#zSifre').addEventListener('submit', async e => {
    e.preventDefault();
    try { await api('/sifre', 'POST', { eski: $('#zEski').value, yeni: $('#zYeni').value }); D.sifreDegistir = false; modalKapat(); toast('Şifren güncellendi'); }
    catch (er) { $('#zHata').textContent = er.message; }
  });
}

/* ---------- modal ---------- */
const modalAc = html => { $('#modalAlan').innerHTML = html; };
const modalKapat = () => { $('#modalAlan').innerHTML = ''; form = null; };

/* ---------- yeni sipariş takibi (15 sn) ---------- */
async function yokla() {
  try {
    const eski = D.ozet;
    const o = await api('/ozet');
    if (D.sonNo !== null && o.sonSiparisNo && o.sonSiparisNo !== D.sonNo) {
      const yeniler = o.sonSiparisler.filter(s => !D.siparisler.some(x => x.no === s.no));
      (yeniler.length ? yeniler : [o.sonSiparisler[0]]).forEach(s => {
        toast('🛍 Yeni sipariş: ' + s.no, `${s.teslimat.adSoyad} · ${para(s.toplam)}`, 'yeni');
        if (window.Notification && Notification.permission === 'granted') new Notification('Yeni sipariş ' + s.no, { body: `${s.teslimat.adSoyad} · ${para(s.toplam)}` });
      });
      bip();
      await veriYenile(true);
      if (['panel', 'siparisler', 'urunler', 'stok'].includes(D.rota) && !$('#modalAlan').innerHTML) ciz();
    } else if (eski && (o.yeniSayisi !== eski.yeniSayisi || o.azKalan.length !== eski.azKalan.length || o.tukenen.length !== eski.tukenen.length)) {
      await veriYenile(true);
      if (!$('#modalAlan').innerHTML && !document.activeElement?.matches?.('input,textarea,select')) ciz();
    }
    D.sonNo = o.sonSiparisNo || D.sonNo || '';
  } catch { /* geçici ağ hatası */ }
}

async function baslat() {
  iskeletCiz();
  try {
    D.ayar = await api('/ayarlar');
    await veriYenile(true);
  } catch { return; }
  D.sonNo = D.ozet.sonSiparisNo || '';
  D.ilkYuk = false;
  const hash = location.hash.slice(1);
  git(BASLIK[hash] ? hash : 'panel');
  clearInterval(D.zamanlayici);
  D.zamanlayici = setInterval(yokla, 15000);
  if (D.sifreDegistir) zorunluSifre();
}

/* ---------- olaylar ---------- */
document.addEventListener('click', async e => {
  const h = s => e.target.closest(s);
  let el;
  if ((el = h('.nav[data-rota]'))) return git(el.dataset.rota);
  if ((el = h('[data-rota-git]'))) return git(el.dataset.rotaGit);
  if ((el = h('[data-siparis-sil]'))) return siparisSilOnay(el.dataset.siparisSil);
  if ((el = h('[data-hediye-duzenle]'))) return hediyeFormAc(D.hediyeler.find(x => x.id === el.dataset.hediyeDuzenle));
  if ((el = h('[data-hediye-sil]'))) return hediyeSilOnay(el.dataset.hediyeSil);
  if ((el = h('[data-siparis]'))) return siparisDetayAc(el.dataset.siparis);
  if ((el = h('[data-sfiltre]'))) { D.siparisFiltre = el.dataset.sfiltre; return siparisCiz(); }
  if ((el = h('[data-ufiltre]'))) { D.urunFiltre = el.dataset.ufiltre; return urunCiz(false); }
  if ((el = h('[data-urun-duzenle]'))) return urunFormAc(D.urunler.find(u => u.id === el.dataset.urunDuzenle));
  if ((el = h('[data-urun-sil]'))) return urunSilOnay(el.dataset.urunSil);
  if (h('[data-kapat]') || (e.target.matches('[data-kapat-perde]') && !h('.modal') && !h('.cekmece'))) { if (D.sifreDegistir) return; return modalKapat(); }
  if ((el = h('[data-act]'))) {
    const a = el.dataset.act;
    if (a === 'menu') $('#yan').classList.toggle('acik');
    if (a === 'cikis') { await api('/cikis', 'POST').catch(() => {}); clearInterval(D.zamanlayici); girisGoster(); }
    if (a === 'ses') { D.sesAcik = !D.sesAcik; localStorage.setItem('ar_ses', D.sesAcik ? '1' : '0'); sesBtnGuncelle(); if (D.sesAcik) bip(); toast(D.sesAcik ? 'Bildirim sesi açık' : 'Bildirim sesi kapalı'); }
    if (a === 'bildirim') {
      if (!window.Notification) return toast('Desteklenmiyor', 'Bu tarayıcı bildirimleri desteklemiyor.', 'uyari');
      const izin = await Notification.requestPermission();
      toast(izin === 'granted' ? 'Tarayıcı bildirimleri açık' : 'Bildirim izni verilmedi', izin === 'granted' ? 'Yeni siparişlerde masaüstü bildirimi alacaksın.' : '', izin === 'granted' ? '' : 'uyari');
    }
    if (a === 'siparisKaydet') siparisKaydet(el.dataset.no);
    if (a === 'yazdir') siparisYazdir(el.dataset.no);
    if (a === 'urunYeni') urunFormAc(null);
    if (a === 'hediyeYeni') hediyeFormAc(null);
    if (a === 'hediyeKaydet') hediyeKaydet();
    if (a === 'hediyeSilOnayla') {
      el.disabled = true;
      try { await api('/hediyeler/' + el.dataset.id, 'DELETE'); modalKapat(); toast('Hediye silindi'); await veriYenile(false); ciz(); }
      catch (er) { toast('Hata', er.message, 'hata'); el.disabled = false; }
    }
    if (a === 'siparisSilOnayla') {
      el.disabled = true;
      try {
        await api('/siparisler/' + el.dataset.no, 'DELETE'); modalKapat(); toast('Sipariş silindi', el.dataset.no);
        await veriYenile(true); D.sonNo = D.ozet.sonSiparisNo || ''; ciz();
      } catch (er) { toast('Hata', er.message, 'hata'); el.disabled = false; }
    }
    if (a === 'dosyaSec') $('#dosya').click();
    if (a === 'gorselKaldir') { form.gorselVeri = null; form.gorselKaldir = true; $('#onizleme').innerHTML = svg('gorsel', 34); el.hidden = true; }
    if (a === 'urunKaydet') urunKaydet();
    if (a === 'urunSilOnayla') {
      el.disabled = true;
      try { await api('/urunler/' + el.dataset.id, 'DELETE'); modalKapat(); toast('Ürün silindi'); await veriYenile(false); ciz(); }
      catch (er) { toast('Hata', er.message, 'hata'); el.disabled = false; }
    }
    if (a === 'bultenKopyala') { navigator.clipboard?.writeText(D.bulten.map(b => b.eposta).join(', ')).then(() => toast('E-postalar kopyalandı')); }
  }
});
document.addEventListener('change', e => {
  if (e.target.matches('[data-stok]')) stokKaydet(e.target);
  if (e.target.matches('[data-hstok]')) {
    const id = e.target.dataset.hstok, deger = Math.max(0, Math.floor(+e.target.value || 0)), inp = e.target;
    api('/hediyeler/' + id, 'PATCH', { stok: deger })
      .then(v => { const h = D.hediyeler.find(x => x.id === id); if (h) h.stok = v.hediye.stok; inp.classList.add('kaydedildi'); setTimeout(() => inp.classList.remove('kaydedildi'), 1200); hediyeCiz(); })
      .catch(er => toast('Hata', er.message, 'hata'));
  }
  if (e.target.matches('[data-haktif]')) {
    const id = e.target.dataset.haktif;
    api('/hediyeler/' + id, 'PATCH', { aktif: e.target.checked })
      .then(() => { const h = D.hediyeler.find(x => x.id === id); if (h) h.aktif = e.target.checked; toast(e.target.checked ? 'Hediye yayında' : 'Hediye gizlendi'); hediyeCiz(); })
      .catch(er => { toast('Hata', er.message, 'hata'); e.target.checked = !e.target.checked; });
  }
  if (e.target.matches('[data-aktif]')) {
    const id = e.target.dataset.aktif;
    api('/urunler/' + id, 'PATCH', { aktif: e.target.checked })
      .then(() => { const u = D.urunler.find(x => x.id === id); if (u) u.aktif = e.target.checked; toast(e.target.checked ? 'Ürün yayında' : 'Ürün gizlendi'); })
      .catch(er => { toast('Hata', er.message, 'hata'); e.target.checked = !e.target.checked; });
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#modalAlan').innerHTML && !D.sifreDegistir) modalKapat();
  if (e.key === 'Enter' && e.target.matches('[data-stok]')) e.target.blur();
});

/* ---------- açılış: oturum var mı? ---------- */
api('/ben').then(v => { D.sifreDegistir = v.sifreDegistir; baslat(); }).catch(() => { if (!$('#uygulama').innerHTML) girisGoster(); });
