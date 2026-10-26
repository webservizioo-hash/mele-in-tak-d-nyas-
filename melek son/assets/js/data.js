/* ============================================================
   MELEĞİN TAKI DÜNYASI — VERİ DOSYASI
   Sitenin tüm içeriği burada. Ürün eklemek, fiyat değiştirmek,
   ayarlar için bu dosya kullanılır.
   ============================================================ */

/* ---------- 1) MAĞAZA AYARLARI ---------- */
const AYARLAR = {
  marka: 'Meleğin Takı Dünyası',
  alanAdi: 'meleksavasliogli.com',
  telefon: '+90 531 331 25 17',
  whatsapp: '905313312517',          // başında + ve boşluk olmadan
  eposta: 'meleksavasliogli@gmail.com',
  iban: 'TR07 0006 7010 0000 0011 8028 35',
  ibanSahibi: 'MELEK SAVAŞLIOĞLU',            // havale ekranında görünen hesap sahibi
  paraBirimi: 'TRY',
  kargoUcreti: 129,                  // ₺
  kargoBedavaLimit: 1000,            // bu tutar ve üzerinde kargo bedava
  azStokLimiti: 3                    // stok bu sayıya inince panelde uyarı çıkar
};

/* ---------- 2) HEDİYELER (ÖRNEK) ----------
   Sepet tutarı kargo limitini (1.000 ₺) geçince müşteri bunlardan 1 tanesini seçer.
   Gerçek hediyelerini admin panel > Hediyeler bölümünden düzenle.            */
let HEDIYELER = [
  { id:'h-01', ad:'Mini Halka Küpe',      aciklama:'Hafif, günlük kullanıma uygun küpe.', tip:'kupe',     metal:'altin', tas:'beyaz',   stok:50, aktif:true, gorsel:'' },
  { id:'h-02', ad:'İnce Zincir Bileklik', aciklama:'İnce zincirli, sade bileklik.',        tip:'bileklik', metal:'gumus', tas:'beyaz',   stok:50, aktif:true, gorsel:'' },
  { id:'h-03', ad:'Kalpli Kolye',         aciklama:'Minik kalp uçlu zarif kolye.',         tip:'kolye',    metal:'rose',  tas:'beyaz',   stok:50, aktif:true, gorsel:'' },
  { id:'h-04', ad:'Taşlı Yüzük',          aciklama:'Ayarlanabilir, taşlı yüzük.',          tip:'yuzuk',    metal:'altin', tas:'ametist', stok:50, aktif:true, gorsel:'' },
  { id:'h-05', ad:'Nazar Halhal',         aciklama:'Nazar boncuklu ince halhal.',          tip:'halhal',   metal:'gumus', tas:'safir',   stok:50, aktif:true, gorsel:'' }
];

/* ---------- 3) KONSEPT GÜNLERİ ----------
   Belirli günlerde sitenin rengi, şeridi ve vitrin başlığı otomatik değişir.
   Tarihler her yıl tekrar eder. Format: 'AA-GG'                             */
const KONSEPT_GUNLERI = [
  { ad:'Sonbahar Kehribar', slogan:'Kehribar ve bal tonları', basla:'09-20', bit:'10-20', renk:'#C9964F', etiket:'Kehribar Haftaları',
    aciklama:'Sonbaharın sıcak tonlarını taşıyan seçki: kehribar ve bal rengi taşlı parçalar öne çıkar.' },
  { ad:'Yeni Yıl Işıltısı', slogan:'Gecenin en parlak parçası sen ol', basla:'12-10', bit:'01-05', renk:'#B8923A', etiket:'Yılbaşı Vitrini',
    aciklama:'Yılbaşı vitrini: pırıltılı, taşlı parçalar öne çıkar.' },
  { ad:'Sevgililer Vitrini', slogan:'Kalpli ve kırmızı taşlı parçalar', basla:'02-01', bit:'02-14', renk:'#C77D85', etiket:'Sevgililer Günü',
    aciklama:'Şubat boyunca kalp formları ve kırmızı taşlı parçalar vitrinde.' },
  { ad:'Anneler Günü', slogan:'Onun için seçilmiş parçalar', basla:'05-01', bit:'05-11', renk:'#C9A0BF', etiket:'Anneler Günü',
    aciklama:'İnci görünümlü kolyeler ve setler öne çıkar.' },
  { ad:'Yaz Işıltısı', slogan:'Güneş, deniz ve ince zincirler', basla:'06-15', bit:'07-31', renk:'#D9A27A', etiket:'Yaz Seçkisi',
    aciklama:'Halhal, ince bileklik ve deniz temalı parçalar vitrinde.' }
];

