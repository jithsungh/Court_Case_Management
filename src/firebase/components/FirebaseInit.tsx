import { useEffect, useState } from 'react';
import { migrateDataToFirebase, checkDataMigrationNeeded } from '../utils/dataMigration';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

type FirebaseInitProps = {
  onComplete: () => void;
};

export const FirebaseInit = ({ onComplete }: FirebaseInitProps) => {
  const [initializing, setInitializing] = useState(true);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkMigration = async () => {
      const needed = await checkDataMigrationNeeded();
      setMigrationNeeded(needed);
      
      if (!needed) {
        console.log("Firebase initialization complete - calling onComplete");
        onComplete();
      }
      
      console.log("Firebase initialization - setting initializing to false");
      setInitializing(false);
    };
    
    checkMigration();
  }, [onComplete]);

  const handleMigration = async () => {
    setMigrating(true);
    
    try {
      const success = await migrateDataToFirebase();
      
      if (success) {
        toast({
          title: "Data Migration Complete",
          description: "Sample data has been successfully migrated to Firebase.",
        });
        onComplete();
      } else {
        toast({
          title: "Migration Skipped",
          description: "Data already exists in Firebase, migration not needed.",
        });
        onComplete();
      }
    } catch (error) {
      console.error("Error during migration:", error);
      toast({
        title: "Migration Failed",
        description: "There was an error migrating data to Firebase.",
        variant: "destructive"
      });
    } finally {
      setMigrating(false);
    }
  };

  if (initializing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <Card className="w-[350px] shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Initializing Application</CardTitle>
            <CardDescription>Checking Firebase setup...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (migrationNeeded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <Card className="w-[450px] shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Database Setup Required</CardTitle>
            <CardDescription>
              We need to initialize your Firebase database with sample data for the application to work properly.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p className="mb-2">This will:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Create user accounts for clients, lawyers, clerks, and judges</li>
              <li>Set up sample court cases</li>
              <li>Initialize necessary data structures</li>
            </ul>
            <p className="mt-2">
              This only needs to be done once. The application will work with your Firebase configuration after this setup.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onComplete()}>
              Skip
            </Button>
            <Button 
              onClick={handleMigration} 
              disabled={migrating}
            >
              {migrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                "Initialize Database"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return null;
};
