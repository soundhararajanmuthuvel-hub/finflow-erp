import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Landmark, Edit2, Trash2, Phone, Mail, Percent, Wallet } from 'lucide-react';
import apiClient from '../../api/client';
import { Modal } from '../../components/common/Modal';
import { ConfirmDeleteModal } from '../../components/common/ConfirmDeleteModal';
import { StatusBadge } from '../../components/common/Badge';
import {
  AccessibleButton,
  AccessibleInput,
  AccessibleSelect,
  AccessibleCard,
  AccessibleEmptyState,
} from '../../components/common/AccessibleComponents';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

export const PartnerList: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [partnerToEdit, setPartnerToEdit] = useState<any>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [capitalContribution, setCapitalContribution] = useState('');
  const [sharePercentage, setSharePercentage] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [notes, setNotes] = useState('');

  const { data: partners, isLoading, refetch } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const res: any = await apiClient.get('/partners');
      return res.data || [];
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await apiClient.post('/partners', payload);
      return res.data;
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      refetch();
      resetForm();
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res: any = await apiClient.patch(`/partners/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      setIsEditModalOpen(false);
      setPartnerToEdit(null);
      refetch();
      resetForm();
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: async (id: string) => {
      const res: any = await apiClient.delete(`/partners/${id}`);
      return res.data;
    },
    onSuccess: () => {
      setPartnerToDelete(null);
      refetch();
    },
  });

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setCapitalContribution('');
    setSharePercentage('');
    setStatus('ACTIVE');
    setNotes('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setPartnerToEdit(p);
    setName(p.name || '');
    setPhone(p.phone || '');
    setEmail(p.email || '');
    setCapitalContribution(p.capitalContribution?.toString() || '');
    setSharePercentage(p.sharePercentage?.toString() || '');
    setStatus(p.status || 'ACTIVE');
    setNotes(p.notes || '');
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (p: any) => {
    setPartnerToDelete(p);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createPartnerMutation.mutate({
      name,
      phone,
      email,
      capitalContribution: Number(capitalContribution) || 0,
      sharePercentage: Number(sharePercentage) || 0,
      notes,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerToEdit) return;
    updatePartnerMutation.mutate({
      id: partnerToEdit.id,
      payload: {
        name,
        phone,
        email,
        capitalContribution: Number(capitalContribution) || 0,
        sharePercentage: Number(sharePercentage) || 0,
        status,
        notes,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#D6CFC4]">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#1A1A1A] tracking-tight">
            Company Partners & Capital
          </h1>
          <p className="text-sm sm:text-base font-medium text-[#52525B] mt-1">
            Manage company co-owners, equity ownership shares, and partner profit distributions
          </p>
        </div>
        <AccessibleButton
          variant="primary"
          size="normal"
          icon={Plus}
          onClick={handleOpenCreate}
        >
          Add New Partner
        </AccessibleButton>
      </div>

      {/* Desktop / Tablet High-Contrast Table View */}
      <div className="hidden md:block rounded-2xl border-2 border-[#D6CFC4] bg-white overflow-hidden shadow-warm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="bg-[#FAF7F2] text-[#1A1A1A] font-extrabold border-b-2 border-[#D6CFC4]">
              <tr>
                <th className="py-3.5 px-5 text-sm font-bold">Partner Code</th>
                <th className="py-3.5 px-5 text-sm font-bold">Partner Name</th>
                <th className="py-3.5 px-5 text-sm font-bold">Contact</th>
                <th className="py-3.5 px-5 text-sm font-bold">Capital Contributed</th>
                <th className="py-3.5 px-5 text-sm font-bold">Equity Share %</th>
                <th className="py-3.5 px-5 text-sm font-bold">Status</th>
                <th className="py-3.5 px-5 text-sm font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#EDE7DE] text-[#1A1A1A]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-base font-bold text-[#52525B]">
                    Loading partner records...
                  </td>
                </tr>
              ) : partners?.length > 0 ? (
                partners.map((p: any, index: number) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-[#FAF7F2] transition-colors ${
                      index % 2 === 1 ? 'bg-[#FCFAF7]' : 'bg-white'
                    }`}
                  >
                    <td className="py-3.5 px-5 font-mono font-bold text-[#8B1A1A] text-base whitespace-nowrap">
                      {p.partnerCode}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-base text-[#1A1A1A]">
                      {p.name}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <p className="font-bold text-[#1A1A1A] text-sm">{p.phone}</p>
                      <p className="text-xs text-[#52525B] mt-0.5">{p.email || '—'}</p>
                    </td>
                    <td className="py-3.5 px-5 font-extrabold text-base text-[#1E3A8A] whitespace-nowrap">
                      {formatCurrency(p.capitalContribution)}
                    </td>
                    <td className="py-3.5 px-5 font-extrabold text-base text-[#1F6B3A] whitespace-nowrap">
                      {formatPercentage(p.sharePercentage)}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <StatusBadge status={p.status || 'ACTIVE'} size="sm" />
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          title="Edit Partner"
                          onClick={() => handleOpenEdit(p)}
                          className="h-9 px-2.5 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#1E3A8A] border-2 border-[#D6CFC4] hover:border-[#1E3A8A] font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                        >
                          <Edit2 className="h-3.5 w-3.5 stroke-[2.3]" />
                          <span>Edit</span>
                        </button>
                        <button
                          title="Delete Partner"
                          onClick={() => handleOpenDelete(p)}
                          className="h-9 px-2.5 rounded-lg bg-white hover:bg-[#FEE2E2] text-[#B91C1C] border-2 border-[#FECACA] hover:border-[#B91C1C] font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5 stroke-[2.3]" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12">
                    <AccessibleEmptyState
                      icon={Landmark}
                      title="No partners registered"
                      description="Add company partners and equity stakeholders to record capital contribution."
                      actionText="Add New Partner"
                      onAction={handleOpenCreate}
                      actionIcon={Plus}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Card View (<768px) */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-lg font-bold text-[#52525B]">
            Loading partner records...
          </div>
        ) : partners?.length > 0 ? (
          partners.map((p: any) => (
            <AccessibleCard key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-3 pb-3 border-b-2 border-[#EDE7DE]">
                <div>
                  <span className="font-mono text-sm font-bold text-[#8B1A1A] block">
                    {p.partnerCode}
                  </span>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mt-0.5">{p.name}</h3>
                  <p className="text-base font-semibold text-[#52525B] mt-0.5">{p.phone}</p>
                </div>
                <StatusBadge status={p.status || 'ACTIVE'} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-b-2 border-[#EDE7DE] text-base">
                <div>
                  <p className="text-sm font-bold text-[#3F3F46]">Capital Contributed</p>
                  <p className="text-lg font-extrabold text-[#1E3A8A] mt-0.5 whitespace-nowrap">
                    {formatCurrency(p.capitalContribution)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1F6B3A]">Equity Share</p>
                  <p className="text-lg font-extrabold text-[#1F6B3A] mt-0.5 whitespace-nowrap">
                    {formatPercentage(p.sharePercentage)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="h-12 px-4 rounded-xl bg-white border-2 border-[#D6CFC4] text-[#1E3A8A] font-bold text-base flex items-center gap-1.5 shadow-sm"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleOpenDelete(p)}
                  className="h-12 px-4 rounded-xl bg-white border-2 border-[#FECACA] text-[#B91C1C] font-bold text-base flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </AccessibleCard>
          ))
        ) : (
          <AccessibleEmptyState
            icon={Landmark}
            title="No partners found"
            description="Add your first company partner profile."
            actionText="Add New Partner"
            onAction={handleOpenCreate}
            actionIcon={Plus}
          />
        )}
      </div>

      {/* Add Partner Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Company Partner"
        subtitle="Register company equity stakeholder"
      >
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Partner Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. K. Soundhararajan"
            />

            <AccessibleInput
              label="Phone Number"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Capital Contribution (₹)"
              type="number"
              value={capitalContribution}
              onChange={(e) => setCapitalContribution(e.target.value)}
              placeholder="500000"
            />

            <AccessibleInput
              label="Equity Share Percentage (%)"
              type="number"
              value={sharePercentage}
              onChange={(e) => setSharePercentage(e.target.value)}
              placeholder="25"
            />
          </div>

          <AccessibleInput
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="partner@domain.in"
          />

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t-2 border-[#EDE7DE]">
            <AccessibleButton
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </AccessibleButton>
            <AccessibleButton
              type="submit"
              variant="primary"
              isLoading={createPartnerMutation.isPending}
            >
              Create Partner
            </AccessibleButton>
          </div>
        </form>
      </Modal>

      {/* Edit Partner Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Partner Profile"
        subtitle={`Updating details for ${partnerToEdit?.partnerCode || ''}`}
      >
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Partner Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <AccessibleInput
              label="Phone Number"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Capital Contribution (₹)"
              type="number"
              value={capitalContribution}
              onChange={(e) => setCapitalContribution(e.target.value)}
            />

            <AccessibleInput
              label="Equity Share Percentage (%)"
              type="number"
              value={sharePercentage}
              onChange={(e) => setSharePercentage(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <AccessibleSelect
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t-2 border-[#EDE7DE]">
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
              isLoading={updatePartnerMutation.isPending}
            >
              Save Changes
            </AccessibleButton>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!partnerToDelete}
        onClose={() => setPartnerToDelete(null)}
        onConfirm={() => {
          if (partnerToDelete) deletePartnerMutation.mutate(partnerToDelete.id);
        }}
        title="Delete Partner Record"
        message={`Are you sure you want to delete partner ${partnerToDelete?.name}?`}
        itemDescription={`Partner Code: ${partnerToDelete?.partnerCode} — ${partnerToDelete?.name}`}
        isLoading={deletePartnerMutation.isPending}
      />
    </div>
  );
};

export default PartnerList;
