import { Link } from "react-router-dom";
import { BadgeCheck, Building2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Connection } from "@/data/profilesData";

interface ProfileConnectionCardProps {
  connection: Connection;
}

export function ProfileConnectionCard({ connection }: ProfileConnectionCardProps) {
  return (
    <Link to={`/profile/${connection.id}`}>
      <Card className="bento-card group cursor-pointer hover:border-secondary/50 transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <img
              src={connection.image}
              alt={connection.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-border group-hover:ring-secondary transition-all"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-primary truncate">{connection.name}</h4>
                <ArrowRight className="h-4 w-4 text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm text-muted-foreground truncate">{connection.title}</p>
              <div className="flex items-center gap-1 mt-1">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">{connection.company}</span>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {connection.relationship}
                </Badge>
                {connection.badges.map((badge) => (
                  <span key={badge} className="badge-cysec text-xs py-0">
                    <BadgeCheck className="h-3 w-3" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
