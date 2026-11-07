# Convertrio — Tarayıcıda Arka Plan Silici

Convertrio, görsellerin arka planını tarayıcı içinde AI ile kaldıran, Türkçe, responsive, tek sayfalık bir React uygulamasıdır.

## Kurulum

Node.js 20.19+ veya 22.12+:

```bash
npm install
npm run dev
```

Üretim derlemesi:

```bash
npm run build
```

## Kullanım

1. PNG, JPG veya WEBP görsellerinizi seçin veya sürükleyip bırakın (dosya başına en fazla 20 MB).
2. **Arka planı kaldır** butonuna basın. İlk kullanımda WASM ve AI model dosyaları internetten indirilir.
3. AI işleminin ardından çok düşük saydamlık izleri otomatik temizlenir. Sonuç önizlemesini kontrol edin ve şeffaf PNG'yi indirin.

Birden fazla görsel sırayla işlenebilir. İşlem sırasında dosya kaldırma/temizleme kilitlenir.

## Teknoloji ve gizlilik

- React 19 + Vite 6 + CSS
- [IMG.LY background-removal](https://github.com/imgly/background-removal-js) v1.7.0 ve ONNX Runtime Web
- İşlem istemcinin tarayıcısında yapılır; görsel sunucuya yüklenmez.
- Daha yüksek kalite için `large` (isnet) modeli kullanılır; ilk kullanımda model/WASM dosyaları IMG.LY CDN'inden indirilir. Bu işlem daha fazla bellek ve indirme gerektirir. Sonraki kullanımlar önbelleğe bağlıdır.
- İlk indirme onlarca MB olabilir. Bellek veya tarayıcı uyumluluğu nedeniyle bazı görseller hata verebilir.
- PNG saydamlığını korur; kesimin kalitesi AI modeline ve görsele göre değişir. Kenar temizliği, AI sonucunun düşük alfa değerlerine müdahale eder ve saç gibi ince ayrıntıları da silebilir.\n- Yenileme veya sayfadan ayrılma durumunda yüklenen dosyalar uygulama belleğinden temizlenir.

## Lisans uyarısı

Kullanılan `@imgly/background-removal` kütüphanesi **GNU AGPL** lisansı altındadır. Projeyi yayımlamadan veya ticari kullanımdan önce AGPL yükümlülüklerini değerlendirin. Ticari/kapalı kaynak bir kullanım düşünülüyorsa IMG.LY ile ayrı lisans koşulları görüşülmelidir. Ayrıntılar: [IMG.LY README / LICENSE](https://github.com/imgly/background-removal-js).

## Doğrulama

GitHub Actions, Vite üretim derlemesini denetler. Üretim derlemesinin geçmesi, AI modelinin tüm tarayıcılarda gerçekten başarılı çalıştığını kanıtlamaz; gerçek dosyalarla tarayıcı üzerinde ayrıca test yapılmalıdır.
