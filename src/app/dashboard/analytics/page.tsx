'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { FilterBar } from '@/components/Dashboard/FilterBar/FilterBar';
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from '@heroui/react';
import {
  ChartBarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import { useAnalyticsEventsData, AnalyticsEvent } from '@/hooks/useDashboardData';
import { formatNumber, formatRelativeTime, formatDuration, formatPercentage } from '@/utils/formatters';
import { Period } from '@/utils/default-data';
import Link from 'next/link';

interface SessionGroup {
  session_id: string;
  events: AnalyticsEvent[];
  eventCount: number;
  firstEventTime: string;
  lastEventTime: string;
  duration: number; // in seconds
  categories: {
    user_action: number;
    api_call: number;
    metric: number;
    error: number;
  };
  uniqueEventTypes: string[];
}

export default function AnalyticsPage() {
  const t = useTranslations('dashboard.analytics');
  const [period, setPeriod] = useState<Period>('week');
  const [sessionPage, setSessionPage] = useState(1);
  const [eventType, setEventType] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionGroup | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  // Modal-level filter state
  const [modalEventType, setModalEventType] = useState<string | null>(null);
  const [modalCategory, setModalCategory] = useState<string | null>(null);
  // Metadata modal state
  const [selectedEventMetadata, setSelectedEventMetadata] = useState<AnalyticsEvent | null>(null);
  const { isOpen: isMetadataModalOpen, onOpen: onMetadataModalOpen, onClose: onMetadataModalClose } = useDisclosure();

  // Always fetch page 1 with high limit for session grouping (we need all events to group properly)
  const { summary, events, isLoading, error, refetch } = useAnalyticsEventsData({
    period,
    page: 1,
    limit: 1000, // High limit to get more events for grouping (API max is 1000)
    eventType,
    category,
    step: null,
  });

  // Group events by session_id
  const sessions = useMemo(() => {
    if (!events || events.length === 0) return [];

    const sessionMap = new Map<string, AnalyticsEvent[]>();

    // Group events by session_id
    events.forEach((event) => {
      const sessionId = event.session_id;
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, []);
      }
      sessionMap.get(sessionId)!.push(event);
    });

    // Convert to SessionGroup array
    // Note: Events are already sorted DESC by the database query
    const sessionGroups: SessionGroup[] = Array.from(sessionMap.entries()).map(([sessionId, sessionEvents]) => {
      // Ensure events within session are sorted DESC (safety check - should already be sorted from DB)
      const sortedEvents = [...sessionEvents].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // When sorted DESC: [0] = newest, [length-1] = oldest
      const lastEventTime = sortedEvents[0].timestamp; // Newest event (first in DESC sort)
      const firstEventTime = sortedEvents[sortedEvents.length - 1].timestamp; // Oldest event (last in DESC sort)
      const duration =
        (new Date(lastEventTime).getTime() - new Date(firstEventTime).getTime()) / 1000;

      // Count categories
      const categories = {
        user_action: 0,
        api_call: 0,
        metric: 0,
        error: 0,
      };
      sessionEvents.forEach((event) => {
        if (event.category in categories) {
          categories[event.category as keyof typeof categories]++;
        }
      });

      // Get unique event types
      const uniqueEventTypes = Array.from(new Set(sessionEvents.map((e) => e.event_type)));

      return {
        session_id: sessionId,
        events: sortedEvents, // Sorted DESC (guaranteed)
        eventCount: sessionEvents.length,
        firstEventTime,
        lastEventTime,
        duration,
        categories,
        uniqueEventTypes,
      };
    });

    // Sort by last event time (most recent first)
    return sessionGroups.sort(
      (a, b) => new Date(b.lastEventTime).getTime() - new Date(a.lastEventTime).getTime()
    );
  }, [events]);

  // Paginate sessions
  const sessionsPerPage = 20;
  const paginatedSessions = useMemo(() => {
    const startIndex = (sessionPage - 1) * sessionsPerPage;
    const endIndex = startIndex + sessionsPerPage;
    return sessions.slice(startIndex, endIndex);
  }, [sessions, sessionPage]);

  const totalSessionPages = Math.ceil(sessions.length / sessionsPerPage);

  // Get unique event types and categories from selected session for modal filters
  const modalFilterOptions = useMemo(() => {
    if (!selectedSession) {
      return { eventTypes: [], categories: [] };
    }
    const uniqueEventTypes = Array.from(new Set(selectedSession.events.map((e) => e.event_type)));
    const uniqueCategories = Array.from(new Set(selectedSession.events.map((e) => e.category)));
    return {
      eventTypes: uniqueEventTypes.sort(),
      categories: uniqueCategories.sort(),
    };
  }, [selectedSession]);

  // Filter events within the modal based on modal filters
  // Note: Events are already sorted DESC from the database, so we just need to filter
  const filteredModalEvents = useMemo(() => {
    if (!selectedSession) return [];
    return selectedSession.events.filter((event) => {
      const matchesEventType = !modalEventType || event.event_type === modalEventType;
      const matchesCategory = !modalCategory || event.category === modalCategory;
      return matchesEventType && matchesCategory;
    });
    // No need to sort - already sorted DESC from DB
  }, [selectedSession, modalEventType, modalCategory]);

  const handleSessionClick = (session: SessionGroup) => {
    setSelectedSession(session);
    setModalEventType(null); // Reset modal filters
    setModalCategory(null); // Reset modal filters
    onOpen();
  };

  const handleModalClose = () => {
    setSelectedSession(null);
    setModalEventType(null); // Reset modal filters
    setModalCategory(null); // Reset modal filters
    onClose();
  };

  const handleShowMetadata = (event: AnalyticsEvent) => {
    setSelectedEventMetadata(event);
    onMetadataModalOpen();
  };

  const handleMetadataModalClose = () => {
    setSelectedEventMetadata(null);
    onMetadataModalClose();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'user_action':
        return 'primary';
      case 'api_call':
        return 'secondary';
      case 'metric':
        return 'success';
      case 'error':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Get unique event types and categories for filters
  const uniqueEventTypes = summary?.topEventTypes.map((et) => et.type) || [];
  const categories = ['user_action', 'api_call', 'metric', 'error'];

  // Calculate derived metrics
  const errorRate = useMemo(() => {
    if (!summary?.totalEvents || summary.totalEvents === 0) return 0;
    return (summary.errorCount / summary.totalEvents) * 100;
  }, [summary?.totalEvents, summary?.errorCount]);


  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message="Loading analytics events..." fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message="Failed to load analytics events" onRetry={refetch} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {/* Period Selector and Filters */}
      <div className="mb-6">
        <FilterBar
          period={period}
          onPeriodChange={(selectedPeriod) => {
            setPeriod(selectedPeriod);
            setSessionPage(1); // Reset to first page when period changes
          }}
          category={category}
          categoryOptions={categories}
          onCategoryChange={(selectedCategory) => {
            setCategory(selectedCategory);
            setSessionPage(1);
          }}
          eventType={eventType}
          eventTypeOptions={uniqueEventTypes}
          onEventTypeChange={(selectedEventType) => {
            setEventType(selectedEventType);
            setSessionPage(1);
          }}
          onRefresh={refetch}
          isEventTypeDisabled={uniqueEventTypes.length === 0}
        />
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Events"
          value={formatNumber(summary?.totalEvents || 0)}
          subtitle={`Events in selected period`}
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Unique Sessions"
          value={formatNumber(summary?.uniqueSessions || 0)}
          subtitle={`Active checkout sessions`}
          icon={<UserIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Errors"
          value={formatNumber(summary?.errorCount || 0)}
          subtitle={
            errorRate > 0
              ? `${formatPercentage(errorRate)} error rate`
              : 'No errors detected'
          }
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="API Calls"
          value={formatNumber(summary?.eventsByCategory?.api_call || 0)}
          subtitle={`Backend API requests`}
          icon={<ServerIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Events by Category Breakdown */}
      <div className="mb-8">
        <ChartCard
          title="Events by Category"
          subtitle="Distribution of events across different categories"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {summary?.eventsByCategory && (
              <>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(summary.eventsByCategory.user_action)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">User Actions</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {formatNumber(summary.eventsByCategory.api_call)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">API Calls</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {formatNumber(summary.eventsByCategory.metric)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Metrics</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {formatNumber(summary.eventsByCategory.error)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Errors</p>
                </div>
              </>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Sessions Table */}
      <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
            <h3 className="text-xl font-bold text-gray-900">Sessions</h3>
            <div className="text-sm text-gray-500">
              Showing {paginatedSessions.length} of {formatNumber(sessions.length)} sessions
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-semibold mb-2">No sessions found</p>
              <p className="text-sm">Try adjusting your filters or select a different time period.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {paginatedSessions.map((session) => (
                  <Card key={session.session_id} className="border border-gray-200">
                    <CardBody className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-gray-500 mb-1">Session ID</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {session.session_id.substring(0, 20)}...
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          isIconOnly
                          onPress={() => handleSessionClick(session)}
                          aria-label="View Events"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Events</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatNumber(session.eventCount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Duration</p>
                          <p className="text-sm text-gray-900">
                            {formatDuration(session.duration)}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-2">Last Event</p>
                        <p className="text-xs font-semibold text-gray-900">
                          {formatRelativeTime(session.lastEventTime)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(session.lastEventTime).toLocaleString()}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-2">Categories</p>
                        <div className="flex gap-1 flex-wrap">
                          {session.categories.user_action > 0 && (
                            <Chip color="primary" size="sm" variant="flat">
                              UA: {session.categories.user_action}
                            </Chip>
                          )}
                          {session.categories.api_call > 0 && (
                            <Chip color="secondary" size="sm" variant="flat">
                              API: {session.categories.api_call}
                            </Chip>
                          )}
                          {session.categories.metric > 0 && (
                            <Chip color="success" size="sm" variant="flat">
                              M: {session.categories.metric}
                            </Chip>
                          )}
                          {session.categories.error > 0 && (
                            <Chip color="danger" size="sm" variant="flat">
                              E: {session.categories.error}
                            </Chip>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table aria-label="Analytics sessions table" removeWrapper>
                  <TableHeader>
                    <TableColumn>SESSION ID</TableColumn>
                    <TableColumn>EVENTS</TableColumn>
                    <TableColumn>DURATION</TableColumn>
                    <TableColumn>FIRST EVENT</TableColumn>
                    <TableColumn>LAST EVENT</TableColumn>
                    <TableColumn>CATEGORIES</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {paginatedSessions.map((session) => (
                      <TableRow key={session.session_id}>
                        <TableCell>
                          <span className="text-sm font-mono text-gray-900">
                            {session.session_id.substring(0, 12)}...
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatNumber(session.eventCount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatDuration(session.duration)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">
                              {formatRelativeTime(session.firstEventTime)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(session.firstEventTime).toLocaleString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">
                              {formatRelativeTime(session.lastEventTime)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(session.lastEventTime).toLocaleString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {session.categories.user_action > 0 && (
                              <Chip color="primary" size="sm" variant="flat">
                                UA: {session.categories.user_action}
                              </Chip>
                            )}
                            {session.categories.api_call > 0 && (
                              <Chip color="secondary" size="sm" variant="flat">
                                API: {session.categories.api_call}
                              </Chip>
                            )}
                            {session.categories.metric > 0 && (
                              <Chip color="success" size="sm" variant="flat">
                                M: {session.categories.metric}
                              </Chip>
                            )}
                            {session.categories.error > 0 && (
                              <Chip color="danger" size="sm" variant="flat">
                                E: {session.categories.error}
                              </Chip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            startContent={<EyeIcon className="w-4 h-4" />}
                            onPress={() => handleSessionClick(session)}
                          >
                            View Events
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalSessionPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    total={totalSessionPages}
                    page={sessionPage}
                    onChange={setSessionPage}
                    size="sm"
                    showControls
                    showShadow
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Session Events Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          base: 'bg-background max-w-[95vw] md:max-w-5xl',
          header: 'border-b border-divider',
          body: 'py-4 md:py-6',
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg md:text-xl font-bold text-gray-900">Session Events</h3>
            {selectedSession && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-gray-600">
                  <span className="font-mono text-xs md:text-sm break-all md:break-normal">{selectedSession.session_id}</span>
                  <span className="hidden md:inline">•</span>
                  <span>{formatNumber(selectedSession.eventCount)} events</span>
                  <span className="hidden md:inline">•</span>
                  <span>Duration: {formatDuration(selectedSession.duration)}</span>
                </div>
                {/* Filter dropdowns */}
                <div className="pt-2 border-t border-gray-200">
                  <FilterBar
                    period="week"
                    onPeriodChange={() => {
                      // No-op handler for modal filter
                    }}
                    category={modalCategory}
                    categoryOptions={modalFilterOptions.categories}
                    onCategoryChange={(selectedCategory) => {
                      setModalCategory(selectedCategory);
                    }}
                    eventType={modalEventType}
                    eventTypeOptions={modalFilterOptions.eventTypes}
                    onEventTypeChange={(selectedEventType) => {
                      setModalEventType(selectedEventType);
                    }}
                    isEventTypeDisabled={modalFilterOptions.eventTypes.length === 0}
                    className="bg-transparent border-0 p-0"
                  />
                  {filteredModalEvents.length !== selectedSession.eventCount && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">
                        Showing {formatNumber(filteredModalEvents.length)} of {formatNumber(selectedSession.eventCount)} events
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ModalHeader>
          <ModalBody>
            {selectedSession && (
              <div className="space-y-4">
                {filteredModalEvents.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg font-semibold mb-2">No events match the selected filters</p>
                    <p className="text-sm">Try adjusting your filter criteria.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {filteredModalEvents.map((event) => (
                        <Card key={event.id} className="border border-gray-200">
                          <CardBody className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 mb-1">Timestamp</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {formatRelativeTime(event.timestamp)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(event.timestamp).toLocaleString()}
                                </p>
                              </div>
                              <Chip
                                color={getCategoryColor(event.category)}
                                size="sm"
                                variant="flat"
                              >
                                {event.category.replace('_', ' ').toUpperCase()}
                              </Chip>
                            </div>
                            
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-500 mb-1">Event Type</p>
                              <p className="text-sm font-medium text-gray-900 break-all">
                                {event.event_type}
                              </p>
                            </div>

                            {event.step && (
                              <div className="pt-2 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-1">Step</p>
                                <p className="text-sm text-gray-600">{event.step}</p>
                              </div>
                            )}

                            {event.metadata && (
                              <div className="pt-2">
                                <Button
                                  size="sm"
                                  variant="flat"
                                  color="primary"
                                  onPress={() => handleShowMetadata(event)}
                                  className="w-full"
                                >
                                  Show Metadata
                                </Button>
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table aria-label="Session events table" removeWrapper>
                        <TableHeader>
                          <TableColumn>TIMESTAMP</TableColumn>
                          <TableColumn>EVENT TYPE</TableColumn>
                          <TableColumn>CATEGORY</TableColumn>
                          <TableColumn>STEP</TableColumn>
                          <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {filteredModalEvents.map((event) => (
                            <TableRow key={event.id}>
                              <TableCell>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatRelativeTime(event.timestamp)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(event.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-medium text-gray-900">{event.event_type}</span>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  color={getCategoryColor(event.category)}
                                  size="sm"
                                  variant="flat"
                                >
                                  {event.category.replace('_', ' ').toUpperCase()}
                                </Chip>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">
                                  {event.step || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="light"
                                  onPress={() => handleShowMetadata(event)}
                                  isDisabled={!event.metadata}
                                >
                                  Show Metadata
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Metadata Modal */}
      <Modal
        isOpen={isMetadataModalOpen}
        onClose={handleMetadataModalClose}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: 'bg-background max-w-[95vw] md:max-w-2xl',
          header: 'border-b border-divider',
          body: 'py-4 md:py-6',
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg md:text-xl font-bold text-gray-900">Event Metadata</h3>
            {selectedEventMetadata && (
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-gray-600 mt-2">
                <span className="font-medium break-all md:break-normal">{selectedEventMetadata.event_type}</span>
                <span className="hidden md:inline">•</span>
                <Chip
                  color={getCategoryColor(selectedEventMetadata.category)}
                  size="sm"
                  variant="flat"
                >
                  {selectedEventMetadata.category.replace('_', ' ').toUpperCase()}
                </Chip>
                {selectedEventMetadata.step && (
                  <>
                    <span className="hidden md:inline">•</span>
                    <span>Step: {selectedEventMetadata.step}</span>
                  </>
                )}
              </div>
            )}
          </ModalHeader>
          <ModalBody>
            {selectedEventMetadata && selectedEventMetadata.metadata ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Metadata</h4>
                  <pre className="text-xs bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200 overflow-x-auto">
                    {JSON.stringify(selectedEventMetadata.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No metadata available for this event.</p>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Quick Links to Category Pages */}
      <div className="mt-8">
        <ChartCard
          title="Analytics Categories"
          subtitle="Explore detailed analytics for specific categories"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/analytics/payment">
              <Button
                variant="flat"
                className="w-full"
                color="primary"
              >
                Payment Analytics
              </Button>
            </Link>
            <Link href="/dashboard/analytics/shipping">
              <Button
                variant="flat"
                className="w-full"
                color="secondary"
              >
                Shipping Analytics
              </Button>
            </Link>
            <Link href="/dashboard/analytics/devices">
              <Button
                variant="flat"
                className="w-full"
                color="success"
              >
                Device Analytics
              </Button>
            </Link>
            <Link href="/dashboard/analytics/browsers">
              <Button
                variant="flat"
                className="w-full"
                color="warning"
              >
                Browser Analytics
              </Button>
            </Link>
          </div>
        </ChartCard>
      </div>
    </PageWrapper>
  );
}
