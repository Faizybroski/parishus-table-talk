import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationBannerProps {
  crossedPathsCount: number;
  onDismiss: () => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ 
  crossedPathsCount, 
  onDismiss 
}) => {
  const navigate = useNavigate();

  if (crossedPathsCount === 0) return null;

  return (
    <Card className="mb-6 bg-gradient-to-r from-peach-gold/10 to-peach-gold/5 border-peach-gold/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Users className="h-6 w-6 text-peach-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                New Crossed Paths Discovered!
              </h3>
              <p className="text-sm text-muted-foreground">
                You've crossed paths with {crossedPathsCount} new people at restaurants within the last 14 days.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => navigate('/crossed-paths')}
              size="sm"
              className="bg-peach-gold hover:bg-peach-gold/90 text-background"
            >
              View Paths
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationBanner;