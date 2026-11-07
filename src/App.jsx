import { useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, Check, CheckCircle2, ChevronDown, FileImage, Menu, Trash2, Upload, X } from 'lucide-react'

const MAX_FILE_SIZE = 2 * 1024 ** 3
const MIME_TYPES = { PNG: 'image/png', JPG: 'image/jpeg', WEBP: 'image/webp' }
const SOURCE_FORMATS = ['PNG', 'JPG', 'WEBP', 'SVG']
const TARGET_FORMATS = ['PNG', 'JPG', 'WEBP']

const extension = file => (file.name.split('.').pop() || '').toUpperCase().replace('JPEG', 'JPG')
const sizeLabel = size => size < 1024 ? `${size} B` : size < 1048576 ? `${(size / 1024).toFixed(1)} KB` : size < 1073741824 ? `${(size / 1048576).toFixed(1)} MB` : `${(size / 1073741824).toFixed(2)} GB`
const fileId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

function Brand({ footer = false }) {
  return <a className={`brand ${footer ? 'brand-footer' : ''}`} href="#ust" aria-label="Convertrio ana sayfa">
    <img src="/convertrio-logo.webp" alt="" className="brand-image"/>
    <span>convert<strong>rio</strong></span>
  </a>
}

function accepted(file) {
  return SOURCE_FORMATS.includes(extension(file))
}

function readAsImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => { URL.revokeObjectURL(objectUrl); resolve(image) }
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Görsel açılamadı veya dosya bozuk.')) }
    image.src = objectUrl
  })
}

async function convertImage(file, target) {
  const image = await readAsImage(file)
  if (!image.naturalWidth || !image.naturalHeight) throw new Error('Geçersiz görsel boyutları.')
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Bu görsel tarayıcıda işlenemiyor.')
  if (target === 'JPG') {
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
  }
  context.drawImage(image, 0, 0)
  const blob = await new Promise((resolve, reject) => canvas.toBlob(
    value => value ? resolve(value) : reject(new Error('Dönüştürme başarısız oldu.')),
    MIME_TYPES[target],
    0.92
  ))
  if (blob.type !== MIME_TYPES[target]) throw new Error('Tarayıcı bu çıktı formatını desteklemiyor.')
  return blob
}

