/* ============================================================
   MELEĞİN TAKI DÜNYASI — UYGULAMA
   Bölümler: 0 Entegrasyon · 1 Yardımcılar · 2 SVG takı çizimleri
   3 Durum · 4 Sepet · 5 Ürünler · 6 Sepet · 7 Ödeme
   8 Konsept günleri · 9 Arayüz & animasyon
   ============================================================ */

/* ---------- 0. ENTEGRASYON NOKTALARI ----------
   Ödeme ve kargo altyapısını bağlayacağın tek yer burası.
   Şu an ikisi de "yerel mod"da çalışıyor: sipariş tarayıcıda
   oluşturulur, sunucu gerekmez. Sunucunu hazırlayınca
   aktif:true yap ve uc (endpoint) adresini yaz.              */
const ENTEGRASYON = {
  odeme: {
    aktif: false,                 // sanal POS hazır olunca true
    saglayici: 'iyzico',          // iyzico | paytr | param | stripe
    uc: '/api/odeme/baslat',      // sunucundaki başlatma adresi
    async baslat(siparis) {
      if (!this.aktif) return { durum: 'yerel', mesaj: 'Sanal POS bağlı değil' };
      const y = await fetch(this.uc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siparis)
      });
      const veri = await y.json();
      if (veri.odemeSayfasi) location.href = veri.odemeSayfasi; // 3D Secure yönlendirmesi
      return veri;
    }
  },
  kargo: {
    aktif: false,                 // kargo API'si hazır olunca true
    saglayici: 'aras',            // aras | yurtici | mng | surat
    uc: '/api/kargo/gonderi',
    async gonderiOlustur(siparis) {
      if (!this.aktif) return { durum: 'yerel', takipNo: null };
      const y = await fetch(this.uc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siparis)
      });
      return y.json();
    }
  }
};

/* ---------- 1. YARDIMCILAR ---------- */
const $  = (s, k = document) => k.querySelector(s);
const $$ = (s, k = document) => [...k.querySelectorAll(s)];

const paraBicim = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const para = n => paraBicim.format(n) + ' ₺';   // Türkçe yazım: 1.580 ₺
const tarihBicim = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' });

const depo = {
  al(anahtar, varsayilan) {
    try { const d = localStorage.getItem(anahtar); return d ? JSON.parse(d) : varsayilan; }
    catch { return varsayilan; }
  },
  yaz(anahtar, deger) {
    try { localStorage.setItem(anahtar, JSON.stringify(deger)); } catch { /* gizli sekme */ }
  }
};

const urunBul = id => URUNLER.find(u => u.id === id);
const azalt = s => (s || '').toLocaleLowerCase('tr-TR');

/* ---------- 2. SVG TAKI ÇİZİMLERİ ---------- */
const METAL_AD = { altin: 'Altın rengi', rose: 'Rose renk', gumus: 'Gümüş rengi' };
const TAS_AD = { beyaz: 'Beyaz taş', yakut: 'Kırmızı taş', zumrut: 'Yeşil taş', safir: 'Mavi taş', ametist: 'Mor taş', inci: 'İnci görünümlü', kehribar: 'Kehribar rengi taş' };
const METAL = {
  altin: ['#F8E9BA', '#D4A93F', '#8B6716'],
  rose:  ['#FADFD3', '#DD9B81', '#9E5B45'],
  gumus: ['#F8FBFD', '#C6CFD9', '#82909E']
};
const TAS = {
  beyaz:    ['#FFFFFF', '#D2E5F0', '#83A8BD'],
  yakut:    ['#FF9FAA', '#C4203C', '#6C0D21'],
  zumrut:   ['#A9F2D0', '#15906A', '#094E37'],
  safir:    ['#AAC8FF', '#2A54B9', '#11255D'],
  ametist:  ['#E2C7FF', '#8A4EC5', '#48216F'],
  inci:     ['#FFFFFF', '#F2E6DE', '#C9B4A8'],
  kehribar: ['#FFDAA2', '#DA8A2B', '#874C11']
};

