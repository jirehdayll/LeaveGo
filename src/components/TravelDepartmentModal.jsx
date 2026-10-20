import React, { useState, useEffect } from 'react';
import { X, Download, Building, FileSpreadsheet, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getAllDepartments } from '../utils/departmentsPositions';

export default function TravelDepartmentModal({
  isOpen,
  onClose,
  downloadType = 'excel',
  pendingTravelForms = [],
  onConfirm,
  loading = false,
}) {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [error, setError] = useState('');

  // Load all departments (standard + custom from account management)
  useEffect(() => {
    const loadDepts = () => {
      const all = getAllDepartments();
      setDepartments(all);
    };

    if (isOpen) {
      loadDepts();
      setSelectedDept('');
      setError('');
    }

    window.addEventListener('departmentsUpdated', loadDepts);
    return () => window.removeEventListener('departmentsUpdated', loadDepts);
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper to extract department from form
  const getFormDept = (req) => {
    return (
      req.details?.office_department ||
      req.department ||
      req.details?.department ||
      ''
    ).trim();
  };

  // Count matching forms for the currently selected department
  const getMatchingCount = (dept) => {
    if (!dept) return 0;
    if (dept === 'ALL') return pendingTravelForms.length;
    return pendingTravelForms.filter(
      (r) => getFormDept(r).toLowerCase() === dept.trim().toLowerCase()
    ).length;
  };

  const currentMatchCount = selectedDept ? getMatchingCount(selectedDept) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedDept) {
      setError('Please select a department from the dropdown.');
      return;
    }

    if (currentMatchCount === 0) {
      setError(`No pending travel orders found for "${selectedDept}". Please select another department.`);
      return;
    }

    onConfirm(selectedDept);
  };

  const isExcel = downloadType === 'excel';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className={`px-6 py-5 flex items-center justify-between text-white ${
          isExcel
            ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
            : 'bg-gradient-to-r from-blue-600 to-indigo-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              {isExcel ? <FileSpreadsheet className="w-5 h-5 text-white" /> : <FileText className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="text-lg font-black leading-tight">Travel Order Summary</h3>
              <p className="text-xs text-white/80">Select department for {isExcel ? 'Excel (.xlsx)' : 'PDF (.pdf)'} export</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-600" />
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white transition-all shadow-sm"
              required
            >
              <option value="">-- Choose a Department --</option>
              <option value="ALL">All Departments ({pendingTravelForms.length} requests)</option>
              {departments.map((dept) => {
                const count = getMatchingCount(dept);
                return (
                  <option key={dept} value={dept}>
                    {dept} ({count} pending)
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-slate-400 mt-1.5">
              Includes all default departments and any custom departments added in Account Management.
            </p>
          </div>

          {/* Department Count Status Box */}
          {selectedDept && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              currentMatchCount > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {currentMatchCount > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {currentMatchCount > 0
                    ? `${currentMatchCount} travel order application${currentMatchCount !== 1 ? 's' : ''} found.`
                    : 'No pending travel orders found for this department.'}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {currentMatchCount > 0
                    ? `Only travel orders for ${selectedDept === 'ALL' ? 'all departments' : selectedDept} will be included in the ${isExcel ? 'Excel sheet' : 'PDF report'}.`
                    : 'You can still download an empty report or select another department.'}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedDept}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isExcel
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {loading ? 'Generating...' : `Download ${isExcel ? 'Excel' : 'PDF'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
