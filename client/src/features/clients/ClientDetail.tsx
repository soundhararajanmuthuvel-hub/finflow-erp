import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  User,
  ArrowLeft,
  ArrowRight,
  PlusCircle,
  Edit2,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Briefcase,
} from 'lucide-react';
import apiClient from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import {
  AccessibleButton,
  AccessibleInput,
  AccessibleSelect,
  AccessibleCard,
} from '../../components/common/AccessibleComponents';
import { formatCurrency } from '../../utils/formatters';

export const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [city, setCity] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const { data: client, isLoading, refetch } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const res: any = await apiClient.get(`/clients/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const updateClientMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await apiClient.patch(`/clients/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      setIsEditModalOpen(false);
      refetch();
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async () => {
      const res: any = await apiClient.delete(`/clients/${id}`);
      return res.data;
    },
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      navigate('/clients');
    },
  });

  const handleOpenEdit = () => {
    if (!client) return;
    setFullName(client.fullName || '');
    setBusinessName(client.businessName || '');
    setPhone(client.phone || '');
    setEmail(client.email || '');
    setPan(client.pan || '');
    setCity(client.city || '');
    setBusinessType(client.businessType || '');
    setStatus(client.status || 'ACTIVE');
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateClientMutation.mutate({
      fullName,
      businessName,
      phone,
      email,
      pan,
      city,
      businessType,
      status,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="h-14 w-14 border-4 border-[#8B1A1A]/20 border-t-[#8B1A1A] rounded-full animate-spin mb-4" />
        <p className="text-xl font-bold text-[#1A1A1A]">Loading client profile...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-16 text-xl font-bold text-[#52525B]">
        Client record not found
      </div>
    );
  }

  const summary = client.summary || {
    totalFinanceReceived: 0,
    totalInterestPayable: 0,
    totalRepaid: 0,
    outstandingAmount: 0,
    overdueAmount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => navigate('/clients')}
          className="inline-flex items-center gap-1.5 text-base font-bold text-[#8B1A1A] hover:underline"
        >
          <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
          <span>Back to Client Directory</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <AccessibleButton
            variant="outline"
            size="normal"
            icon={Edit2}
            onClick={handleOpenEdit}
          >
            Edit Profile
          </AccessibleButton>
          <AccessibleButton
            variant="danger"
            size="normal"
            icon={Trash2}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete
          </AccessibleButton>
          <AccessibleButton
            variant="primary"
            size="normal"
            icon={PlusCircle}
            onClick={() => navigate('/deals/new')}
          >
            New Finance Deal
          </AccessibleButton>
        </div>
      </div>

      {/* Client Profile Banner Card */}
      <AccessibleCard withTopAccent className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#FDF2F2] text-[#8B1A1A] border-2 border-[#F8CFCF] flex items-center justify-center font-black text-xl shrink-0">
              <User className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {client.fullName}
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[#8B1A1A] font-semibold">
                  {client.clientCode}
                </span>
                <StatusBadge status={client.status || 'ACTIVE'} size="sm" />
              </div>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                {client.businessName ? `${client.businessName} • ` : ''}
                {client.industry || client.businessType || 'General Commercial Trading'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Phone</span>
              <span className="font-semibold text-slate-900 text-sm sm:text-base mt-0.5 block">{client.phone}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Email</span>
              <span className="font-semibold text-slate-900 text-sm mt-0.5 block break-words">
                {client.email || '—'}
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Location</span>
              <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                {client.city ? `${client.city}, ${client.state || ''}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Aggregate Financial Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-medium text-slate-500 block">Total Finance Taken</span>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 whitespace-nowrap">
              {formatCurrency(summary.totalFinanceReceived)}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-xs font-medium text-emerald-800 block">Total Repaid (P+I)</span>
            <p className="text-lg sm:text-xl font-bold text-emerald-700 mt-0.5 whitespace-nowrap">
              {formatCurrency(summary.totalRepaid)}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-xs font-medium text-amber-800 block">Outstanding Total</span>
            <p className="text-lg sm:text-xl font-bold text-amber-700 mt-0.5 whitespace-nowrap">
              {formatCurrency(summary.outstandingAmount)}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80">
            <span className="text-xs font-medium text-rose-800 block">Overdue Balance</span>
            <p className="text-lg sm:text-xl font-bold text-rose-700 mt-0.5 whitespace-nowrap">
              {formatCurrency(summary.overdueAmount)}
            </p>
          </div>
        </div>
      </AccessibleCard>

      {/* Finance Deals History */}
      <AccessibleCard withTopAccent className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-[#8B1A1A] stroke-[2.2]" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Finance Deal History ({client.deals?.length || 0} Deals)
            </h3>
          </div>
          <AccessibleButton
            variant="primary"
            size="compact"
            icon={PlusCircle}
            onClick={() => navigate('/deals/new')}
          >
            Create Deal
          </AccessibleButton>
        </div>

        {client.deals && client.deals.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold text-xs tracking-wider uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Deal #</th>
                  <th className="py-3 px-5">Approved Finance</th>
                  <th className="py-3 px-5">Contract Interest</th>
                  <th className="py-3 px-5">Total Repaid</th>
                  <th className="py-3 px-5">Outstanding</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {client.deals.map((d: any) => (
                  <tr
                    key={d.id}
                    onClick={() => navigate(`/deals/${d.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono font-semibold text-[#8B1A1A] text-sm whitespace-nowrap">
                      {d.dealNumber}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-sm text-slate-900 whitespace-nowrap">
                      {formatCurrency(d.financeAmountApproved)}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-sm text-emerald-700 whitespace-nowrap">
                      {formatCurrency(d.totalInterest)}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-sm text-emerald-700 whitespace-nowrap">
                      {formatCurrency(
                        Number(d.totalPrincipalRepaid || 0) + Number(d.totalInterestRepaid || 0)
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-sm text-amber-700 whitespace-nowrap">
                      {formatCurrency(d.outstandingTotal)}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <StatusBadge status={d.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <AccessibleButton
                        variant="secondary"
                        size="compact"
                        icon={ArrowRight}
                        iconPosition="right"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/deals/${d.id}`);
                        }}
                      >
                        View Deal
                      </AccessibleButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-sm font-medium text-slate-500">
            No finance deals registered for this client yet.
          </div>
        )}
      </AccessibleCard>

      {/* Edit Client Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Client Information"
        subtitle={`Updating master record for ${client.clientCode}`}
      >
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <AccessibleInput
              label="Business / Firm Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Phone Number"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <AccessibleInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <AccessibleSelect
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'ACTIVE', label: 'ACTIVE' },
                { value: 'INACTIVE', label: 'INACTIVE' },
                { value: 'BLOCKED', label: 'BLOCKED' },
              ]}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <AccessibleButton
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </AccessibleButton>
            <AccessibleButton
              type="submit"
              variant="primary"
              isLoading={updateClientMutation.isPending}
            >
              Save Changes
            </AccessibleButton>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteClientMutation.mutate()}
        isLoading={deleteClientMutation.isPending}
        title="Delete Client Record"
        message="Are you sure you want to permanently delete this client and all associated records?"
        itemDescription={`${client.clientCode}: ${client.fullName}`}
      />
    </div>
  );
};

export default ClientDetail;
