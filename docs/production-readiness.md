# ClearPix — Yayına Hazırlık Denetimi

Denetim tarihi: 8 Kasım 2026. Kodun mevcut GitHub `main` dalı temel alınmıştır.

## 1. Build ve kod kalitesi

- GitHub Actions üzerinde `npm run lint`: **başarılı (0 hata, 0 uyarı)**.
- GitHub Actions üzerinde `npm run build`: **başarılı**.
- `eslint.config.js` eklendi, ESLint 9 ve React JSX değişken denetimi etkinleştirildi.
- Uygulama kodundaki kullanılmayan `catch` değişkeni temizlendi.
- Kaynak kod taramasında `console.log`, `console.debug`, `debugger` ve yorum satırına alınmış eski kod bulunmadı.
- **TODO/FIXME listesi:** Tarama sırasında bulunmadı; silinecek bir TODO yoktu.
- Metin tabanlı proje kaynaklarında hardcoded API anahtarı, erişim tokenı veya şifre deseni bulunmadı.
- `.env` ve `.env.*` Git tarafından yok sayılır; `.env.example` repoda kalır.
- `VITE_*` ortam değişkenleri tarayıcıya dahil olabileceği için sır saklamak amacıyla kullanılmamalıdır. Mevcut projede sır içeren böyle bir değişken yok.

## 2. npm audit — çözülmemiş riskler

GitHub Actions içinde `npm audit --audit-level=low` çalıştırıldı.

**Sonuç: 2 yüksek önem dereceli bağımlılık kaydı; tek kök zincir.**

| Paket | Risk | Durum |
|---|---|---|
| `zod` (<4.6.6) | Aşırı büyük kısıtlanmış koleksiyonların doğrulanmasında bellek tüketimi, GHSA-mrhx-c7xc-m3w5 | Çözülmedi |
| `@imgly/background-removal@1.7.0` | Etkilenen Zod sürümüne dolaylı bağımlılık | Çözülmedi |

`npm audit`, `npm audit fix --force` ile `@imgly/background-removal` paketinin **1.1.5** sürümüne düşürülmesini öneriyor. Bu uyumsuz sürüm değişikliği mevcut AI işlemini bozabileceğinden uygulanmadı. Güvenli, davranışı koruyan düzeltme bu aşamada doğrulanamadı. Yayına alınmadan önce upstream düzeltmeleri takip edilmeli ve bağımlılıklar kontrollü test edilmelidir.

Denetim adımı CI'da `continue-on-error` kullanır: kalite kontrollerinin durumu ve audit bulguları birbirinden ayrı gösterilir. **Başarılı build, güvenlik denetiminin geçtiği anlamına gelmez.**

Ek not: NPM kurulumunda eski ESLint 9 sürümünün artık desteklenmediğine ilişkin deprecation uyarısı görülebilir. ESLint 10'a geçiş test edilmediği için mevcut, çalışan yapı korunmuştur.

## 3. SEO ve yönlendirme

- Dil: `<html lang="tr">`.
- Ana sayfa başlığı: **ClearPix | Ücretsiz AI Arka Plan Silici**.
- Açıklama: PNG/JPG/WEBP ile yerel arka plan silme ve şeffaf PNG indirme.
- Statik Open Graph + Twitter Card etiketleri eklendi.
- `public/robots.txt` ve `public/sitemap.xml` eklendi.
- **Değiştirilecek placeholder:** `https://example.com` (HTML'deki `og:url`, `og:image`, robots ve sitemap).
- `react-router-dom` ile ana sayfa ve `path="*"` için 404 sayfası eklendi.
- `react-helmet-async` ile sayfa bazında başlık ve açıklama tanımlandı.
- Ana sayfa, 404 sayfası ve uygulama hata ekranında ayrı ayrı tek bir `h1` bulunur.
- `vercel.json` SPA rewrite tanımlar; ayrıca `nosniff`, `strict-origin-when-cross-origin`, `DENY` başlıklarını uygular.
- React Error Boundary bileşeni beklenmeyen render hatalarına karşı kurtarma ekranı sunar. Asenkron AI işlem hataları kendi hata akışında ele alınır.

## 4. Dış kaynak envanteri

| Kaynak | Kullanım |
|---|---|
| `fonts.googleapis.com` | Plus Jakarta Sans font CSS |
| `fonts.gstatic.com` | Google Fonts font dosyaları |
| IMG.LY model/CDN altyapısı | Arka plan kaldırma için ilk kullanımda ONNX modeli / ilgili çalışma zamanı varlıkları |
| `github.com/shymok-nt/Convertrio/issues` | Kullanıcı tıklarsa açılan dış bağlantı |

Doğrudan HTML içine eklenen üçüncü taraf JavaScript `<script src="https://...">` etiketi bulunmamaktadır. NPM kütüphaneleri build ile paketlenir; AI model kaynakları çalışma zamanında IMG.LY hizmetinden alınabilir. Favicon ve ClearPix logosu kendi `public/` dizininde servis edilir.

## 5. Yayın öncesi kalan işler

- Gerçek alan adı belirlendiğinde `example.com` değerlerini değiştir.
- GitHub build/lint sonuçlarına ek olarak Android ve masaüstü tarayıcıda gerçek görsellerle uçtan uca test yap.
- AGPL lisansının siteyi yayımlama koşullarını değerlendir.
- Zod/IMG.LY güvenlik uyarısı için uyumlu düzeltme çıkınca regresyon testiyle yükseltme yap.
- Vercel dağıtımı yapılınca 404 ve güvenlik başlıklarını canlı sunucuda doğrula.
