/**
 * ParkingMap Component (Pure Google Maps API)
 * Built with @react-google-maps/api featuring Google Places Autocomplete,
 * custom "P" parking pin markers, InfoWindows, Geolocation, and Magnifying Glass Zoom controls.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GoogleMap,
  Marker,
  InfoWindow,
  Autocomplete
} from '@react-google-maps/api';
import { useGoogleMaps } from '../context/GoogleMapsContext';

// Royal Blue Custom Google Maps Styling (Muted, elegant palette)
const ROYAL_MAP_STYLES = [
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e9e9e9' }, { lightContrast: 10 }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'road.arterial', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.local', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }, { weight: 1.2 }] }
];

// SVG Parking Marker ("P" Symbol) for Google Maps
const getParkingPinSvg = () => ({
  path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm-1 10V6h2.5c1.38 0 2.5 1.12 2.5 2.5S14.88 11 13.5 11H11z',
  fillColor: '#2563eb',
  fillOpacity: 1,
  strokeColor: '#ffffff',
  strokeWeight: 2,
  scale: 1.8,
  anchor: typeof window !== 'undefined' && window.google ? new window.google.maps.Point(12, 22) : undefined
});

// Custom User Location Pin for Google Maps
const getUserLocationPinSvg = () => ({
  path: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 15a5 5 0 110-10 5 5 0 010 10z',
  fillColor: '#2563eb',
  fillOpacity: 1,
  strokeColor: '#ffffff',
  strokeWeight: 3,
  scale: 1.4,
  anchor: typeof window !== 'undefined' && window.google ? new window.google.maps.Point(12, 12) : undefined
});

const ParkingMap = ({
  facilities = [],
  userLocation = null,
  center = [26.1445, 91.7362],
  zoom = 13,
  selectedFacilityId = null,
  onSelectFacility = () => {},
  onSearchLocation = () => {},
  onUseCurrentLocation = () => {}
}) => {
  const navigate = useNavigate();

  // Consume the single shared Maps loader from GoogleMapsContext (loaded once at app level)
  const { isLoaded, loadError } = useGoogleMaps();

  const [selectedFacility, setSelectedFacility] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);

  const onMapLoad = useCallback((map) => {
    setMapInstance(map);
  }, []);

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place) {
        const query = place.name || place.formatted_address || '';
        if (query && onSearchLocation) {
          onSearchLocation(query);
        }
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          if (mapInstance) {
            mapInstance.panTo({ lat, lng });
            mapInstance.setZoom(15);
          }
        }
      }
    }
  };

  const handleFacilityClick = (fac) => {
    const facId = fac._id || fac.facilityId || fac.id;
    setSelectedFacility(fac);
    onSelectFacility(facId);

    const lat = parseFloat(fac.latitude) || 26.1445;
    const lng = parseFloat(fac.longitude) || 91.7362;
    if (mapInstance) {
      mapInstance.panTo({ lat, lng });
    }
  };

  const handleZoomIn = () => {
    if (mapInstance) {
      mapInstance.setZoom(mapInstance.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      mapInstance.setZoom(mapInstance.getZoom() - 1);
    }
  };

  const mapCenterObj = {
    lat: center && !isNaN(center[0]) ? center[0] : 26.1445,
    lng: center && !isNaN(center[1]) ? center[1] : 91.7362
  };

  // Sync selectedFacilityId from parent
  useEffect(() => {
    if (selectedFacilityId && facilities.length > 0) {
      const found = facilities.find(f => (f._id || f.facilityId || f.id) === selectedFacilityId);
      if (found) {
        setSelectedFacility(found);
        if (mapInstance) {
          const lat = parseFloat(found.latitude) || 26.1445;
          const lng = parseFloat(found.longitude) || 91.7362;
          mapInstance.panTo({ lat, lng });
        }
      }
    }
  }, [selectedFacilityId, facilities, mapInstance]);

  if (loadError) {
    return (
      <div className="parking-map-wrapper" style={{ padding: '24px', textAlign: 'center', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' }}>
        <h3>Error Loading Google Maps</h3>
        <p style={{ fontSize: '13px', margin: 0 }}>Please check your GOOGLE_MAP_API key in .env or verify network connectivity.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="parking-map-wrapper" style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', color: '#64748b' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Loading Google Maps Engine...</p>
      </div>
    );
  }

  return (
    <div className="parking-map-wrapper">
      {/* Top Control Bar with Google Places Autocomplete, Location Button, and Magnifying Glass Zoom Controls */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <Autocomplete
            onLoad={(auto) => { autocompleteRef.current = auto; }}
            onPlaceChanged={onPlaceChanged}
          >
            <input
              type="text"
              ref={searchInputRef}
              placeholder="Search address, landmark, or area on Google Maps..."
              style={{
                width: '100%',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </Autocomplete>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '13px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}
            onClick={onUseCurrentLocation}
          >
            Recenter to My Location
          </button>

          {/* Custom Magnifying Glass Zoom Controls */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              style={{ padding: '6px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Zoom In"
              aria-label="Zoom In"
              onClick={handleZoomIn}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
              Zoom +
            </button>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              style={{ padding: '6px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Zoom Out"
              aria-label="Zoom Out"
              onClick={handleZoomOut}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
              Zoom -
            </button>
          </div>
        </div>
      </div>

      {/* Google Maps Container */}
      <GoogleMap
        mapContainerClassName="parking-map-container"
        center={mapCenterObj}
        zoom={zoom}
        onLoad={onMapLoad}
        options={{
          styles: ROYAL_MAP_STYLES,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false
        }}
      >
        {/* User Location Marker ("You are here") */}
        {userLocation && userLocation.lat && userLocation.lng && (
          <Marker
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            icon={getUserLocationPinSvg()}
            title="You are here"
          />
        )}

        {/* Parking Facility Markers */}
        {facilities.map((fac) => {
          const facId = fac._id || fac.facilityId || fac.id;
          const lat = parseFloat(fac.latitude) || 26.1445;
          const lng = parseFloat(fac.longitude) || 91.7362;

          return (
            <Marker
              key={facId}
              position={{ lat, lng }}
              icon={getParkingPinSvg()}
              title={fac.name}
              onClick={() => handleFacilityClick(fac)}
            />
          );
        })}

        {/* InfoWindow for Selected Parking Location */}
        {selectedFacility && (
          <InfoWindow
            position={{
              lat: parseFloat(selectedFacility.latitude) || 26.1445,
              lng: parseFloat(selectedFacility.longitude) || 91.7362
            }}
            onCloseClick={() => setSelectedFacility(null)}
          >
            <div style={{ padding: '4px', maxWidth: '220px' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: '#1e293b', fontWeight: 700 }}>
                {selectedFacility.name}
              </h4>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#64748b' }}>
                {selectedFacility.address || 'Guwahati, Assam'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                <span className="badge badge-info">{selectedFacility.totalSlots || 20} Slots</span>
                <strong style={{ color: '#2563eb' }}>
                  Rs. {selectedFacility.pricePerHour || selectedFacility.ratePerHour || 20} / hr
                </strong>
              </div>

              {selectedFacility.distanceKm !== undefined && selectedFacility.distanceKm !== null && (
                <div style={{ fontSize: '11px', color: '#059669', marginBottom: '8px', fontWeight: 600 }}>
                  {selectedFacility.distanceKm} km away from your location
                </div>
              )}

              <button
                type="button"
                className="btn btn-sm"
                style={{ width: '100%', fontSize: '12px', padding: '6px', backgroundColor: '#2563eb' }}
                onClick={() => navigate(`/slots?facilityId=${selectedFacility._id || selectedFacility.facilityId || selectedFacility.id}`)}
              >
                View Slots & Book &rarr;
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default ParkingMap;
