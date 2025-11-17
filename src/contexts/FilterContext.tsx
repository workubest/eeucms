import React, { createContext, useContext, useState, useEffect } from 'react';

interface FilterContextType {
  isFilterEnabled: boolean;
  toggleFilter: () => void;
  enableFilter: () => void;
  disableFilter: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [isFilterEnabled, setIsFilterEnabled] = useState(false);

  // Load filter state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('filterEnabled');
    if (savedState !== null) {
      setIsFilterEnabled(JSON.parse(savedState));
    }
  }, []);

  // Save filter state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('filterEnabled', JSON.stringify(isFilterEnabled));
  }, [isFilterEnabled]);

  const toggleFilter = () => {
    setIsFilterEnabled(prev => !prev);
  };

  const enableFilter = () => {
    setIsFilterEnabled(true);
  };

  const disableFilter = () => {
    setIsFilterEnabled(false);
  };

  return (
    <FilterContext.Provider value={{
      isFilterEnabled,
      toggleFilter,
      enableFilter,
      disableFilter
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
