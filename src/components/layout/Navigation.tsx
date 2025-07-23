import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Home, 
  Calendar, 
  Search, 
  User, 
  LogOut, 
  Settings,
  Heart,
  Star,
  CreditCard,
  MessageSquare,
  UtensilsCrossed
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { useProfile } from '@/hooks/useProfile';

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getNavItems = () => {
    const baseItems = [
      { icon: Home, label: 'Home', path: '/' },
      { icon: Calendar, label: 'My Events', path: '/events' },
      { icon: Search, label: 'Explore', path: '/explore' },
      { icon: UtensilsCrossed, label: 'Restaurants', path: '/restaurants' },
      { icon: Heart, label: 'RSVPs', path: '/rsvps' },
      { icon: MessageSquare, label: 'Feedback', path: '/feedback' },
      { icon: Star, label: 'Crossed Paths', path: '/crossed-paths' },
    ];

    // Only show subscription for admin and superadmin
    if (profile?.role === 'admin' || profile?.role === 'superadmin') {
      baseItems.push({ icon: CreditCard, label: 'Subscription', path: '/subscription' });
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-dark-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ParishUs
            </h1>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`flex items-center space-x-2 ${
                    isActive 
                      ? 'text-peach-gold bg-peach-gold/10' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <NotificationCenter />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.profile_photo_url || ''} />
                    <AvatarFallback className="bg-peach-gold/20 text-peach-gold">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;