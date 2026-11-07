# Convertrio

Modern, responsive, tarayıcı içinde çalışan dosya dönüştürme web uygulaması.

## Yerel geliştirme

Gereksinim: Node.js 20.19+ (veya 22.12+) ve npm.

```bash
npm install
npm run dev
```

Vite terminalde bir yerel adres gösterir (genellikle http://localhost:5173).

## Üretim derlemesi

```bash
npm run build
npm run preview
```

## İlk sürümde çalışanlar

- Responsive React landing page ve SVG Convertrio logosu
- Dosya seçme, sürükle/bırak, çoklu dosya kuyruğu, kaldırma
- PNG, JPG ve WEBP görseller arasında tamamen istemci tarafında dönüşüm
- SVG kaynak görsellerini PNG, JPG veya WEBP'ye dönüştürme
- İlerleme durumu (işlem aşamalarına dayalı) ve biten çıktıyı indirme
- Örnek SVG dosyası ile deneme
- Herkese açık URL'lerden CORS izin veriyorsa dosya indirme
- Google Drive / Dropbox için yönlendirme ve dosyayı yerel olarak seçme açıklaması
- SSS, formatlar, gizlilik ve API bilgileri

## Sınırlar ve dürüst davranış

- PDF, DOCX, XLSX, MP3 ve MP4 **henüz dönüştürülmez**. Seçim ekranında bu formatlar açıkça yakında olarak belirtilir.
- Bulut depolama servisleriyle doğrudan OAuth dosya seçicisi henüz yoktur.
- Herkese açık bir Convertrio API sunulmamaktadır.
- Yerel görsel dönüşümleri sunucuya gönderilmez. URL ekleme seçeneği, kullanıcı tarafından verilen uzak sunucuyla tarayıcıdan iletişim kurar ve CORS'a bağlıdır.
- 2 GB dosya sınırı seçme aşamasında kontrol edilir; tarayıcı belleği / piksel sınırları nedeniyle daha küçük görseller de başarısız olabilir.
- Çıktı PNG/JPG/WEBP; JPG şeffaf arka planı beyaza dönüştürür.
- Tarayıcıda dosya işlemeye ilişkin performans ve bellek testleri henüz otomatik yapılmamıştır.

## Teknoloji

React 19 · Vite 6 · JavaScript · CSS · Lucide React

## Sonraki aşama

Gerçek PDF ve belge dönüştürme yöntemlerini araştırıp tarayıcıda çalışabilen motorları kademeli eklemek; sonrasında ses/video desteği ve erişilebilirlik testleri.
