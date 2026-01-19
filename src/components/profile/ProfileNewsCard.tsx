import { Clock, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NewsArticle } from "@/data/profilesData";

interface ProfileNewsCardProps {
  article: NewsArticle;
}

export function ProfileNewsCard({ article }: ProfileNewsCardProps) {
  return (
    <Card className="bento-card group cursor-pointer hover:border-secondary/50 transition-all overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge className="bg-secondary text-secondary-foreground">{article.category}</Badge>
        </div>
        <div className="absolute bottom-3 right-3">
          <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <CardContent className="p-4">
        <h4 className="font-semibold text-primary line-clamp-2 mb-2 group-hover:text-secondary transition-colors">
          {article.title}
        </h4>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.summary}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {article.date}
        </div>
      </CardContent>
    </Card>
  );
}
