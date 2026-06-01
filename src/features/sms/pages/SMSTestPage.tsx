import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import smsApi, { SMSSettingsData } from '../../../api/sms.api';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Loader from '../../../components/ui/Loader';
import { MessageSquare, Send, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const SMSTestPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('Hello, this is a test message from skStorePulse!');
  const [testResult, setTestResult] = useState<{ success: boolean; data?: any; error?: string } | null>(null);

  // Load configured setting to pre-fill test phone number
  const { data: settings, isLoading } = useQuery<SMSSettingsData>({
    queryKey: ['smsSettings'],
    queryFn: smsApi.getSettings
  });

  useEffect(() => {
    if (settings?.alert_phone) {
      setPhone(settings.alert_phone);
    }
  }, [settings]);

  // Mutation to send test SMS
  const sendTestMutation = useMutation({
    mutationFn: ({ phone, message }: { phone: string; message: string }) => 
      smsApi.sendTestSMS(phone, message),
    onSuccess: (data) => {
      setTestResult({
        success: data.success !== false, // Assume true if not explicitly false
        data: data,
        error: data.error
      });
    },
    onError: (err: any) => {
      setTestResult({
        success: false,
        error: err?.response?.data?.detail || err?.message || 'Network request failed.'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);

    if (!phone.trim() || !message.trim()) {
      setTestResult({
        success: false,
        error: 'Both Phone Number and Message are required for testing.'
      });
      return;
    }

    sendTestMutation.mutate({ phone: phone.trim(), message: message.trim() });
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          SMS Test Console
        </h2>
        <p className="text-slate-500 mt-1">
          Verify your SMS gateway API credentials and endpoint connectivity by sending a manual test message.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Form Column */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Send className="h-4.5 w-4.5 text-blue-600" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Send Test Payload
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <Input
              label="Recipient Phone Number"
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +919876543210"
              disabled={sendTestMutation.isPending}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Test Message Content</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="Write your SMS text here..."
                disabled={sendTestMutation.isPending}
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                isLoading={sendTestMutation.isPending}
                className="flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Send className="h-4 w-4" />
                <span>Dispatch Test SMS</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Result Column */}
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 min-h-[300px] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">
                API Response Logs
              </h3>

              {!testResult && !sendTestMutation.isPending && (
                <div className="text-center py-12 text-slate-400">
                  <RefreshCw className="h-8 w-8 mx-auto text-slate-300 mb-2 animate-spin-slow" />
                  <p className="font-medium text-xs">Waiting for dispatch trigger...</p>
                  <p className="text-[10px] mt-0.5">Submit the form on the left to see logs.</p>
                </div>
              )}

              {sendTestMutation.isPending && (
                <div className="text-center py-12 text-blue-600">
                  <svg className="animate-spin h-8 w-8 mx-auto text-blue-500 mb-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="font-semibold text-xs">Sending HTTP request...</p>
                </div>
              )}

              {testResult && (
                <div className="space-y-4">
                  {testResult.success ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 flex items-start gap-2.5 shadow-sm">
                      <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm">Dispatched Successfully</p>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          The SMS Gateway received the request without reporting errors.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 flex items-start gap-2.5 shadow-sm">
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm">Dispatch Failed</p>
                        <p className="text-xs text-red-700 mt-0.5">
                          {testResult.error || 'The SMS gateway returned an error response.'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">
                      Raw JSON Response
                    </span>
                    <pre className="bg-[#1e293b] text-[#f8fafc] p-4 rounded-xl text-xs font-mono overflow-auto max-h-[180px] border border-slate-800 shadow-inner">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 border-t border-slate-200/60 pt-4 mt-6">
              Gateway endpoint used: <span className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-600 font-semibold break-all">SMS_API env variable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSTestPage;