let idSayaci = 0;
function cizim(urun, boy = 200) {
  if (urun.gorsel) return `<img class="urun-foto" src="${urun.gorsel}" alt="${urun.ad}" loading="lazy">`;
  const n = ++idSayaci;
  const m = METAL[urun.metal] || METAL.altin;
  const t = TAS[urun.tas] || TAS.beyaz;
  const mg = `m${n}`, tg = `t${n}`, pg = `p${n}`;

  const defs = `
  <defs>
    <linearGradient id="${mg}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${m[0]}"/><stop offset="42%" stop-color="${m[1]}"/>
      <stop offset="72%" stop-color="${m[2]}"/><stop offset="100%" stop-color="${m[1]}"/>
    </linearGradient>
    <radialGradient id="${tg}" cx="36%" cy="30%" r="78%">
      <stop offset="0%" stop-color="${t[0]}"/><stop offset="46%" stop-color="${t[1]}"/>
      <stop offset="100%" stop-color="${t[2]}"/>
    </radialGradient>
    <radialGradient id="${pg}" cx="34%" cy="28%" r="72%">
      <stop offset="0%" stop-color="#FFFFFF"/><stop offset="55%" stop-color="${t[1]}"/>
      <stop offset="100%" stop-color="${t[2]}"/>
    </radialGradient>
  </defs>`;

  const sekil = { yuzuk, kolye, kupe, bileklik, halhal, inci, set }[urun.tip] || yuzuk;
  return `<svg viewBox="0 0 200 200" width="${boy}" height="${boy}" role="img" aria-label="${urun.ad}" xmlns="http://www.w3.org/2000/svg">${defs}${sekil(mg, tg, pg)}</svg>`;

  /* --- yıldız parıltısı --- */
  function yildiz(x, y, r, o = .95) {
    return `<path d="M${x} ${y - r} L${x + r * .26} ${y - r * .26} L${x + r} ${y} L${x + r * .26} ${y + r * .26} L${x} ${y + r} L${x - r * .26} ${y + r * .26} L${x - r} ${y} L${x - r * .26} ${y - r * .26} Z" fill="#fff" opacity="${o}"/>`;
  }
  /* --- çok yüzlü taş --- */
  function tas(cx, cy, r, grad) {
    return `
      <path d="M${cx} ${cy - r} L${cx + r * .72} ${cy - r * .38} L${cx + r * .72} ${cy + r * .38} L${cx} ${cy + r} L${cx - r * .72} ${cy + r * .38} L${cx - r * .72} ${cy - r * .38} Z" fill="url(#${grad})"/>
      <path d="M${cx} ${cy - r} L${cx + r * .72} ${cy - r * .38} L${cx} ${cy + r * .1} L${cx - r * .72} ${cy - r * .38} Z" fill="#fff" opacity=".34"/>
      <path d="M${cx} ${cy + r} L${cx + r * .72} ${cy + r * .38} L${cx} ${cy + r * .1} Z" fill="#000" opacity=".16"/>
      <path d="M${cx} ${cy - r} L${cx} ${cy + r} M${cx - r * .72} ${cy - r * .38} L${cx + r * .72} ${cy + r * .38} M${cx + r * .72} ${cy - r * .38} L${cx - r * .72} ${cy + r * .38}" stroke="#fff" stroke-width=".6" opacity=".42" fill="none"/>`;
  }
  /* --- damla taş --- */
  function damla(cx, cy, r, grad) {
    return `
      <path d="M${cx} ${cy - r * 1.25} C${cx + r * .92} ${cy - r * .25}, ${cx + r * .82} ${cy + r * .95}, ${cx} ${cy + r} C${cx - r * .82} ${cy + r * .95}, ${cx - r * .92} ${cy - r * .25}, ${cx} ${cy - r * 1.25} Z" fill="url(#${grad})"/>
      <path d="M${cx - r * .3} ${cy - r * .6} C${cx - r * .1} ${cy - r * .2}, ${cx - r * .12} ${cy + r * .3}, ${cx - r * .34} ${cy + r * .45}" stroke="#fff" stroke-width="2.2" opacity=".55" fill="none" stroke-linecap="round"/>`;
  }
  /* --- zincir --- */
  function zincir(d, kalin = 3.4) {
    return `<path d="${d}" fill="none" stroke="url(#${mg})" stroke-width="${kalin}" stroke-linecap="round" stroke-dasharray="1.4 4.2"/>
            <path d="${d}" fill="none" stroke="#fff" stroke-width="${kalin * .3}" opacity=".3" stroke-dasharray="1 5"/>`;
  }

  /* --- şekiller --- */
  function yuzuk(mg, tg) {
    return `
    <ellipse cx="100" cy="176" rx="46" ry="7" fill="#000" opacity=".16"/>
    <ellipse cx="100" cy="126" rx="44" ry="47" fill="none" stroke="url(#${mg})" stroke-width="10"/>
    <ellipse cx="100" cy="126" rx="44" ry="47" fill="none" stroke="#fff" stroke-width="2" opacity=".32" stroke-dasharray="26 120" stroke-dashoffset="18"/>
    <ellipse cx="100" cy="126" rx="35" ry="38" fill="none" stroke="#000" stroke-width="1.4" opacity=".14"/>
    <path d="M86 84 L100 66 L114 84" fill="none" stroke="url(#${mg})" stroke-width="5" stroke-linecap="round"/>
    ${tas(100, 62, 26, tg)}
    ${yildiz(126, 44, 8)}${yildiz(70, 52, 5, .7)}${yildiz(118, 138, 4.5, .55)}`;
  }

  function kolye(mg, tg) {
    return `
    <ellipse cx="100" cy="182" rx="34" ry="5" fill="#000" opacity=".12"/>
    ${zincir('M40 30 Q100 140 160 30')}
    <circle cx="100" cy="119" r="7" fill="none" stroke="url(#${mg})" stroke-width="3.4"/>
    <ellipse cx="100" cy="150" rx="33" ry="33" fill="none" stroke="url(#${mg})" stroke-width="6"/>
    <circle cx="100" cy="150" r="27" fill="url(#${mg})" opacity=".22"/>
    ${tas(100, 150, 19, tg)}
    ${yildiz(132, 124, 7)}${yildiz(64, 132, 4.5, .6)}`;
  }

  function kupe(mg, tg) {
    const bir = (cx) => `
      <path d="M${cx} 52 A14 15 0 1 1 ${cx - 1} 52" fill="none" stroke="url(#${mg})" stroke-width="3.2" stroke-linecap="round"/>
      ${zincir(`M${cx} 82 L${cx} 104`, 3)}
      ${damla(cx, 128, 22, tg)}
      <circle cx="${cx}" cy="104" r="4.6" fill="url(#${mg})"/>`;
    return `
    <ellipse cx="100" cy="182" rx="46" ry="5" fill="#000" opacity=".12"/>
    ${bir(64)}${bir(136)}
    ${yildiz(100, 60, 7)}${yildiz(44, 120, 4.5, .6)}${yildiz(158, 136, 5, .6)}`;
  }

  function bileklik(mg, tg) {
    return `
    <ellipse cx="100" cy="166" rx="62" ry="7" fill="#000" opacity=".14"/>
    <ellipse cx="100" cy="106" rx="70" ry="42" fill="none" stroke="url(#${mg})" stroke-width="7"/>
    <ellipse cx="100" cy="106" rx="70" ry="42" fill="none" stroke="#fff" stroke-width="1.8" opacity=".3" stroke-dasharray="30 180" stroke-dashoffset="40"/>
    ${tas(100, 64, 15, tg)}${tas(62, 70, 10, tg)}${tas(138, 70, 10, tg)}
    <rect x="92" y="142" width="16" height="10" rx="2" fill="url(#${mg})"/>
    ${yildiz(100, 42, 7)}${yildiz(38, 92, 4.5, .55)}`;
  }

  function halhal(mg, tg) {
    return `
    <ellipse cx="100" cy="164" rx="56" ry="6" fill="#000" opacity=".12"/>
    ${zincir('M32 84 Q100 154 168 84', 3)}
    <ellipse cx="100" cy="106" rx="66" ry="44" fill="none" stroke="url(#${mg})" stroke-width="2.6" opacity=".55"/>
    ${damla(100, 134, 13, tg)}
    <circle cx="70" cy="128" r="5" fill="url(#${mg})"/><circle cx="130" cy="128" r="5" fill="url(#${mg})"/>
    ${yildiz(100, 74, 6)}${yildiz(150, 104, 4, .5)}`;
  }

  function inci(mg, tg, pg) {
    let boncuk = '';
    const N = 17;
    for (let i = 0; i <= N; i++) {
      const p = i / N;
      // ikinci dereceden eğri: (34,34) → (100,150) → (166,34)
      const x = (1 - p) * (1 - p) * 34 + 2 * (1 - p) * p * 100 + p * p * 166;
      const y = (1 - p) * (1 - p) * 34 + 2 * (1 - p) * p * 156 + p * p * 34;
      const r = 6.6 + Math.sin(p * Math.PI) * 3.4;
      boncuk += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="url(#${pg})"/>
                 <circle cx="${(x - r * .3).toFixed(1)}" cy="${(y - r * .34).toFixed(1)}" r="${(r * .26).toFixed(1)}" fill="#fff" opacity=".8"/>`;
    }
    return `
    <ellipse cx="100" cy="180" rx="40" ry="5" fill="#000" opacity=".12"/>
    <path d="M34 34 Q100 156 166 34" fill="none" stroke="url(#${mg})" stroke-width="1.6" opacity=".5"/>
    ${boncuk}
    ${yildiz(136, 118, 6)}${yildiz(58, 108, 4, .5)}`;
  }

  function set(mg, tg, pg) {
    return `
    <ellipse cx="100" cy="178" rx="62" ry="6" fill="#000" opacity=".13"/>
    ${zincir('M46 26 Q96 116 146 26')}
    <ellipse cx="96" cy="120" rx="26" ry="26" fill="none" stroke="url(#${mg})" stroke-width="5"/>
    ${tas(96, 120, 15, tg)}
    <g opacity=".95">
      <path d="M40 116 A10 11 0 1 1 39 116" fill="none" stroke="url(#${mg})" stroke-width="2.6"/>
      ${damla(40, 146, 13, tg)}
    </g>
    <ellipse cx="152" cy="140" rx="20" ry="21" fill="none" stroke="url(#${mg})" stroke-width="5"/>
    ${tas(152, 112, 11, tg)}
    ${yildiz(120, 76, 7)}${yildiz(66, 92, 4.5, .55)}`;
  }
}

/* --- vitrin (hero) mücevheri --- */
function vitrinCizimi() {
  return `
  <svg viewBox="0 0 400 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Meleğin Takı Dünyası imza kolyesi">
    <defs>
      <linearGradient id="hm" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FCEFC6"/><stop offset="34%" stop-color="#E0BC5D"/>
        <stop offset="62%" stop-color="#A57F24"/><stop offset="100%" stop-color="#EBD28C"/>
      </linearGradient>
      <radialGradient id="ht" cx="34%" cy="26%" r="80%">
        <stop offset="0%" stop-color="#FFFFFF"/><stop offset="30%" stop-color="#E8F6FF"/>
        <stop offset="64%" stop-color="#9FCBE4"/><stop offset="100%" stop-color="#3D6E8C"/>
      </radialGradient>
      <radialGradient id="hh" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFF6D8" stop-opacity=".5"/>
        <stop offset="100%" stop-color="#FFF6D8" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="hp" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#D8C6B8"/>
      </linearGradient>
    </defs>

    <circle cx="200" cy="286" r="150" fill="url(#hh)"/>

    <!-- zincir -->
    <path d="M62 26 Q200 232 338 26" fill="none" stroke="url(#hm)" stroke-width="4.4" stroke-linecap="round" stroke-dasharray="2 6"/>
    <path d="M62 26 Q200 232 338 26" fill="none" stroke="#FFF6D8" stroke-width="1.2" opacity=".45" stroke-dasharray="1 7"/>

    <!-- bağlantı halkası -->
    <circle cx="200" cy="196" r="9" fill="none" stroke="url(#hm)" stroke-width="4"/>

    <!-- hale: 16 küçük taş -->
    <g>
      ${Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
        const x = 200 + Math.cos(a) * 76, y = 288 + Math.sin(a) * 76;
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.6" fill="url(#ht)" stroke="url(#hm)" stroke-width="1.6"/>`;
      }).join('')}
    </g>

    <!-- ana montür -->
    <circle cx="200" cy="288" r="60" fill="none" stroke="url(#hm)" stroke-width="7"/>
    <circle cx="200" cy="288" r="60" fill="#FBEFEC" opacity=".75"/>

    <!-- merkez damla taş -->
    <path d="M200 226 C246 274, 240 330, 200 348 C160 330, 154 274, 200 226 Z" fill="url(#ht)"/>
    <path d="M200 226 C246 274, 240 330, 200 348 L200 226 Z" fill="#000" opacity=".1"/>
    <path d="M200 232 L226 286 L200 342 L174 286 Z" fill="#fff" opacity=".22"/>
    <path d="M182 258 C176 282, 178 312, 188 330" stroke="#fff" stroke-width="4" opacity=".6" fill="none" stroke-linecap="round"/>

    <!-- parıltılar -->
    <path d="M296 176 l4 13 13 4 -13 4 -4 13 -4 -13 -13 -4 13 -4 z" fill="#FFF8E2" opacity=".95"/>
    <path d="M104 214 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3 z" fill="#FFF8E2" opacity=".75"/>
    <path d="M262 370 l2.6 8 8 2.6 -8 2.6 -2.6 8 -2.6 -8 -8 -2.6 8 -2.6 z" fill="#FFF8E2" opacity=".65"/>
  </svg>`;
}

/* ---------- 3. DURUM ---------- */
const durum = {
  sepet:  depo.al('arenimo_sepet', []),   // [{id, adet}]
  filtre: 'Tümü',
  sirala: 'onerilen',
  konsept: null,
  onizleme: null
};
const sepetKaydet = () => depo.yaz('arenimo_sepet', durum.sepet);

/* ---------- SUNUCUDAN VERİ ---------- */
const SUNUCU = { acik: false };
async function veriYukle() {
  try {
    const [u, a, hd] = await Promise.all([
      fetch('/api/urunler', { cache: 'no-store' }).then(r => { if (!r.ok) throw 0; return r.json(); }),
      fetch('/api/ayarlar', { cache: 'no-store' }).then(r => { if (!r.ok) throw 0; return r.json(); }),
      fetch('/api/hediyeler', { cache: 'no-store' }).then(r => { if (!r.ok) throw 0; return r.json(); })
    ]);
    URUNLER = u;
    HEDIYELER = hd;
    Object.assign(AYARLAR, a);
    SUNUCU.acik = true;
  } catch { SUNUCU.acik = false; }            // sunucu yoksa data.js'teki yedek liste kullanılır
  /* sepeti güncel stoğa göre düzelt */
  durum.sepet = durum.sepet.filter(s => urunBul(s.id) && urunBul(s.id).stok > 0);
  durum.sepet.forEach(s => { s.adet = Math.min(s.adet, urunBul(s.id).stok); });
  sepetKaydet();
}

/* ---------- 4. SEPET HESABI ---------- */
function sepetHesapla() {
  let adet = 0, araToplam = 0;
  durum.sepet.forEach(s => {
    const u = urunBul(s.id);
    if (!u) return;
    adet += s.adet;
    araToplam += u.fiyat * s.adet;
  });
  const kargo = adet === 0 ? 0 : (araToplam >= AYARLAR.kargoBedavaLimit ? 0 : AYARLAR.kargoUcreti);
  return { adet, araToplam, kargo, toplam: araToplam + kargo };
}
/* sepet limiti geçtiyse ve hediye varsa müşteri 1 hediye seçer */
function hediyeUygun() {
  const h = sepetHesapla();
  return h.adet > 0 && h.araToplam >= AYARLAR.kargoBedavaLimit && HEDIYELER.length > 0;
}

/* ---------- 5. ÜRÜN LİSTESİ ---------- */
function urunleriGetir() {
  let liste = durum.filtre === 'Tümü' ? [...URUNLER] : URUNLER.filter(u => u.kategori === durum.filtre);
  const s = durum.sirala;
  if (s === 'ucuz')  liste.sort((a, b) => a.fiyat - b.fiyat);
  if (s === 'pahali') liste.sort((a, b) => b.fiyat - a.fiyat);
  if (s === 'yeni')  liste.sort((a, b) => (b.rozet === 'Yeni') - (a.rozet === 'Yeni'));
  return liste;
}

function kartHtml(u) {
  const eski = u.eski ? `<s>${para(u.eski)}</s>` : '';
  const rozet = u.rozet ? `<span class="kart__rozet">${u.rozet}</span>` : '';
  const esik = u.stokUyari > 0 ? u.stokUyari : (AYARLAR.azStokLimiti || 3);
  const tukendi = u.stok <= 0;
  const stok = tukendi ? `<span class="kart__tukendi">Tükendi</span>`
    : (u.stok <= esik ? `<span class="kart__stok">Son ${u.stok} adet</span>` : '');
  const malzeme = `${METAL_AD[u.metal] || METAL_AD.altin} · ${TAS_AD[u.tas] || TAS_AD.beyaz}`;
  return `
  <article class="kart beliren ${tukendi ? 'tukendi' : ''}" data-id="${u.id}">
    <div class="kart__plaka" data-detay="${u.id}">
      ${rozet}
      ${cizim(u)}
      <div class="kart__gor">
        <button class="btn btn--dolu" data-ekle="${u.id}" ${tukendi ? 'disabled' : ''}>${tukendi ? 'Tükendi' : 'Sepete ekle'}</button>
        <button class="btn btn--cizgi" data-detay="${u.id}">İncele</button>
      </div>
    </div>
    <div class="kart__alt">
      <span class="kart__kat">${u.kategori}</span>
      <h3 class="kart__ad" data-detay="${u.id}" style="cursor:pointer">${u.ad}</h3>
      <span class="kart__mal">${malzeme}</span>
      ${stok}
      <div class="kart__fiyat"><b>${para(u.fiyat)}</b>${eski}</div>
      <button class="btn btn--dolu kart__mobil" data-ekle="${u.id}" ${tukendi ? 'disabled' : ''}>${tukendi ? 'Tükendi' : 'Sepete ekle'}</button>
    </div>
  </article>`;
}

function urunleriCiz() {
  const liste = urunleriGetir();
  const kap = $('#urunIzgara');
  kap.innerHTML = liste.map(kartHtml).join('');
  $('#bosDurum').hidden = liste.length > 0;
  $('#urunSayi').textContent = `${liste.length} parça`;
  belirenleriBagla(kap);
}

/* ---------- 6. SEPET ---------- */
function sepeteEkle(id, adet = 1) {
  const u = urunBul(id);
  if (!u) return;
  if (u.stok <= 0) { toast(`${u.ad} şu an tükendi.`); return; }
  const satir = durum.sepet.find(s => s.id === id);
  if (satir) {
    if (satir.adet >= u.stok) { toast(`${u.ad} için stok sınırına ulaştın.`); return; }
    satir.adet++;
  } else {
    durum.sepet.push({ id, adet });
  }
  sepetKaydet();
  sepetiCiz();
  rozetOynat();
  toast(`${u.ad} sepete eklendi`);
}

function adetDegistir(id, yon) {
  const satir = durum.sepet.find(s => s.id === id);
  if (!satir) return;
  const u = urunBul(id);
  if (yon > 0 && satir.adet >= u.stok) { toast(`Stokta ${u.stok} adet var.`); return; }
  satir.adet += yon;
  if (satir.adet < 1) durum.sepet = durum.sepet.filter(s => s.id !== id);
  sepetKaydet();
  sepetiCiz();
}

function sepettenCikar(id) {
  durum.sepet = durum.sepet.filter(s => s.id !== id);
  sepetKaydet();
  sepetiCiz();
}

function sepetiCiz() {
  const h = sepetHesapla();

  /* üst rozet */
  const rz = $('#sepetSayi');
  rz.textContent = h.adet;
  rz.classList.toggle('acik', h.adet > 0);

  /* kargo çizelgesi (0 → kargo limiti) */
  {
    const netB = h.araToplam, limB = AYARLAR.kargoBedavaLimit;
    const tamam = h.adet > 0 && netB >= limB;
    const yuzde = Math.min(100, Math.max(0, netB / limB * 100));
    $('#bantDurum').textContent = tamam ? 'Kargonuz bedava 🎉'
      : (h.adet === 0 ? 'Sepetin boş' : `Sepet tutarı: ${para(netB)}`);
    const hd = HEDIYELER.length > 0;
    $('#bantAlt').textContent = tamam
      ? `${para(limB)} ve üzeri siparişlerde kargo ücretsiz${hd ? ' · hediyeni ödeme adımında seç 🎁' : ''}`
      : `Ücretsiz kargo${hd ? ' ve hediye hakkı' : ''} için ${para(limB - (h.adet === 0 ? 0 : netB))} kaldı`;
    $('#bantIlerle').style.width = yuzde.toFixed(1) + '%';
    $('#kargoYol').setAttribute('aria-valuenow', Math.round(Math.min(netB, limB)));
    $('#kargoGrafik').classList.toggle('tamam', tamam);
  }

  /* ücretsiz kargo çubuğu */
  const net = h.araToplam, lim = AYARLAR.kargoBedavaLimit;
  $('#kargoYazi').innerHTML = h.adet === 0 ? `<b>${para(lim)}</b> ve üzeri siparişlerde kargo ücretsiz`
    : (net >= lim ? `<b>Kargo ücretsiz</b> — tebrikler!${HEDIYELER.length ? ' Hediyeni ödeme adımında seç 🎁' : ''}` : `Ücretsiz kargoya <b>${para(lim - net)}</b> kaldı`);
  $('#kargoIlerle').style.width = (h.adet === 0 ? 0 : Math.min(100, net / lim * 100)).toFixed(0) + '%';

  /* satırlar */
  const liste = $('#sepetListe');
  if (durum.sepet.length === 0) {
    liste.innerHTML = `
      <div class="sepet-bos">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <p>Sepetin henüz boş.</p>
        <button class="btn btn--cizgi" data-kapat-cekmece>Koleksiyona dön</button>
      </div>`;
  } else {
    liste.innerHTML = durum.sepet.map(s => {
      const u = urunBul(s.id);
      const fiyatYazi = `<b>${para(u.fiyat * s.adet)}</b>`;
      return `
      <div class="sepet-satir">
        <div class="sepet-satir__gor">${cizim(u, 64)}</div>
        <div>
          <div class="sepet-satir__ad">${u.ad}</div>
          <div class="sepet-satir__mal">${u.kategori}</div>
          <div class="sepet-satir__fiyat">${fiyatYazi}</div>
        </div>
        <div>
          <div class="sayac">
            <button data-eksi="${u.id}" aria-label="Azalt">−</button>
            <b>${s.adet}</b>
            <button data-arti="${u.id}" aria-label="Artır">+</button>
          </div>
          <button class="sil" data-sil="${u.id}">Kaldır</button>
        </div>
      </div>`;
    }).join('');
  }

  /* özet */
  $('#ozetAra').textContent = para(h.araToplam);
  $('#ozetKargo').textContent = h.adet === 0 ? '—' : (h.kargo === 0 ? 'Bedava' : para(h.kargo));
  $('#ozetToplam').textContent = para(h.toplam);
  $('#odemeGec').disabled = h.adet === 0;
}

function cekmeceAc(ac) {
  $('#cekmece').classList.toggle('acik', ac);
  $('#cekmece').setAttribute('aria-hidden', String(!ac));
  $('#perde').classList.toggle('acik', ac);
  document.body.classList.toggle('kilit', ac);
}

/* ---------- 7. ÖDEME AKIŞI ---------- */
const siparisTaslak = { teslimat: {}, kargo: 'standart', odeme: 'havale', adim: 1, hediye: null };

const KARGO_SECENEK = [
  { id: 'standart', ad: 'Standart kargo', not: 'Ücretsiz kargo limiti ve üzeri siparişlerde bedava', ucret: null }
];
const ODEME_SECENEK = [
  { id: 'havale', ad: 'Havale / EFT', not: 'IBAN bilgisi siparişten sonra gösterilir', ek: 0, aktif: true }
];

/* ödeme adımları: hediye hakkı varsa ilk adım hediye seçimi */
const adimlar = () => [...(hediyeUygun() ? ['hediye'] : []), 'teslimat', 'kargo', 'odeme', 'ozet'];

function odemeAc() {
  siparisTaslak.adim = 1;
  if (!hediyeUygun() || !HEDIYELER.some(x => x.id === siparisTaslak.hediye)) siparisTaslak.hediye = null;
  $('#odemeModal').hidden = false;
  document.body.classList.add('kilit');
  odemeCiz();
}
function odemeKapat() {
  $('#odemeModal').hidden = true;
  if (!$('#cekmece').classList.contains('acik')) document.body.classList.remove('kilit');
}

function kargoUcreti() {
  const h = sepetHesapla();
  const s = KARGO_SECENEK.find(k => k.id === siparisTaslak.kargo);
  return s.ucret === null ? h.kargo : s.ucret;
}
function genelToplam() {
  const h = sepetHesapla();
  const o = ODEME_SECENEK.find(x => x.id === siparisTaslak.odeme);
  return h.araToplam + kargoUcreti() + (o ? o.ek : 0);
}

function odemeCiz() {
  const h = sepetHesapla();
  const AD = adimlar();
  const a = AD[siparisTaslak.adim - 1];
  const hd = HEDIYELER.find(x => x.id === siparisTaslak.hediye);
  const t = siparisTaslak.teslimat;
  let govde = '', altSol = '', altSag = '';

  if (a === 'hediye') {
    govde = `
      <p class="lede" style="margin:0">Alışverişin ${para(AYARLAR.kargoBedavaLimit)} ve üzeri olduğu için hediye hakkın var. <b>Sadece 1 hediye</b> seçebilirsin.</p>
      <div class="hediye-izgara">${HEDIYELER.map(x => `
        <label class="hediye ${siparisTaslak.hediye === x.id ? 'secili' : ''}">
          <input type="radio" name="hediyeSec" value="${x.id}" ${siparisTaslak.hediye === x.id ? 'checked' : ''}>
          <span class="hediye__gor">${cizim(x, 96)}</span>
          <b>${x.ad}</b>
          ${x.aciklama ? `<small>${x.aciklama}</small>` : ''}
          <span class="hediye__tik" aria-hidden="true">✓</span>
        </label>`).join('')}</div>`;
    altSag = `<button class="btn btn--altin" data-odeme-ileri ${hd ? '' : 'disabled'}>Teslimata geç</button>`;
  }

  if (a === 'teslimat') {
    govde = `
      <div class="alan"><label for="adSoyad">Ad Soyad</label>
        <input id="adSoyad" type="text" value="${t.adSoyad || ''}" placeholder="Zeynep Yılmaz" autocomplete="name"></div>
      <div class="ikili">
        <div class="alan"><label for="telefon">Telefon</label>
          <input id="telefon" type="tel" value="${t.telefon || ''}" placeholder="0555 000 00 00" autocomplete="tel"></div>
        <div class="alan"><label for="eposta">E-posta</label>
          <input id="eposta" type="email" value="${t.eposta || ''}" placeholder="ornek@eposta.com" autocomplete="email"></div>
      </div>
      <div class="alan"><label for="adres">Adres</label>
        <textarea id="adres" placeholder="Mahalle, sokak, kapı no, daire" autocomplete="street-address">${t.adres || ''}</textarea></div>
      <div class="ikili">
        <div class="alan"><label for="il">İl</label>
          <input id="il" type="text" value="${t.il || ''}" placeholder="İstanbul"></div>
        <div class="alan"><label for="ilce">İlçe</label>
          <input id="ilce" type="text" value="${t.ilce || ''}" placeholder="Kadıköy"></div>
      </div>
      <div class="alan"><label for="notu">Sipariş notu (isteğe bağlı)</label>
        <input id="notu" type="text" value="${t.notu || ''}" placeholder="Hediye paketi olsun, kartına 'Nice yıllara' yazın"></div>`;
    altSol = siparisTaslak.adim > 1 ? `<button class="btn btn--cizgi" data-odeme-geri>Geri</button>` : '';
    altSag = `<button class="btn btn--altin" data-odeme-ileri>Kargoya geç</button>`;
  }

  if (a === 'kargo') {
    govde = KARGO_SECENEK.map(k => {
      const ucret = k.ucret === null ? (h.kargo === 0 ? 'Bedava' : para(h.kargo)) : (k.ucret === 0 ? 'Ücretsiz' : para(k.ucret));
      return `<label class="secenek ${siparisTaslak.kargo === k.id ? 'secili' : ''}">
        <input type="radio" name="kargoSec" value="${k.id}" ${siparisTaslak.kargo === k.id ? 'checked' : ''}>
        <span><b>${k.ad}</b><span>${k.not}</span></span>
        <span class="ucret">${ucret}</span>
      </label>`;
    }).join('');
    altSol = `<button class="btn btn--cizgi" data-odeme-geri>Geri</button>`;
    altSag = `<button class="btn btn--altin" data-odeme-ileri>Ödemeye geç</button>`;
  }

  if (a === 'odeme') {
    govde = ODEME_SECENEK.map(o => `
      <label class="secenek ${o.aktif ? '' : 'pasif'} ${siparisTaslak.odeme === o.id ? 'secili' : ''}">
        <input type="radio" name="odemeSec" value="${o.id}" ${siparisTaslak.odeme === o.id ? 'checked' : ''} ${o.aktif ? '' : 'disabled'}>
        <span><b>${o.ad}</b><span>${o.not}</span></span>
        <span class="ucret">${o.ek ? '+' + para(o.ek) : ''}</span>
      </label>`).join('');
    altSol = `<button class="btn btn--cizgi" data-odeme-geri>Geri</button>`;
    altSag = `<button class="btn btn--altin" data-odeme-ileri>Özeti gör</button>`;
  }

  if (a === 'ozet') {
    const k = KARGO_SECENEK.find(x => x.id === siparisTaslak.kargo);
    const o = ODEME_SECENEK.find(x => x.id === siparisTaslak.odeme);
    govde = `
      <ul class="ozellik" style="border-top:none;padding-top:0">
        ${durum.sepet.map(s => {
          const u = urunBul(s.id);
          return `<li><span>${u.ad} × ${s.adet}</span><span>${para(u.fiyat * s.adet)}</span></li>`;
        }).join('')}
      </ul>
      <div style="display:grid;gap:7px">
        <div class="ozet-satir"><span>Ara toplam</span><span>${para(h.araToplam)}</span></div>
        <div class="ozet-satir"><span>${k.ad}</span><span>${kargoUcreti() === 0 ? 'Bedava' : para(kargoUcreti())}</span></div>
        ${o.ek ? `<div class="ozet-satir"><span>${o.ad} farkı</span><span>${para(o.ek)}</span></div>` : ''}
        <div class="ozet-satir ozet-satir--toplam"><span>Genel toplam</span><b>${para(genelToplam())}</b></div>
      </div>
      <ul class="ozellik">
        <li><span>Teslimat</span><span>${t.adSoyad || '—'} · ${t.ilce || ''} ${t.il || ''}</span></li>
        <li><span>Telefon</span><span>${t.telefon || '—'}</span></li>
        <li><span>Ödeme</span><span>${o.ad}</span></li>
        ${hd ? `<li><span>Hediyeniz 🎁</span><span>${hd.ad}</span></li>` : ''}
      </ul>`;
    altSol = `<button class="btn btn--cizgi" data-odeme-geri>Geri</button>`;
    altSag = `<button class="btn btn--altin" data-siparis-tamamla>Siparişi tamamla</button>`;
  }

  const BASLIK = { hediye: 'Hediyenizi seçin', teslimat: 'Teslimat bilgileri', kargo: 'Kargo', odeme: 'Ödeme yöntemi', ozet: 'Sipariş özeti' };
  $('#odemeIcerik').innerHTML = `
    <div class="odeme-bas">
      <span class="etiket">Adım ${siparisTaslak.adim} / ${AD.length}</span>
      <h3 style="margin-top:6px">${BASLIK[a]}</h3>
      <div class="odeme-adim">${AD.map((_, i) => `<div class="${i + 1 <= siparisTaslak.adim ? 'gecti' : ''}"></div>`).join('')}</div>
    </div>
    <div class="odeme-govde">${govde}</div>
    <div class="odeme-alt">
      <div>${altSol}</div>
      <div style="display:flex;align-items:center;gap:14px">
        <span style="font-size:.9rem;color:var(--metin-2)">${para(genelToplam())}</span>
        ${altSag}
      </div>
    </div>`;
}

function teslimatDogrula() {
  const alanlar = [['adSoyad', 'Ad soyad gerekli'], ['telefon', 'Telefon gerekli'], ['adres', 'Adres gerekli'], ['il', 'İl gerekli'], ['ilce', 'İlçe gerekli']];
  let gecerli = true;
  alanlar.forEach(([id, uyari]) => {
    const el = $('#' + id);
    const kap = el.closest('.alan');
    kap.querySelector('.uyari')?.remove();
    kap.classList.remove('hata');
    const v = el.value.trim();
    const rakam = v.replace(/\D/g, '');
    let mesaj = '';
    if (!v) mesaj = uyari;
    else if (id === 'adSoyad' && v.split(/\s+/).filter(k => k.length >= 2).length < 2) mesaj = 'Ad ve soyadını yaz';
    else if (id === 'telefon' && (rakam.length < 10 || rakam.length > 13)) mesaj = 'Geçerli bir telefon yaz (örn. 0532 123 45 67)';
    else if (id === 'adres' && v.length < 10) mesaj = 'Adresini mahalle, cadde ve kapı no ile yaz';
    else if ((id === 'il' || id === 'ilce') && v.length < 2) mesaj = uyari;
    if (mesaj) {
      gecerli = false;
      kap.classList.add('hata');
      kap.insertAdjacentHTML('beforeend', `<span class="uyari">${mesaj}</span>`);
    }
  });
  if (gecerli) {
    siparisTaslak.teslimat = {
      adSoyad: $('#adSoyad').value.trim(), telefon: $('#telefon').value.trim(),
      eposta: $('#eposta').value.trim(), adres: $('#adres').value.trim(),
      il: $('#il').value.trim(), ilce: $('#ilce').value.trim(), notu: $('#notu').value.trim()
    };
  }
  return gecerli;
}

async function siparisiTamamla() {
  const buton = $('[data-siparis-tamamla]');
  if (buton) { buton.disabled = true; buton.textContent = 'Gönderiliyor…'; }
  let siparis;

  if (SUNUCU.acik) {
    /* sunucu fiyatı ve stoğu kendisi doğrular; sipariş admin panele düşer */
    try {
      const y = await fetch('/api/siparis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urunler: durum.sepet.map(s => ({ id: s.id, adet: s.adet })),
          teslimat: siparisTaslak.teslimat, kargo: 'standart', odeme: 'havale',
          hediye: hediyeUygun() ? siparisTaslak.hediye : null
        })
      });
      const v = await y.json();
      if (!y.ok || !v.ok) {
        toast(v.hata || 'Sipariş oluşturulamadı.');
        if (y.status === 409) { await veriYukle(); sepetiCiz(); urunleriCiz(); }
        if (/hediye/i.test(v.hata || '')) { await veriYukle(); siparisTaslak.hediye = null; siparisTaslak.adim = 1; odemeCiz(); return; }
        if (buton) { buton.disabled = false; buton.textContent = 'Siparişi tamamla'; }
        return;
      }
      siparis = v.siparis;
    } catch {
      toast('Bağlantı hatası. İnternetini kontrol edip tekrar dene.');
      if (buton) { buton.disabled = false; buton.textContent = 'Siparişi tamamla'; }
      return;
    }
  } else {
    /* sunucu yoksa eski yerel mod (sipariş tarayıcıda kalır, WhatsApp ile gider) */
    const h = sepetHesapla();
    siparis = {
      no: 'MT-' + Date.now().toString(36).toUpperCase().slice(-6), tarih: new Date().toISOString(),
      urunler: durum.sepet.map(s => { const u = urunBul(s.id); return { id: u.id, ad: u.ad, adet: s.adet, birim: u.fiyat }; }),
      hediye: (hediyeUygun() && HEDIYELER.find(x => x.id === siparisTaslak.hediye)) ? { id: siparisTaslak.hediye, ad: HEDIYELER.find(x => x.id === siparisTaslak.hediye).ad } : null,
      kargo: { yontem: 'standart', ucret: kargoUcreti() }, odeme: { yontem: 'havale' },
      teslimat: siparisTaslak.teslimat, toplam: genelToplam()
    };
    const gecmis = depo.al('arenimo_siparisler', []); gecmis.push(siparis); depo.yaz('arenimo_siparisler', gecmis);
  }
  const no = siparis.no;

  durum.sepet = [];
  siparisTaslak.hediye = null;
  sepetKaydet();
  if (SUNUCU.acik) await veriYukle();           // stok güncel görünsün
  sepetiCiz();
  urunleriCiz();
  cekmeceAc(false);

  const metin = siparisMetni(siparis);
  const o = ODEME_SECENEK.find(x => x.id === siparis.odeme.yontem);
  $('#odemeIcerik').innerHTML = `
    <div class="basari">
      <div class="basari__halka"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M20 6 9 17l-5-5"/></svg></div>
      <span class="etiket">Siparişin alındı</span>
      <div class="siparis-no">${no}</div>
      <p class="lede" style="text-align:center">Teşekkürler ${siparis.teslimat.adSoyad.split(' ')[0]}. Siparişin bize ulaştı; en kısa sürede seninle iletişime geçeceğiz.</p>
      ${siparis.odeme.yontem === 'havale' ? `
        <ul class="ozellik" style="width:100%;text-align:left">
          <li><span>IBAN</span><b style="user-select:all">${AYARLAR.iban}</b></li>
          <li><span>Hesap sahibi</span><span>${AYARLAR.ibanSahibi}</span></li>
          <li><span>Açıklama</span><b style="user-select:all">${no}</b></li>
          <li><span>Tutar</span><span>${para(siparis.toplam)}</span></li>
        </ul>` : `<p class="not-kutu">${o.ad} seçildi. Toplam ${para(siparis.toplam)}.</p>`}
      ${siparis.hediye ? `<p class="not-kutu" style="text-align:center">🎁 Hediyen: <b>${siparis.hediye.ad}</b></p>` : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <button class="btn btn--cizgi" data-kopyala="${encodeURIComponent(metin)}">Sipariş özetini kopyala</button>
        <a class="btn btn--altin" href="https://wa.me/${AYARLAR.whatsapp}?text=${encodeURIComponent(metin)}" target="_blank" rel="noopener">WhatsApp'tan yaz</a>
      </div>
      <button class="btn btn--cizgi" data-odeme-kapat style="margin-top:6px">Alışverişe devam et</button>
    </div>`;
  toast(`Sipariş ${no} oluşturuldu.`);
}

function siparisMetni(s) {
  const satirlar = s.urunler.map(u => `• ${u.ad} × ${u.adet} — ${para(u.birim * u.adet)}`).join('\n');
  return `${AYARLAR.marka} — Sipariş ${s.no}
${satirlar}
${s.hediye ? `Hediye: ${s.hediye.ad}\n` : ''}Kargo: ${s.kargo.ucret ? para(s.kargo.ucret) : 'Ücretsiz'}
Toplam: ${para(s.toplam)}
Ad: ${s.teslimat.adSoyad}
Telefon: ${s.teslimat.telefon}
Adres: ${s.teslimat.adres}, ${s.teslimat.ilce}/${s.teslimat.il}${s.teslimat.notu ? `\nNot: ${s.teslimat.notu}` : ''}`;
}

/* ---------- 8. KONSEPT GÜNLERİ ---------- */
function konseptAraligi(k, d = new Date()) {
  const yil = d.getFullYear();
  const [ab, gb] = k.basla.split('-').map(Number);
  const [ae, ge] = k.bit.split('-').map(Number);
  let bas = new Date(yil, ab - 1, gb, 0, 0, 0);
  let bit = new Date(yil, ae - 1, ge, 23, 59, 59);
  if (bit < bas) {                              // yıl değiştiren aralık (ör. Aralık → Ocak)
    if (d >= bas) bit = new Date(yil + 1, ae - 1, ge, 23, 59, 59);
    else bas = new Date(yil - 1, ab - 1, gb, 0, 0, 0);
  }
  return { bas, bit, aktif: d >= bas && d <= bit };
}

function sonrakiBaslangic(k, d = new Date()) {
  const { bas } = konseptAraligi(k, d);
  return bas >= d ? bas : new Date(bas.getFullYear() + 1, bas.getMonth(), bas.getDate());
}

function konseptleriCiz() {
  const simdi = new Date();
  const aktif = KONSEPT_GUNLERI.find(k => konseptAraligi(k, simdi).aktif);
  durum.konsept = aktif || null;

  const gosterilen = durum.onizleme || aktif;

  /* aktif konsept paneli */
  const panel = $('#konseptAktif');
  if (gosterilen) {
    const ar = konseptAraligi(gosterilen, simdi);
    const bitis = ar.aktif ? ar.bit : null;
    const baslangic = ar.aktif ? null : sonrakiBaslangic(gosterilen, simdi);
    panel.hidden = false;
    panel.innerHTML = `
      <div>
        <span class="canli"><i></i>${ar.aktif ? 'Vitrinde şu an' : durum.onizleme ? 'Önizleme' : 'Yaklaşan konsept'}</span>
        <h3>${gosterilen.ad}</h3>
        <p class="lede">${gosterilen.aciklama}</p>
        <p style="margin-top:14px;font-size:.84rem;color:var(--metin-2)">
          ${tarihBicim.format(ar.bas)} – ${tarihBicim.format(ar.bit)} · ${gosterilen.slogan}
        </p>
        ${durum.onizleme ? `<button class="btn btn--cizgi" data-onizleme-kapat style="margin-top:16px">Önizlemeden çık</button>` : ''}
      </div>
      <div>
        <span class="etiket">${bitis ? 'Bitmesine kalan' : 'Başlamasına kalan'}</span>
        <div class="geri-sayim" id="geriSayim" data-hedef="${(bitis || baslangic).getTime()}">
          ${['Gün', 'Saat', 'Dakika', 'Saniye'].map(a => `<div class="gs-kutu"><b>00</b><span>${a}</span></div>`).join('')}
        </div>
      </div>`;
    geriSayimGuncelle();
  } else {
    panel.hidden = true;
  }

  /* takvim kartları */
  $('#konseptListe').innerHTML = KONSEPT_GUNLERI.map(k => {
    const ar = konseptAraligi(k, simdi);
    return `
    <button class="konsept-kart" style="--kk:${k.renk}" data-konsept="${k.ad}">
      <span class="tar">${tarihBicim.format(ar.bas)} – ${tarihBicim.format(ar.bit)}</span>
      <h3>${k.ad}</h3>
      <p>${k.slogan}</p>
      <span class="onizle">${ar.aktif ? 'Şu an vitrinde →' : 'Önizle →'}</span>
    </button>`;
  }).join('');

  /* kayan şerit metni */
  const konseptYazi = gosterilen ? `${gosterilen.etiket} · ${gosterilen.slogan}` : 'A KALİTE İMİTASYON TAKI';
  const parcalar = [
    konseptYazi,
    `${para(AYARLAR.kargoBedavaLimit)} ÜZERİ KARGO BEDAVA`,
    ...(HEDIYELER.length ? [`${para(AYARLAR.kargoBedavaLimit)} ÜZERİ HEDİYENİ SEÇ`] : [])
  ];
  const grup = `<div class="serit__grup">${parcalar.map(p => `<span>${p}</span><i>✦</i>`).join('')}</div>`;
  $('#seritRay').innerHTML = grup + grup;
}

function geriSayimGuncelle() {
  const kap = $('#geriSayim');
  if (!kap) return;
  const fark = Math.max(0, +kap.dataset.hedef - Date.now());
  const sn = Math.floor(fark / 1000);
  const deger = [Math.floor(sn / 86400), Math.floor(sn % 86400 / 3600), Math.floor(sn % 3600 / 60), sn % 60];
  $$('.gs-kutu b', kap).forEach((b, i) => { b.textContent = String(deger[i]).padStart(2, '0'); });
}

/* ---------- 9. ARAYÜZ & ANİMASYON ---------- */
function toast(mesaj) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z"/></svg><span>${mesaj}</span>`;
  $('#toastlar').appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 300ms ease, transform 300ms ease';
    el.style.opacity = '0'; el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 320);
  }, 2600);
}

