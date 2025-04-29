
import { useEffect, useState } from 'react';
import { useFirebaseData } from '@/context/FirebaseDataContext';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import { Case } from '@/services/types';

export const useDefendantCases = () => {
  const [defendantCases, setDefendantCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { cases } = useFirebaseData();
  const { userData } = useFirebaseAuth();

  useEffect(() => {
    const loadDefendantCases = () => {
      if (!userData?.phone || !cases.length) {
        setDefendantCases([]);
        setIsLoading(false);
        return;
      }

      try {
        // Filter cases where the current user is the defendant
        const filtered = cases.filter(
          (c) => 
            c.defendant?.phoneNumber === userData.phone && 
            (c.status === "pending" || c.status === "active") &&
            !c.defendantLawyerId
        );
        
        setDefendantCases(filtered);
      } catch (error) {
        console.error('Error finding defendant cases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDefendantCases();
  }, [userData?.phone, cases]);

  return { defendantCases, isLoading };
};
