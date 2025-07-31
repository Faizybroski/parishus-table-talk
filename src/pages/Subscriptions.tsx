import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Subscriptions = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription Plans</h1>
          <p className="text-muted-foreground">
            This feature is currently being set up. Please check back soon.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              Subscription functionality will be available once the database migration is applied.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please apply the database migration to enable subscription features.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscriptions;