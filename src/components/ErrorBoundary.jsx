import React from 'react';

// simple class-based boundary to catch render/runtime errors and display a
// friendly message instead of leaving the UI completely blank.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary" style={{ padding: 20, color: 'red' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <button onClick={() => window.location.reload(false)}>Reload page</button>
        </div>
      );
    }
    return this.props.children;
  }
}
