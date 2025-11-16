'use client';

import { useMemo, useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
  SelectItem,
} from '@heroui/react';
import { formatDate } from '@/utils/formatters';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';
import type { UserProfileTransformed } from '@/hooks/usePersonalizationProfiles';

interface ProfilesTableProps {
  profiles: UserProfileTransformed[];
  isLoading?: boolean;
  maxRows?: number;
}

const DEVICE_COLORS = {
  mobile: 'primary' as const,
  desktop: 'secondary' as const,
  tablet: 'success' as const,
};

const STATUS_COLORS = {
  active: 'success' as const,
  inactive: 'default' as const,
};

export function ProfilesTable({ profiles, isLoading = false, maxRows = 100 }: ProfilesTableProps) {
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredProfiles = useMemo(() => {
    let filtered = [...profiles];

    // Filter by device type
    if (deviceFilter !== 'all') {
      filtered = filtered.filter((p) => p.deviceType === deviceFilter);
    }

    // Filter by status
    if (statusFilter === 'active') {
      filtered = filtered.filter((p) => p.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((p) => !p.isActive);
    }

    // Sort by updated date (most recent first)
    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Limit rows
    return filtered.slice(0, maxRows);
  }, [profiles, deviceFilter, statusFilter, maxRows]);

  const formatSessionId = (sessionId: string): string => {
    return sessionId.length > 12 ? `${sessionId.substring(0, 12)}...` : sessionId;
  };

  const formatDevice = (device?: string): string => {
    if (!device) return 'Unknown';
    return device.charAt(0).toUpperCase() + device.slice(1);
  };

  const formatLocation = (location?: { country?: string; region?: string; city?: string }): string => {
    if (!location) return 'N/A';
    const parts = [location.city, location.region, location.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Spinner size="md" />
        <div className="text-foreground/60">Loading profiles...</div>
      </div>
    );
  }

  if (filteredProfiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-foreground/60">
        <p>No profiles found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select
          label="Device Type"
          size="sm"
          selectedKeys={[deviceFilter]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setDeviceFilter(selected || 'all');
          }}
          className="w-40"
        >
          <SelectItem key="all" textValue="all">
            All Devices
          </SelectItem>
          <SelectItem key="mobile" textValue="mobile">
            Mobile
          </SelectItem>
          <SelectItem key="desktop" textValue="desktop">
            Desktop
          </SelectItem>
          <SelectItem key="tablet" textValue="tablet">
            Tablet
          </SelectItem>
        </Select>

        <Select
          label="Status"
          size="sm"
          selectedKeys={[statusFilter]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setStatusFilter(selected || 'all');
          }}
          className="w-40"
        >
          <SelectItem key="all" textValue="all">
            All Status
          </SelectItem>
          <SelectItem key="active" textValue="active">
            Active
          </SelectItem>
          <SelectItem key="inactive" textValue="inactive">
            Inactive
          </SelectItem>
        </Select>
      </div>

      {/* Table */}
      <Table aria-label="User profiles table" className="border border-default rounded-lg">
        <TableHeader>
          <TableColumn>SESSION ID</TableColumn>
          <TableColumn>DEVICE</TableColumn>
          <TableColumn>BROWSER</TableColumn>
          <TableColumn>LOCATION</TableColumn>
          <TableColumn>LAST UPDATED</TableColumn>
          <TableColumn>STATUS</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No profiles found">
          {filteredProfiles.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell>
                <span className="font-mono text-sm">{formatSessionId(profile.sessionId)}</span>
              </TableCell>
              <TableCell>
                {profile.deviceType && (
                  <Chip
                    size="sm"
                    variant="flat"
                    color={DEVICE_COLORS[profile.deviceType as keyof typeof DEVICE_COLORS] || 'default'}
                  >
                    {formatDevice(profile.deviceType)}
                  </Chip>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-foreground/70">{profile.browser || 'N/A'}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-foreground/70">{formatLocation(profile.location)}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-foreground/70">{formatDate(profile.updatedAt)}</span>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  color={profile.isActive ? STATUS_COLORS.active : STATUS_COLORS.inactive}
                >
                  {profile.isActive ? 'Active' : 'Inactive'}
                </Chip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

