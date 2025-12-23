import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ParkingLotData } from '../types';

// Fix for default Leaflet icons in React ESM environment
// Using direct CDN URLs to avoid bundler import issues with image files
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Override default icon
L.Marker.prototype.options.icon = DefaultIcon;

interface ParkingMapProps {
  data: ParkingLotData[];
  userLocation: { lat: number; lng: number } | null;
}

// Sub-component to handle flying to user location
const RecenterMap = ({ location }: { location: { lat: number; lng: number } | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (location) {
      // Fly to user location with a smooth animation
      map.flyTo([location.lat, location.lng], 16, {
        duration: 1.5
      });
    }
  }, [location, map]);
  
  return null;
};

export const ParkingMap: React.FC<ParkingMapProps> = ({ data, userLocation }) => {
  
  // Format the availability text based on requirements
  const getAvailabilityText = (available: number) => {
    if (available === -9) return "無法提供";
    if (available === -11) return "剩餘格位足夠";
    if (available === -12) return "剩餘格位不足半數";
    if (available === -13) return "剩餘格數不足";
    if (available < 0) return "資訊不明";
    return `${available} 格`;
  };

  const getAvailabilityClass = (available: number) => {
    if (available === -9) return "text-gray-500 font-bold";
    if (available === -11) return "text-green-600 font-bold";
    if (available === -12) return "text-yellow-600 font-bold";
    if (available === -13) return "text-red-600 font-bold";
    if (available > 0) return "text-blue-600 font-bold";
    return "text-gray-600 font-bold";
  };

  // Center on Taipei City Hall by default
  const defaultCenter: [number, number] = [25.03746, 121.564558];
  
  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={14} 
      scrollWheelZoom={true} 
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Handle auto-centering when user location changes */}
      <RecenterMap location={userLocation} />

      {/* User Location Marker */}
      {userLocation && (
        <CircleMarker 
          center={[userLocation.lat, userLocation.lng]}
          radius={8}
          pathOptions={{ 
            color: 'white', 
            fillColor: '#2563eb', // Blue-600
            fillOpacity: 1, 
            weight: 2 
          }}
        >
          <Popup>您的目前位置</Popup>
        </CircleMarker>
      )}
      
      {/* Parking Lot Markers */}
      {data.map((park) => (
        <Marker 
          key={park.id} 
          position={[park.lat, park.lng]}
          icon={DefaultIcon}
        >
          <Tooltip direction="top" offset={[0, -30]} opacity={1}>
             <span className="font-bold text-gray-700 font-sans text-sm">{park.name}</span>
          </Tooltip>
          <Popup>
            <div className="min-w-[200px] p-1 font-sans">
              <h3 className="text-lg font-bold text-gray-800 mb-1">{park.name}</h3>
              <div className="text-sm text-gray-600 mb-2">{park.address}</div>
              
              <div className="grid grid-cols-2 gap-2 border-t pt-2">
                <div>
                  <span className="text-xs text-gray-500 block">總車位數</span>
                  <span className="font-semibold text-gray-800">{park.totalcar} 格</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">剩餘車位</span>
                  <span className={getAvailabilityClass(park.availablecar)}>
                    {getAvailabilityText(park.availablecar)}
                  </span>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-400">
                 {park.payex}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};