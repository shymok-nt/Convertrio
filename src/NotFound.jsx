import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function NotFound() {
  return (
    <main className="not-found">
      <Helmet>
        <title>Sayfa Bulunamadı (404) | ClearPix</title>
        <meta name="description" content="Aradığınız ClearPix sayfası bulunamadı. Ücretsiz arka plan silici ana sayfasına dönün." />
      </Helmet>
      <div className="not-found-content">
        <span className="not-found-code">404</span>
        <h1>Bu sayfa bulunamadı.</h1>
        <p>Bağlantı değişmiş veya adres yanlış yazılmış olabilir.</p>
        <Link className="not-found-link" to="/">Ana sayfaya dön</Link>
      </div>
    </main>
  )
}
