import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  Clock,
  Building2,
  BookOpen,
  User,
  Plus,
  Filter,
  AlertTriangle,
  Printer,
  Sparkles,
  ShieldAlert,
  LayoutGrid,
  Users,
  Wand2,
  Layers,
  ChevronDown,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  TimetableSlot,
  Stream,
  Subject,
  Teacher,
  ViewMode,
  DayOfWeek,
  ConflictItem,
  TeacherWorkload,
  RoomUtilization,
} from '../components/timetable/types';
import { TimetableGrid } from '../components/timetable/TimetableGrid';
import { SlotEditModal } from '../components/timetable/SlotEditModal';
import { TeacherTimetableView } from '../components/timetable/TeacherTimetableView';
import { RoomTimetableView } from '../components/timetable/RoomTimetableView';
import { MasterMatrixView } from '../components/timetable/MasterMatrixView';
import { ConflictInspector } from '../components/timetable/ConflictInspector';
import { PrintableTimetableCard } from '../components/timetable/PrintableTimetableCard';
import { AutoScheduleModal } from '../components/timetable/AutoScheduleModal';

export const TimetablePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'FORM_TEACHER';

  // Navigation State
  const [viewMode, setViewMode] = useState<ViewMode>('CLASS');
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');

  // Modals & Drawers State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState<boolean>(false);
  const [activeSlot, setActiveSlot] = useState<TimetableSlot | null>(null);
  const [modalInitialDay, setModalInitialDay] = useState<DayOfWeek>('MONDAY');
  const [modalInitialPeriod, setModalInitialPeriod] = useState<number>(1);
  const [isConflictInspectorOpen, setIsConflictInspectorOpen] = useState<boolean>(false);
  const [isAutoScheduleOpen, setIsAutoScheduleOpen] = useState<boolean>(false);

  // 1. Fetch Streams List
  const { data: streamsData, isLoading: isStreamsLoading } = useQuery({
    queryKey: ['academicStreams'],
    queryFn: async () => (await api.get('/academic/streams')).data,
  });

  const streams: Stream[] = streamsData?.streams || [];

  // Default to Basic 7A stream if not yet selected
  const currentStream =
    streams.find((s) => s.id === selectedStreamId) ||
    streams.find((s) => s.class?.code === 'B7' && s.name === 'A') ||
    streams[0];

  const currentStreamId = currentStream?.id || '';

  // 2. Fetch Subjects List
  const { data: subjectsData } = useQuery({
    queryKey: ['academicSubjects'],
    queryFn: async () => (await api.get('/academic/subjects')).data,
  });
  const subjects: Subject[] = subjectsData?.subjects || [];

  // 3. Fetch Staff / Teachers List
  const { data: staffData } = useQuery({
    queryKey: ['staffList'],
    queryFn: async () => (await api.get('/staff')).data,
  });
  const teachers: Teacher[] = staffData?.staff || [];

  // 4. Fetch All Timetable Slots
  const { data: allSlotsData, isLoading: isSlotsLoading, refetch: refetchSlots } = useQuery({
    queryKey: ['timetableAllSlots'],
    queryFn: async () => (await api.get('/timetable')).data,
  });
  const allSlots: TimetableSlot[] = allSlotsData?.slots || [];

  // Filter slots for current class stream
  const currentStreamSlots = allSlots.filter((s) => s.streamId === currentStreamId);

  // 5. Fetch Conflicts
  const { data: conflictsData, refetch: refetchConflicts } = useQuery({
    queryKey: ['timetableConflicts'],
    queryFn: async () => (await api.get('/timetable/conflicts')).data,
  });
  const conflicts: ConflictItem[] = conflictsData?.conflicts || [];
  const criticalConflictsCount = conflictsData?.criticalCount || 0;

  // 6. Fetch Teacher Workloads
  const { data: workloadsData } = useQuery({
    queryKey: ['teacherWorkloads'],
    queryFn: async () => (await api.get('/timetable/teacher-workload')).data,
  });
  const workloads: TeacherWorkload[] = workloadsData?.workloads || [];

  // 7. Fetch Rooms & Facility Utilization
  const { data: roomsData } = useQuery({
    queryKey: ['roomUtilizations'],
    queryFn: async () => (await api.get('/timetable/rooms')).data,
  });
  const rooms: RoomUtilization[] = roomsData?.rooms || [];

  // Mutation: Save / Update Slot
  const saveSlotMutation = useMutation({
    mutationFn: async (slotPayload: any) => {
      return (await api.post('/timetable/slot', slotPayload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetableAllSlots'] });
      queryClient.invalidateQueries({ queryKey: ['timetableConflicts'] });
      queryClient.invalidateQueries({ queryKey: ['teacherWorkloads'] });
      queryClient.invalidateQueries({ queryKey: ['roomUtilizations'] });
    },
  });

  // Mutation: Delete Slot
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      return (await api.delete(`/timetable/slot/${slotId}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetableAllSlots'] });
      queryClient.invalidateQueries({ queryKey: ['timetableConflicts'] });
      queryClient.invalidateQueries({ queryKey: ['teacherWorkloads'] });
      queryClient.invalidateQueries({ queryKey: ['roomUtilizations'] });
    },
  });

  // Mutation: Auto-Generate Timetable
  const autoGenerateMutation = useMutation({
    mutationFn: async ({ streamId, clearExisting }: { streamId: string; clearExisting: boolean }) => {
      return (await api.post('/timetable/auto-generate', { streamId, clearExisting })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetableAllSlots'] });
      queryClient.invalidateQueries({ queryKey: ['timetableConflicts'] });
      queryClient.invalidateQueries({ queryKey: ['teacherWorkloads'] });
      queryClient.invalidateQueries({ queryKey: ['roomUtilizations'] });
    },
  });

  // Mutation: Copy Timetable Template
  const copyTimetableMutation = useMutation({
    mutationFn: async ({
      sourceStreamId,
      targetStreamId,
      overrideExisting,
    }: {
      sourceStreamId: string;
      targetStreamId: string;
      overrideExisting: boolean;
    }) => {
      return (
        await api.post('/timetable/copy', {
          sourceStreamId,
          targetStreamId,
          overrideExisting,
        })
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetableAllSlots'] });
      queryClient.invalidateQueries({ queryKey: ['timetableConflicts'] });
      queryClient.invalidateQueries({ queryKey: ['teacherWorkloads'] });
    },
  });

  // Mutation: Clear Stream Timetable
  const clearStreamMutation = useMutation({
    mutationFn: async (streamId: string) => {
      return (await api.delete(`/timetable/stream/${streamId}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetableAllSlots'] });
      queryClient.invalidateQueries({ queryKey: ['timetableConflicts'] });
    },
  });

  // Handlers
  const handleOpenSlotModal = (day: DayOfWeek, period: number, existingSlot: TimetableSlot | null) => {
    setModalInitialDay(day);
    setModalInitialPeriod(period);
    setActiveSlot(existingSlot);
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = async (slotData: any) => {
    await saveSlotMutation.mutateAsync(slotData);
  };

  const handleDeleteSlot = async (slotId: string) => {
    await deleteSlotMutation.mutateAsync(slotId);
  };

  const handleDuplicateSlot = async (slot: TimetableSlot, targetDay: DayOfWeek) => {
    await saveSlotMutation.mutateAsync({
      streamId: slot.streamId,
      subjectId: slot.subjectId,
      teacherId: slot.teacherId,
      dayOfWeek: targetDay,
      period: slot.period,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room,
    });
  };

  const handleMasterSlotClick = (streamId: string, day: DayOfWeek, period: number, slot: TimetableSlot | null) => {
    setSelectedStreamId(streamId);
    setModalInitialDay(day);
    setModalInitialPeriod(period);
    setActiveSlot(slot);
    setIsSlotModalOpen(true);
  };

  const handleJumpToConflictSlot = (slotId: string) => {
    const foundSlot = allSlots.find((s) => s.id === slotId);
    if (foundSlot) {
      setSelectedStreamId(foundSlot.streamId);
      setActiveSlot(foundSlot);
      setModalInitialDay(foundSlot.dayOfWeek);
      setModalInitialPeriod(foundSlot.period);
      setIsSlotModalOpen(true);
    }
  };

  // If in Print Preview Mode
  if (viewMode === 'PRINT' && currentStream) {
    return (
      <PrintableTimetableCard
        stream={currentStream}
        slots={currentStreamSlots}
        onBack={() => setViewMode('CLASS')}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 font-bold">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Class Timetable & Master Schedule
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ghana Basic Education Weekly Period Matrix (KG 1 – Basic 9) • Conflict-Aware Grid
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Conflict Badge / Toggle */}
          <button
            onClick={() => setIsConflictInspectorOpen(!isConflictInspectorOpen)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 border shadow-xs ${
              criticalConflictsCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-300 hover:bg-amber-100'
                : conflicts.length > 0
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 text-sky-900 dark:text-sky-300 hover:bg-sky-100'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-300'
            }`}
          >
            {criticalConflictsCount > 0 ? (
              <ShieldAlert className="w-4 h-4 text-amber-600 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>
              {conflicts.length === 0
                ? '0 Conflicts'
                : `${conflicts.length} Notice${conflicts.length > 1 ? 's' : ''}`}
            </span>
          </button>

          {/* Builder Wizard Button (Admins only) */}
          {canEdit && currentStream && (
            <button
              onClick={() => setIsAutoScheduleOpen(true)}
              className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex items-center gap-1.5 shadow-xs"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Builder Tools</span>
            </button>
          )}

          {/* Print Official Sheet Button */}
          <button
            onClick={() => setViewMode('PRINT')}
            className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Official Timetable</span>
          </button>
        </div>
      </div>

      {/* 2. Conflict Inspector Banner / Drawer (when open or when critical conflicts exist) */}
      <ConflictInspector
        conflicts={conflicts}
        isOpen={isConflictInspectorOpen}
        onClose={() => setIsConflictInspectorOpen(false)}
        onSelectConflictSlot={handleJumpToConflictSlot}
      />

      {/* 3. Perspective Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setViewMode('CLASS')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              viewMode === 'CLASS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Class Timetable</span>
          </button>

          <button
            onClick={() => setViewMode('TEACHER')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              viewMode === 'TEACHER'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Teacher Schedule</span>
          </button>

          <button
            onClick={() => setViewMode('ROOM')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              viewMode === 'ROOM'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Facility / Lab Schedule</span>
          </button>

          <button
            onClick={() => setViewMode('MASTER')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              viewMode === 'MASTER'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>School Master Matrix</span>
          </button>
        </div>

        {/* Class Stream Selector (visible in CLASS view) */}
        {viewMode === 'CLASS' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={currentStreamId}
              onChange={(e) => setSelectedStreamId(e.target.value)}
              className="p-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
            >
              {streams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.class?.name} {s.name} ({s._count?.enrollments || 0} Pupils)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4. Stream Summary Ribbon (when in Class View) */}
      {viewMode === 'CLASS' && currentStream && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-black text-base flex items-center justify-center shrink-0">
              {currentStream.class?.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {currentStream.class?.name} {currentStream.name}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {currentStream.class?.level}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Form Teacher: <strong>{currentStream.formTeacher?.fullName || 'Not Assigned'}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Pupils: <strong>{currentStream._count?.enrollments || 0} Enrolled</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Period Coverage Metric */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Weekly Period Coverage
              </div>
              <div className="text-[11px] text-slate-500">
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {currentStreamSlots.length}
                </strong>{' '}
                of 40 Periods Assigned ({Math.round((currentStreamSlots.length / 40) * 100)}%)
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black text-xs text-emerald-700 dark:text-emerald-300">
              {Math.round((currentStreamSlots.length / 40) * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* 5. Active View Rendering */}
      {viewMode === 'CLASS' && (
        <TimetableGrid
          slots={currentStreamSlots}
          allSlots={allSlots}
          conflicts={conflicts}
          canEdit={canEdit}
          onSlotClick={handleOpenSlotModal}
          onDeleteSlot={handleDeleteSlot}
          onDuplicateSlot={handleDuplicateSlot}
          streamName={currentStream ? `${currentStream.class?.name} ${currentStream.name}` : undefined}
        />
      )}

      {viewMode === 'TEACHER' && (
        <TeacherTimetableView
          teachers={teachers}
          selectedTeacherId={selectedTeacherId || teachers[0]?.id || ''}
          onSelectTeacher={(tId) => setSelectedTeacherId(tId)}
          allSlots={allSlots}
          workloads={workloads}
          conflicts={conflicts}
          canEdit={canEdit}
          onSlotClick={(s) => {
            setSelectedStreamId(s.streamId);
            setActiveSlot(s);
            setModalInitialDay(s.dayOfWeek);
            setModalInitialPeriod(s.period);
            setIsSlotModalOpen(true);
          }}
        />
      )}

      {viewMode === 'ROOM' && (
        <RoomTimetableView
          rooms={rooms}
          selectedRoom={selectedRoom || rooms[0]?.name || 'Science Lab 1'}
          onSelectRoom={(rName) => setSelectedRoom(rName)}
          allSlots={allSlots}
          conflicts={conflicts}
          canEdit={canEdit}
          onSlotClick={(s) => {
            setSelectedStreamId(s.streamId);
            setActiveSlot(s);
            setModalInitialDay(s.dayOfWeek);
            setModalInitialPeriod(s.period);
            setIsSlotModalOpen(true);
          }}
        />
      )}

      {viewMode === 'MASTER' && (
        <MasterMatrixView
          streams={streams}
          allSlots={allSlots}
          conflicts={conflicts}
          canEdit={canEdit}
          onSlotClick={handleMasterSlotClick}
        />
      )}

      {/* 6. Slot Edit / Assign Modal */}
      {isSlotModalOpen && (
        <SlotEditModal
          isOpen={isSlotModalOpen}
          onClose={() => {
            setIsSlotModalOpen(false);
            setActiveSlot(null);
          }}
          slot={activeSlot}
          streamId={currentStreamId}
          streamName={currentStream ? `${currentStream.class?.name} ${currentStream.name}` : undefined}
          initialDay={modalInitialDay}
          initialPeriod={modalInitialPeriod}
          subjects={subjects}
          teachers={teachers}
          allSlots={allSlots}
          onSave={handleSaveSlot}
          onDelete={handleDeleteSlot}
          canEdit={canEdit}
        />
      )}

      {/* 7. Auto-Scheduler & Template Modal */}
      {isAutoScheduleOpen && currentStream && (
        <AutoScheduleModal
          isOpen={isAutoScheduleOpen}
          onClose={() => setIsAutoScheduleOpen(false)}
          targetStream={currentStream}
          allStreams={streams}
          onAutoGenerate={async (sId, clear) => {
            await autoGenerateMutation.mutateAsync({ streamId: sId, clearExisting: clear });
          }}
          onCopyFromStream={async (srcId, tgtId, override) => {
            await copyTimetableMutation.mutateAsync({
              sourceStreamId: srcId,
              targetStreamId: tgtId,
              overrideExisting: override,
            });
          }}
          onClearStream={async (sId) => {
            await clearStreamMutation.mutateAsync(sId);
          }}
        />
      )}
    </div>
  );
};
