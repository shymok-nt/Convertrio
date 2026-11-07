import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown, ArrowDownToLine, ArrowRight, Check, CheckCircle2,
  ChevronDown, Cloud, Code2, File, FileImage, FileText, FolderOpen,
  HelpCircle, Image, Link2, LockKeyhole, Menu, Plus, RotateCcw,
  ShieldCheck, Sparkles, Trash2, UploadCloud, X, Zap
} from 'lucide-react'

const MAX_BYTES = 2 * 1024 ** 3
const ALL_FORMATS = ['PDF', 'PNG', 'JPG', 'WEBP', 'MP3', 'MP4', 'SVG', 'DOCX', 'XLSX']
const OUTPUT_TYPES = { PNG: 'image/png', JPG: 'image/jpeg', WEBP: 'image/webp' }
const EXT_TO_FORMAT = { jpeg: 'JPG', jpg: 'JPG', png: 'PNG', webp: 'WEBP', svg: 'SVG', pdf: 'PDF', mp3: 'MP3', mp4: 'MP4', docx: 'DOCX', xlsx: 'XLSX' }
const faqs = [
  { q: 'Dosyalarım gerçekten güvende mi?', a: 'Yerel cihazınızdan seçtiğiniz görsellerin dönüşümü tarayıcı içinde yapılır; Convertrio sunucusuna gönderilmez. URL ile ekleme özelliğinde tarayıcınız ilgili uzak adresten dosyayı indirmeye çalışır.' },
  { q: 'Hangi formatları dönüştürebilirim?', a: 'Bu ilk sürümde PNG, JPG, WEBP görselleri ve SVG kaynak görselleri PNG/JPG/WEBP biçimlerine dönüştürebilirsiniz. PDF, DOCX, XLSX, MP3 ve MP4 için gerçek dönüştürme motorları sonraki sürümlerde eklenecek.' },
  { q: 'Dosya boyutu sınırı var mı?', a: 'Dosya seçici 2 GB üstündeki dosyaları reddeder. Ancak tarayıcının bellek kapasitesi ve görselin piksel boyutları nedeniyle çok büyük dosyalar daha düşük sınırda başarısız olabilir.' },
  { q: 'Hesap açmam gerekiyor mu?', a: 'Hayır. Yerel görsel dönüştürme özelliğini herhangi bir hesap oluşturmadan kullanabilirsiniz.' },
  { q: 'Google Drive veya Dropbox dosyalarını kullanabilir miyim?', a: 'Bu servislerden dosyanızı cihazınıza indirdikten sonra Convertrio üzerinden seçebilirsiniz. Doğrudan bulut dosya seçicisi bağlantısı henüz sunulmuyor.' },
]
const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#fff7f5"/><circle cx="940" cy="160" r="260" fill="#ffe4e2"/><circle cx="130" cy="740" r="320" fill="#fee2e2"/><rect x="180" y="180" width="840" height="440" rx="36" fill="#fff" stroke="#fecaca" stroke-width="3"/><path d="M480 350a120 120 0 1 0 2 102" fill="none" stroke="#ef4444" stroke-width="36" stroke-linecap="round"/><path d="m455 302 66 46-65 48" fill="#ef4444"/><text x="600" y="520" fill="#0f172a" font-size="55" font-family="Arial,sans-serif" font-weight="700" text-anchor="middle">Convertrio</text></svg>`

function Logo({ small = false }) {
  return <a href="#ust" className={`brand ${small ? 'brand-small' : ''}`} aria-label="Convertrio ana sayfa">
    <svg className="brand-symbol" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M49 18A24 24 0 1 0 50 45" stroke="#7F1D1D" strokeWidth="8.5" strokeLinecap="round"/>
      <path d="M47 12A24 24 0 1 0 47 49" stroke="#EF4444" strokeWidth="8.5" strokeLinecap="round"/>
      <path d="M44 3 56 11 44 20Z" fill="#EF4444"/>
      <path d="m42 43 13 7-13 9Z" fill="#7F1D1D"/>
    </svg>
    <span className="brand-type">convert<span>rio</span></span>
  </a>
}

