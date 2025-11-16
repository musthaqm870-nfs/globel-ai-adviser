import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Destination {
  name: string;
  coordinates: [number, number];
  description?: string;
  recommendations?: string[];
}

interface MapProps {
  destinations?: Destination[];
  safetyZones?: Array<{ coordinates: [number, number]; level: string }>;
}

const Map = ({ destinations = [], safetyZones = [] }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isTokenSet, setIsTokenSet] = useState(false);

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        zoom: 2,
        center: [0, 20],
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      setIsTokenSet(true);
      toast.success('Map initialized successfully!');
    } catch (error) {
      toast.error('Invalid Mapbox token. Please check and try again.');
      console.error('Map initialization error:', error);
    }
  };

  useEffect(() => {
    if (!map.current || !isTokenSet) return;

    // Clear existing markers
    const markers = document.querySelectorAll('.mapbox-marker');
    markers.forEach(marker => marker.remove());

    // Add destination markers with enhanced popups
    destinations.forEach((dest) => {
      const el = document.createElement('div');
      el.className = 'mapbox-marker';
      el.style.backgroundColor = 'hsl(var(--primary))';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.transition = 'transform 0.2s';
      
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      // Create enhanced popup content
      const popupContent = `
        <div style="min-width: 280px; max-width: 320px; font-family: system-ui, -apple-system, sans-serif;">
          <!-- Header with photo placeholder -->
          <div style="width: 100%; height: 140px; background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-glow)) 100%); border-radius: 8px 8px 0 0; margin: -15px -15px 12px -15px; position: relative; overflow: hidden;">
            <div style="position: absolute; inset: 0; background-image: url('https://source.unsplash.com/400x200/?${encodeURIComponent(dest.name)},landmark,travel'); background-size: cover; background-position: center; opacity: 0.9;"></div>
            <div style="position: absolute; bottom: 8px; left: 12px; right: 12px;">
              <h3 style="color: white; font-size: 18px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${dest.name}</h3>
            </div>
          </div>
          
          <!-- Description -->
          ${dest.description ? `
            <div style="margin-bottom: 12px;">
              <p style="color: #374151; font-size: 13px; line-height: 1.5; margin: 0;">${dest.description}</p>
            </div>
          ` : ''}
          
          <!-- Recommendations -->
          ${dest.recommendations && dest.recommendations.length > 0 ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              <h4 style="color: #111827; font-size: 13px; font-weight: 600; margin: 0 0 8px 0;">✨ Top Recommendations</h4>
              <ul style="margin: 0; padding-left: 18px; color: #4b5563; font-size: 12px; line-height: 1.6;">
                ${dest.recommendations.slice(0, 3).map(rec => `<li style="margin-bottom: 4px;">${rec}</li>`).join('')}
              </ul>
            </div>
          ` : `
            <div style="margin-top: 12px; padding: 10px; background: #f9fafb; border-radius: 6px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">📍 Explore this destination</p>
            </div>
          `}
          
          <!-- Coordinates -->
          <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 11px; margin: 0; text-align: center;">
              📌 ${dest.coordinates[1].toFixed(4)}°, ${dest.coordinates[0].toFixed(4)}°
            </p>
          </div>
        </div>
      `;

      new mapboxgl.Marker(el)
        .setLngLat(dest.coordinates)
        .setPopup(
          new mapboxgl.Popup({ 
            offset: 30,
            maxWidth: '340px',
            className: 'custom-popup'
          })
            .setHTML(popupContent)
        )
        .addTo(map.current!);
    });

    // Add safety zone markers
    safetyZones.forEach((zone) => {
      const color = zone.level === 'safe' ? '#22c55e' : 
                    zone.level === 'moderate' ? '#eab308' : '#ef4444';
      
      const el = document.createElement('div');
      el.className = 'mapbox-marker';
      el.style.backgroundColor = color;
      el.style.width = '15px';
      el.style.height = '15px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.opacity = '0.7';

      new mapboxgl.Marker(el)
        .setLngLat(zone.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<div style="color: black;">Safety Level: ${zone.level}</div>`)
        )
        .addTo(map.current!);
    });

    // Fit bounds if destinations exist
    if (destinations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      destinations.forEach(dest => bounds.extend(dest.coordinates));
      map.current?.fitBounds(bounds, { padding: 50 });
    }
  }, [destinations, safetyZones, isTokenSet]);

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!isTokenSet) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
        <div className="max-w-md w-full space-y-4">
          <h3 className="text-lg font-semibold text-center">Enter Mapbox Token</h3>
          <p className="text-sm text-muted-foreground text-center">
            Get your free public token from{' '}
            <a 
              href="https://account.mapbox.com/access-tokens/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
          <Input
            type="text"
            placeholder="pk.eyJ1Ijoi..."
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="w-full"
          />
          <Button 
            onClick={initializeMap}
            disabled={!mapboxToken}
            className="w-full"
          >
            Initialize Map
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
    </div>
  );
};

export default Map;