function rozetOynat() {
  const rz = $('#sepetSayi');
  rz.classList.remove('zipla');
  void rz.offsetWidth;
  rz.classList.add('zipla');
}

function urunDetayAc(id) {
  const u = urunBul(id);
  if (!u) return;
  const malzeme = `A kalite imitasyon · ${(METAL_AD[u.metal] || METAL_AD.altin).toLocaleLowerCase('tr-TR')}`;
  $('#urunDetayIcerik').innerHTML = `
    <div class="urun-detay">
      <div class="urun-detay__gor">${cizim(u, 320)}</div>
      <div class="urun-detay__bil">
        <span class="etiket">${u.kategori}</span>
        <h3>${u.ad}</h3>
        <div class="detay-fiyat"><b>${para(u.fiyat)}</b>${u.eski ? `<s>${para(u.eski)}</s>` : ''}</div>
        <p class="lede">${u.aciklama}</p>
        <ul class="ozellik">
          <li><span>Malzeme</span><span>${malzeme}</span></li>
          <li><span>Taş</span><span>${TAS_AD[u.tas] || TAS_AD.beyaz}</span></li>
          <li><span>Stok</span><span>${u.stok > 0 ? (u.stok <= 5 ? `Son ${u.stok} adet` : 'Stokta') : 'Tükendi'}</span></li>
          <li><span>Kargo</span><span>${para(AYARLAR.kargoBedavaLimit)} üzeri ücretsiz</span></li>
        </ul>
        ${HEDIYELER.length ? `<p class="not-kutu">${para(AYARLAR.kargoBedavaLimit)} ve üzeri alışverişlerde kargo bedava ve hediyeni sen seçersin.</p>` : ''}
        <button class="btn btn--altin btn--genis" data-ekle="${u.id}" ${u.stok <= 0 ? 'disabled' : ''}>${u.stok <= 0 ? 'Tükendi' : `Sepete ekle · ${para(u.fiyat)}`}</button>
      </div>
    </div>`;
  $('#urunModal').hidden = false;
  document.body.classList.add('kilit');
}
function urunDetayKapat() {
  $('#urunModal').hidden = true;
  if (!$('#cekmece').classList.contains('acik')) document.body.classList.remove('kilit');
}

