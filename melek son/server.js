/* ============================================================
   MELEĞİN TAKI DÜNYASI — SUNUCU (bağımlılık yok, sadece Node 18+)
   Başlat:  node server.js      →  http://localhost:3000
   Admin :  http://localhost:3000/admin
   Şifre  :  ilk açılışta  123123123  (Admin > Ayarlar'dan değiştir)
   ============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const PORT = +process.env.PORT || 3000;
const KOK = __dirname;
const VERI = process.env.VERI_KLASORU || path.join(KOK, 'veri');
const YUKLEME = path.join(VERI, 'yuklemeler');
fs.mkdirSync(YUKLEME, { recursive: true });

/* ---------- küçük JSON veritabanı ---------- */
const dosya = ad => path.join(VERI, ad + '.json');
function oku(ad, varsayilan) {
  try { return JSON.parse(fs.readFileSync(dosya(ad), 'utf8')); } catch { return varsayilan; }
}
function yaz(ad, veri) {
  const hedef = dosya(ad), gecici = hedef + '.tmp';
  fs.writeFileSync(gecici, JSON.stringify(veri, null, 2));
  fs.renameSync(gecici, hedef);
}

/* ---------- ilk kurulum: data.js'teki örnek ürünleri tohum olarak al ---------- */
const VARSAYILAN_AYAR = {
  marka: 'Meleğin Takı Dünyası', alanAdi: '', telefon: '+90 531 331 25 17', whatsapp: '905313312517',
  eposta: 'meleksavasliogli@gmail.com', adres: '',
  iban: 'TR07 0006 7010 0000 0011 8028 35', ibanSahibi: 'MELEK SAVAŞLIOĞLU',
  kargoUcreti: 129, kargoBedavaLimit: 1000, azStokLimiti: 3
};
function tohumHediyeler() {
  try {
    const kod = fs.readFileSync(path.join(KOK, 'assets/js/data.js'), 'utf8');
    const { HEDIYELER } = vm.runInNewContext(kod + '\n;({ HEDIYELER })');
    return HEDIYELER.map(h => ({ ...h, aktif: true, gorsel: '', olusturma: new Date().toISOString() }));
  } catch { return []; }
}
function tohumUrunler() {
  try {
    const kod = fs.readFileSync(path.join(KOK, 'assets/js/data.js'), 'utf8');
    const { URUNLER } = vm.runInNewContext(kod + '\n;({ URUNLER })');
    return URUNLER.map(u => ({ ...u, aktif: true, gorsel: '', stokUyari: 0, olusturma: new Date().toISOString() }));
  } catch { return []; }
}
let urunler = oku('urunler', null);
if (!urunler) { urunler = tohumUrunler(); yaz('urunler', urunler); }
let hediyeler = oku('hediyeler', null);
if (!hediyeler) { hediyeler = tohumHediyeler(); yaz('hediyeler', hediyeler); }
let siparisler = oku('siparisler', []);
let bulten = oku('bulten', []);
let ayar = { ...VARSAYILAN_AYAR, ...oku('ayarlar', {}) };
delete ayar.hizliKargoUcreti; delete ayar.kapidaOdemeFarki;
yaz('ayarlar', ayar);

