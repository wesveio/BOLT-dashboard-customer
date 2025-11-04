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
  Textarea,
} from '@heroui/react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description?: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Modal for creating a new custom API key
 */
export function ApiKeyModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: ApiKeyModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      return;
    }
    await onSubmit(name.trim(), description.trim() || undefined);
    // Reset form on success
    setName('');
    setDescription('');
  };

  const handleClose = () => {
    if (!isLoading) {
      setName('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-gray-900">Create New API Key</h2>
          <p className="text-sm text-gray-600 font-normal">
            Create a new API key for your integrations
          </p>
        </ModalHeader>
        <ModalBody>
          <Input
            label="Name"
            placeholder="e.g., Production API, Webhook Key"
            value={name}
            onChange={(e) => setName(e.target.value)}
            variant="bordered"
            size="lg"
            isRequired
            isDisabled={isLoading}
            description="A descriptive name for this API key"
          />
          <Textarea
            label="Description"
            placeholder="Optional description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            variant="bordered"
            size="lg"
            isDisabled={isLoading}
            description="Optional description to help identify this key"
            maxRows={3}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            variant="light"
            onPress={handleClose}
            isDisabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!name.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Create API Key
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

interface ApiKeyDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  keyName?: string;
}

/**
 * Modal for displaying a newly generated API key (show once)
 */
export function ApiKeyDisplayModal({
  isOpen,
  onClose,
  apiKey,
  keyName,
}: ApiKeyDisplayModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isDismissable={false} hideCloseButton>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-gray-900">
            {keyName ? `API Key Created: ${keyName}` : 'API Key Created'}
          </h2>
          <p className="text-sm text-red-600 font-semibold">
            ⚠️ Important: Copy this key now. You won&apos;t be able to see it again!
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your API Key
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm break-all">
                  {apiKey}
                </div>
                <Button
                  isIconOnly
                  variant="flat"
                  onPress={handleCopy}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <CheckIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <ClipboardIcon className="w-5 h-5 text-gray-600" />
                  )}
                </Button>
              </div>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Security Note:</strong> Store this key in a secure location. Never share it
                publicly or commit it to version control.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onPress={onClose}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            I&apos;ve Copied the Key
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