/* ---------- 4) ÜRÜNLER (ÖRNEK) ----------
   Bunlar örnek üründür; gerçek ürünlerini ve fiyatlarını admin panelden ekle/düzenle.
   tip  : yuzuk | kolye | kupe | bileklik | halhal | inci | set
   metal: altin (altın rengi) | rose (rose renk) | gumus (gümüş rengi)
   tas  : beyaz | yakut (kırmızı) | zumrut (yeşil) | safir (mavi) | ametist (mor) | inci | kehribar */
let URUNLER = [
  { id:'zr-01', ad:'Nur Tek Taş Yüzük',      kategori:'Yüzük',    fiyat:249, eski:0, tip:'yuzuk',    metal:'altin', tas:'beyaz',    rozet:'Yeni', stok:8,  aciklama:'Tek taşlı, zarif yüzük. Altın rengi kaplama, ince bant.' },
  { id:'zr-02', ad:'Efsun Kırmızı Taşlı Yüzük', kategori:'Yüzük', fiyat:299, eski:0, tip:'yuzuk',    metal:'altin', tas:'yakut',    rozet:'', stok:4,  aciklama:'Oval kırmızı taşlı, çevresi küçük taşlarla süslü yüzük.' },
  { id:'zr-03', ad:'Ada Mor Taşlı Yüzük',    kategori:'Yüzük',    fiyat:229, eski:0, tip:'yuzuk',    metal:'rose',  tas:'ametist',  rozet:'Yeni', stok:6,  aciklama:'Rose renk kaplama, mor taşlı yüzük.' },
  { id:'zr-04', ad:'İris Gümüş Rengi Yüzük', kategori:'Yüzük',    fiyat:179, eski:0, tip:'yuzuk',    metal:'gumus', tas:'beyaz',    rozet:'', stok:14, aciklama:'Gümüş rengi, ince form. Günlük kullanıma uygun.' },
  { id:'zr-05', ad:'Sema Çift Yüzük',        kategori:'Yüzük',    fiyat:349, eski:0, tip:'yuzuk',    metal:'altin', tas:'beyaz',    rozet:'Çift', stok:3,  aciklama:'Sade tasarımlı çift yüzük seti.' },

  { id:'zr-06', ad:'Zeyn Tek Taş Küpe',      kategori:'Küpe',     fiyat:199, eski:0, tip:'kupe',     metal:'altin', tas:'beyaz', rozet:'', stok:11, aciklama:'Tek taşlı, hafif ve rahat küpe.' },
  { id:'zr-07', ad:'Hilal Halka Küpe',       kategori:'Küpe',     fiyat:169, eski:0, tip:'kupe',     metal:'altin', tas:'beyaz',    rozet:'', stok:9,  aciklama:'Burgu dokulu halka küpe. Gündüzden geceye uygun.' },
  { id:'zr-08', ad:'Damla Mavi Taşlı Küpe',  kategori:'Küpe',     fiyat:219, eski:0, tip:'kupe',     metal:'gumus', tas:'safir',    rozet:'', stok:5,  aciklama:'Sallantılı damla form, mavi taşlı küpe. Gümüş rengi.' },
  { id:'zr-09', ad:'Rüya Kelebek Küpe',      kategori:'Küpe',     fiyat:149, eski:0, tip:'kupe',     metal:'rose',  tas:'ametist',  rozet:'Yeni', stok:12, aciklama:'Minik kelebek formlu, rose renk küpe.' },

  { id:'zr-10', ad:'Sedef İnci Kolye',       kategori:'Kolye',    fiyat:279, eski:0, tip:'inci',     metal:'altin', tas:'inci',     rozet:'', stok:7,  aciklama:'İnci görünümlü taneler, altın rengi kilit. 42 cm.' },
  { id:'zr-11', ad:'Ayla Madalyon Kolye',    kategori:'Kolye',    fiyat:259, eski:0, tip:'kolye',    metal:'altin', tas:'beyaz',    rozet:'', stok:6,  aciklama:'Madalyon uçlu kolye. Zincir 45 cm.' },
  { id:'zr-12', ad:'Lale Yeşil Taşlı Kolye', kategori:'Kolye',    fiyat:329, eski:0, tip:'kolye',    metal:'altin', tas:'zumrut',   rozet:'', stok:2,  aciklama:'Markiz kesim yeşil taşlı, altın rengi kolye.' },
  { id:'zr-13', ad:'Mine Zarif Kolye',       kategori:'Kolye',    fiyat:199, eski:0, tip:'kolye',    metal:'rose',  tas:'beyaz',    rozet:'', stok:20, aciklama:'İnce zincirli, sade ve zarif rose renk kolye.' },
  { id:'zr-14', ad:'Kehribar Damla Kolye',   kategori:'Kolye',    fiyat:239, eski:0, tip:'kolye',    metal:'altin', tas:'kehribar', rozet:'', stok:5,  aciklama:'Kehribar rengi damla taşlı kolye.' },

  { id:'zr-15', ad:'Zümrüt Tenis Bileklik',  kategori:'Bileklik', fiyat:349, eski:0, tip:'bileklik', metal:'altin', tas:'zumrut',   rozet:'', stok:2,  aciklama:'Sıra taş dizilimli bileklik, güvenlik kilidi.' },
  { id:'zr-16', ad:'Şule İnce Zincir Bileklik', kategori:'Bileklik', fiyat:159, eski:0, tip:'bileklik', metal:'altin', tas:'beyaz', rozet:'', stok:18, aciklama:'İnce zincir bileklik. Üst üste takıma uygun.' },
  { id:'zr-17', ad:'Bahar Charm Bileklik',   kategori:'Bileklik', fiyat:189, eski:0, tip:'bileklik', metal:'gumus', tas:'safir',    rozet:'', stok:10, aciklama:'Charm detaylı gümüş rengi bileklik.' },
  { id:'zr-18', ad:'Nazar Bileklik',         kategori:'Bileklik', fiyat:129, eski:0, tip:'bileklik', metal:'gumus', tas:'safir',    rozet:'Hediyelik', stok:25, aciklama:'Zincir üzerinde nazar boncuğu detaylı bileklik.' },

  { id:'zr-19', ad:'Deniz Halhal',           kategori:'Halhal',   fiyat:139, eski:0, tip:'halhal',   metal:'altin', tas:'beyaz',    rozet:'', stok:15, aciklama:'Minik deniz kabuğu charmlı halhal, uzatma zincirli.' },
  { id:'zr-20', ad:'Su İnce Halhal',         kategori:'Halhal',   fiyat:119, eski:0, tip:'halhal',   metal:'gumus', tas:'beyaz',    rozet:'Hediyelik', stok:22, aciklama:'Sade zincirli, gümüş rengi halhal.' },

  { id:'zr-21', ad:'Cemre Kolye + Küpe Seti',kategori:'Set',      fiyat:379, eski:0, tip:'set',      metal:'altin', tas:'beyaz',    rozet:'Set', stok:4,  aciklama:'Aynı tasarımda kolye ve küpe seti.' },
  { id:'zr-22', ad:'İnci Gelin Seti',        kategori:'Set',      fiyat:549, eski:0, tip:'set',      metal:'gumus', tas:'inci',     rozet:'', stok:3,  aciklama:'İnci görünümlü kolye, küpe ve bileklik üçlüsü.' }
];
