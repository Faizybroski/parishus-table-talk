import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, RefreshCw } from 'lucide-react';

interface UserSubscription {
  id: string;
  user_id: string;
  email: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  plan_name?: string;
  subscription_start?: string;
  subscription_end?: string;
  created_at: string;
  updated_at: string;
  profiles: {
    first_name?: string;
    last_name?: string;
  };
}

const AdminSubscriptions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscribers')
        .select(`
          *,
          profiles!inner(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscriptions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSubscription = async (subscriberId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${user?.access_token}`,
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Subscription status refreshed"
      });
      
      fetchSubscriptions();
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      toast({
        title: "Error",
        description: "Failed to refresh subscription status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'canceled':
        return 'destructive';
      case 'past_due':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = 
      subscription.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${subscription.profiles?.first_name} ${subscription.profiles?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.plan_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Subscriptions</h1>
        <Button onClick={fetchSubscriptions} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredSubscriptions.map((subscription) => (
          <Card key={subscription.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    {subscription.profiles?.first_name} {subscription.profiles?.last_name}
                    <Badge variant={getStatusBadgeVariant(subscription.status)}>
                      {subscription.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{subscription.email}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRefreshSubscription(subscription.id)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Plan</p>
                  <p className="text-muted-foreground">
                    {subscription.plan_name || 'No active plan'}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium">Subscription Period</p>
                  <p className="text-muted-foreground">
                    {subscription.subscription_start && subscription.subscription_end ? (
                      <>
                        {new Date(subscription.subscription_start).toLocaleDateString()} - 
                        {new Date(subscription.subscription_end).toLocaleDateString()}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium">Customer ID</p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {subscription.stripe_customer_id || 'N/A'}
                  </p>
                </div>
              </div>
              
              {subscription.stripe_subscription_id && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Stripe Subscription ID: 
                    <span className="font-mono ml-1">
                      {subscription.stripe_subscription_id}
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubscriptions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'No subscriptions match your filters' 
                : 'No subscriptions found'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSubscriptions;