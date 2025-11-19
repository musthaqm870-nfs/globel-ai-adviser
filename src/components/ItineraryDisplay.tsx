import { Calendar, MapPin, DollarSign, Utensils, Camera, Info } from "lucide-react";

interface ItineraryDisplayProps {
  itinerary: string;
}

const ItineraryDisplay = ({ itinerary }: ItineraryDisplayProps) => {
  const formatItinerary = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        elements.push(<div key={`space-${index}`} className="h-3" />);
        return;
      }
      
      // Day headers (e.g., "Day 1:", "Day 1 -", "**Day 1**")
      if (/^(\*\*)?Day \d+/i.test(trimmedLine)) {
        const cleanText = trimmedLine.replace(/\*\*/g, '').replace(/:/g, '');
        elements.push(
          <div key={`day-${index}`} className="flex items-center gap-2 mt-6 mb-3 pb-2 border-b-2 border-primary/20">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-bold text-foreground">{cleanText}</h3>
          </div>
        );
        return;
      }
      
      // Time-based sections (Morning, Afternoon, Evening, Night)
      if (/^(Morning|Afternoon|Evening|Night|Breakfast|Lunch|Dinner):/i.test(trimmedLine)) {
        const [time, ...rest] = trimmedLine.split(':');
        const content = rest.join(':').trim();
        elements.push(
          <div key={`time-${index}`} className="mt-4 mb-2">
            <h4 className="text-lg font-bold text-primary inline">{time}:</h4>
            {content && <span className="ml-2 text-foreground">{content}</span>}
          </div>
        );
        return;
      }
      
      // Section headers (Budget, Tips, Recommendations, etc.)
      if (/^(Budget|Tips|Recommendations|Accommodation|Transportation|Notes|Important):/i.test(trimmedLine)) {
        const [header, ...rest] = trimmedLine.split(':');
        const content = rest.join(':').trim();
        elements.push(
          <div key={`section-${index}`} className="mt-4 mb-2">
            <div className="flex items-center gap-2">
              {header.toLowerCase().includes('budget') && <DollarSign className="h-4 w-4 text-primary" />}
              {header.toLowerCase().includes('tip') && <Info className="h-4 w-4 text-primary" />}
              {(header.toLowerCase().includes('accommodation') || header.toLowerCase().includes('hotel')) && <MapPin className="h-4 w-4 text-primary" />}
              <span className="font-bold text-primary">{header}:</span>
            </div>
            {content && <p className="mt-1 ml-6 text-foreground">{content}</p>}
          </div>
        );
        return;
      }
      
      // Bullet points (lines starting with -, *, or •)
      if (/^[\-\*\•]/.test(trimmedLine)) {
        const content = trimmedLine.substring(1).trim();
        const icon = content.toLowerCase().includes('food') || content.toLowerCase().includes('restaurant') || content.toLowerCase().includes('eat') ? 
          <Utensils className="h-3 w-3 text-primary flex-shrink-0 mt-1" /> : 
          content.toLowerCase().includes('photo') || content.toLowerCase().includes('camera') || content.toLowerCase().includes('view') ?
          <Camera className="h-3 w-3 text-primary flex-shrink-0 mt-1" /> :
          <MapPin className="h-3 w-3 text-primary flex-shrink-0 mt-1" />;
        
        elements.push(
          <div key={`bullet-${index}`} className="flex gap-2 ml-4 my-1">
            {icon}
            <span className="text-foreground">{content}</span>
          </div>
        );
        return;
      }
      
      // Bold text wrapped in ** or __
      if (/\*\*.*\*\*|__.*__/.test(trimmedLine)) {
        const formatted = trimmedLine
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
          .replace(/__(.*?)__/g, '<strong class="font-bold text-foreground">$1</strong>');
        
        elements.push(
          <p 
            key={`text-${index}`} 
            className="my-2 text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        );
        return;
      }
      
      // Regular text
      elements.push(
        <p key={`text-${index}`} className="my-2 text-foreground leading-relaxed">
          {trimmedLine}
        </p>
      );
    });
    
    return elements;
  };
  
  return (
    <div className="space-y-2">
      {formatItinerary(itinerary)}
    </div>
  );
};

export default ItineraryDisplay;
