'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Business, BusinessUser, Role } from '@prisma/client';

// Define the structure of a business object with its users
export type BusinessWithUsers = Business & {
  users: (
    {
      role: Role;
      user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
      };
    }
  )[];
};

// Define the shape of the context
interface BusinessContextType {
  activeBusiness: BusinessWithUsers | null;
  setActiveBusiness: (business: BusinessWithUsers | null) => void;
  userBusinesses: BusinessWithUsers[];
  loading: boolean;
  refreshBusinesses: () => void;
}

// Create the context with a default undefined value
const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

// Create the provider component
export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const [activeBusiness, setActiveBusiness] = useState<BusinessWithUsers | null>(null);
  const [userBusinesses, setUserBusinesses] = useState<BusinessWithUsers[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/businesses');
      if (!response.ok) {
        throw new Error('Failed to fetch businesses');
      }
      const businesses: BusinessWithUsers[] = await response.json();
      setUserBusinesses(businesses);

      // Set the first business as active by default, or null if none exist
      if (businesses.length > 0) {
        setActiveBusiness(businesses[0]);
      } else {
        setActiveBusiness(null);
      }
    } catch (error) {
      console.error(error);
      setUserBusinesses([]);
      setActiveBusiness(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const value = {
    activeBusiness,
    setActiveBusiness,
    userBusinesses,
    loading,
    refreshBusinesses: fetchBusinesses, // Expose a function to manually refresh
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};

// Create a custom hook for easy consumption of the context
export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
