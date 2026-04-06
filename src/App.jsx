import './App.css'
import React, { useState } from 'react'
import Header from './components/Header'
import RoleSelector from './pages/RoleSelector'
import Home from './pages/Home'

// simple boundary to catch render errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="error-screen" style={{ padding: 20 }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  console.log('App function running');
  // simple stack so we can always return to the previous view
  const [showHome, setShowHome] = useState(true)
  const [navHistory, setNavHistory] = useState(['home'])

  React.useEffect(() => {
    console.log('App mounted; showHome=', showHome, 'history=', navHistory);
  }, [showHome, navHistory]);

  React.useEffect(() => {
    console.log('App state changed; showHome=', showHome, 'history=', navHistory);
  }, [showHome, navHistory]);

  const navigateTo = (page) => {
    setNavHistory(prev => [...prev, page])
    setShowHome(page === 'home')
  }

  const goBack = () => {
    setNavHistory(prev => {
      if (prev.length <= 1) return prev
      const newStack = prev.slice(0, prev.length - 1)
      const last = newStack[newStack.length - 1]
      setShowHome(last === 'home')
      return newStack
    })
  }

  return (
    <ErrorBoundary>
      <div className="app">
        {/* show a back button when there is history to return to */}
        {navHistory.length > 1 && (
          <button className="btn-global-back" onClick={goBack} aria-label="Go back">
            ← Back
          </button>
        )}

        <Header />
        {showHome ? (
          <Home onStart={() => navigateTo('role')} />
        ) : (
          <RoleSelector />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
