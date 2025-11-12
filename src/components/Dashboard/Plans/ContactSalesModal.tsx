'use client';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@heroui/react';
import { ContactForm } from '@/components/Public/Contact/ContactForm';

interface ContactSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal for contacting sales about Enterprise plan
 */
export function ContactSalesModal({
  isOpen,
  onClose,
}: ContactSalesModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Contact Sales
        </ModalHeader>
        <ModalBody className="pb-6">
          <ContactForm source="enterprise" onSuccess={onClose} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

