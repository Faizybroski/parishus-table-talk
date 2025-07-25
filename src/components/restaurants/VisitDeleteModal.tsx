import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RestaurantVisit {
  id: string;
  restaurant_id?: string;
  restaurant_name: string;
  latitude: number;
  longitude: number;
  visited_at: string;
  created_at: string;
}

interface VisitDeleteModalProps {
  visit: RestaurantVisit;
  onVisitDeleted?: () => void;
}

const VisitDeleteModal: React.FC<VisitDeleteModalProps> = ({ visit, onVisitDeleted }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('restaurant_visits')
        .delete()
        .eq('id', visit.id);

      if (error) throw error;

      toast({
        title: "Visit deleted!",
        description: "Your restaurant visit has been deleted.",
      });

      onVisitDeleted?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete visit",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Restaurant Visit</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete your visit to "{visit.restaurant_name}" on {new Date(visit.visited_at).toLocaleDateString()}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default VisitDeleteModal;