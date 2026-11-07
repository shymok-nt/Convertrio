import { Helmet } from 'react-helmet-async'
import { useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, Check, ImagePlus, Menu, Trash2, Upload, X } from 'lucide-react'

const MAX_FILE_SIZE = 20 * 1024 * 1024
const ACCEPTED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp'])
const fileId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
const sizeLabel = bytes => bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`

async function automaticallyCleanEdges(blob) {
  const url = URL.createObjectURL(blob)
  try {
    const image = new Image()
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () => reject(new Error('Önizleme görseli açılamadı.'))
      image.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return blob
    context.drawImage(image, 0, 0)
    const data = context.getImageData(0, 0, canvas.width, canvas.height)
    let modified = false
    for (let i = 3; i < data.data.length; i += 4) {
      if (data.data[i] > 0 && data.data[i] <= 7) {
        data.data[i] = 0
        modified = true
      }
    }
    if (!modified) return blob
    context.putImageData(data, 0, 0)
    return await new Promise((resolve, reject) => canvas.toBlob(
      result => result ? resolve(result) : reject(new Error('PNG oluşturulamadı.')), 'image/png'
    ))
  } catch {

    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}

function Brand({ footer = false }) {
  return <a className={`brand ${footer ? 'brand-footer' : ''}`} href="#ust" aria-label="ClearPix ana sayfa">
    <img src="/clearpix-wordmark.webp" alt="ClearPix" className="brand-wordmark"/>
  </a>
}

export default function App() {
  const fileInput = useRef(null)
  const itemsRef = useRef([])
  const busyRef = useRef(false)
  const mountedRef = useRef(true)
  const [items, setItems] = useState([])
  const [dragging, setDragging] = useState(false)
  const [message, setMessage] = useState('')
  const [working, setWorking] = useState(false)
  const [progress, setProgress] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [preview, setPreview] = useState('result')

  const setList = updater => {
    const next = typeof updater === 'function' ? updater(itemsRef.current) : updater
    itemsRef.current = next
    if (mountedRef.current) setItems(next)
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      itemsRef.current.forEach(item => {
        URL.revokeObjectURL(item.originalUrl)
        if (item.outputUrl) URL.revokeObjectURL(item.outputUrl)
      })
    }
  }, [])

  function addFiles(list) {
    const next = []
    const errors = []
    for (const file of Array.from(list || [])) {
      if (!ACCEPTED_MIME.has(file.type)) { errors.push(`${file.name}: yalnızca PNG, JPG ve WEBP kabul edilir.`); continue }
      if (!file.size) { errors.push(`${file.name}: dosya boş.`); continue }
      if (file.size > MAX_FILE_SIZE) { errors.push(`${file.name}: 20 MB sınırını aşıyor.`); continue }
      next.push({
        id: fileId(), file, originalUrl: URL.createObjectURL(file),
        outputUrl: null, state: 'ready', error: ''
      })
    }
    setMessage(errors.join(' '))
    if (next.length) {
      setPreview('original')
      setList(old => [...old, ...next])
    }
  }

  function removeItem(id) {
    if (busyRef.current) return
    const item = itemsRef.current.find(x => x.id === id)
    if (item) {
      URL.revokeObjectURL(item.originalUrl)
      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl)
    }
    setList(old => old.filter(x => x.id !== id))
  }

  function clearAll() {
    if (busyRef.current) return
    for (const item of itemsRef.current) {
      URL.revokeObjectURL(item.originalUrl)
      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl)
    }
    setList([])
    setMessage('')
    setProgress('')
  }

  async function removeBackgrounds() {
    if (busyRef.current) return
    const pending = itemsRef.current.filter(x => x.state !== 'done')
    if (!pending.length) return
    busyRef.current = true
    setWorking(true)
    setMessage('')
    setProgress('AI modeli hazırlanıyor…')
    try {

      const { removeBackground } = await import('@imgly/background-removal')
      for (const item of pending) {
        if (!mountedRef.current) break
        setList(old => old.map(x => x.id === item.id ? { ...x, state: 'working', error: '' } : x))
        setProgress(`${item.file.name} işleniyor…`)
        try {
          const blob = await removeBackground(item.file, {
            model: 'large',
            output: { format: 'image/png', quality: 1, type: 'foreground' },
            progress: (key, current, total) => {
              if (!mountedRef.current || !total) return
              const percentage = Math.round((current / total) * 100)
              setProgress(`Model dosyası yükleniyor: %${percentage}`)
            }
          })
          if (!mountedRef.current) break
          if (blob.type !== 'image/png' || !blob.size) throw new Error('Şeffaf PNG oluşturulamadı.')
          const cleanedBlob = await automaticallyCleanEdges(blob)
          if (!mountedRef.current) break
          const outputUrl = URL.createObjectURL(cleanedBlob)
          setList(old => old.map(x => x.id === item.id ? { ...x, outputUrl, state: 'done' } : x))
          if (itemsRef.current[itemsRef.current.length - 1]?.id === item.id) setPreview('result')
          setProgress('')
        } catch (error) {
          if (mountedRef.current) {
            setList(old => old.map(x => x.id === item.id ? { ...x, state: 'error', error: error?.message || 'Arka plan silinemedi.' } : x))
            setProgress('')
          }
        }
      }
    } catch {
      if (mountedRef.current) {
        setMessage('Arka plan silme motoru yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.')
        setProgress('')
      }
    } finally {
      busyRef.current = false
      if (mountedRef.current) setWorking(false)
    }
  }



  useEffect(() => {
    const discard = () => {
      itemsRef.current.forEach(item => {
        URL.revokeObjectURL(item.originalUrl)
        if (item.outputUrl) URL.revokeObjectURL(item.outputUrl)
      })
      itemsRef.current = []
      setItems([])
      setMessage('')
      setProgress('')
      setPreview('original')
      if (fileInput.current) fileInput.current.value = ''
    }
    const onPageShow = event => { if (event.persisted) discard() }
    window.addEventListener('pagehide', discard)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('pagehide', discard)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  const latest = items[items.length - 1]

  return <div className="site" id="ust">
    <Helmet>
      <title>ClearPix | Ücretsiz AI Arka Plan Silici</title>
      <meta name="description" content="ClearPix ile PNG, JPG ve WEBP görsellerinizin arka planını tarayıcınızda kaldırın ve şeffaf PNG olarak indirin. Hesap gerekmez." />
    </Helmet>
    <header className="header">
      <div className="container header-content">
        <Brand/>
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Ana menü">
          <a href="#arac" onClick={() => setMenuOpen(false)}>Arka Plan Silici</a>
          <a href="#nasil-calisir" onClick={() => setMenuOpen(false)}>Nasıl Çalışır?</a>
          <a href="#yardim" onClick={() => setMenuOpen(false)}>Yardım</a>
        </nav>
        <button type="button" className="menu-toggle" aria-expanded={menuOpen} aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'} onClick={() => setMenuOpen(x => !x)}>{menuOpen ? <X size={23}/> : <Menu size={23}/>}</button>
      </div>
    </header>
    <main>
      <section className="hero" id="arac">
        <div className="container hero-inner">
          <h1>Görsellerinizin arka planını kaldırın</h1>
          <div className="converter">
            {items.length === 0 && <div className="empty-upload">
            <div className="converter-toolbar">
              <button className="select-file" type="button" onClick={() => fileInput.current?.click()} disabled={working}><Upload size={19}/> Görsel seç</button>
              <span className="supported-label">PNG, JPG veya WEBP · En fazla 20 MB</span>
            </div>
            <div className={`drop-area ${dragging ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); if (!working) setDragging(true) }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false) }} onDrop={e => { e.preventDefault(); setDragging(false); if (!working) addFiles(e.dataTransfer.files) }}>
              veya görselleri buraya sürükle
            </div>
            </div>}
            {items.length > 0 && <div className="selected-toolbar">
              <strong>Görsel önizleme</strong>
              <button type="button" className="change-file" onClick={() => fileInput.current?.click()} disabled={working}><Upload size={16}/> Görsel ekle</button>
            </div>}
            <input type="file" ref={fileInput} className="visually-hidden" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" multiple disabled={working} onChange={e => { addFiles(e.target.files); e.target.value = '' }}/>
            {message && <p className="form-error" role="alert">{message}</p>}
            {items.length > 0 && <>
              {latest && <div className="preview-panel" id="gorsel-onizleme">
                <div className="preview-header"><h2>{latest.file.name}</h2><div className="preview-tabs" role="group" aria-label="Görsel önizleme"><button type="button" className={preview === 'original' ? 'active' : ''} onClick={() => setPreview('original')}>Orijinal</button><button type="button" className={preview === 'result' ? 'active' : ''} onClick={() => setPreview('result')} disabled={!latest.outputUrl}>Sonuç</button></div></div>
                <div className="preview-canvas"><img src={preview === 'result' && latest.outputUrl ? latest.outputUrl : latest.originalUrl} alt={preview === 'result' && latest.outputUrl ? 'Arka planı kaldırılmış görsel' : 'Orijinal görsel'}/></div>
                <div className="preview-action">
                  {latest.outputUrl ? <a className="convert-button preview-download" href={latest.outputUrl} download={`${latest.file.name.replace(/\.[^.]+$/, '')}-arkaplan-silindi.png`}><ArrowDownToLine size={17}/> Şeffaf PNG indir</a> : <button type="button" className="convert-button" disabled={working} onClick={removeBackgrounds}>{working ? 'İşleniyor…' : 'Arka planı kaldır'}</button>}
                  <span aria-live="polite">{progress || (latest.state === 'error' ? latest.error : '')}</span>
                </div>
              </div>}
              <div className="queue">
                <div className="queue-heading"><h2>Görseller <span>{items.length}</span></h2><button type="button" onClick={clearAll} disabled={working}><Trash2 size={15}/> Temizle</button></div>
                <div className="queue-list">{items.map(item => <div className="queue-item" key={item.id}>
                  <div className="file-mark"><ImagePlus size={21}/></div>
                  <div className="file-info"><strong title={item.file.name}>{item.file.name}</strong><span>{sizeLabel(item.file.size)}</span></div>
                  <span className={`item-status status-${item.state}`}>{item.state === 'ready' ? 'Hazır' : item.state === 'working' ? 'İşleniyor' : item.state === 'done' ? 'Tamamlandı' : 'Hata'}</span>
                  {item.outputUrl ? <a className="download-link" href={item.outputUrl} download={`${item.file.name.replace(/\.[^.]+$/, '')}-arkaplan-silindi.png`}><ArrowDownToLine size={16}/> PNG indir</a> : <button className="remove-file" type="button" aria-label={`${item.file.name} dosyasını kaldır`} onClick={() => removeItem(item.id)} disabled={working}><X size={18}/></button>}
                  {item.error && <p className="item-error">{item.error}</p>}
                </div>)}</div>
                
              </div>
            </>}
          </div>
          <div className="hero-notes"><span><Check size={16}/> Hesap gerekmez</span><span className="separator">·</span><span><Check size={16}/> Görseller cihazınızda işlenir</span></div>
        </div>
      </section>
      <section className="steps" id="nasil-calisir">
        <div className="container">
          <h2>Üç adımda tamam</h2>
          <div className="steps-grid">
            <article className="step"><div className="step-number">1</div><h3>Görselini yükle</h3><p>PNG, JPG veya WEBP görselini cihazından seç ya da sürükleyip bırak.</p></article>
            <article className="step"><div className="step-number">2</div><h3>Arka planı kaldır</h3><p>AI modeli görselini tarayıcında işleyerek arka planı ayırır.</p></article>
            <article className="step"><div className="step-number">3</div><h3>PNG olarak indir</h3><p>Sonucu kontrol et, şeffaf arka planlı görselini indir.</p></article>
          </div>
        </div>
      </section>
      <section className="help" id="yardim"><div className="container help-content"><strong>Bilmeniz gerekenler</strong><p>PNG, JPG ve WEBP dosyaları desteklenir. İlk işlemde AI modeli indirilir; indirme süresi bağlantınıza bağlıdır. Model daha sonra tarayıcı önbelleğinden kullanılabilir. Sonuç kalitesi görsele göre değişebilir.</p><p id="gizlilik">Gizlilik: Görselleriniz işlem için sunucuya yüklenmez. AI model dosyaları ilk kullanımda internet üzerinden indirilir.</p><p id="sartlar">Kullanım: Dosya başına 20 MB sınırı vardır. Büyük görseller, cihazın bellek ve işlem gücü sınırlarına takılabilir.</p><p>Arka plan kaldırma teknolojisi IMG.LY'nin AGPL lisanslı açık kaynak yazılımını kullanır.</p></div></section>
    </main>
    <footer className="footer"><div className="container footer-inner"><Brand footer/><div className="footer-links"><a href="#gizlilik">Gizlilik</a><a href="#sartlar">Şartlar</a><a href="#yardim">Yardım</a><a href="https://github.com/shymok-nt/Convertrio/issues" target="_blank" rel="noreferrer">İletişim</a></div></div></footer>
  </div>
}
