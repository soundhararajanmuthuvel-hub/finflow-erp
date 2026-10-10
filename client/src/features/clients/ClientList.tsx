import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowRight,
  UserCheck,
  Building,
  Phone,
  MapPin,
  FileText,
  Users,
  ChevronRight,
} from 'lucide-react';
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
import { formatCurrency } from '../../utils/formatters';

export const ClientList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<any>(null);
  const [clientToDelete, setClientToDelete] = useState<any>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [city, setCity] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ['clients', searchTerm],
    queryFn: async () => {
      const res: any = await apiClient.get(`/clients?search=${searchTerm}`);
      return res.data || [];
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await apiClient.post('/clients', payload);
      return res.data;
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      refetch();
      resetForm();
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res: any = await apiClient.patch(`/clients/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      setIsEditModalOpen(false);
      setClientToEdit(null);
      refetch();
      resetForm();
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const res: any = await apiClient.delete(`/clients/${id}`);
      return res.data;
    },
    onSuccess: () => {
      setClientToDelete(null);
      refetch();
    },
  });

  const resetForm = () => {
    setFullName('');
    setBusinessName('');
    setPhone('');
    setEmail('');
    setPan('');
    setCity('');
    setBusinessType('');
    setStatus('ACTIVE');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (c: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setClientToEdit(c);
    setFullName(c.fullName || '');
    setBusinessName(c.businessName || '');
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setPan(c.pan || '');
    setCity(c.city || '');
    setBusinessType(c.businessType || '');
    setStatus(c.status || 'ACTIVE');
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (c: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setClientToDelete(c);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createClientMutation.mutate({
      fullName,
      businessName,
      phone,
      email,
      pan,
      city,
      businessType,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientToEdit) return;
    updateClientMutation.mutate({
      id: clientToEdit.id,
      payload: {
        fullName,
        businessName,
        phone,
        email,
        pan,
        city,
        businessType,
        status,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
            Client Directory
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            Manage client borrower profiles, active financings, and KYC records
          </p>
        </div>
        <AccessibleButton
          variant="primary"
          size="normal"
          icon={Plus}
          onClick={handleOpenCreate}
        >
          Add New Client
        </AccessibleButton>
      </div>

      {/* Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[2.2]" />
          <input
            type="text"
            placeholder="Search by client name, business, phone, or PAN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#8B1A1A] focus:ring-2 focus:ring-[#8B1A1A]/10 rounded-xl pl-10 pr-3.5 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all outline-none"
          />
        </div>
      </div>

      {/* Desktop / Tablet High-Contrast Table View */}
      <div className="hidden md:block rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold text-xs tracking-wider uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-5 font-semibold">Client Code</th>
                <th className="py-3 px-5 font-semibold">Client / Business</th>
                <th className="py-3 px-5 font-semibold">Contact</th>
                <th className="py-3 px-5 font-semibold">Total Finance</th>
                <th className="py-3 px-5 font-semibold">Outstanding</th>
                <th className="py-3 px-5 font-semibold">Deals</th>
                <th className="py-3 px-5 font-semibold">Status</th>
                <th className="py-3 px-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm font-medium text-slate-500">
                    Loading client directory...
                  </td>
                </tr>
              ) : clients?.length > 0 ? (
                clients.map((c: any, index: number) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/clients/${c.id}`)}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors bg-white"
                  >
                    <td className="py-3.5 px-5 font-mono font-semibold text-[#8B1A1A] text-sm whitespace-nowrap">
                      {c.clientCode}
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-sm text-slate-900">{c.fullName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {c.businessName || 'Individual'}
                      </p>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <p className="font-medium text-sm text-slate-800">{c.phone}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.city || '—'}</p>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-sm text-slate-900 whitespace-nowrap">
                      {formatCurrency(c.totalFinanceReceived)}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-sm text-amber-700 whitespace-nowrap">
                      {formatCurrency(c.outstandingAmount)}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                        {c.dealsCount} deals
                      </span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <StatusBadge status={c.status || 'ACTIVE'} size="sm" />
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          title="Edit Client"
                          onClick={(e) => handleOpenEdit(c, e)}
                          className="h-8 px-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-medium text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          title="Delete Client"
                          onClick={(e) => handleOpenDelete(c, e)}
                          className="h-8 px-2.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 font-medium text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12">
                    <AccessibleEmptyState
                      icon={Users}
                      title="No clients found"
                      description="Add your first client profile to manage financings and repayments."
                      actionText="Add New Client"
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

      {/* Mobile Stacked Card List View (<768px, No Horizontal Scrolling) */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-sm font-medium text-slate-500">
            Loading client directory...
          </div>
        ) : clients?.length > 0 ? (
          clients.map((c: any) => (
            <AccessibleCard
              key={c.id}
              onClick={() => navigate(`/clients/${c.id}`)}
              className="p-5"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-semibold text-[#8B1A1A] block">
                    {c.clientCode}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{c.fullName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {c.businessName || 'Individual'}
                  </p>
                </div>
                <StatusBadge status={c.status || 'ACTIVE'} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-3.5 py-3.5 border-b border-slate-100 text-sm">
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Finance</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5 whitespace-nowrap">
                    {formatCurrency(c.totalFinanceReceived)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-700">Outstanding</p>
                  <p className="text-sm font-bold text-amber-700 mt-0.5 whitespace-nowrap">
                    {formatCurrency(c.outstandingAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Phone</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{c.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Deals Count</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{c.dealsCount} deals</p>
                </div>
              </div>

              <div
                className="flex items-center justify-between gap-2 pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleOpenEdit(c, e)}
                    className="h-9 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1.5 shadow-2xs hover:bg-slate-50"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => handleOpenDelete(c, e)}
                    className="h-9 px-3 rounded-xl bg-white border border-rose-200 text-rose-600 font-medium text-xs flex items-center gap-1.5 shadow-2xs hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
                <button
                  onClick={() => navigate(`/clients/${c.id}`)}
                  className="h-9 px-3 rounded-xl bg-[#8B1A1A]/10 text-[#8B1A1A] font-semibold text-xs flex items-center gap-1 hover:bg-[#8B1A1A]/15"
                >
                  <span>View</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </AccessibleCard>
          ))
        ) : (
          <AccessibleEmptyState
            icon={Users}
            title="No clients found"
            description="Add your first client profile to manage financings and repayments."
            actionText="Add New Client"
            onAction={handleOpenCreate}
            actionIcon={Plus}
          />
        )}
      </div>

      {/* Add Client Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Client Profile"
        subtitle="Create master record for private finance applicant"
      >
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
            />

            <AccessibleInput
              label="Business / Firm Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Balaji Traders"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="Phone Number"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />

            <AccessibleInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@domain.in"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccessibleInput
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Chennai"
            />

            <AccessibleInput
              label="Business Type"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="Proprietorship / Retail"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-5 border-t border-slate-100">
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
              isLoading={createClientMutation.isPending}
            >
              Create Client
            </AccessibleButton>
          </div>
        </form>
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Client Information"
        subtitle={`Updating master details for ${clientToEdit?.clientCode || ''}`}
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

            <AccessibleInput
              label="Business Type"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
            />
          </div>

          <AccessibleSelect
            label="Record Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'ACTIVE', label: 'ACTIVE' },
              { value: 'INACTIVE', label: 'INACTIVE' },
            ]}
          />

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
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={() => {
          if (clientToDelete) deleteClientMutation.mutate(clientToDelete.id);
        }}
        title="Delete Client Record"
        message={`Are you sure you want to delete client ${clientToDelete?.fullName}? All associated deal links must be cleared first.`}
        itemDescription={`Client Code: ${clientToDelete?.clientCode} — ${clientToDelete?.fullName}`}
        isLoading={deleteClientMutation.isPending}
      />
    </div>
  );
};

export default ClientList;
