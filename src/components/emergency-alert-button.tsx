'use client';

import { useState } from 'react';
import { Siren } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function EmergencyAlertButton() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleEmergencyAlert = () => {
    setIsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          toast({
            title: 'Emergency Alert Sent!',
            description: `Your location (Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}) and details have been shared with the cybercell helpline. They will contact you shortly.`,
            variant: 'destructive',
            duration: 8000,
          });
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: 'Emergency Alert Sent (Location Failed)',
            description: 'Your details have been shared, but we could not access your location. The cybercell helpline will contact you shortly.',
            variant: 'destructive',
            duration: 8000,
          });
          setIsLoading(false);
        }
      );
    } else {
      toast({
        title: 'Emergency Alert Sent (Location Not Supported)',
        description: 'Your details have been shared, but geolocation is not supported by your browser. The cybercell helpline will contact you shortly.',
        variant: 'destructive',
        duration: 8000,
      });
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="lg" className="w-full md:w-auto shadow-lg hover:shadow-xl transition-shadow" disabled={isLoading}>
          <Siren className="mr-2 h-5 w-5" />
          {isLoading ? 'Sending Alert...' : 'Emergency Alert'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Emergency Alert?</AlertDialogTitle>
          <AlertDialogDescription>
            This will immediately send an alert with your current location (if available) and contact details to the cybercell helpline. Use this only in a genuine emergency.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleEmergencyAlert} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            Send Alert Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
