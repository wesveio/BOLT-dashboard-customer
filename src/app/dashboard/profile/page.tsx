'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import {
  Card,
  CardBody,
  Input,
  Button,
  Avatar,
} from '@heroui/react';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import { CameraIcon, EnvelopeIcon, UserIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function ProfilePage() {
  const t = useTranslations('dashboard.profile');
  const { user } = useDashboardAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    company: '',
    jobTitle: '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to Supabase
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(t('saveSuccess'));
      setIsEditing(false);
    } catch (error) {
      toast.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      company: '',
      jobTitle: '',
    });
    setIsEditing(false);
  };

  return (
    <m.div initial="hidden" animate="visible" variants={fadeIn}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardBody className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('personalInfo')}</h2>
              <div className="space-y-4">
                <Input
                  label={t('name')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  variant="bordered"
                  size="lg"
                  isDisabled={!isEditing}
                  isRequired
                  startContent={<UserIcon className="w-5 h-5 text-gray-400" />}
                  classNames={{
                    input: 'text-base',
                    label: 'text-sm font-semibold',
                  }}
                />
                <Input
                  label={t('email')}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  variant="bordered"
                  size="lg"
                  isDisabled={true}
                  isRequired
                  startContent={<EnvelopeIcon className="w-5 h-5 text-gray-400" />}
                  description={t('emailNote')}
                  classNames={{
                    input: 'text-base',
                    label: 'text-sm font-semibold',
                  }}
                />
                <Input
                  label={t('phone')}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  variant="bordered"
                  size="lg"
                  isDisabled={!isEditing}
                  placeholder="+55 (11) 99999-9999"
                  classNames={{
                    input: 'text-base',
                    label: 'text-sm font-semibold',
                  }}
                />
              </div>
            </CardBody>
          </Card>

          {/* Professional Information */}
          <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardBody className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t('professionalInfo')}</h2>
              <div className="space-y-4">
                <Input
                  label={t('company')}
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  variant="bordered"
                  size="lg"
                  isDisabled={!isEditing}
                  classNames={{
                    input: 'text-base',
                    label: 'text-sm font-semibold',
                  }}
                />
                <Input
                  label={t('jobTitle')}
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  variant="bordered"
                  size="lg"
                  isDisabled={!isEditing}
                  classNames={{
                    input: 'text-base',
                    label: 'text-sm font-semibold',
                  }}
                />
              </div>
            </CardBody>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            {!isEditing ? (
              <Button
                color="primary"
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                onPress={() => setIsEditing(true)}
              >
                {t('editProfile')}
              </Button>
            ) : (
              <>
                <Button
                  color="primary"
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  onPress={handleSave}
                  isLoading={isSaving}
                >
                  {t('saveChanges')}
                </Button>
                <Button
                  variant="light"
                  size="lg"
                  onPress={handleCancel}
                  isDisabled={isSaving}
                >
                  {t('cancel')}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Right Column - Avatar & Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Avatar Card */}
          <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardBody className="p-6">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <Avatar
                    size="lg"
                    name={user?.name || user?.email || 'U'}
                    className="w-32 h-32 text-3xl bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                  />
                  {isEditing && (
                    <button
                      className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                      onClick={() => {
                        // TODO: Implement image upload
                        toast.info(t('avatarUploadComingSoon'));
                      }}
                    >
                      <CameraIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{user?.name || 'User'}</h3>
                <p className="text-sm text-gray-600 mb-4">{user?.email}</p>
                <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                  {user?.role || 'viewer'}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Account Stats */}
          <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
            <CardBody className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('accountStats')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('memberSince')}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('lastLogin')}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('accountStatus')}</span>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    {t('active')}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </m.div>
  );
}