export default function App() {
  const fileInput = useRef(null)
  const itemsRef = useRef([])
  const [items, setItems] = useState([])
  const [target, setTarget] = useState('WEBP')
  const [dragging, setDragging] = useState(false)
  const [message, setMessage] = useState('')
  const [working, setWorking] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => { itemsRef.current = items }, [items])
  useEffect(() => () => { itemsRef.current.forEach(item => { if (item.url) URL.revokeObjectURL(item.url) }) }, [])

  function addFiles(list) {
    const acceptedFiles = []
    const errors = []
    for (const file of Array.from(list || [])) {
      if (file.size === 0) { errors.push(`${file.name}: boş dosya`); continue }
      if (file.size > MAX_FILE_SIZE) { errors.push(`${file.name}: 2 GB sınırı aşıldı`); continue }
      if (!accepted(file)) { errors.push(`${file.name}: bu format henüz desteklenmiyor`); continue }
      acceptedFiles.push({ id: fileId(), file, target, state: 'ready', url: null, error: '' })
    }
    setMessage(errors.join(' • '))
    if (acceptedFiles.length) setItems(old => [...old, ...acceptedFiles])
  }

  function removeItem(id) {
    const current = itemsRef.current.find(item => item.id === id)
    if (current?.url) URL.revokeObjectURL(current.url)
    setItems(old => old.filter(item => item.id !== id))
  }

  function changeItemTarget(id, nextTarget) {
    const old = itemsRef.current.find(item => item.id === id)
    if (old?.url) URL.revokeObjectURL(old.url)
    setItems(all => all.map(item => item.id === id ? { ...item, target: nextTarget, state: 'ready', url: null, error: '' } : item))
  }

  async function startConversion() {
    if (working) return
    const pending = itemsRef.current.filter(item => item.state !== 'done')
    if (!pending.length) return
    setWorking(true)
    setMessage('')
    for (const item of pending) {
      setItems(all => all.map(x => x.id === item.id ? { ...x, state: 'working', error: '' } : x))
      try {
        const blob = await convertImage(item.file, item.target)
        const outputUrl = URL.createObjectURL(blob)
        setItems(all => all.map(x => x.id === item.id ? { ...x, state: 'done', url: outputUrl, error: '' } : x))
      } catch (error) {
        setItems(all => all.map(x => x.id === item.id ? { ...x, state: 'error', error: error?.message || 'Dönüştürme başarısız.' } : x))
      }
    }
    setWorking(false)
  }

  function clearAll() {
    itemsRef.current.forEach(item => { if (item.url) URL.revokeObjectURL(item.url) })
    setItems([])
    setMessage('')
  }

  const readyCount = items.filter(item => item.state !== 'done').length
  return <div className="site" id="ust">
    <header className="header">
      <div className="container header-content">
        <Brand/>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Ana menü">
          <a href="#donustur" onClick={() => setMenuOpen(false)}>Dönüştürücüler</a>
          <a href="#nasil-calisir" onClick={() => setMenuOpen(false)}>Araçlar</a>
          <a href="#yardim" onClick={() => setMenuOpen(false)}>Yardım</a>
        </nav>
        <button type="button" className="menu-toggle" aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'} aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X size={23}/> : <Menu size={23}/>}</button>
      </div>
    </header>
    <main>
      <section className="hero" id="donustur">
        <div className="container hero-inner">
          <h1>Her dosyayı saniyeler içinde dönüştür</h1>
          <div className="converter">
            <div className="converter-toolbar">
              <button className="select-file" type="button" onClick={() => fileInput.current?.click()}><Upload size={19} strokeWidth={2}/> Dosya seç</button>
              <div className="target-control"><label htmlFor="target">Dönüştür:</label><div className="select-wrap"><select id="target" value={target} onChange={e => setTarget(e.target.value)}>{TARGET_FORMATS.map(value => <option value={value} key={value}>{value}</option>)}</select><ChevronDown size={17}/></div></div>
              <span className="supported-label">PNG · JPG · WEBP · SVG</span>
              <input type="file" ref={fileInput} className="visually-hidden" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" multiple onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
            </div>
            <div className={`drop-area ${dragging ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false) }} onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}>
              veya dosyaları buraya sürükle
            </div>
            {message && <p className="form-error" role="alert">{message}</p>}
            {items.length > 0 && <div className="queue">
              <div className="queue-heading"><h2>Dosyalar <span>{items.length}</span></h2><button type="button" onClick={clearAll} disabled={working}><Trash2 size={15}/> Temizle</button></div>
              <div className="queue-list">{items.map(item => <div className="queue-item" key={item.id}>
                <div className="file-mark"><FileImage size={21}/></div>
                <div className="file-info"><strong title={item.file.name}>{item.file.name}</strong><span>{extension(item.file)} · {sizeLabel(item.file.size)}</span></div>
                <div className="item-select"><label htmlFor={`fmt-${item.id}`}>Format</label><select id={`fmt-${item.id}`} value={item.target} disabled={working} onChange={e => changeItemTarget(item.id,e.target.value)}>{TARGET_FORMATS.map(value => <option key={value} value={value}>{value}</option>)}</select></div>
                <span className={`item-status status-${item.state}`}>{item.state === 'ready' ? 'Hazır' : item.state === 'working' ? 'Dönüştürülüyor' : item.state === 'done' ? 'Tamamlandı' : 'Hata'}</span>
                {item.state === 'done' && item.url ? <a className="download-link" href={item.url} download={`${item.file.name.replace(/\.[^.]+$/, '')}.${item.target.toLowerCase()}`}><ArrowDownToLine size={16}/> İndir</a> : <button type="button" className="remove-file" aria-label={`${item.file.name} dosyasını kaldır`} onClick={() => removeItem(item.id)} disabled={working}><X size={18}/></button>}
                {item.error && <p className="item-error">{item.error}</p>}
              </div>)}</div>
              {readyCount > 0 && <div className="queue-footer"><span>{items.filter(item => item.state === 'done').length} / {items.length} tamamlandı</span><button className="convert-button" disabled={working} onClick={startConversion}>{working ? 'Dönüştürülüyor…' : 'Dönüştür'}</button></div>}
            </div>}
          </div>
          <div className="hero-notes"><span><Check size={16}/> Kayıt gerekmez</span><span className="separator">·</span><span><Check size={16}/> Toplu dönüştürme</span></div>
        </div>
      </section>
      <section className="steps" id="nasil-calisir">
        <div className="container">
          <h2>Üç adımda tamam</h2>
          <div className="steps-grid">
            <article className="step"><div className="step-number">1</div><h3>Dosyanı yükle</h3><p>Bilgisayarından dosyanı seç veya sürükleyerek yükle.</p></article>
            <article className="step"><div className="step-number">2</div><h3>Formatı seç</h3><p>Dosyan için desteklenen hedef formatı belirle.</p></article>
            <article className="step"><div className="step-number">3</div><h3>İndir</h3><p>Dönüşüm bitince dosyanı tek tıkla indir.</p></article>
          </div>
        </div>
      </section>
      <section className="help" id="yardim"><div className="container help-content"><strong>Desteklenen dönüşümler</strong><p>PNG, JPG, WEBP ve SVG görselleri PNG, JPG veya WEBP formatına tarayıcınızda dönüştürebilirsiniz. Video, ses, belge, e-kitap ve arşiv dönüşümleri henüz sunulmuyor.</p><p id="gizlilik">Gizlilik: Yerel görsel dosyalarınız sunucuya yüklenmez.</p><p id="sartlar">Kullanım: 2 GB üzerindeki dosyalar kabul edilmez; tarayıcınızın bellek sınırları daha düşük olabilir.</p></div></section>
    </main>
    <footer className="footer"><div className="container footer-inner"><Brand footer/><div className="footer-links"><a href="#gizlilik">Gizlilik</a><a href="#sartlar">Şartlar</a><a href="#yardim">Yardım</a><a href="https://github.com/shymok-nt/Convertrio/issues" target="_blank" rel="noreferrer">İletişim</a></div></div></footer>
  </div>
}
