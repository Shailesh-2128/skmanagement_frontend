import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import smsApi, { SMSSettingsData } from '../../../api/sms.api';
import groupsApi from '../../../api/groups.api';
import Button from '../../../components/ui/Button';
import Loader from '../../../components/ui/Loader';
import Select from '../../../components/ui/Select';
import { Bell, Clock, CheckCircle2, AlertTriangle, Save, CalendarDays, FolderGit2 } from 'lucide-react';


export const SMSNotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [dailyReportEnabled, setDailyReportEnabled] = useState(true);
  const [dailyReportTime, setDailyReportTime] = useState('12:00');
  const [dailyReportGroup, setDailyReportGroup] = useState('overall');
  const [inAppNotificationsEnabled, setInAppNotificationsEnabled] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');



  // Fetch settings
  const { data: settings, isLoading: isSettingsLoading } = useQuery<SMSSettingsData>({
    queryKey: ['smsSettings'],
    queryFn: smsApi.getSettings
  });

  // Fetch groups for the dropdown menu
  const { data: groups, isLoading: isGroupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.list
  });

  const isLoading = isSettingsLoading || isGroupsLoading;


  // Sync state
  useEffect(() => {
    if (settings) {
      setDailyReportEnabled(settings.daily_report_enabled ?? true);
      setInAppNotificationsEnabled(settings.in_app_notifications_enabled ?? true);
      setDailyReportGroup(settings.daily_report_group ? String(settings.daily_report_group) : 'overall');
      // Backend returns "HH:MM:SS", format to "HH:MM" for <input type="time" />
      const timeStr = settings.daily_report_time;
      if (timeStr) {
        setDailyReportTime(timeStr.substring(0, 5));
      } else {
        setDailyReportTime('12:00');
      }
    }
  }, [settings]);



  // Mutation to update settings
  const updateNotificationsMutation = useMutation({
    mutationFn: smsApi.updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['smsSettings'], data);
      setSuccessMsg('Daily alert configuration updated successfully!');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.detail || 'Failed to update alert configuration.');
      setSuccessMsg('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!dailyReportTime) {
      setErrorMsg('Please select a valid notification time.');
      return;
    }

    updateNotificationsMutation.mutate({
      daily_report_enabled: dailyReportEnabled,
      daily_report_time: dailyReportTime + ':00', // Append seconds for django TimeField
      in_app_notifications_enabled: inAppNotificationsEnabled,
      daily_report_group: dailyReportGroup === 'overall' ? null : Number(dailyReportGroup),
    });
  };



  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <Bell className="h-6 w-6 text-blue-600 animate-bounce-slow" />
          Notification Settings
        </h2>
        <p className="text-slate-500 mt-1">
          Manage automated alert delivery times and parameters. Configure when to receive reports.
        </p>
      </div>

      <div className="max-w-xl bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4.5 w-4.5 text-blue-600" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Daily Report Scheduling
            </span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
            dailyReportEnabled 
              ? 'bg-blue-50 text-blue-700 border-blue-100' 
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {dailyReportEnabled ? 'ENABLED' : 'DISABLED'}
          </span>
        </div>

        {/* Card Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-start gap-2.5 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Settings Saved</p>
                <p className="text-xs text-emerald-700 mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-start gap-2.5 shadow-sm">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Update Failed</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Group Select Dropdown */}
          <div className="space-y-1.5 p-4 border border-slate-100 rounded-xl bg-slate-50/30">
            <div className="flex items-center gap-1.5 mb-1">
              <FolderGit2 className="h-4.5 w-4.5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Target Group for Daily SMS</span>
            </div>
            <Select
              value={dailyReportGroup}
              onChange={(e) => setDailyReportGroup(e.target.value)}
              options={[
                { value: 'overall', label: 'Overall (All Groups Summary)' },
                ...(groups?.map((g) => ({ value: g.id, label: g.name })) || [])
              ]}
            />
            <p className="text-xs text-slate-400 mt-1">
              Choose whether to receive the global sum summary across all store groups, or a detailed breakdown (Sales, Wins, Commissions, MP, Spending, Profit/Loss) for a specific group.
            </p>
          </div>

          {/* Toggle Block */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <p className="text-sm font-bold text-slate-800">Daily SMS Summary Report</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically receive an SMS summary of sales, wins, and profit/loss.
              </p>
            </div>

            {/* Custom Toggle switch */}
            <button
              type="button"
              onClick={() => setDailyReportEnabled(!dailyReportEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                dailyReportEnabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  dailyReportEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {/* In-App Notifications Toggle Block */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <p className="text-sm font-bold text-slate-800">In-App Notification Center</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Receive alert notices (Daily PDF reports, cutting overlimits) in your web header bell menu.
              </p>
            </div>

            {/* Custom Toggle switch */}
            <button
              type="button"
              onClick={() => setInAppNotificationsEnabled(!inAppNotificationsEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                inAppNotificationsEnabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  inAppNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>


          {/* Time Picker Block */}
          {dailyReportEnabled && (
            <div className="space-y-2 p-4 border border-slate-100 rounded-xl bg-slate-50/30 transition duration-200">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="h-4.5 w-4.5 text-slate-400" />
                <label className="text-sm font-semibold text-slate-700">Dispatch Time (24h Format)</label>
              </div>
              <div className="relative max-w-[150px]">
                <input
                  type="time"
                  required
                  value={dailyReportTime}
                  onChange={(e) => setDailyReportTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
              <p className="text-xs text-slate-400">
                Configure the time of day when the system executes and dispatches the statistics summary.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              isLoading={updateNotificationsMutation.isPending}
              className="flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="h-4 w-4" />
              <span>Save Alert Schedule</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SMSNotificationsPage;
