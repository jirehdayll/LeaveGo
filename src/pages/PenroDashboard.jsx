import React, { useEffect, useState, useCallback } from 'react';
import { REQUEST_STATUS, REQUEST_TYPES } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { leaveRequestsAPI } from '../api/leaveRequests';
import { emailService } from '../services/emailService';
import { supabase } from '../lib/supabaseClient';
import {
  Clock, CheckCircle2, FileText, TrendingUp,
  Eye, Check, X, Calendar, Mail, Search,
  XCircle, AlertTriangle, Info, User, CheckCheck, Filter
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import ConfirmationModal from '../components/ConfirmationModal';

function ViewLeaveModal({ request, onClose, onApprove, onDecline, user }) {
  if (!request) return null;

  const d = request.details || {};
  const isPenroApproved = Boolean(request.penro_approved || d.penro_approved);
  const isFullyApproved = request.status === REQUEST_STATUS.APPROVED;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 min-h-screen">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col my-4 animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className="px-7 py-5 bg-gradient-to-r from-[#1a3530] via-[#244b44] to-[#122824] text-white flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                PENRO Review
              </span>
              <p className="text-white/70 text-xs font-semibold">Leave Application Details</p>
            </div>
            <h3 className="text-xl font-black text-white mt-1">{request.user_name || request.user_email}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-7 space-y-4">
          {/* Approval Workflow Banner */}
          <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5">Approval Workflow Status</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                isPenroApproved
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                {isPenroApproved ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                )}
                <div>
                  <p className="text-xs font-bold">1. PENRO Endorsement</p>
                  <p className="text-xs font-medium opacity-90">
                    {isPenroApproved
                      ? `Approved by ${d.penro_approved_by || 'PENRO'}`
                      : 'Pending Your Approval'}
                  </p>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                isFullyApproved
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                {isFullyApproved ? (
                  <CheckCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                )}
                <div>
                  <p className="text-xs font-bold">2. Admin Final Approval</p>
                  <p className="text-xs font-medium opacity-90">
                    {isFullyApproved ? 'Fully Approved & Processed' : 'Awaiting PENRO Endorsement First'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Applicant Info */}
          <div className="bg-slate-50 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><p className="text-xs text-slate-400">Applicant Name</p><p className="text-sm font-semibold text-slate-800">{request.user_name || '—'}</p></div>
            <div><p className="text-xs text-slate-400">Email Address</p><p className="text-sm font-semibold text-slate-800">{request.user_email || '—'}</p></div>
            <div><p className="text-xs text-slate-400">Department</p><p className="text-sm font-semibold text-slate-800">{d.office_department || request.department || '—'}</p></div>
            <div><p className="text-xs text-slate-400">Position</p><p className="text-sm font-semibold text-slate-800">{d.position || '—'}</p></div>
            <div><p className="text-xs text-slate-400">Date Filed</p><p className="text-sm font-semibold text-slate-800">{new Date(request.submitted_at || request.created_at).toLocaleDateString('en-PH')}</p></div>
            <div>
              <p className="text-xs text-slate-400">Overall Status</p>
              <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                request.status === REQUEST_STATUS.PENDING ? 'bg-amber-100 text-amber-800' :
                request.status === REQUEST_STATUS.APPROVED ? 'bg-emerald-100 text-emerald-800' :
                'bg-red-100 text-red-800'
              }`}>{request.status}</span>
            </div>
          </div>

          {/* Leave Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h4 className="font-bold text-slate-800 text-sm">Leave Application Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><p className="text-xs text-slate-400">Leave Type</p><p className="text-sm font-semibold text-slate-800">{d.leave_type || '—'}</p></div>
              <div><p className="text-xs text-slate-400">Working Days Applied</p><p className="text-sm font-semibold text-slate-800">{d.num_days || d.number_of_days || '—'} day(s)</p></div>
              <div><p className="text-xs text-slate-400">Start Date</p><p className="text-sm font-medium text-slate-800">{d.start_date || '—'}</p></div>
              <div><p className="text-xs text-slate-400">End Date</p><p className="text-sm font-medium text-slate-800">{d.end_date || '—'}</p></div>
            </div>
            {d.details_of_leave && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-400">Details of Leave / Specific Purpose</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5 whitespace-pre-wrap">{d.details_of_leave}</p>
              </div>
            )}
            {d.commutation && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-400">Commutation</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{d.commutation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-7 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-sm transition-all"
          >
            Close
          </button>
          {!isPenroApproved && request.status === REQUEST_STATUS.PENDING && (
            <>
              <button
                onClick={() => {
                  onClose();
                  onDecline(request);
                }}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-sm transition-all flex items-center gap-1.5"
              >
                <X className="w-4 h-4" /> Decline
              </button>
              <button
                onClick={() => {
                  onClose();
                  onApprove(request);
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-700/20"
              >
                <Check className="w-4 h-4" /> Approve Leave
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
      <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
        {Icon && <Icon className={`w-6 h-6 ${color}`} />}
      </div>
      <div>
        <p className="text-2xl font-black text-slate-800">{value ?? '0'}</p>
        <p className="text-xs font-medium text-slate-500 mt-0.5 leading-tight">{label}</p>
      </div>
    </div>
  );
}

export default function PenroDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [filterTab, setFilterTab] = useState('pending_penro'); // 'pending_penro' | 'approved_penro' | 'all'
  const [searchTerm, setSearchTerm] = useState('');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: null,
    isLoading: false,
    showCommentInput: false
  });
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const now = new Date();
  const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][now.getMonth()];
  const year = now.getFullYear();

  // Fetch only LEAVE forms (No travel forms)
  const fetchLeaveRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const { data, error } = await leaveRequestsAPI.getAll({
        is_archived: false,
        request_type: REQUEST_TYPES.LEAVE
      });

      if (error) {
        console.error('Error fetching leave requests for PENRO:', error);
        setRequests([]);
      } else {
        // Enforce strictly Leave forms only
        const leaveOnly = (data || []).filter(r => r.request_type === REQUEST_TYPES.LEAVE);
        setRequests(leaveOnly);
      }
    } catch (err) {
      console.error('Error in fetchLeaveRequests:', err);
      setRequests([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaveRequests();

    // Subscribe to real-time updates for leave requests
    const channel = supabase
      .channel('penro-leave-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leave_requests'
        },
        () => {
          fetchLeaveRequests(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaveRequests]);

  // Handle PENRO Approval
  const handlePenroApprove = (req) => {
    setConfirmModal({
      isOpen: true,
      type: 'success',
      title: 'Approve Leave Application',
      message: `Are you sure you want to approve and endorse this Leave Application from ${req.user_name}? Once approved, it will be forwarded to the Administrator for final processing and leave balance deduction.`,
      confirmText: 'Approve & Forward to Admin',
      isLoading: false,
      showCommentInput: false,
      onConfirm: async () => {
        try {
          setActionLoading(true);
          const updatedDetails = {
            ...(req.details || {}),
            penro_approved: true,
            penro_approved_at: new Date().toISOString(),
            penro_approved_by: user?.email || 'PENRO Officer'
          };

          const { error } = await leaveRequestsAPI.update(req.id, {
            details: updatedDetails
          });

          if (error) throw error;

          showToast('Leave application approved! Forwarded to Admin for final approval.', 'success');
          fetchLeaveRequests(true);
        } catch (err) {
          console.error('Error during PENRO approval:', err);
          showToast(err.message || 'Failed to approve leave application.', 'danger');
        } finally {
          setActionLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Handle PENRO Decline
  const handlePenroDecline = (req) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Decline Leave Application',
      message: `Are you sure you want to decline this Leave Application from ${req.user_name}? This action will archive the application and notify the applicant.`,
      confirmText: 'Decline Leave',
      isLoading: false,
      showCommentInput: true,
      onConfirm: async (payload) => {
        try {
          setActionLoading(true);
          const comment = payload?.comment || '';
          const updatedDetails = {
            ...(req.details || {}),
            penro_declined: true,
            penro_declined_at: new Date().toISOString(),
            penro_declined_by: user?.email || 'PENRO Officer',
            admin_comment: comment
          };

          await leaveRequestsAPI.update(req.id, {
            status: REQUEST_STATUS.DECLINED,
            is_archived: true,
            details: updatedDetails
          });

          try {
            await emailService.sendDeclineNotification(
              { ...req, details: updatedDetails },
              comment
            );
          } catch (e) {
            console.warn('Decline email failed:', e);
          }

          showToast('Leave application declined and moved to archive.', 'danger');
          fetchLeaveRequests(true);
        } catch (err) {
          console.error('Error declining leave application:', err);
          showToast(err.message || 'Failed to decline leave application.', 'danger');
        } finally {
          setActionLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Calculations for stats
  const allLeaves = requests.filter(r => r.request_type === REQUEST_TYPES.LEAVE);
  
  // Pending leaves that still require PENRO approval
  const awaitingPenro = allLeaves.filter(
    (r) => r.status === REQUEST_STATUS.PENDING && !Boolean(r.penro_approved || r.details?.penro_approved)
  );

  // Pending leaves that PENRO has endorsed, waiting for Admin
  const penroApprovedAwaitingAdmin = allLeaves.filter(
    (r) => r.status === REQUEST_STATUS.PENDING && Boolean(r.penro_approved || r.details?.penro_approved)
  );

  const unseenLeaves = awaitingPenro.filter((r) => !r.seen_by_admin).length;

  const monthStart = new Date(year, now.getMonth(), 1).toISOString();
  const approvedThisMonth = allLeaves.filter((r) => {
    const d = new Date(r.submitted_at || r.created_at);
    return r.status === REQUEST_STATUS.APPROVED && d >= new Date(monthStart);
  }).length;

  const totalApprovedAllTime = allLeaves.filter((r) => r.status === REQUEST_STATUS.APPROVED).length;

  const stats = [
    { icon: Clock, label: 'Awaiting PENRO Review', value: awaitingPenro.length, color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: AlertTriangle, label: 'Unseen Leaves', value: unseenLeaves, color: 'text-rose-600', bg: 'bg-rose-50' },
    { icon: CheckCircle2, label: 'PENRO Endorsed (To Admin)', value: penroApprovedAwaitingAdmin.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { icon: FileText, label: 'Approved (This Month)', value: approvedThisMonth, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: TrendingUp, label: 'Total Approved All-Time', value: totalApprovedAllTime, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  // Filter table data based on active tab & search
  let displayedRequests = [];
  if (filterTab === 'pending_penro') {
    displayedRequests = awaitingPenro;
  } else if (filterTab === 'approved_penro') {
    displayedRequests = penroApprovedAwaitingAdmin;
  } else {
    displayedRequests = allLeaves.filter(r => r.status === REQUEST_STATUS.PENDING);
  }

  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase();
    displayedRequests = displayedRequests.filter(
      (r) =>
        (r.user_name || '').toLowerCase().includes(q) ||
        (r.user_email || '').toLowerCase().includes(q) ||
        (r.details?.leave_type || '').toLowerCase().includes(q) ||
        (r.details?.office_department || '').toLowerCase().includes(q)
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8 fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                PENRO Executive
              </span>
              <p className="text-slate-500 text-xs font-semibold">Leave Governance &amp; Endorsement</p>
            </div>
            <h2 className="text-2xl font-black text-slate-800">PENRO Dashboard</h2>
            <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              {monthName} {year} · Exclusively for Leave Applications
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Main Applications Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '580px' }}>
          {/* Card Topbar: Tabs and Search */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Leave Applications</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {displayedRequests.length} leave application{displayedRequests.length !== 1 ? 's' : ''} listed in this view
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilterTab('pending_penro')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterTab === 'pending_penro'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Awaiting Review ({awaitingPenro.length})
              </button>

              <button
                onClick={() => setFilterTab('approved_penro')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterTab === 'approved_penro'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                PENRO Approved ({penroApprovedAwaitingAdmin.length})
              </button>

              <button
                onClick={() => setFilterTab('all')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterTab === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                All Pending ({awaitingPenro.length + penroApprovedAwaitingAdmin.length})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-100">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search applicant, leave type, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-20 flex-1">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : displayedRequests.length === 0 ? (
            <div className="py-20 text-center flex-1">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-slate-600 font-bold">No applications in this view</p>
              <p className="text-slate-400 text-xs mt-1">
                {filterTab === 'pending_penro'
                  ? 'Great job! No pending leave applications waiting for PENRO review.'
                  : 'No records matching the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3">Applicant</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Leave Type &amp; Duration</th>
                    <th className="px-6 py-3">Submitted</th>
                    <th className="px-6 py-3">PENRO Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {displayedRequests.map((req) => {
                    const isPenroApproved = Boolean(req.penro_approved || req.details?.penro_approved);
                    const d = req.details || {};

                    return (
                      <tr
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        {/* Applicant */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{req.user_name || 'Unknown'}</p>
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {req.user_email || '—'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">
                          {d.office_department || req.department || '—'}
                        </td>

                        {/* Leave Details */}
                        <td className="px-6 py-4 text-xs max-w-[220px]">
                          <p className="font-semibold text-slate-800 truncate">{d.leave_type || 'Leave'}</p>
                          <p className="text-slate-500 mt-0.5">
                            {d.num_days || d.number_of_days || '1'} day(s) · {d.start_date || '—'} to {d.end_date || '—'}
                          </p>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(req.submitted_at || req.created_at).toLocaleDateString('en-PH')}
                        </td>

                        {/* PENRO Status */}
                        <td className="px-6 py-4">
                          {isPenroApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Approved by PENRO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Awaiting PENRO
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {!isPenroApproved && (
                              <>
                                <button
                                  onClick={() => handlePenroApprove(req)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all"
                                  title="Approve Leave"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => handlePenroDecline(req)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-all"
                                  title="Decline Leave"
                                >
                                  <X className="w-3.5 h-3.5" /> Decline
                                </button>
                              </>
                            )}

                            {isPenroApproved && (
                              <span className="text-xs font-semibold text-slate-400 italic">
                                Forwarded to Admin
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {selectedRequest && (
        <ViewLeaveModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handlePenroApprove}
          onDecline={handlePenroDecline}
          user={user}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        isLoading={actionLoading}
        showCommentInput={confirmModal.showCommentInput}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((t) => {
          let bgClass = 'bg-white border-slate-100 text-slate-800';
          let icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
          if (t.type === 'success') {
            bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-900';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
          } else if (t.type === 'danger') {
            bgClass = 'bg-rose-50 border-rose-200 text-rose-900';
            icon = <XCircle className="w-5 h-5 text-rose-600" />;
          }

          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl transition-all duration-300 animate-slide-in-right ${bgClass}`}
            >
              <div className="flex-shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1 text-sm font-semibold leading-tight">{t.message}</div>
              <button
                onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
                className="text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
