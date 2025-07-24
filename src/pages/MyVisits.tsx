import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Search, Filter, Clock, Building, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RestaurantVisit {
  id: string;
  restaurant_id?: string;
  restaurant_name: string;
  latitude: number;
  longitude: number;
  visited_at: string;
  created_at: string;
}

const MyVisits = () => {
  const [visits, setVisits] = useState<RestaurantVisit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<RestaurantVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    if (profile) {
      fetchVisits();
    }
  }, [profile]);

  useEffect(() => {
    filterAndSortVisits();
  }, [visits, searchTerm, dateFilter, sortBy]);

  const fetchVisits = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('restaurant_visits')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('visited_at', { ascending: false });

      if (error) {
        console.error('Error fetching visits:', error);
        return;
      }

      setVisits(data || []);
    } catch (error: any) {
      console.error('Error in fetchVisits:', error);
      toast({
        title: "Error",
        description: "Failed to load visit history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortVisits = () => {
    let filtered = [...visits];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(visit => 
        visit.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(visit => 
        new Date(visit.visited_at) >= filterDate
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime();
        case 'oldest':
          return new Date(a.visited_at).getTime() - new Date(b.visited_at).getTime();
        case 'name':
          return a.restaurant_name.localeCompare(b.restaurant_name);
        default:
          return 0;
      }
    });

    setFilteredVisits(filtered);
  };

  const trackNewVisit = async () => {
    // This would typically be called automatically when a user visits a restaurant
    // For demo purposes, we could add a manual "Add Visit" button
    const restaurantName = prompt('Enter restaurant name:');
    if (!restaurantName) return;

    try {
      const response = await supabase.functions.invoke('track-restaurant-visit', {
        body: {
          restaurant_name: restaurantName,
          latitude: 40.7128, // Default to NYC coordinates for demo
          longitude: -74.0060,
        }
      });

      if (response.error) throw response.error;

      await fetchVisits();
      toast({
        title: "Visit tracked!",
        description: "Restaurant visit has been recorded.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to track visit",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-card rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Restaurant Visits</h1>
              <p className="text-muted-foreground mt-1">
                Track your dining history and discover crossed paths
              </p>
            </div>
            <Button onClick={trackNewVisit} className="bg-peach-gold hover:bg-peach-gold/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Visit
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Visits</p>
                    <p className="text-2xl font-bold text-foreground">{visits.length}</p>
                  </div>
                  <Building className="h-8 w-8 text-peach-gold" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">This Month</p>
                    <p className="text-2xl font-bold text-foreground">
                      {visits.filter(v => {
                        const visitDate = new Date(v.visited_at);
                        const now = new Date();
                        return visitDate.getMonth() === now.getMonth() && 
                               visitDate.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-peach-gold" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Unique Restaurants</p>
                    <p className="text-2xl font-bold text-foreground">
                      {new Set(visits.map(v => v.restaurant_name)).size}
                    </p>
                  </div>
                  <MapPin className="h-8 w-8 text-peach-gold" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="shadow-card border-border">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search restaurants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last 3 Months</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="name">By Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Visits List */}
          {filteredVisits.length === 0 ? (
            <Card className="shadow-card border-border">
              <CardContent className="py-12 text-center">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {visits.length === 0 ? 'No visits recorded yet' : 'No visits match your filters'}
                </h3>
                <p className="text-muted-foreground">
                  {visits.length === 0 
                    ? 'Start dining at restaurants to track your visits and discover crossed paths'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredVisits.map((visit) => (
                <Card key={visit.id} className="shadow-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {visit.restaurant_name}
                        </h3>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(visit.visited_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(visit.visited_at).toLocaleTimeString()}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            {visit.latitude.toFixed(4)}, {visit.longitude.toFixed(4)}
                          </div>
                        </div>
                        {visit.restaurant_id && (
                          <Badge variant="secondary" className="mt-2">
                            Verified Restaurant
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyVisits;