import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, MapPin, Phone, MessageSquare, Filter } from 'lucide-react';

// Fix for default Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LiveMap = () => {
  const [activeTrip, setActiveTrip] = useState('RT-2017002346');

  // Mock data for the live map
  const trips = [
    {
      id: 'RT-2017002346',
      busType: 'Intercity AC',
      origin: 'Colombo Fort',
      destination: 'Maharagama',
      driver: {
        name: 'Sunil Shantha',
        company: 'Routie Transport',
        avatar: 'S'
      },
      coordinates: [
        [6.9360, 79.8450], // Colombo
        [6.9150, 79.8700],
        [6.8850, 79.8900],
        [6.8500, 79.9200]  // Maharagama
      ],
      currentLocation: [6.8850, 79.8900],
      fleet: { busNumber: 'ND-4521', seats: 54, speed: '45 km/h', progress: 65 }
    },
    {
      id: 'RT-2017003323',
      busType: 'Normal',
      origin: 'Kandy City',
      destination: 'Peradeniya',
      driver: {
        name: 'Kamal Perera',
        company: 'Central Transport',
        avatar: 'K'
      },
      coordinates: [
        [7.2906, 80.6337], // Kandy
        [7.2800, 80.6100],
        [7.2680, 80.5950]  // Peradeniya
      ],
      currentLocation: [7.2800, 80.6100],
      fleet: { busNumber: 'CP-2983', seats: 42, speed: '38 km/h', progress: 40 }
    }
  ];

  const activeTripData = trips.find(t => t.id === activeTrip);

  return (
    <div className="live-map-container card glass">
      <div className="map-sidebar">
        <div className="search-container">
          <div className="search-inputs-wrapper">
            <div className="search-box">
              <MapPin size={14} className="search-icon" />
              <input type="text" placeholder="Origin" />
            </div>
            <div className="search-box">
              <MapPin size={14} className="search-icon destination" />
              <input type="text" placeholder="Destination" />
            </div>
            <div className="search-actions">
              <button className="active-buses-btn">
                <Search size={16} />
                Search Buses
              </button>
            </div>
          </div>
        </div>

        <h3 className="section-title">Live Bus Trips</h3>

        <div className="trip-list">
          {trips.map(trip => (
            <div
              key={trip.id}
              className={`trip-card ${activeTrip === trip.id ? 'active' : ''}`}
              onClick={() => setActiveTrip(trip.id)}
            >
              <div className="trip-header">
                <div>
                  <span className="trip-label">Trip Number</span>
                  <h4>{trip.id}</h4>
                  <span className="trip-type">{trip.busType}</span>
                </div>
                <div className="bus-icon-placeholder">
                  <div className="bus-shape"></div>
                </div>
              </div>

              <div className="route-timeline">
                <div className="timeline-point origin">
                  <div className="point-icon green"></div>
                  <div className="point-info">
                    <h5>{trip.origin}</h5>
                    <span>Origin Stop</span>
                  </div>
                </div>
                <div className="timeline-line"></div>
                <div className="timeline-point destination">
                  <div className="point-icon blue"></div>
                  <div className="point-info">
                    <h5>{trip.destination}</h5>
                    <span>Destination Stop</span>
                  </div>
                </div>
              </div>

              <div className="driver-info">
                <div className="driver-avatar">{trip.driver.avatar}</div>
                <div className="driver-details">
                  <span className="label">Driver</span>
                  <h5>{trip.driver.name}</h5>
                  <span>{trip.driver.company}</span>
                </div>
                <div className="driver-actions">
                  <button className="action-btn"><Phone size={16} /></button>
                  <button className="action-btn"><MessageSquare size={16} /></button>
                </div>
              </div>

              {activeTrip === trip.id && (
                <div className="fleet-info" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bus: <strong style={{color: 'var(--text-main)'}}>{trip.fleet.busNumber}</strong></span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Seats: <strong style={{color: 'var(--text-main)'}}>{trip.fleet.seats}</strong></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '600' }}>Speed: {trip.fleet.speed}</span>
                    <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold' }}>Progress: {trip.fleet.progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${trip.fleet.progress}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px', transition: 'width 0.5s ease-in-out' }}></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="map-view">
        <MapContainer
          center={activeTripData ? activeTripData.currentLocation : [6.9271, 79.8612]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-lg)' }}
          key={activeTrip} // Re-mount map on trip change for easy centering
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" // Premium light theme map
          />

          {trips.map(trip => (
            <Marker 
              key={trip.id} 
              position={trip.currentLocation}
              eventHandlers={{
                click: () => setActiveTrip(trip.id),
              }}
            >
              <Popup>
                <div style={{ textAlign: 'center', minWidth: '120px' }}>
                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>{trip.id}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>{trip.busType}</div>
                  <div style={{ fontSize: '12px', marginTop: '4px', fontWeight: 'bold', color: '#2563EB' }}>Click for fleet details</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {activeTripData && (
            <Polyline 
              positions={activeTripData.coordinates} 
              color="var(--primary)" 
              weight={5} 
              opacity={0.8} 
            />
          )}
        </MapContainer>

      </div>

      <style jsx>{`
        .live-map-container {
          display: flex;
          height: 700px;
          padding: 0;
          overflow: hidden;
          margin-top: 32px;
        }

        .map-sidebar {
          width: 380px;
          background: var(--bg-main);
          border-right: 1px solid var(--border);
          padding: 24px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .search-container {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .search-inputs-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .search-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .search-box {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--accent-green);
        }

        .search-icon.destination {
          color: var(--primary);
        }

        .search-box input {
          width: 100%;
          padding: 10px 12px 10px 36px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--bg-sidebar);
          color: var(--text-main);
          font-size: 14px;
        }

        .search-box input:focus {
          border-color: var(--primary);
          outline: none;
        }

        .active-buses-btn {
          flex: 1;
          height: 40px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .active-buses-btn:hover {
          filter: brightness(1.1);
        }        .section-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 16px;
          color: var(--text-main);
        }

        .trip-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .trip-card {
          background: var(--bg-sidebar);
          border: 2px solid transparent;
          border-radius: var(--radius-md);
          padding: 20px;
          cursor: pointer;
          transition: var(--transition);
          box-shadow: var(--shadow-sm);
        }

        .trip-card:hover {
          box-shadow: var(--shadow-md);
        }

        .trip-card.active {
          border-color: var(--primary);
          box-shadow: 0 4px 20px rgba(0, 86, 210, 0.1);
        }

        .trip-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .trip-label {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
          display: block;
        }

        .trip-header h4 {
          font-size: 16px;
          color: var(--text-main);
          margin-bottom: 2px;
        }

        .trip-type {
          font-size: 12px;
          color: var(--text-muted);
        }

        .bus-icon-placeholder {
          width: 60px;
          height: 30px;
          background: #E2E8F0;
          border-radius: 4px;
          position: relative;
        }

        .bus-shape {
          position: absolute;
          bottom: 0;
          left: 4px;
          width: 52px;
          height: 20px;
          background: #CBD5E1;
          border-radius: 4px 4px 0 0;
        }

        .route-timeline {
          position: relative;
          padding-left: 12px;
          margin-bottom: 24px;
        }

        .timeline-line {
          position: absolute;
          left: 15px;
          top: 16px;
          bottom: 16px;
          width: 2px;
          background: #E2E8F0;
          border-left: 2px dashed var(--border);
        }

        .timeline-point {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          position: relative;
          z-index: 1;
        }

        .timeline-point.origin {
          margin-bottom: 24px;
        }

        .point-icon {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 6px;
          box-shadow: 0 0 0 4px white;
        }

        .point-icon.green { background: var(--accent-green); box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2); }
        .point-icon.blue { background: var(--primary); box-shadow: 0 0 0 4px rgba(0, 86, 210, 0.2); }

        .point-info h5 {
          font-size: 14px;
          color: var(--text-main);
          margin-bottom: 2px;
        }

        .point-info span {
          font-size: 12px;
          color: var(--text-muted);
        }

        .driver-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .driver-avatar {
          width: 40px;
          height: 40px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .driver-details {
          flex: 1;
        }

        .driver-details .label {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .driver-details h5 {
          font-size: 13px;
          color: var(--text-main);
        }

        .driver-details span {
          font-size: 11px;
          color: var(--text-muted);
        }

        .driver-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: var(--transition);
        }

        .action-btn:hover {
          background: var(--primary);
          color: white;
        }

        .map-view {
          flex: 1;
          position: relative;
          z-index: 1;
        }



        /* Leaflet overrides for dark mode support if needed */
        [data-theme='dark'] .leaflet-layer,
        [data-theme='dark'] .leaflet-control-zoom-in,
        [data-theme='dark'] .leaflet-control-zoom-out,
        [data-theme='dark'] .leaflet-control-attribution {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }

        @media (max-width: 768px) {
          .live-map-container {
            flex-direction: column;
            height: auto;
          }
          
          .map-sidebar {
            width: 100%;
            max-height: 400px;
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          
          .map-view {
            height: 400px;
            min-height: 400px;
          }
        }
      `}</style>
    </div>
  );
};

export default LiveMap;
