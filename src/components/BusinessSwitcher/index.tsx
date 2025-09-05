'use client';

import React from 'react';
import { useBusiness } from '@/context/BusinessContext';
import styles from './BusinessSwitcher.module.css';

const BusinessSwitcher = () => {
  const { activeBusiness, userBusinesses, setActiveBusiness, loading } = useBusiness();

  const handleBusinessChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBusinessId = event.target.value;
    const selectedBusiness = userBusinesses.find(b => b.id === selectedBusinessId) || null;
    setActiveBusiness(selectedBusiness);
  };

  if (loading) {
    return <div className={styles.loading}>Loading businesses...</div>;
  }

  if (!activeBusiness && userBusinesses.length === 0) {
    return (
        <div className={styles.container}>
            <span className={styles.noBusinessText}>No business found.</span>
            {/* In a future step, we can make this a link to a create business page */}
            <a href="/businesses/new" className={styles.createBusinessLink}>Create One</a>
        </div>
    );
  }

  return (
    <div className={styles.container}>
      <select
        value={activeBusiness?.id || ''}
        onChange={handleBusinessChange}
        className={styles.select}
        aria-label="Select a business"
      >
        {userBusinesses.map(business => (
          <option key={business.id} value={business.id}>
            {business.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default BusinessSwitcher;
