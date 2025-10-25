import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with webpack
// This needs to run before any map renders
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom stall icon
const stallIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Type for raw data from Supabase
interface StallData {
  id: string;
  stall_name: string;
  location?: string;
  geolocation?: { lat: number; lng: number } | null;
}

// Type for processed stall data with required fields
interface Stall {
  id: string;
  stall_name: string;
  location: string;
  geolocation: { lat: number; lng: number };
}

interface StallMapProps {
  fullScreen?: boolean;
}

const StallMap = ({ fullScreen = false }: StallMapProps) => {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStalls = async () => {
      try {
        // Check if location column exists in the table
        const { data, error } = await supabase
          .from('seller_stalls')
          .select('id, stall_name, geolocation');

        if (error) {
          throw error;
        }

        // Filter out stalls without geolocation data and transform to our format
        const stallsWithLocation = (data as any)
          .filter((stall: any) => stall.geolocation !== null && stall.geolocation !== undefined)
          .map((stall: any) => ({
            id: stall.id,
            stall_name: stall.stall_name,
            location: 'Pasar Malam Batu 2 1/2, Taiping, Perak', // Default location
            geolocation: stall.geolocation
          }));

        // If no stalls have geolocation data, generate sample data for Taiping
        if (stallsWithLocation.length === 0) {
          // Generate sample data for Taiping night market
          const taipingCenter = { lat: 4.8526, lng: 100.7389 };
          const sampleStalls = Array.from({ length: 5 }).map((_, index) => ({
            id: `sample-${index}`,
            stall_name: `Sample Stall ${index + 1}`,
            location: 'Pasar Malam Batu 2 1/2, Taiping, Perak',
            geolocation: {
              lat: taipingCenter.lat + (Math.random() - 0.5) * 0.002,
              lng: taipingCenter.lng + (Math.random() - 0.5) * 0.002
            }
          }));
          setStalls(sampleStalls);
        } else {
          setStalls(stallsWithLocation);
        }
      } catch (error) {
        console.error('Error fetching stalls:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStalls();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading map...</div>;
  }

  // Default to Taiping center if no stalls
  const defaultCenter = stalls.length > 0 
    ? [stalls[0].geolocation.lat, stalls[0].geolocation.lng] 
    : [4.8526, 100.7389]; // Taiping coordinates

  return (
    <div className="h-full w-full">
      <MapContainer 
        center={defaultCenter as any}
        zoom={fullScreen ? 16 : 15} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stalls.map(stall => {
          const position = [stall.geolocation.lat, stall.geolocation.lng];
          return (
            <Marker 
              key={stall.id} 
              position={position as any}
              icon={stallIcon}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">{stall.stall_name}</h3>
                  <p>{stall.location}</p>
                  {stall.id.startsWith('sample') && (
                    <p className="text-xs text-muted-foreground mt-1">Sample data for demonstration</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default StallMap;