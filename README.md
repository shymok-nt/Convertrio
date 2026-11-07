# Convertrio

Tek sayfalık, Türkçe, responsive dosya dönüştürücü arayüzü.

## Çalıştırma

Node.js 20.19+ veya 22.12+ gerekir.

```bash
npm install
npm run dev
```

Üretim derlemesi:

```bash
npm run build
```

## Bu sürümde gerçekten desteklenen dönüşümler

- PNG → JPG veya WEBP
- JPG/JPEG → PNG veya WEBP
- WEBP → PNG veya JPG
- SVG → PNG, JPG veya WEBP
- Aynı formatı yeniden dışa aktarma da mümkündür.
- Birden fazla dosya sırayla dönüştürülür.
- İndirme tamamlandığında dosya tarayıcı tarafından kaydedilebilir.

İşlem Canvas API ile tamamen tarayıcıda gerçekleşir. JPG saydamlığını desteklemediği için saydam alanlar beyaza dönüşür.

## Henüz desteklenmeyenler

Video, ses, belge (PDF/DOCX/XLSX), e-kitap ve arşiv dönüşümleri **henüz çalışmıyor**. Kullanıcıya bu formatlar için sahte işlem/indirme gösterilmez; desteklenmeyen giriş dosyaları açıklayıcı mesajla reddedilir.

## Dikkat edilmesi gerekenler

- 2 GB üzerindeki dosyalar reddedilir; tarayıcı bellek/piksel limitleri çok daha küçük dosyaları etkileyebilir.
- Tarayıcınız ilgili kaynak görseli açamıyorsa veya çıktı biçimini desteklemiyorsa işlem açıklayıcı hatayla durur.
- Görseller sunucuya yüklenmez.
- GitHub Actions üretim derlemesini kontrol eder; bu, tüm tarayıcı ve formatlarda uçtan uca fonksiyon testi yerine geçmez.

## Teknoloji

React + Vite + CSS + Lucide React. Plus Jakarta Sans tipografi. Convertrio logo görseli kullanıcı tarafından sağlandı.
