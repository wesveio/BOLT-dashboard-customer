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
import { TrashIcon } from '@heroicons/react/24/outline';
import { UserRole } from '@/utils/users';

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

interface UsersListProps {
  users: User[];
  currentUserId?: string;
  onDelete?: (userId: string) => Promise<void>;
  canDelete?: (userRole: UserRole) => boolean;
}

/**
 * Component to display list of users in a table
 */
export function UsersList({
  users,
  currentUserId,
  onDelete,
  canDelete,
}: UsersListProps) {
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

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const displayName = (user: User): string => {
    if (user.name) return user.name;
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email;
  };

  return (
    <Table aria-label="Users table" removeWrapper>
      <TableHeader>
        <TableColumn>USER</TableColumn>
        <TableColumn>ROLE</TableColumn>
        <TableColumn>JOINED</TableColumn>
        <TableColumn>LAST LOGIN</TableColumn>
        {onDelete ? <TableColumn>ACTIONS</TableColumn> : <></>}
      </TableHeader>
      <TableBody emptyContent="No users found">
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div>
                <p className="font-semibold text-gray-900">{displayName(user)}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </TableCell>
            <TableCell>
              <Chip
                color={getRoleColor(user.role)}
                size="sm"
                variant="flat"
                className="capitalize"
              >
                {user.role}
              </Chip>
            </TableCell>
            <TableCell>
              <span className="text-sm text-gray-600">{formatDate(user.created_at)}</span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-gray-600">{formatDate(user.last_login_at)}</span>
            </TableCell>
            {onDelete ? (
              <TableCell>
                {user.id !== currentUserId && canDelete && canDelete(user.role) && (
                  <Tooltip content="Remove user" placement="left">
                    <Button
                      isIconOnly
                      variant="light"
                      color="danger"
                      size="sm"
                      onPress={() => onDelete(user.id)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                )}
              </TableCell>
            ) : <></>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

