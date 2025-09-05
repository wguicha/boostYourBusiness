'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useBusiness, BusinessWithUsers } from '@/context/BusinessContext'; // Import BusinessWithUsers
import styles from './Businesses.module.css';
import Modal from '@/components/Modal';
import { Role } from '@prisma/client';
import { useSession } from 'next-auth/react';

interface Invitation {
  businessId: string;
  userId: string;
  role: Role;
  status: 'PENDING';
  business: { id: string; name: string; };
}

export default function BusinessesPage() {
  const { data: session } = useSession();
  const { userBusinesses, activeBusiness, loading: businessLoading, refreshBusinesses } = useBusiness();
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [isCreateBusinessModalOpen, setIsCreateBusinessModalOpen] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');

  const [isManageBusinessModalOpen, setIsManageBusinessModalOpen] = useState(false);
  const [businessToManage, setBusinessToManage] = useState<BusinessWithUsers | null>(null);
  const [inviteeEmail, setInviteeEmail] = useState('');

  const fetchPendingInvitations = useCallback(async () => {
    setLoadingInvitations(true);
    try {
      const response = await fetch('/api/invitations');
      if (!response.ok) throw new Error('Failed to fetch pending invitations');
      const data: Invitation[] = await response.json();
      setPendingInvitations(data);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      setPendingInvitations([]);
    } finally {
      setLoadingInvitations(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingInvitations();
  }, [fetchPendingInvitations, activeBusiness]);

  const handleAcceptInvitation = async (businessId: string) => {
    try {
      const response = await fetch(`/api/invitations/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });
      if (!response.ok) throw new Error('Failed to accept invitation');
      alert('Invitation accepted!');
      fetchPendingInvitations(); // Refresh invitations
      refreshBusinesses(); // Refresh user's businesses in context
    } catch (error) {
      alert('Error accepting invitation.');
      console.error(error);
    }
  };

  const handleRejectInvitation = async (businessId: string) => {
    try {
      const response = await fetch(`/api/invitations/${businessId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to reject invitation');
      alert('Invitation rejected.');
      fetchPendingInvitations(); // Refresh invitations
    } catch (error) {
      alert('Error rejecting invitation.');
      console.error(error);
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusinessName) return alert('Business name is required.');

    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBusinessName }),
      });
      if (!response.ok) throw new Error('Failed to create business');
      alert('Business created successfully!');
      setNewBusinessName('');
      setIsCreateBusinessModalOpen(false);
      refreshBusinesses(); // Refresh user's businesses in context
    } catch (error) {
      alert('Error creating business.');
      console.error(error);
    }
  };

  const handleRemoveMember = async (businessId: string, memberId: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        const response = await fetch(`/api/businesses/${businessId}/members/${memberId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to remove member');
        alert('Member removed successfully!');
        // Refresh the businessToManage data and userBusinesses context
        if (businessToManage && businessToManage.id === businessId) {
          setBusinessToManage(prev => prev ? { ...prev, users: prev.users.filter(u => u.user.id !== memberId) } : null);
        }
        refreshBusinesses();
      } catch (error) {
        alert('Error removing member.');
        console.error(error);
      }
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessToManage) return;
    if (!inviteeEmail) return alert('Email is required.');

    try {
      const response = await fetch(`/api/businesses/${businessToManage.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteeEmail }),
      });
      if (!response.ok) throw new Error('Failed to send invitation');
      alert('Invitation sent successfully!');
      setInviteeEmail('');
      // Optionally refresh businessToManage to show pending invite
      // For now, just refresh all businesses
      refreshBusinesses();
    } catch (error) {
      alert('Error sending invitation.');
      console.error(error);
    }
  };

  if (businessLoading) return <p>Loading businesses...</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Businesses</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Businesses</h2>
        {userBusinesses.length === 0 ? (
          <p>You are not part of any business yet.</p>
        ) : (
          <ul className={styles.businessList}>
            {userBusinesses.map((business) => {
              const currentUserMembership = business.users.find(
                (bu) => bu.user.id === session?.user?.id
              );
              const role = currentUserMembership ? currentUserMembership.role : 'N/A';

              return (
                <li key={business.id} className={styles.businessItem}>
                  <span>{business.name} ({role}) {business.id === activeBusiness?.id && '(Active)'}</span>
                  {currentUserMembership?.role === Role.OWNER && (
                    <button 
                      onClick={() => { setBusinessToManage(business); setIsManageBusinessModalOpen(true); }}
                      className={styles.manageButton}
                    >
                      Manage
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <button onClick={() => setIsCreateBusinessModalOpen(true)} className={styles.createButton}>Create New Business</button>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Pending Invitations</h2>
        {loadingInvitations ? (
          <p>Loading invitations...</p>
        ) : pendingInvitations.length === 0 ? (
          <p>No pending invitations.</p>
        ) : (
          <ul className={styles.invitationList}>
            {pendingInvitations.map((inv) => (
              <li key={inv.businessId} className={styles.invitationItem}>
                <span>You are invited to {inv.business.name} as {inv.role}.</span>
                <div>
                  <button onClick={() => handleAcceptInvitation(inv.businessId)} className={styles.acceptButton}>Accept</button>
                  <button onClick={() => handleRejectInvitation(inv.businessId)} className={styles.rejectButton}>Reject</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal isOpen={isCreateBusinessModalOpen} onClose={() => setIsCreateBusinessModalOpen(false)} title="Create New Business">
        <form onSubmit={handleCreateBusiness} className={styles.form}>
          <label htmlFor="businessName" className={styles.label}>Business Name</label>
          <input
            type="text"
            id="businessName"
            value={newBusinessName}
            onChange={(e) => setNewBusinessName(e.target.value)}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.submitButton}>Create</button>
          <button type="button" onClick={() => setIsCreateBusinessModalOpen(false)} className={styles.cancelButton}>Cancel</button>
        </form>
      </Modal>

      {businessToManage && (
        <Modal isOpen={isManageBusinessModalOpen} onClose={() => setIsManageBusinessModalOpen(false)} title={`Manage ${businessToManage.name}`}>
          <section className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Members</h3>
            <ul className={styles.memberList}>
              {businessToManage.users.map((member) => (
                <li key={member.user.id} className={styles.memberItem}>
                  <span>{member.user.name || member.user.email} ({member.role})</span>
                  {session?.user?.id === businessToManage.users.find(u => u.role === Role.OWNER)?.user.id && // Only owner can remove
                   member.user.id !== session?.user?.id && ( // Cannot remove self
                    <button 
                      onClick={() => handleRemoveMember(businessToManage.id, member.user.id)}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Invite New Member</h3>
            <form onSubmit={handleInviteUser} className={styles.form}>
              <label htmlFor="inviteeEmail" className={styles.label}>Email</label>
              <input
                type="email"
                id="inviteeEmail"
                value={inviteeEmail}
                onChange={(e) => setInviteeEmail(e.target.value)}
                className={styles.input}
                required
              />
              <button type="submit" className={styles.submitButton}>Send Invitation</button>
            </form>
          </section>
        </Modal>
      )}
    </div>
  );
}
