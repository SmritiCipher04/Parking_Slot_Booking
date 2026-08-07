/**
 * MapErrorBoundary
 * Catches runtime errors thrown by Google Maps components and shows a
 * friendly fallback — the rest of the app remains fully usable.
 */

import React from 'react';

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Unknown map error' };
  }

  componentDidCatch(error, info) {
    console.error('[MapErrorBoundary] Caught map error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
            backgroundColor: '#fef9f0',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            textAlign: 'center',
            minHeight: '220px',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '36px' }}>🗺️</div>
          <h3 style={{ margin: 0, color: '#92400e', fontSize: '18px', fontWeight: 700 }}>
            Map Temporarily Unavailable
          </h3>
          <p style={{ margin: 0, color: '#78350f', fontSize: '14px', maxWidth: '380px' }}>
            Google Maps could not be loaded. This may be due to an invalid API key, network
            issue, or quota limit. The rest of the app is fully functional — you can still
            search, book, and manage your parking.
          </p>
          <button
            style={{
              marginTop: '8px',
              padding: '8px 20px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;
