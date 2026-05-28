import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supportApi, { SupportTicketData } from '../../../api/support.api';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Loader from '../../../components/ui/Loader';
import { HelpCircle, Plus, ClipboardList, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export const SupportPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Fetch Tickets
  const { data: tickets, isLoading } = useQuery<SupportTicketData[]>({
    queryKey: ['supportTickets'],
    queryFn: supportApi.listTickets
  });

  // Create Ticket Mutation
  const createTicketMutation = useMutation({
    mutationFn: supportApi.createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      handleClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail || 'Failed to submit issue.');
    }
  });

  const handleOpen = () => {
    setTitle('');
    setDescription('');
    setError('');
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Both title and description are required.');
      return;
    }
    createTicketMutation.mutate({ title, description });
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-blue-600" />
            Support Center
          </h2>
          <p className="text-slate-500 mt-1">Submit technical issues or bugs to the SaaS administrator.</p>
        </div>
        <Button onClick={handleOpen} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Report an Issue</span>
        </Button>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <ClipboardList className="h-4.5 w-4.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Submitted Tickets ({tickets?.length ?? 0})
          </span>
        </div>

        {tickets?.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <HelpCircle className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-500">No issues reported yet.</p>
            <p className="text-xs text-slate-400 mt-1">Everything looks good! Click "Report an Issue" if you encounter any bugs.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
            {tickets?.map((t) => (
              <div key={t.id} className="p-6 hover:bg-slate-50/50 transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-extrabold text-slate-800 text-base">{t.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                      t.status === 'RESOLVED' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {t.status === 'RESOLVED' ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          <span>RESOLVED</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 animate-pulse" />
                          <span>OPEN</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{t.description}</p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Reported by {t.username} on {new Date(t.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={handleClose} title="Report Technical Issue / Bug">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Issue Title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Jodi grid layout glitch on mobile"
          />

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">Detailed Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please describe the steps to reproduce the issue, and what screen it occurred on."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createTicketMutation.isPending}>
              Submit Issue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SupportPage;
