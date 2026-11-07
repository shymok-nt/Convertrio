import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="not-found" role="alert">
          <div className="not-found-content">
            <h1>Beklenmeyen bir sorun oluştu.</h1>
            <p>Sayfayı yeniden açarak devam edebilirsiniz.</p>
            <a className="not-found-link" href="/">Ana sayfayı aç</a>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