/* ---------- yönetici şifresi (scrypt) ---------- */
let yonetici = oku('yonetici', null);
function sifreHashle(sifre, tuz = crypto.randomBytes(16).toString('hex')) {
  return { tuz, hash: crypto.scryptSync(sifre, tuz, 64).toString('hex') };
}
if (!yonetici) {
  const ilk = process.env.ADMIN_SIFRE || '123123123';
  yonetici = { ...sifreHashle(ilk), gizli: crypto.randomBytes(32).toString('hex'), degistirilmeli: false };
  yaz('yonetici', yonetici);
}
function sifreDogru(sifre) {
  const a = Buffer.from(sifreHashle(String(sifre || ''), yonetici.tuz).hash, 'hex');
  const b = Buffer.from(yonetici.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const imza = v => crypto.createHmac('sha256', yonetici.gizli).update(v).digest('hex');
function oturumUret() { const bit = Date.now() + 12 * 3600e3; return bit + '.' + imza(String(bit)); }
function oturumGecerli(req) {
  const m = /(?:^|;\s*)ar_oturum=([^;]+)/.exec(req.headers.cookie || '');
  if (!m) return false;
  const [bit, im] = m[1].split('.');
  if (!bit || !im || +bit < Date.now()) return false;
  const beklenen = imza(bit);
  return im.length === beklenen.length && crypto.timingSafeEqual(Buffer.from(im), Buffer.from(beklenen));
}

/* ---------- hız sınırlama ---------- */
const sinir = new Map();
function sinirAsildi(anahtar, adet, pencereMs) {
  const simdi = Date.now();
  const liste = (sinir.get(anahtar) || []).filter(t => simdi - t < pencereMs);
  liste.push(simdi);
  sinir.set(anahtar, liste);
  return liste.length > adet;
}
const ipAl = req => (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();

/* ---------- yardımcılar ---------- */
const temiz = (v, n = 200) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const sayi = (v, varsayilan = 0) => { const n = Number(v); return Number.isFinite(n) ? n : varsayilan; };
const yeniId = () => 'p-' + crypto.randomBytes(4).toString('hex');

function kargoUcretiHesapla(urunToplam) {
  return urunToplam >= ayar.kargoBedavaLimit ? 0 : ayar.kargoUcreti;
}
const azLimit = u => (u.stokUyari > 0 ? u.stokUyari : ayar.azStokLimiti);

function genelAyar() {
  const { marka, alanAdi, telefon, whatsapp, eposta, adres, iban, ibanSahibi, kargoUcreti,
    kargoBedavaLimit, azStokLimiti } = ayar;
  return { marka, alanAdi, telefon, whatsapp, eposta, adres, iban, ibanSahibi, kargoUcreti,
    kargoBedavaLimit, azStokLimiti };
}

/* ---------- istek / yanıt ---------- */
function govdeOku(req, sinirBayt) {
  return new Promise((coz, red) => {
    let boyut = 0; const parcalar = [];
    req.on('data', p => {
      boyut += p.length;
      if (boyut > sinirBayt) { red(Object.assign(new Error('Veri çok büyük'), { kod: 413 })); req.destroy(); return; }
      parcalar.push(p);
    });
    req.on('end', () => {
      try { coz(parcalar.length ? JSON.parse(Buffer.concat(parcalar).toString('utf8')) : {}); }
      catch { red(Object.assign(new Error('Geçersiz veri'), { kod: 400 })); }
    });
    req.on('error', red);
  });
}
function json(res, kod, veri, ekBaslik = {}) {
  res.writeHead(kod, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...ekBaslik });
  res.end(JSON.stringify(veri));
}
const hata = (res, kod, mesaj) => json(res, kod, { ok: false, hata: mesaj });

/* ---------- görsel kaydı ---------- */
const GORSEL_TIP = [
  { uz: 'jpg',  test: b => b[0] === 0xFF && b[1] === 0xD8 },
  { uz: 'png',  test: b => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 },
  { uz: 'webp', test: b => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP' }
];
function gorselKaydet(dataUrl) {
  const m = /^data:image\/(png|jpe?g|webp);base64,(.+)$/s.exec(String(dataUrl || ''));
  if (!m) throw Object.assign(new Error('Sadece JPG, PNG veya WEBP görsel yükleyebilirsin.'), { kod: 400 });
  const tampon = Buffer.from(m[2], 'base64');
  if (tampon.length > 6 * 1024 * 1024) throw Object.assign(new Error('Görsel 6 MB’tan büyük.'), { kod: 413 });
  const tip = GORSEL_TIP.find(t => t.test(tampon));
  if (!tip) throw Object.assign(new Error('Dosya geçerli bir görsel değil.'), { kod: 400 });
  const ad = crypto.randomBytes(8).toString('hex') + '.' + tip.uz;
  fs.writeFileSync(path.join(YUKLEME, ad), tampon);
  return '/yuklemeler/' + ad;
}
function gorselSil(url) {
  if (!url || !url.startsWith('/yuklemeler/')) return;
  const ad = path.basename(url);
  fs.promises.unlink(path.join(YUKLEME, ad)).catch(() => {});
}

/* ---------- ürün doğrulama ---------- */
function urunAlanlari(g, eski = {}) {
  const ad = temiz(g.ad, 120);
  if (!ad) throw Object.assign(new Error('Ürün adı gerekli.'), { kod: 400 });
  const fiyat = sayi(g.fiyat, -1);
  if (fiyat < 0) throw Object.assign(new Error('Geçerli bir fiyat yaz.'), { kod: 400 });
  const stok = Math.max(0, Math.floor(sayi(g.stok, 0)));
  const tipler = ['yuzuk', 'kolye', 'kupe', 'bileklik', 'halhal', 'inci', 'set'];
  const metaller = ['altin', 'rose', 'gumus'];
  const taslar = ['beyaz', 'yakut', 'zumrut', 'safir', 'ametist', 'inci', 'kehribar'];
  return {
    ad,
    kategori: temiz(g.kategori, 40) || 'Diğer',
    fiyat: Math.round(fiyat),
    eski: Math.max(0, Math.round(sayi(g.eski, 0))),
    stok,
    stokUyari: Math.max(0, Math.floor(sayi(g.stokUyari, 0))),
    rozet: temiz(g.rozet, 24),
    aciklama: temiz(g.aciklama, 800),
    aktif: g.aktif !== false,
    tip: tipler.includes(g.tip) ? g.tip : (eski.tip || 'yuzuk'),
    metal: metaller.includes(g.metal) ? g.metal : (eski.metal || 'altin'),
    tas: taslar.includes(g.tas) ? g.tas : (eski.tas || 'beyaz')
  };
}

/* ---------- stok iade / tekrar düşme (ürün + hediye) ---------- */
function stokGeriVer(s) {
  if (s.stokDusuldu) {
    s.urunler.forEach(k => { const u = urunler.find(x => x.id === k.id); if (u) u.stok += k.adet; });
    s.stokDusuldu = false; yaz('urunler', urunler);
  }
  if (s.hediye && s.hediyeStokDusuldu) {
    const h = hediyeler.find(x => x.id === s.hediye.id); if (h) h.stok += 1;
    s.hediyeStokDusuldu = false; yaz('hediyeler', hediyeler);
  }
}
function stokTekrarDus(s) {
  if (!s.stokDusuldu) {
    s.urunler.forEach(k => { const u = urunler.find(x => x.id === k.id); if (u) u.stok = Math.max(0, u.stok - k.adet); });
    s.stokDusuldu = true; yaz('urunler', urunler);
  }
  if (s.hediye && !s.hediyeStokDusuldu) {
    const h = hediyeler.find(x => x.id === s.hediye.id); if (h) h.stok = Math.max(0, h.stok - 1);
    s.hediyeStokDusuldu = true; yaz('hediyeler', hediyeler);
  }
}
function hediyeAlanlari(g, eski = {}) {
  const ad = temiz(g.ad, 100);
  if (!ad) throw Object.assign(new Error('Hediye adı gerekli.'), { kod: 400 });
  const tipler = ['yuzuk', 'kolye', 'kupe', 'bileklik', 'halhal', 'inci', 'set'];
  const metaller = ['altin', 'rose', 'gumus'];
  const taslar = ['beyaz', 'yakut', 'zumrut', 'safir', 'ametist', 'inci', 'kehribar'];
  return {
    ad, aciklama: temiz(g.aciklama, 200),
    stok: Math.max(0, Math.floor(sayi(g.stok, 0))),
    aktif: g.aktif !== false,
    tip: tipler.includes(g.tip) ? g.tip : (eski.tip || 'yuzuk'),
    metal: metaller.includes(g.metal) ? g.metal : (eski.metal || 'altin'),
    tas: taslar.includes(g.tas) ? g.tas : (eski.tas || 'beyaz')
  };
}

/* ---------- API: herkese açık ---------- */
async function acikApi(req, res, yol) {
  if (req.method === 'GET' && yol === '/api/urunler') {
    return json(res, 200, urunler.filter(u => u.aktif !== false).map(u => ({
      id: u.id, ad: u.ad, kategori: u.kategori, fiyat: u.fiyat, eski: u.eski, stok: u.stok,
      stokUyari: u.stokUyari, rozet: u.rozet, aciklama: u.aciklama, gorsel: u.gorsel,
      tip: u.tip, metal: u.metal, tas: u.tas
    })));
  }
  if (req.method === 'GET' && yol === '/api/ayarlar') return json(res, 200, genelAyar());
  if (req.method === 'GET' && yol === '/api/hediyeler') {
    return json(res, 200, hediyeler.filter(h => h.aktif !== false && h.stok > 0)
      .map(h => ({ id: h.id, ad: h.ad, aciklama: h.aciklama, gorsel: h.gorsel, tip: h.tip, metal: h.metal, tas: h.tas })));
  }

  if (req.method === 'POST' && yol === '/api/bulten') {
    const g = await govdeOku(req, 5000);
    const eposta = temiz(g.eposta, 120).toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(eposta)) return hata(res, 400, 'Geçerli bir e-posta yaz.');
    if (sinirAsildi('bulten:' + ipAl(req), 10, 3600e3)) return hata(res, 429, 'Çok fazla deneme.');
    if (!bulten.some(b => b.eposta === eposta)) {
      bulten.push({ eposta, ad: temiz(g.ad, 60), tarih: new Date().toISOString() });
      yaz('bulten', bulten);
    }
    return json(res, 200, { ok: true });
  }

  if (req.method === 'POST' && yol === '/api/siparis') {
    if (sinirAsildi('siparis:' + ipAl(req), 8, 3600e3)) return hata(res, 429, 'Kısa sürede çok fazla sipariş denemesi. Lütfen biraz sonra tekrar dene.');
    const g = await govdeOku(req, 60000);
    const t = g.teslimat || {};
    const teslimat = {
      adSoyad: temiz(t.adSoyad, 80), telefon: temiz(t.telefon, 25), eposta: temiz(t.eposta, 120),
      adres: temiz(t.adres, 300), il: temiz(t.il, 40), ilce: temiz(t.ilce, 40), notu: temiz(t.notu, 300)
    };
    if (!teslimat.adSoyad || !teslimat.telefon || !teslimat.adres || !teslimat.il || !teslimat.ilce)
      return hata(res, 400, 'Teslimat bilgileri eksik.');
    const tel = teslimat.telefon.replace(/\D/g, '');
    if (tel.length < 10 || tel.length > 13) return hata(res, 400, 'Geçerli bir telefon numarası yaz.');
    if (teslimat.adSoyad.split(/\s+/).filter(k => k.length >= 2).length < 2) return hata(res, 400, 'Ad ve soyadını yaz.');
    if (teslimat.adres.length < 10) return hata(res, 400, 'Adresini daha ayrıntılı yaz.');
    const kargoYontem = 'standart';
    const odemeYontem = g.odeme === 'havale' ? 'havale' : null;
    if (!odemeYontem) return hata(res, 400, 'Bu ödeme yöntemi şu an kullanılamıyor.');

    /* sepeti sunucuda yeniden kur: fiyat ve stok daima sunucudan gelir */
    const birlesik = new Map();
    (Array.isArray(g.urunler) ? g.urunler : []).slice(0, 60).forEach(s => {
      const adet = Math.floor(sayi(s.adet, 0));
      if (adet > 0) birlesik.set(String(s.id), (birlesik.get(String(s.id)) || 0) + adet);
    });
    if (!birlesik.size) return hata(res, 400, 'Sepet boş.');
    const satirlar = [];
    for (const [id, adet] of birlesik) {
      const u = urunler.find(x => x.id === id && x.aktif !== false);
      if (!u) return hata(res, 409, 'Sepetindeki bir ürün artık satışta değil. Sepeti güncelleyip tekrar dene.');
      if (u.stok < adet) return hata(res, 409, `“${u.ad}” için stokta ${u.stok} adet var. Sepeti güncelleyip tekrar dene.`);
      satirlar.push({ u, adet });
    }
    const urunToplam = satirlar.reduce((t, s) => t + s.u.fiyat * s.adet, 0);
    const kargoUcret = kargoUcretiHesapla(urunToplam);

    /* hediye: sepet limiti geçtiyse tam 1 hediye seçilmeli */
    let hediye = null;
    const hediyeAcik = hediyeler.filter(x => x.aktif !== false && x.stok > 0);
    if (urunToplam >= ayar.kargoBedavaLimit && hediyeAcik.length) {
      hediye = hediyeAcik.find(x => x.id === String(g.hediye || ''));
      if (!hediye) return hata(res, 400, 'Lütfen hediyeni seç (seçtiğin hediye stokta olmayabilir).');
    }

    let no;
    do { no = 'MT-' + crypto.randomBytes(3).toString('hex').toUpperCase(); } while (siparisler.some(s => s.no === no));
    const siparis = {
      no, tarih: new Date().toISOString(), durum: 'yeni', odemeAlindi: false, takipNo: '', yonetimNotu: '',
      urunler: satirlar.map(s => ({ id: s.u.id, ad: s.u.ad, adet: s.adet, birim: s.u.fiyat, gorsel: s.u.gorsel || '' })),
      araToplam: urunToplam,
      hediye: hediye ? { id: hediye.id, ad: hediye.ad, gorsel: hediye.gorsel || '' } : null,
      kargo: { yontem: kargoYontem, ucret: kargoUcret },
      odeme: { yontem: odemeYontem },
      teslimat, toplam: urunToplam + kargoUcret, stokDusuldu: true, hediyeStokDusuldu: !!hediye
    };
    satirlar.forEach(s => { s.u.stok -= s.adet; });       // stoğu düş
    if (hediye) { hediye.stok -= 1; yaz('hediyeler', hediyeler); }
    siparisler.push(siparis);
    yaz('urunler', urunler);
    yaz('siparisler', siparisler);
    return json(res, 200, { ok: true, siparis });
  }
  return null;
}

/* ---------- API: yönetici ---------- */
const DURUMLAR = ['yeni', 'hazirlaniyor', 'kargoda', 'teslim', 'iptal'];
function gunAnahtari(d) { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }

function ozetUret() {
  const bugun = gunAnahtari(new Date());
  const gecerli = siparisler.filter(s => s.durum !== 'iptal');
  const gunluk = {};
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); gunluk[gunAnahtari(d)] = { gun: gunAnahtari(d), adet: 0, ciro: 0 }; }
  gecerli.forEach(s => { const a = gunAnahtari(s.tarih); if (gunluk[a]) { gunluk[a].adet++; gunluk[a].ciro += s.toplam; } });
  const bugunkuler = gecerli.filter(s => gunAnahtari(s.tarih) === bugun);
  const sirali = [...siparisler].sort((a, b) => b.tarih.localeCompare(a.tarih));
  const aktifUrun = urunler.filter(u => u.aktif !== false);
  return {
    bugunSiparis: bugunkuler.length,
    bugunCiro: bugunkuler.reduce((t, s) => t + s.toplam, 0),
    yeniSayisi: siparisler.filter(s => s.durum === 'yeni').length,
    hazirlanan: siparisler.filter(s => s.durum === 'hazirlaniyor').length,
    toplamCiro: gecerli.reduce((t, s) => t + s.toplam, 0),
    toplamSiparis: siparisler.length,
    urunSayisi: urunler.length,
    sonSiparisNo: sirali[0]?.no || null,
    son7: Object.values(gunluk),
    sonSiparisler: sirali.slice(0, 6),
    tukenen: aktifUrun.filter(u => u.stok <= 0).map(u => ({ id: u.id, ad: u.ad, stok: u.stok, gorsel: u.gorsel })),
    azKalan: aktifUrun.filter(u => u.stok > 0 && u.stok <= azLimit(u)).map(u => ({ id: u.id, ad: u.ad, stok: u.stok, esik: azLimit(u), gorsel: u.gorsel }))
  };
}

