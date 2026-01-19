import { Building2, Calendar } from "lucide-react";
import type { CompanyHistory } from "@/data/profilesData";

interface ProfileTimelineProps {
  history: CompanyHistory[];
}

export function ProfileTimeline({ history }: ProfileTimelineProps) {
  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
      
      <div className="space-y-8">
        {history.map((item, index) => (
          <div key={index} className="relative flex gap-6">
            {/* Timeline Dot */}
            <div className="relative z-10 flex-shrink-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                index === 0 
                  ? 'bg-secondary text-secondary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            
            {/* Content */}
            <div className={`flex-1 pb-8 ${index === history.length - 1 ? 'pb-0' : ''}`}>
              <div className="bento-card">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Calendar className="h-3 w-3" />
                  {item.year}
                </div>
                <h4 className="font-semibold text-primary">{item.title}</h4>
                <p className="text-secondary font-medium text-sm">{item.company}</p>
                <p className="text-muted-foreground text-sm mt-2">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
