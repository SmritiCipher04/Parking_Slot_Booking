import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ParkingMap from '../components/ParkingMap';

/**
 * Haversine formula to compute distance in km between two GPS coordinates
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);

  // Geolocation & Map State
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Detecting your location...');
  const [mapCenter, setMapCenter] = useState([26.1445, 91.7362]); // Default city center (Guwahati)
  const [sortByNearest, setSortByNearest] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState(null);

  const requestUserLocation = () => {
    if ('geolocation' in navigator) {
      setLocationStatus('Detecting your GPS position...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const uLat = pos.coords.latitude;
          const uLng = pos.coords.longitude;
          setUserLocation({ lat: uLat, lng: uLng });
          setMapCenter([uLat, uLng]);
          setLocationStatus('Location detected (Map centered on your position)');
        },
        (err) => {
          console.warn('Geolocation permission denied or unavailable:', err.message);
          setLocationStatus('City Center View (Location access denied)');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setLocationStatus('City Center View (Geolocation not supported)');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // 1. Fetch facilities from backend API
    const fetchFacilities = async () => {
      try {
        const res = await fetch('/api/locations');
        const data = await res.json();
        if (data.success) {
          setFacilities(data.data);
        }
      } catch (err) {
        console.error('Error fetching facilities:', err);
      }
    };

    fetchFacilities();
    requestUserLocation();
  }, [user, navigate]);

  // Compute distances if user location is available
  const processedFacilities = facilities.map(f => {
    const lat = parseFloat(f.latitude) || 26.1445;
    const lng = parseFloat(f.longitude) || 91.7362;
    let dist = null;

    if (userLocation) {
      dist = calculateHaversineDistance(userLocation.lat, userLocation.lng, lat, lng);
    }

    return {
      ...f,
      latitude: lat,
      longitude: lng,
      distanceKm: dist
    };
  });

  // Filter facilities by search term (tokens matching name or address)
  let filteredFacilities = processedFacilities;
  if (searchTerm.trim() !== '') {
    const tokens = searchTerm.toLowerCase().trim().split(/\s+/);
    filteredFacilities = processedFacilities.filter(f => {
      const targetText = `${f.name} ${f.address || ''} ${f.location || ''}`.toLowerCase();
      return tokens.every(token => targetText.includes(token));
    });
  }

  // Sort by nearest if toggled
  if (sortByNearest && userLocation) {
    filteredFacilities.sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999));
  }

  const handleFacilitySelect = (facId) => {
    setSelectedFacilityId(facId);
    const found = facilities.find(f => (f._id || f.facilityId || f.id) === facId);
    if (found) {
      const lat = parseFloat(found.latitude) || 26.1445;
      const lng = parseFloat(found.longitude) || 91.7362;
      setMapCenter([lat, lng]);
    }
  };

  return (
    <>
      <Navbar />
      <main className="container">
        <h2 id="welcome-heading">
          {user ? `Welcome back, ${user.name.split(' ')[0]}! Find Parking Near You` : 'Find & Reserve Parking Slots'}
        </h2>
        <p className="subtitle">Select your location and preferred date to check live slot availability</p>

        {/* Search & Location Controls */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <label htmlFor="search-location">Search Location / Facility</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                id="search-location"
                placeholder="e.g. City Mall, GS Road, Dispur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingRight: searchTerm ? '32px' : '12px' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  title="Clear search"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div style={{ minWidth: '180px' }}>
            <label htmlFor="search-date">Parking Date</label>
            <input
              type="date"
              id="search-date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              className="sort-nearest-btn"
              style={{
                backgroundColor: sortByNearest ? '#2563eb' : '#ffffff',
                color: sortByNearest ? '#ffffff' : 'var(--text-primary)',
                border: sortByNearest ? '1px solid #2563eb' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: sortByNearest ? '0 1px 3px rgba(37, 99, 235, 0.25)' : 'none'
              }}
              onClick={() => setSortByNearest(prev => !prev)}
            >
              {sortByNearest ? 'Sorted by Nearest' : 'Sort by Nearest'}
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{locationStatus}</span>
          <span>
            {searchTerm ? `Matching "${searchTerm}": ` : ''}Showing {filteredFacilities.length} parking facilities
          </span>
        </div>

        {/* Synced Interactive Map & Facilities Component */}
        <ParkingMap
          facilities={filteredFacilities}
          userLocation={userLocation}
          center={mapCenter}
          zoom={userLocation ? 14 : 13}
          selectedFacilityId={selectedFacilityId}
          onSelectFacility={handleFacilitySelect}
          onSearchLocation={(query) => setSearchTerm(query)}
          onUseCurrentLocation={requestUserLocation}
        />

        <h3>Available Parking Facilities</h3>
        <table id="facilities-table">
          <thead>
            <tr>
              <th>Facility Name</th>
              <th>Location Address</th>
              <th>Distance</th>
              <th>Total Capacity</th>
              <th>Hourly Rate</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredFacilities.length > 0 ? (
              filteredFacilities.map((f) => {
                const facId = f._id || f.facilityId || f.id;
                const isSelected = selectedFacilityId === facId;

                return (
                  <tr
                    key={facId}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                      transition: 'background-color 0.2s ease'
                    }}
                    onClick={() => handleFacilitySelect(facId)}
                  >
                    <td>
                      <strong>{f.name}</strong>
                      {isSelected && <span className="badge badge-info" style={{ marginLeft: '8px', fontSize: '10px' }}>Selected on Map</span>}
                    </td>
                    <td>{f.address || f.location || 'Guwahati'}</td>
                    <td>
                      {f.distanceKm !== null ? (
                        <strong style={{ color: '#059669', fontSize: '13px' }}>{f.distanceKm} km</strong>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>N/A</span>
                      )}
                    </td>
                    <td><span className="badge badge-info">{f.totalSlots || 20} Slots</span></td>
                    <td><strong>Rs. {f.pricePerHour || f.ratePerHour}</strong> / hr</td>
                    <td>
                      <Link to={`/slots?facilityId=${facId}`} className="btn btn-sm" onClick={(e) => e.stopPropagation()}>
                        View Slots & Book
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No parking facilities matched your search location.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </main>
      <Footer />
    </>
  );
};

export default HomePage;
