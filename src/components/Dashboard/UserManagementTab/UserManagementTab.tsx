'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
} from '@heroui/react';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { InviteUserModal } from '../InviteUserModal/InviteUserModal';
import { UsersList } from '../UsersList/UsersList';
import { InvitationsList } from '../InvitationsList/InvitationsList';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { getPlanUserLimit, getRemainingUserSlots, canRoleDeleteUser } from '@/utils/users';
import type { UserRole } from '@/utils/users';

interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  created_at: string;
  last_login_at?: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  expires_at: string;
  created_at: string;
  status: 'pending' | 'expired' | 'accepted';
}

/**
 * User Management Tab Component
 * Displays users and invitations for the account
 */
export function UserManagementTab() {
  const { user: currentUser } = useDashboardAuth();
  const { role } = useRolePermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [, setIsResending] = useState(false);
  const [, setIsDeleting] = useState(false);
  const [, setIsDeletingInvitation] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [planType, setPlanType] = useState<'basic' | 'pro' | 'enterprise'>('basic');

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load users
      const usersResponse = await fetch('/api/dashboard/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
        setUserCount(usersData.count || 0);
        setPlanType(usersData.planType || 'basic');
      } else {
        const error = await usersResponse.json();
        toast.error(error.error || 'Failed to load users');
      }

      // Load invitations
      const invitationsResponse = await fetch('/api/dashboard/users/invitations');
      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setInvitations(invitationsData.invitations || []);
      } else {
        const error = await invitationsResponse.json();
        toast.error(error.error || 'Failed to load invitations');
      }
    } catch (error) {
      console.error('Load data error:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvite = async (email: string, userRole: UserRole) => {
    setIsInviting(true);
    try {
      const response = await fetch('/api/dashboard/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: userRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }

      toast.success('Invitation sent successfully');
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Invite error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleResend = async (invitationId: string) => {
    setIsResending(true);
    try {
      const response = await fetch(`/api/dashboard/users/invitations/${invitationId}/resend`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resend invitation');
      }

      toast.success('Invitation resent successfully');
      await loadData();
    } catch (error) {
      console.error('Resend error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resend invitation');
    } finally {
      setIsResending(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/dashboard/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      toast.success('User removed successfully');
      await loadData();
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    setIsDeletingInvitation(true);
    try {
      const response = await fetch(`/api/dashboard/users/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel invitation');
      }

      toast.success('Invitation cancelled successfully');
      await loadData();
    } catch (error) {
      console.error('Cancel invitation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel invitation');
    } finally {
      setIsDeletingInvitation(false);
    }
  };

  const limit = getPlanUserLimit(planType);
  const remainingSlots = getRemainingUserSlots(userCount, planType);

  if (isLoading) {
    return (
      <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 mt-6">
        <CardBody className="p-6">
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Invite Button */}
      <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Team Members</h2>
              <p className="text-sm text-gray-600">
                {userCount} of {limit} users used ({remainingSlots} remaining)
              </p>
            </div>
            <Button
              color="primary"
              startContent={<UserPlusIcon className="w-5 h-5" />}
              onPress={() => setIsModalOpen(true)}
              isDisabled={remainingSlots === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Invite User
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Users List */}
      <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Active Users</h3>
          <UsersList
            users={users}
            currentUserId={currentUser?.id}
            onDelete={handleDeleteUser}
            canDelete={(userRole) =>
              canRoleDeleteUser(role as UserRole, userRole as UserRole)
            }
          />
        </CardBody>
      </Card>

      {/* Invitations List */}
      <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Pending Invitations</h3>
          <InvitationsList
            invitations={invitations}
            onResend={handleResend}
            onCancel={handleCancelInvitation}
          />
        </CardBody>
      </Card>

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleInvite}
        isLoading={isInviting}
        remainingSlots={remainingSlots}
      />
    </div>
  );
}

