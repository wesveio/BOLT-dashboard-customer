'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import { UserRole } from '@/utils/users';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, role: UserRole) => Promise<void>;
  isLoading?: boolean;
  remainingSlots?: number;
}

/**
 * Modal for inviting a new user
 */
export function InviteUserModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  remainingSlots = 0,
}: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [errors, setErrors] = useState<{ email?: string; role?: string }>({});

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
    return emailRegex.test(emailValue);
  };

  const handleSubmit = async () => {
    const newErrors: { email?: string; role?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email.trim())) {
      newErrors.email = 'Invalid email format';
    }

    if (!role) {
      newErrors.role = 'Role is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await onSubmit(email.trim().toLowerCase(), role);
    // Reset form on success
    setEmail('');
    setRole('viewer');
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      setRole('viewer');
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-gray-900">Invite New User</h2>
          <p className="text-sm text-gray-600 font-normal">
            Send an invitation to join your account
            {remainingSlots > 0 && (
              <span className="ml-1 text-blue-600 font-medium">
                ({remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining)
              </span>
            )}
          </p>
        </ModalHeader>
        <ModalBody>
          <Input
            label="Email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) {
                setErrors({ ...errors, email: undefined });
              }
            }}
            variant="bordered"
            size="lg"
            isRequired
            isDisabled={isLoading}
            isInvalid={!!errors.email}
            errorMessage={errors.email}
            description="The user will receive an invitation email"
          />
          <Select
            label="Role"
            selectedKeys={[role]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as UserRole;
              setRole(selected);
              if (errors.role) {
                setErrors({ ...errors, role: undefined });
              }
            }}
            variant="bordered"
            size="lg"
            isRequired
            isDisabled={isLoading}
            isInvalid={!!errors.role}
            errorMessage={errors.role}
            description="Select the role for this user"
          >
            <SelectItem key="viewer" textValue="viewer">
              Viewer - Read-only access
            </SelectItem>
            <SelectItem key="editor" textValue="editor">
              Editor - Can edit themes
            </SelectItem>
            <SelectItem key="admin" textValue="admin">
              Administrator - Can manage most settings
            </SelectItem>
            <SelectItem key="owner" textValue="owner">
              Owner - Full access
            </SelectItem>
          </Select>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!email.trim() || !role || remainingSlots === 0}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Send Invitation
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