function formatName(file) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  return EXT_TO_FORMAT[ext] || (file.type.split('/')[1] || 'DOSYA').toUpperCase()
}
function fileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}
function canConvert(file) {
  return ['PNG', 'JPG', 'WEBP', 'SVG'].includes(formatName(file))
}
function defaultTarget(file) {
  return formatName(file) === 'PNG' ? 'WEBP' : 'PNG'
}
function getImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Görsel tarayıcı tarafından açılamadı.')) }
    img.src = url
  })
}
async function convertImage(file, format, onProgress) {
  onProgress(15)
  const img = await getImage(file)
  onProgress(45)
  if (!img.naturalWidth || !img.naturalHeight) throw new Error('Görsel boyutları okunamadı.')
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Tarayıcınız bu görseli işleyemiyor.')
  if (format === 'JPG') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height) }
  ctx.drawImage(img, 0, 0)
  onProgress(80)
  const blob = await new Promise((resolve, reject) => canvas.toBlob(
    value => value ? resolve(value) : reject(new Error('Dönüştürme başarısız oldu.')),
    OUTPUT_TYPES[format], 0.92
  ))
  if (blob.type !== OUTPUT_TYPES[format]) throw new Error('Tarayıcınız bu çıktı biçimini desteklemiyor.')
  onProgress(100)
  return blob
}
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