/* --- ışıltı tuvali --- */
function isiltiBaslat() {
  const c = $('#isilti');
  if (!c) return;
  const ctx = c.getContext('2d');
  const azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let p = [], g = 0, h = 0;

  function olustur() {
    const o = c.parentElement.getBoundingClientRect();
    g = c.width = o.width * devicePixelRatio;
    h = c.height = o.height * devicePixelRatio;
    const say = Math.min(90, Math.round(o.width / 14));
    p = Array.from({ length: say }, () => ({
      x: Math.random() * g, y: Math.random() * h,
      r: (Math.random() * 1.7 + .4) * devicePixelRatio,
      hiz: (Math.random() * .22 + .05) * devicePixelRatio,
      faz: Math.random() * Math.PI * 2,
      tempo: Math.random() * .022 + .006
    }));
  }
  function ciz() {
    ctx.clearRect(0, 0, g, h);
    p.forEach(z => {
      if (!azHareket) { z.y -= z.hiz; z.faz += z.tempo; if (z.y < -6) { z.y = h + 6; z.x = Math.random() * g; } }
      const o = .28 + Math.abs(Math.sin(z.faz)) * .62;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240,214,150,${o.toFixed(2)})`;
      ctx.shadowBlur = 8 * devicePixelRatio;
      ctx.shadowColor = 'rgba(240,214,150,.55)';
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    if (!azHareket) requestAnimationFrame(ciz);
  }
  olustur(); ciz();
  addEventListener('resize', () => { olustur(); if (azHareket) ciz(); });
}

/* --- kaydırınca beliren bölümler --- */
let gozlemci = null;
function belirenleriBagla(kap = document) {
  if (!('IntersectionObserver' in window)) {
    $$('.beliren', kap).forEach(e => e.classList.add('gorunur'));
    return;
  }
  if (!gozlemci) {
    gozlemci = new IntersectionObserver((girisler) => {
      girisler.forEach((g, i) => {
        if (g.isIntersecting) {
          setTimeout(() => g.target.classList.add('gorunur'), Math.min(i * 60, 320));
          gozlemci.unobserve(g.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .06 });
  }
  $$('.beliren:not(.gorunur)', kap).forEach(e => gozlemci.observe(e));
}

/* --- vitrin fare paralaksı --- */
function paralaks() {
  const sahne = $('#vitrinSahne'), m = $('#heroJewel');
  if (!sahne || !m || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  sahne.addEventListener('pointermove', e => {
    const o = sahne.getBoundingClientRect();
    const x = (e.clientX - o.left) / o.width - .5;
    const y = (e.clientY - o.top) / o.height - .5;
    m.style.transform = `translate3d(${(x * 26).toFixed(1)}px, ${(y * 20).toFixed(1)}px, 0) rotateY(${(x * 10).toFixed(1)}deg) rotateX(${(-y * 8).toFixed(1)}deg)`;
  });
  sahne.addEventListener('pointerleave', () => { m.style.transform = ''; });
}

/* ---------- KURULUM ---------- */
async function kur() {
  await veriYukle();
  /* statik içerikler */
  $('#heroJewel').innerHTML = vitrinCizimi();

  /* kategori filtreleri */
  const kategoriler = ['Tümü', ...new Set(URUNLER.map(u => u.kategori))];
  $('#filtreCipler').innerHTML = kategoriler.map(k =>
    `<button class="cip ${k === 'Tümü' ? 'aktif' : ''}" data-filtre="${k}">${k}</button>`).join('');

  /* marka bilgileri */
  $$('[data-bilgi]').forEach(el => {
    const alan = el.dataset.bilgi;
    if (AYARLAR[alan]) el.textContent = AYARLAR[alan];
  });
  $('#kargoLimit').textContent = para(AYARLAR.kargoBedavaLimit);
  const bl = $('#bantLimit'); if (bl) bl.textContent = para(AYARLAR.kargoBedavaLimit);
  $('#yil').textContent = new Date().getFullYear();
  const waMesaj = encodeURIComponent(`Merhaba, ${AYARLAR.marka} sitesinden yazıyorum.`);
  ['#waBtn', '#waIletisim'].forEach(k => { const el = $(k); if (el && AYARLAR.whatsapp) el.href = `https://wa.me/${AYARLAR.whatsapp}?text=${waMesaj}`; });

  konseptleriCiz();
  urunleriCiz();
  sepetiCiz();
  isiltiBaslat();
  paralaks();
  belirenleriBagla();
  setInterval(geriSayimGuncelle, 1000);

  /* güvenlik ağı: animasyon takılırsa her şey görünür olsun */
  setTimeout(() => $$('.beliren').forEach(e => e.classList.add('gorunur')), 2600);

  /* üstbar küçülmesi */
  addEventListener('scroll', () => {
    $('#ustbar').classList.toggle('dar', scrollY > 30);
  }, { passive: true });

  /* ---- tek merkezden tıklama yönetimi ---- */
  document.addEventListener('click', e => {
    const h = (s) => e.target.closest(s);

    if (h('[data-ekle]'))   { sepeteEkle(h('[data-ekle]').dataset.ekle); urunDetayKapat(); return; }
    if (h('[data-detay]'))  { urunDetayAc(h('[data-detay]').dataset.detay); return; }
    if (h('[data-arti]'))   { adetDegistir(h('[data-arti]').dataset.arti, +1); return; }
    if (h('[data-eksi]'))   { adetDegistir(h('[data-eksi]').dataset.eksi, -1); return; }
    if (h('[data-sil]'))    { sepettenCikar(h('[data-sil]').dataset.sil); return; }

    if (h('#sepetBtn'))            { cekmeceAc(true); return; }
    if (h('[data-kapat-cekmece]') || h('#perde') || h('#cekmeceKapat')) { cekmeceAc(false); return; }

    if (h('#menuBtn')) { $('#anaMenu').classList.toggle('acik'); return; }
    if (h('.menu a'))  { $('#anaMenu').classList.remove('acik'); return; }

    const fk = h('[data-kat]');
    if (fk) {
      durum.filtre = fk.dataset.kat;
      $$('#filtreCipler .cip').forEach(c => c.classList.toggle('aktif', c.dataset.filtre === durum.filtre));
      urunleriCiz();
      return;
    }

    const cip = h('[data-filtre]');
    if (cip) {
      durum.filtre = cip.dataset.filtre;
      $$('#filtreCipler .cip').forEach(c => c.classList.toggle('aktif', c === cip));
      urunleriCiz();
      return;
    }

    const kk = h('[data-konsept]');
    if (kk) {
      const k = KONSEPT_GUNLERI.find(x => x.ad === kk.dataset.konsept);
      durum.onizleme = (durum.konsept && k.ad === durum.konsept.ad) ? null : k;
      konseptleriCiz();
      toast(durum.onizleme ? `${k.ad} önizleniyor.` : `${k.ad} zaten vitrinde.`);
      $('#konseptAktif').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (h('[data-onizleme-kapat]')) { durum.onizleme = null; konseptleriCiz(); return; }

    if (h('#urunModalKapat') || (e.target.id === 'urunModal')) { urunDetayKapat(); return; }
    if (h('#odemeModalKapat') || h('[data-odeme-kapat]') || (e.target.id === 'odemeModal')) { odemeKapat(); return; }

    if (h('#odemeGec')) { cekmeceAc(false); odemeAc(); return; }
    if (h('[data-odeme-geri]')) { siparisTaslak.adim--; odemeCiz(); return; }
    if (h('[data-odeme-ileri]')) {
      const adNow = adimlar()[siparisTaslak.adim - 1];
      if (adNow === 'hediye' && !HEDIYELER.some(x => x.id === siparisTaslak.hediye)) { toast('Lütfen bir hediye seç.'); return; }
      if (adNow === 'teslimat' && !teslimatDogrula()) { toast('Lütfen eksik alanları doldur.'); return; }
      siparisTaslak.adim++;
      odemeCiz();
      return;
    }
    if (h('[data-siparis-tamamla]')) { siparisiTamamla(); return; }

    const kop = h('[data-kopyala]');
    if (kop) {
      const metin = decodeURIComponent(kop.dataset.kopyala);
      navigator.clipboard?.writeText(metin)
        .then(() => toast('Sipariş özeti kopyalandı.'))
        .catch(() => toast('Kopyalanamadı, metni elle seçebilirsin.'));
      return;
    }
    const kopBil = h('[data-kopyala-bilgi]');
    if (kopBil) {
      const metin = kopBil.previousElementSibling?.textContent?.trim() || '';
      navigator.clipboard?.writeText(metin)
        .then(() => toast('Kopyalandı.'))
        .catch(() => toast('Kopyalanamadı.'));
      return;
    }
  });

  /* sıralama */
  $('#siralaSec').addEventListener('change', e => { durum.sirala = e.target.value; urunleriCiz(); });

  /* ödeme adımlarındaki radyolar */
  document.addEventListener('change', e => {
    if (e.target.name === 'kargoSec')  { siparisTaslak.kargo = e.target.value; odemeCiz(); }
    if (e.target.name === 'odemeSec')  { siparisTaslak.odeme = e.target.value; odemeCiz(); }
    if (e.target.name === 'hediyeSec') { siparisTaslak.hediye = e.target.value; odemeCiz(); }
  });

  /* bülten formu */
  $('#bultenForm').addEventListener('submit', e => {
    e.preventDefault();
    const eposta = $('#bultenEposta');
    if (!eposta.value.includes('@')) { toast('Geçerli bir e-posta yaz.'); return; }
    if (SUNUCU.acik) {
      fetch('/api/bulten', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eposta: eposta.value, ad: $('#bultenAd').value }) }).catch(() => {});
    } else {
      const kayitlilar = depo.al('arenimo_bulten', []);
      kayitlilar.push({ eposta: eposta.value, tarih: new Date().toISOString() });
      depo.yaz('arenimo_bulten', kayitlilar);
    }
    e.target.reset();
    toast('Listeye eklendin. Yeni konsept günlerinden ilk sen haberdar olacaksın.');
  });

  /* klavye */
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('#urunModal').hidden) urunDetayKapat();
    else if (!$('#odemeModal').hidden) odemeKapat();
    else if ($('#cekmece').classList.contains('acik')) cekmeceAc(false);
  });
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', kur)
  : kur();
