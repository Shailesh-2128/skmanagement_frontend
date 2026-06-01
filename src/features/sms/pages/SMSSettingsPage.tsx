import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import smsApi, { SMSSettingsData } from '../../../api/sms.api';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Loader from '../../../components/ui/Loader';
import { Sliders, BellRing, CheckCircle, AlertTriangle, Save, Smartphone } from 'lucide-react';

export const SMSSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [alertPhone, setAlertPhone] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<SMSSettingsData>({
    queryKey: ['smsSettings'],
    queryFn: smsApi.getSettings
  });

  // Sync state when data is loaded
  useEffect(() => {
    if (settings) {
      setAlertPhone(settings.alert_phone || '');
      setIsEnabled(settings.is_enabled);
    }
  }, [settings]);

  // Mutation to update settings
  const updateSettingsMutation = useMutation({
    mutationFn: smsApi.updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['smsSettings'], data);
      setSuccessMessage('SMS Notification settings updated successfully!');
      setErrorMessage('');
      // Auto-clear message after 4s
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || 'Failed to update SMS settings.');
      setSuccessMessage('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    // Quick regex validation if phone is entered
    if (alertPhone.trim() && !/^\+?[0-9]{10,15}$/.test(alertPhone.replace(/\s+/g, ''))) {
      setErrorMessage('Please enter a valid phone number (10 to 15 digits, digits only or with country code).');
      return;
    }

    updateSettingsMutation.mutate({
      alert_phone: alertPhone.trim(),
      is_enabled: isEnabled,
    });
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <Sliders className="h-6 w-6 text-blue-600" />
          SMS Configuration
        </h2>
        <p className="text-slate-500 mt-1">
          Configure the phone numbers and toggles for automated system alerts and transactions.
        </p>
      </div>

      <div className="max-w-xl bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Notification Routing
            </span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
            isEnabled 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {isEnabled ? 'NOTIFICATIONS ACTIVE' : 'MUTED'}
          </span>
        </div>

        {/* Card Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-start gap-2.5 shadow-sm">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Success</p>
                <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-start gap-2.5 shadow-sm">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Configuration Error</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Phone Number Field */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Smartphone className="h-4.5 w-4.5 text-slate-400" />
              <label className="text-sm font-semibold text-slate-700">Alert Recipient Phone Number</label>
            </div>
            <Input
              type="text"
              required
              value={alertPhone}
              onChange={(e) => setAlertPhone(e.target.value)}
              placeholder="e.g. +919876543210"
              className="text-base"
            />
            <p className="text-xs text-slate-400">
              This phone number will receive transactional notifications, reports, and administrative alerts. Format: including country code (e.g. +91 for India).
            </p>
          </div>

          {/* Toggle Block */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <p className="text-sm font-bold text-slate-800">Enable Alert Dispatching</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle whether the system is authorized to send alerts to the recipient above.
              </p>
            </div>

            {/* Styled Switch Toggle */}
            <button
              type="button"
              onClick={() => setIsEnabled(!isEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isEnabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              isLoading={updateSettingsMutation.isPending}
              className="flex items-center gap-2 cursor-pointer shadow-md hover:scale-[1.01] transition duration-150"
            >
              <Save className="h-4 w-4" />
              <span>Save Configuration</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SMSSettingsPage;