function App() {
  const inputRef = useRef(null)
  const fileListRef = useRef([])
  const [files, setFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  const [urlOpen, setUrlOpen] = useState(false)
  const [urlValue, setUrlValue] = useState('')
  const [urlBusy, setUrlBusy] = useState(false)
  const [cloudHint, setCloudHint] = useState('')
  useEffect(() => { fileListRef.current = files }, [files])
  useEffect(() => () => fileListRef.current.forEach(item => { if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl) }), [])

  function addFiles(incoming) {
    setError('')
    const valid = []
    for (const file of Array.from(incoming || [])) {
      if (file.size > MAX_BYTES) { setError(`${file.name}: 2 GB sınırını aşıyor.`); continue }
      if (!file.size) { setError(`${file.name}: Dosya boş.`); continue }
      valid.push({ id: makeId(), file, target: defaultTarget(file), status: 'ready', progress: 0, downloadUrl: null, message: '' })
    }
    if (valid.length) setFiles(old => [...old, ...valid])
  }
  function patch(id, props) { setFiles(old => old.map(item => item.id === id ? { ...item, ...props } : item)) }
  function removeFile(id) {
    const item = fileListRef.current.find(x => x.id === id)
    if (item?.downloadUrl) URL.revokeObjectURL(item.downloadUrl)
    setFiles(old => old.filter(x => x.id !== id))
  }
  function onDrop(event) {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }
  async function convert(item) {
    if (item.status === 'converting' || !canConvert(item.file) || !OUTPUT_TYPES[item.target]) return
    patch(item.id, { status: 'converting', progress: 0, message: '' })
    try {
      const blob = await convertImage(item.file, item.target, progress => patch(item.id, { progress }))
      const old = fileListRef.current.find(x => x.id === item.id)
      if (old?.downloadUrl) URL.revokeObjectURL(old.downloadUrl)
      const downloadUrl = URL.createObjectURL(blob)
      patch(item.id, { status: 'done', progress: 100, downloadUrl })
    } catch (err) {
      patch(item.id, { status: 'error', progress: 0, message: err.message || 'Dönüştürülemedi.' })
    }
  }
  async function addFromUrl(event) {
    event.preventDefault()
    setError('')
    setUrlBusy(true)
    try {
      const url = new URL(urlValue)
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('HTTP veya HTTPS bağlantısı kullanın.')
      const response = await fetch(url.href)
      if (!response.ok) throw new Error(`Dosya alınamadı (HTTP ${response.status}).`)
      const length = Number(response.headers.get('content-length') || 0)
      if (length > MAX_BYTES) throw new Error('Dosya 2 GB sınırını aşıyor.')
      const blob = await response.blob()
      if (blob.size > MAX_BYTES) throw new Error('Dosya 2 GB sınırını aşıyor.')
      const name = decodeURIComponent(url.pathname.split('/').pop() || 'uzak-gorsel.png').replace(/[^\w.\-ğüşıöçĞÜŞİÖÇ]/g, '_')
      addFiles([new window.File([blob], name, { type: blob.type })])
      setUrlOpen(false)
      setUrlValue('')
    } catch (err) {
      setError(err instanceof TypeError ? 'Bu bağlantı tarayıcının CORS güvenlik politikası nedeniyle açılamadı. Dosyayı indirip cihazınızdan seçin.' : (err.message || 'Bağlantı açılamadı.'))
      setUrlOpen(false)
    } finally { setUrlBusy(false) }
  }
  function addSample() {
    const file = new window.File([sampleSvg], 'convertrio-ornek.svg', { type: 'image/svg+xml' })
    addFiles([file])
  }
  const readyCount = files.filter(x => x.status === 'ready' && canConvert(x.file)).length
  return <div id="ust" className="site">
    <header className="header">
      <div className="container header-inner">
        <Logo />
        <nav className={`nav ${menuOpen ? 'nav-open' : ''}`} aria-label="Ana menü">
          <a href="#donustur" onClick={() => setMenuOpen(false)}>Dönüştür</a>
          <a href="#formatlar" onClick={() => setMenuOpen(false)}>Formatlar</a>
          <a href="#api" onClick={() => setMenuOpen(false)}>API</a>
          <a href="#yardim" onClick={() => setMenuOpen(false)}>Yardım</a>
        </nav>
        <button className="menu-button" type="button" aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'} aria-expanded={menuOpen} onClick={() => setMenuOpen(x => !x)}>{menuOpen ? <X size={22}/> : <Menu size={22}/>}</button>
      </div>
    </header>

    <main>
      <section className="hero" id="donustur">
        <div className="hero-glow hero-glow-left" /><div className="hero-glow hero-glow-right" />
        <div className="container hero-inner">
          <div className="eyebrow"><span className="eyebrow-dot" /> DOSYALARINIZ, KONTROLÜNÜZDE <span className="eyebrow-line" /></div>
          <h1>Dosyalarınızı dönüştürün.<br/><span className="gradient-text">Gerisini bize bırakın.</span></h1>
          <p className="hero-description">Hızlı, güvenli ve zahmetsiz dosya dönüştürme.<br className="desktop-break"/> Dosyalarınız sunucuya yüklenmeden, doğrudan tarayıcınızda işlenir.</p>
          <div className="converter-card">
            <div className="converter-head"><div><span className="live-dot" /> DOSYA DÖNÜŞTÜRÜCÜ</div><div className="card-privacy"><LockKeyhole size={13}/> TARAYICINIZDA İŞLENİR</div></div>
            <div className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={e => {e.preventDefault();setDragging(true)}} onDragLeave={e => {if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)}} onDrop={onDrop}>
              <div className="upload-icon"><UploadCloud size={30} strokeWidth={1.7}/></div>
              <h2>Dosyalarınızı buraya sürükleyin</h2>
              <p>veya cihazınızdan bir dosya seçerek başlayın</p>
              <input ref={inputRef} type="file" multiple hidden onChange={e => {addFiles(e.target.files);e.target.value=''}} aria-label="Dosya yükle"/>
              <button className="primary-button upload-button" onClick={() => inputRef.current?.click()}><FolderOpen size={18}/> Dosyaları Seçin <ArrowRight size={16}/></button>
              <div className="drop-help">Dosya başına en fazla 2 GB <span>•</span> Çoklu dosya seçimi</div>
            </div>
            <div className="upload-actions">
              <span>Başka bir yerden ekle</span>
              <div className="source-buttons">
                <button onClick={() => setCloudHint('Google Drive')} title="Google Drive dosyası ekleme yönergesi"><Cloud size={16}/> Google Drive</button>
                <button onClick={() => setCloudHint('Dropbox')} title="Dropbox dosyası ekleme yönergesi"><Cloud size={16}/> Dropbox</button>
                <button onClick={() => {setUrlOpen(true);setError('')}}><Link2 size={15}/> URL</button>
              </div>
            </div>
            {error && <div className="error-banner" role="alert">{error}<button aria-label="Hata mesajını kapat" onClick={() => setError('')}><X size={15}/></button></div>}
            {files.length > 0 && <div className="file-panel">
              <div className="file-panel-heading"><div><strong>Dosyalarınız</strong><span className="file-count">{files.length}</span></div><button onClick={() => {files.forEach(x => x.downloadUrl && URL.revokeObjectURL(x.downloadUrl));setFiles([])}}><Trash2 size={14}/> Listeyi temizle</button></div>
              <div className="file-list">{files.map(item => <div className="file-item" key={item.id}>
                <div className="file-top"><div className="file-icon"><FileImage size={21}/></div><div className="file-info"><strong title={item.file.name}>{item.file.name}</strong><span>{fileSize(item.file.size)} <i>·</i> {formatName(item.file)}</span></div><button className="remove-button" aria-label={`${item.file.name} dosyasını kaldır`} onClick={() => removeFile(item.id)}><X size={17}/></button></div>
                <div className="file-bottom">
                  <span className={`status ${item.status}`}>{item.status === 'done' ? <><CheckCircle2 size={13}/> Tamamlandı</> : item.status === 'converting' ? 'Dönüştürülüyor...' : item.status === 'error' ? 'Hata' : 'Hazır'}</span>
                  <div className="file-controls"><ArrowRight className="file-arrow" size={16}/><select aria-label={`${item.file.name} hedef format`} value={item.target} disabled={item.status === 'converting'} onChange={e => {if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);patch(item.id, {target:e.target.value,status:'ready',progress:0,downloadUrl:null,message:''})}}>
                    {ALL_FORMATS.map(fmt => <option key={fmt} value={fmt} disabled={!canConvert(item.file) || !OUTPUT_TYPES[fmt]}>{fmt}{!OUTPUT_TYPES[fmt] ? ' (yakında)' : ''}</option>)}
                  </select>
                  {item.status === 'done' ? <a className="download-button" href={item.downloadUrl} download={`${item.file.name.replace(/\.[^.]+$/, '')}.${item.target.toLowerCase() === 'jpg' ? 'jpg' : item.target.toLowerCase()}`}><ArrowDownToLine size={15}/> İndir</a> : <button className="convert-button" disabled={!canConvert(item.file) || item.status === 'converting'} onClick={() => convert(item)}>{item.status === 'converting' ? 'İşleniyor' : 'Dönüştür'}</button>}
                  </div>
                </div>
                {item.status === 'converting' && <div className="progress-track" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100}><div style={{width:`${item.progress}%`}}/></div>}
                {!canConvert(item.file) && <p className="file-note">Bu dosya türünün dönüşüm motoru henüz eklenmedi.</p>}
                {item.message && <p className="file-note file-error">{item.message}</p>}
              </div>)}</div>
              <div className="file-panel-footer"><button className="add-another" onClick={() => inputRef.current?.click()}><Plus size={16}/> Daha fazla dosya ekle</button>{readyCount > 0 && <button className="convert-all" onClick={() => files.filter(x => x.status === 'ready' && canConvert(x.file)).forEach(convert)}>Tümünü dönüştür <ArrowRight size={15}/></button>}</div>
            </div>}
            <div className="converter-foot"><span><ShieldCheck size={15}/> Dosyalarınız cihazınızda kalır</span><button onClick={addSample}><Sparkles size={14}/> Örnek dosya ile dene <ArrowRight size={13}/></button></div>
          </div>
          <div className="hero-assurances"><span><CheckCircle2 size={15}/> Hesap gerekmez</span><span><CheckCircle2 size={15}/> Kurulum gerekmez</span><span><CheckCircle2 size={15}/> Gizliliğe öncelik</span></div>
        </div>
      </section>

      <section className="section process-section" id="nasil-calisir"><div className="container">
        <div className="section-kicker">BU KADAR KOLAY</div><h2>Üç adımda <span>hazır.</span></h2><p className="section-desc">Karmaşık ayarlar yok. İhtiyacınız olan tek şey dosyanız.</p>
        <div className="steps-grid">
          <div className="step-card"><span className="step-index">01 / SEÇ</span><div className="step-icon step-red"><FolderOpen size={26}/></div><h3>Dosyanızı ekleyin</h3><p>Cihazınızdan seçin veya sürükleyip bırakın. Birden fazla dosyayı aynı anda ekleyebilirsiniz.</p></div>
          <div className="step-card"><span className="step-index">02 / DÖNÜŞTÜR</span><div className="step-icon step-orange"><RotateCcw size={26}/></div><h3>Formatı belirleyin</h3><p>İstediğiniz çıktı formatını seçin. Dönüşüm, desteklenen türlerde tarayıcınızda gerçekleşir.</p></div>
          <div className="step-card"><span className="step-index">03 / İNDİR</span><div className="step-icon step-green"><ArrowDownToLine size={26}/></div><h3>Hemen indirin</h3><p>İşlem tamamlandığında yeni dosyanızı tek tıklamayla cihazınıza kaydedin.</p></div>
        </div>
      </div></section>

      <section className="section formats-section" id="formatlar"><div className="container formats-layout"><div className="formats-copy"><div className="section-kicker">FORMATLAR</div><h2>Doğru format.<br/><span>Her seferinde.</span></h2><p>Popüler dosya türlerini tek bir yerde keşfedin. İlk sürümde görsel dönüşümü kullanılabilir; diğer dönüşüm araçlarını adım adım ekliyoruz.</p><a className="text-link" href="#donustur">Dönüştürmeye başla <ArrowRight size={17}/></a></div><div className="formats-panel"><div className="formats-panel-head"><FileImage size={18}/> Görsel formatları <span className="available-mark">KULLANILABİLİR</span></div><div className="format-tags">{['PNG','JPG','WEBP','SVG (girdi)'].map(x => <span className="format-tag active-tag" key={x}>{x}</span>)}</div><div className="format-divider"/><div className="formats-panel-head"><FileText size={18}/> Belge, ses ve video <span className="soon-mark">YAKINDA</span></div><div className="format-tags">{['PDF','DOCX','XLSX','MP3','MP4'].map(x => <span className="format-tag" key={x}>{x}</span>)}</div><p className="format-footnote">SVG görselleri PNG, JPG veya WEBP olarak dışa aktarılabilir.</p></div></div></section>

      <section className="section trust-section"><div className="container"><div className="trust-content"><div className="trust-icon"><LockKeyhole size={26}/></div><div><div className="section-kicker">GİZLİLİK ÖNCE GELİR</div><h2>Dosyanız size ait.<br/><span>Öyle de kalmalı.</span></h2><p>Görsel dosyalarınızın işlenmesi tamamen tarayıcınızda gerçekleşir. Hesap açmanıza veya dosyalarınızı bize göndermenize gerek yok.</p></div><div className="trust-points"><div><Check size={17}/> Sunucuya dosya yüklemesi yok</div><div><Check size={17}/> Tarayıcı içinde dönüşüm</div><div><Check size={17}/> Kayıt ve hesap gerektirmez</div></div></div></div></section>

      <section className="section faq-section" id="yardim"><div className="container faq-layout"><div><div className="section-kicker">YARDIM MERKEZİ</div><h2>Aklınıza takılan<br/><span>bir şey mi var?</span></h2><p>Sık sorulan soruların yanıtları burada.</p></div><div className="faq-list">{faqs.map((faq, i) => <div className={`faq-item ${openFaq === i ? 'faq-open' : ''}`} key={faq.q}><button aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>{faq.q}<ChevronDown size={19}/></button>{openFaq === i && <p>{faq.a}</p>}</div>)}</div></div></section>

      <section className="api-section" id="api"><div className="container api-inner"><div className="api-left"><div className="api-icon"><Code2 size={21}/></div><div><strong>Geliştiriciler için Convertrio</strong><p>Şu anda yalnızca tarayıcı tabanlı bir arayüz sunuluyor; herkese açık bir sunucu API'si bulunmuyor.</p></div></div><a href="#yardim">Daha fazla bilgi <ArrowRight size={16}/></a></div></section>
    </main>
    <footer className="footer" id="gizlilik"><div className="container footer-main"><div><Logo small/><p>Dosyalarınız, kontrolünüzde.</p></div><div className="footer-links"><a href="#donustur">Dönüştür</a><a href="#formatlar">Formatlar</a><a href="#yardim">Yardım</a><a href="#gizlilik-bilgisi">Gizlilik</a></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Convertrio. Tüm hakları saklıdır.</span><span id="gizlilik-bilgisi">Yerel dönüştürme • Dosyalar sunucuya gönderilmez</span></div></footer>

    {urlOpen && <div className="modal-backdrop" onClick={() => setUrlOpen(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="url-title" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setUrlOpen(false)} aria-label="Kapat"><X size={20}/></button><div className="modal-icon"><Link2 size={22}/></div><h2 id="url-title">URL'den dosya ekle</h2><p>Herkese açık bir dosyanın doğrudan bağlantısını girin. Bağlantının CORS erişimine izin vermesi gerekir.</p><form onSubmit={addFromUrl}><label htmlFor="file-url">Dosya bağlantısı</label><input id="file-url" type="url" value={urlValue} required placeholder="https://ornek.com/gorsel.png" onChange={e => setUrlValue(e.target.value)}/><button className="primary-button" disabled={urlBusy}>{urlBusy ? 'İndiriliyor...' : 'Dosyayı ekle'} <ArrowRight size={16}/></button></form></div></div>}
    {cloudHint && <div className="modal-backdrop" onClick={() => setCloudHint('')}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="cloud-title" onClick={e => e.stopPropagation()}><button className="modal-close" aria-label="Kapat" onClick={() => setCloudHint('')}><X size={20}/></button><div className="modal-icon"><Cloud size={22}/></div><h2 id="cloud-title">{cloudHint} dosyası ekleme</h2><p>Doğrudan bulut hesabı bağlantısı henüz mevcut değil. {cloudHint} üzerindeki dosyanızı cihazınıza indirdikten sonra buradan seçebilirsiniz.</p><div className="modal-actions"><a className="secondary-link" href={cloudHint === 'Dropbox' ? 'https://www.dropbox.com/home' : 'https://drive.google.com/drive/my-drive'} target="_blank" rel="noreferrer">{cloudHint} uygulamasını aç <ArrowRight size={15}/></a><button className="primary-button" onClick={() => {setCloudHint('');inputRef.current?.click()}}>Cihazdan seç <FolderOpen size={16}/></button></div></div></div>}
  </div>
}
export default App
