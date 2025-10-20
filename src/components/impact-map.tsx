'use client';

import { MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Location = {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
};

type ImpactMapProps = {
  locations: Location[];
};

// Function to convert lat/lng to pixel coordinates (simplified)
const latLngToPixel = (lat: number, lng: number, width: number, height: number) => {
  const x = (lng + 180) * (width / 360);
  const y = (90 - lat) * (height / 180);
  return { x, y };
};

export function ImpactMap({ locations }: ImpactMapProps) {
  const mapWidth = 800;
  const mapHeight = 400;

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden relative bg-secondary border">
      {/* Background map image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage: "url('https://picsum.photos/seed/map-bg/1600/800')",
        }}
        data-ai-hint="world map"
      />
      
      <TooltipProvider>
        <div className="relative w-full h-full">
          {locations.map((location) => {
            const { x, y } = latLngToPixel(location.position.lat, location.position.lng, mapWidth, mapHeight);

            // Ensure pins are within map boundaries
            const constrainedX = Math.max(8, Math.min(x - 8, mapWidth - 16));
            const constrainedY = Math.max(8, Math.min(y - 16, mapHeight - 16));
            
            return (
              <Tooltip key={location.id}>
                <TooltipTrigger asChild>
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-full"
                    style={{ left: `${constrainedX / mapWidth * 100}%`, top: `${constrainedY / mapHeight * 100}%` }}
                  >
                    <MapPin className="h-6 w-6 text-primary fill-current transition-transform duration-200 hover:scale-125" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{location.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
