import { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, DirectionsRenderer, InfoWindowF } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

interface PatientMapProps {
  location: { lat: number; lng: number; address?: string };
  ambulanceLocation?: { lat: number; lng: number } | null;
  hospitalLocation?: { lat: number; lng: number } | null;
}

export default function PatientMap({ location, ambulanceLocation, hospitalLocation }: PatientMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);
  
  // Calculate directions
  useMemo(() => {
    if (!isLoaded || !location) return;
    
    // Prioritize ambulance location, then hospital location for directions
    const destination = ambulanceLocation || hospitalLocation;
    
    if (destination) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: location,
          destination: destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirectionsResponse(result);
          } else {
            console.error(`Error fetching directions: ${status}`);
          }
        }
      );
    } else {
      setDirectionsResponse(null);
    }
  }, [location, ambulanceLocation, hospitalLocation, isLoaded]);

  if (!isLoaded) return <div className="h-32 rounded-xl bg-card border border-border flex items-center justify-center text-sm text-muted-foreground">Loading Maps API...</div>;

  return (
    <div className="h-48 rounded-xl overflow-hidden relative z-0">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={location}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{ disableDefaultUI: true, zoomControl: true }}
      >
        {!directionsResponse && (
          <MarkerF position={location}>
            <InfoWindowF position={location} options={{ disableAutoPan: true }}>
              <div className="p-1">
                <div className="font-semibold mb-1 text-sm text-foreground">Your Location</div>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Open in Maps
                </a>
              </div>
            </InfoWindowF>
          </MarkerF>
        )}
        
        {directionsResponse && (
          <DirectionsRenderer 
            directions={directionsResponse} 
            options={{
              suppressMarkers: false,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
