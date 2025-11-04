'use client';

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Tooltip,
} from '@heroui/react';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { UserRole } from '@/utils/users';

interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  expires_at: string;
  created_at: string;
  status: 'pending' | 'expired' | 'accepted';
}

interface InvitationsListProps {
  invitations: Invitation[];
  onResend?: (invitationId: string) => Promise<void>;
  onCancel?: (invitationId: string) => Promise<void>;
}

/**
 * Component to display list of pending invitations
 */
export function InvitationsList({
  invitations,
  onResend,
  onCancel,
}: InvitationsListProps) {
  const getStatusColor = (
    status: 'pending' | 'expired' | 'accepted'
  ): 'default' | 'primary' | 'warning' | 'success' => {
    switch (status) {
      case 'pending':
        return 'primary';
      case 'expired':
        return 'warning';
      case 'accepted':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const isExpired = (expiresAt: string): boolean => {
    return new Date(expiresAt) < new Date();
  };

  const getRoleColor = (role: UserRole): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
    switch (role) {
      case 'owner':
        return 'danger';
      case 'admin':
        return 'primary';
      case 'editor':
        return 'secondary';
      case 'viewer':
        return 'default';
      default:
        return 'default';
    }
  };

  const pendingInvitations = invitations.filter((inv) => inv.status !== 'accepted');

  if (pendingInvitations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No pending invitations</p>
      </div>
    );
  }

  return (
    <Table aria-label="Invitations table" removeWrapper>
      <TableHeader>
        <TableColumn>EMAIL</TableColumn>
        <TableColumn>ROLE</TableColumn>
        <TableColumn>STATUS</TableColumn>
        <TableColumn>EXPIRES</TableColumn>
        {(onResend || onCancel) ? <TableColumn>ACTIONS</TableColumn> : <></>}
      </TableHeader>
      <TableBody>
        {pendingInvitations.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell>
              <span className="font-medium text-gray-900">{invitation.email}</span>
            </TableCell>
            <TableCell>
              <Chip
                color={getRoleColor(invitation.role)}
                size="sm"
                variant="flat"
                className="capitalize"
              >
                {invitation.role}
              </Chip>
            </TableCell>
            <TableCell>
              <Chip
                color={getStatusColor(invitation.status)}
                size="sm"
                variant="flat"
                className="capitalize"
              >
                {invitation.status}
              </Chip>
            </TableCell>
            <TableCell>
              <span className="text-sm text-gray-600">
                {isExpired(invitation.expires_at) ? (
                  <span className="text-red-600">Expired</span>
                ) : (
                  formatDate(invitation.expires_at)
                )}
              </span>
            </TableCell>
            {(onResend || onCancel) ? (
              <TableCell>
                <div className="flex items-center gap-2">
                  {invitation.status === 'expired' && onResend && (
                    <Tooltip content="Resend invitation" placement="left">
                      <Button
                        isIconOnly
                        variant="light"
                        color="primary"
                        size="sm"
                        onPress={() => onResend(invitation.id)}
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  )}
                  {invitation.status === 'pending' && onResend && (
                    <Tooltip content="Resend invitation" placement="left">
                      <Button
                        isIconOnly
                        variant="light"
                        color="primary"
                        size="sm"
                        onPress={() => onResend(invitation.id)}
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  )}
                  {onCancel && invitation.status !== 'accepted' && (
                    <Tooltip content="Cancel invitation" placement="left">
                      <Button
                        isIconOnly
                        variant="light"
                        color="danger"
                        size="sm"
                        onPress={() => onCancel(invitation.id)}
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
            ) : <></>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

