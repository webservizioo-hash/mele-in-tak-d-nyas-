# Meleğin Takı Dünyası — Kullanım Kılavuzu

## Çalıştırma
1. Bilgisayarına Node.js (18 veya üstü) kur: https://nodejs.org
2. Klasörde terminal aç ve şunu yaz: node server.js
3. Site: http://localhost:3000   ·   Panel: http://localhost:3000/admin

Ek paket kurmana gerek yok (npm install yok).
Panel şifresi (ilk kurulum): 123123123 — yayına almadan önce Panel > Ayarlar'dan güçlü bir şifreyle değiştir.

Daha önce siteyi çalıştırdıysan veri/ klasörü eski şifre ve ayarları saklar. Yeni şifre ve ayarların
devreye girmesi için veri/yonetici.json ve veri/ayarlar.json dosyalarını sil
(ürün ve siparişleri korumak için veri/ klasörünün tamamını silme).

## Panel
Genel Bakış, Siparişler (durum değiştir, yazdır, sil), Ürünler (ekle/düzenle/sil, bilgisayardan fotoğraf yükle), Hediyeler, Stok Takibi, Bülten,
Ayarlar (kargo limiti ve ücretleri, telefon, WhatsApp, e-posta, IBAN, şifre).

## Ürünler
Sitedeki ürünler örnek üründür. Panel > Ürünler'den kendi ürünlerini, fiyatlarını ve fotoğraflarını gir.
Fotoğraf yüklenmeyen ürünlerde çizim görünür.

## Yayına almak
Siparişlerin panele düşmesi için sitenin bir Node.js sunucusunda çalışması gerekir
(Render, Railway, Fly.io, VPS, cPanel Node.js). Sadece dosya barındıran servisler
(Netlify, GitHub Pages) tek başına yetmez.
- Başlatma komutu: node server.js (port, PORT değişkeninden okunur)
- veri/ klasörü kalıcı diskte durmalı; ara sıra yedeğini al.
- Şifreyi ortam değişkeniyle de verebilirsin: ADMIN_SIFRE=... (yalnızca ilk kurulumda).
- Siteyi HTTPS üzerinden yayınla.

## Notlar
- Sepet tutarı kargo limitini (varsayılan 1.000 TL) geçince kargo bedava olur ve müşteri ödemeye geçerken
  Panel > Hediyeler listesinden 1 hediye seçer (önerilen: 5 hediye).
- Ödeme: sadece Havale/EFT. Kargo: standart.
- Sipariş e-postası gönderilmez; bildirim panelden gelir.