function csvHucre(v) { const s = String(v ?? ''); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }

async function yoneticiApi(req, res, yol, sorgu) {
  /* giriş (oturumsuz) */
  if (req.method === 'POST' && yol === '/api/admin/giris') {
    const ip = ipAl(req);
    if (sinirAsildi('giris:' + ip, 8, 10 * 60e3)) return hata(res, 429, 'Çok fazla hatalı deneme. 10 dakika sonra tekrar dene.');
    const g = await govdeOku(req, 2000);
    if (!sifreDogru(g.sifre)) return hata(res, 401, 'Şifre hatalı.');
    const cerez = `ar_oturum=${oturumUret()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${12 * 3600}${req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`;
    return json(res, 200, { ok: true, sifreDegistir: !!yonetici.degistirilmeli }, { 'Set-Cookie': cerez });
  }
  if (!oturumGecerli(req)) return hata(res, 401, 'Oturum gerekli.');

  if (req.method === 'POST' && yol === '/api/admin/cikis')
    return json(res, 200, { ok: true }, { 'Set-Cookie': 'ar_oturum=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
  if (req.method === 'GET' && yol === '/api/admin/ben') return json(res, 200, { ok: true, sifreDegistir: !!yonetici.degistirilmeli });

  if (req.method === 'GET' && yol === '/api/admin/ozet') return json(res, 200, ozetUret());

  /* siparişler */
  if (req.method === 'GET' && yol === '/api/admin/siparisler')
    return json(res, 200, [...siparisler].sort((a, b) => b.tarih.localeCompare(a.tarih)));

  if (req.method === 'GET' && yol === '/api/admin/siparisler.csv') {
    const baslik = ['Sipariş No', 'Tarih', 'Durum', 'Müşteri', 'Telefon', 'E-posta', 'İl', 'İlçe', 'Adres', 'Ürünler', 'Hediye', 'Ara Toplam', 'Kargo', 'Ödeme', 'Ödeme Alındı', 'Toplam', 'Takip No'];
    const satir = siparisler.map(s => [s.no, s.tarih, s.durum, s.teslimat.adSoyad, s.teslimat.telefon, s.teslimat.eposta, s.teslimat.il, s.teslimat.ilce,
      s.teslimat.adres, s.urunler.map(u => `${u.ad} x${u.adet}`).join(' | '), s.hediye ? s.hediye.ad : '', s.araToplam, s.kargo.ucret, s.odeme.yontem, s.odemeAlindi ? 'Evet' : 'Hayır', s.toplam, s.takipNo]);
    const csv = '\ufeff' + [baslik, ...satir].map(r => r.map(csvHucre).join(';')).join('\r\n');
    res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="siparisler.csv"' });
    return res.end(csv);
  }

  let m = /^\/api\/admin\/siparisler\/([A-Z0-9-]+)$/.exec(yol);
  if (m && req.method === 'PATCH') {
    const s = siparisler.find(x => x.no === m[1]);
    if (!s) return hata(res, 404, 'Sipariş bulunamadı.');
    const g = await govdeOku(req, 5000);
    if (g.durum !== undefined) {
      if (!DURUMLAR.includes(g.durum)) return hata(res, 400, 'Geçersiz durum.');
      if (g.durum === 'iptal' && s.durum !== 'iptal') stokGeriVer(s);          // iptalde stok geri gelir
      else if (s.durum === 'iptal' && g.durum !== 'iptal') stokTekrarDus(s);  // iptal geri alınırsa tekrar düşer
      s.durum = g.durum;
    }
    if (g.takipNo !== undefined) s.takipNo = temiz(g.takipNo, 60);
    if (g.yonetimNotu !== undefined) s.yonetimNotu = temiz(g.yonetimNotu, 500);
    if (g.odemeAlindi !== undefined) s.odemeAlindi = !!g.odemeAlindi;
    yaz('siparisler', siparisler);
    return json(res, 200, { ok: true, siparis: s });
  }

  if (m && req.method === 'DELETE') {                                       // sipariş sil
    const i = siparisler.findIndex(x => x.no === m[1]);
    if (i < 0) return hata(res, 404, 'Sipariş bulunamadı.');
    const sil = siparisler[i];
    if (['yeni', 'hazirlaniyor'].includes(sil.durum)) stokGeriVer(sil);      // henüz gönderilmediyse stok geri gelir
    siparisler.splice(i, 1); yaz('siparisler', siparisler);
    return json(res, 200, { ok: true });
  }

  /* hediyeler */
  if (req.method === 'GET' && yol === '/api/admin/hediyeler') return json(res, 200, hediyeler);
  if (req.method === 'POST' && yol === '/api/admin/hediyeler') {
    const g = await govdeOku(req, 20000);
    const h = { id: 'h-' + crypto.randomBytes(3).toString('hex'), ...hediyeAlanlari(g), gorsel: String(g.gorsel || '').startsWith('/yuklemeler/') ? g.gorsel : '', olusturma: new Date().toISOString() };
    hediyeler.push(h); yaz('hediyeler', hediyeler);
    return json(res, 200, { ok: true, hediye: h });
  }
  let mh = /^\/api\/admin\/hediyeler\/([\w-]+)$/.exec(yol);
  if (mh && (req.method === 'PUT' || req.method === 'PATCH')) {
    const h = hediyeler.find(x => x.id === mh[1]);
    if (!h) return hata(res, 404, 'Hediye bulunamadı.');
    const g = await govdeOku(req, 20000);
    if (req.method === 'PATCH') {
      if (g.stok !== undefined) h.stok = Math.max(0, Math.floor(sayi(g.stok, h.stok)));
      if (g.aktif !== undefined) h.aktif = !!g.aktif;
    } else {
      Object.assign(h, hediyeAlanlari({ ...h, ...g }, h));
      if (g.gorsel !== undefined && g.gorsel !== h.gorsel) {
        const yeni = String(g.gorsel || '').startsWith('/yuklemeler/') ? g.gorsel : '';
        gorselSil(h.gorsel); h.gorsel = yeni;
      }
    }
    yaz('hediyeler', hediyeler);
    return json(res, 200, { ok: true, hediye: h });
  }
  if (mh && req.method === 'DELETE') {
    const i = hediyeler.findIndex(x => x.id === mh[1]);
    if (i < 0) return hata(res, 404, 'Hediye bulunamadı.');
    const [silinen] = hediyeler.splice(i, 1);
    gorselSil(silinen.gorsel); yaz('hediyeler', hediyeler);
    return json(res, 200, { ok: true });
  }

  /* ürünler */
  if (req.method === 'GET' && yol === '/api/admin/urunler')
    return json(res, 200, urunler.map(u => ({ ...u, azEsik: azLimit(u) })));

  if (req.method === 'POST' && yol === '/api/admin/gorsel') {
    const g = await govdeOku(req, 9 * 1024 * 1024);
    return json(res, 200, { ok: true, url: gorselKaydet(g.veri) });
  }

  if (req.method === 'POST' && yol === '/api/admin/urunler') {
    const g = await govdeOku(req, 20000);
    const u = { id: yeniId(), ...urunAlanlari(g), gorsel: String(g.gorsel || '').startsWith('/yuklemeler/') ? g.gorsel : '', olusturma: new Date().toISOString() };
    urunler.unshift(u); yaz('urunler', urunler);
    return json(res, 200, { ok: true, urun: u });
  }

  m = /^\/api\/admin\/urunler\/([\w-]+)$/.exec(yol);
  if (m && (req.method === 'PUT' || req.method === 'PATCH')) {
    const u = urunler.find(x => x.id === m[1]);
    if (!u) return hata(res, 404, 'Ürün bulunamadı.');
    const g = await govdeOku(req, 20000);
    if (req.method === 'PATCH') {                                  // hızlı stok / yayın değişikliği
      if (g.stok !== undefined) u.stok = Math.max(0, Math.floor(sayi(g.stok, u.stok)));
      if (g.aktif !== undefined) u.aktif = !!g.aktif;
    } else {
      Object.assign(u, urunAlanlari({ ...u, ...g }, u));
      if (g.gorsel !== undefined && g.gorsel !== u.gorsel) {
        const yeni = String(g.gorsel || '').startsWith('/yuklemeler/') ? g.gorsel : '';
        gorselSil(u.gorsel); u.gorsel = yeni;
      }
    }
    yaz('urunler', urunler);
    return json(res, 200, { ok: true, urun: u });
  }
  if (m && req.method === 'DELETE') {
    const i = urunler.findIndex(x => x.id === m[1]);
    if (i < 0) return hata(res, 404, 'Ürün bulunamadı.');
    const [silinen] = urunler.splice(i, 1);
    gorselSil(silinen.gorsel); yaz('urunler', urunler);
    return json(res, 200, { ok: true });
  }

  /* bülten */
  if (req.method === 'GET' && yol === '/api/admin/bulten') return json(res, 200, [...bulten].reverse());

  /* ayarlar */
  if (req.method === 'GET' && yol === '/api/admin/ayarlar') return json(res, 200, genelAyar());
  if (req.method === 'PUT' && yol === '/api/admin/ayarlar') {
    const g = await govdeOku(req, 5000);
    ['marka', 'alanAdi', 'telefon', 'eposta', 'adres', 'iban', 'ibanSahibi'].forEach(k => { if (g[k] !== undefined) ayar[k] = temiz(g[k], 160); });
    if (g.whatsapp !== undefined) ayar.whatsapp = temiz(g.whatsapp, 20).replace(/\D/g, '');
    ['kargoUcreti', 'kargoBedavaLimit', 'azStokLimiti'].forEach(k => {
      if (g[k] !== undefined) ayar[k] = Math.max(0, Math.round(sayi(g[k], ayar[k])));
    });
    yaz('ayarlar', ayar);
    return json(res, 200, { ok: true, ayar: genelAyar() });
  }
  if (req.method === 'POST' && yol === '/api/admin/sifre') {
    const g = await govdeOku(req, 2000);
    if (!sifreDogru(g.eski)) return hata(res, 400, 'Mevcut şifre hatalı.');
    if (String(g.yeni || '').length < 8) return hata(res, 400, 'Yeni şifre en az 8 karakter olmalı.');
    yonetici = { ...yonetici, ...sifreHashle(String(g.yeni)), degistirilmeli: false };
    yaz('yonetici', yonetici);
    return json(res, 200, { ok: true });
  }
  return null;
}

/* ---------- statik dosyalar ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8'
};
function statikGonder(req, res, yol) {
  if (yol === '/admin') { res.writeHead(302, { Location: '/admin/' }); return res.end(); }
  let rel = decodeURIComponent(yol);
  if (rel.endsWith('/')) rel += 'index.html';
  let tam;
  if (rel.startsWith('/yuklemeler/')) tam = path.join(YUKLEME, path.basename(rel));
  else if (rel === '/index.html' || rel.startsWith('/assets/') || rel.startsWith('/admin/')) tam = path.join(KOK, rel);
  else { res.writeHead(404); return res.end('Bulunamadı'); }
  const guvenli = rel.startsWith('/yuklemeler/') ? YUKLEME : KOK;
  if (!path.resolve(tam).startsWith(guvenli + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(tam, (e, veri) => {
    if (e) { res.writeHead(404); return res.end('Bulunamadı'); }
    const uz = path.extname(tam).toLowerCase();
    const baslik = { 'Content-Type': MIME[uz] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' };
    baslik['Cache-Control'] = rel.startsWith('/yuklemeler/') ? 'public, max-age=604800, immutable' : 'no-cache';
    if (rel.startsWith('/admin/')) { baslik['X-Frame-Options'] = 'DENY'; baslik['Referrer-Policy'] = 'no-referrer'; }
    res.writeHead(200, baslik);
    res.end(veri);
  });
}

/* ---------- sunucu ---------- */
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const yol = url.pathname;
    if (yol.startsWith('/api/')) {
      const r = yol.startsWith('/api/admin/') ? await yoneticiApi(req, res, yol, url.searchParams) : await acikApi(req, res, yol);
      if (r === null) hata(res, 404, 'Bulunamadı');
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    statikGonder(req, res, yol);
  } catch (e) {
    if (!res.headersSent) hata(res, e.kod || 500, e.kod ? e.message : 'Sunucu hatası');
    if (!e.kod) console.error(e);
  }
}).listen(PORT, () => {
  console.log(`\n  Meleğin Takı Dünyası çalışıyor →  http://localhost:${PORT}`);
  console.log(`  Admin panel      →  http://localhost:${PORT}/admin`);
});
