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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b-2 border-[#D6CFC4]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
            Client Directory
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#52525B] mt-1">
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

      {/* Large Accessible Search Bar */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border-2 border-[#D6CFC4] shadow-warm">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-[#52525B] stroke-[2.2]" />
          <input
            type="text"
            placeholder="Search by client name, business, phone, or PAN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 bg-[#FAF7F2] border-2 border-[#A8A29E] focus:border-[#8B1A1A] focus:ring-3 focus:ring-[#8B1A1A]/20 rounded-xl pl-13 pr-4 text-lg font-medium text-[#1A1A1A] placeholder-[#71717A] transition-all"
          />
        </div>
      </div>

      {/* Desktop / Tablet High-Contrast Table View */}
      <div className="hidden md:block rounded-2xl border-2 border-[#D6CFC4] bg-white overflow-hidden shadow-warm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="bg-[#FAF7F2] text-[#1A1A1A] font-extrabold border-b-2 border-[#D6CFC4]">
              <tr>
                <th className="py-4 px-6 text-sm uppercase tracking-wider">Client Code</th>
                <th className="py-4 px-6 text-sm uppercase tracking-wider">Client / Business</th>
                <th className="py-4 px-6 text-sm uppercase tracking-wider">Contact</th>
                <th className="py-4 px-6 text-sm uppercase tracking-wider">Total Finance</th>
                <th className="py-4 px-6 text-sm uppercase tracking-wider">Outstanding</th>
                <th className="py-4 px-6 text-sm uppercase tracking-wider">Deals</th>
                <th className="py-4 px-6 text-sm uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-sm uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#EDE7DE] text-[#1A1A1A]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-lg font-bold text-[#52525B]">
                    Loading client directory...
                  </td>
                </tr>
              ) : clients?.length > 0 ? (
                clients.map((c: any, index: number) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/clients/${c.id}`)}
                    className={`cursor-pointer hover:bg-[#FAF7F2] transition-colors ${
                      index % 2 === 1 ? 'bg-[#FCFAF7]' : 'bg-white'
                    }`}
                  >
                    <td className="py-5 px-6 font-mono font-bold text-[#8B1A1A] text-lg">
                      {c.clientCode}
                    </td>
                    <td className="py-5 px-6">
                      <p className="font-bold text-lg text-[#1A1A1A]">{c.fullName}</p>
                      <p className="text-sm font-semibold text-[#52525B] mt-0.5">
                        {c.businessName || 'Individual'}
                      </p>
                    </td>
                    <td className="py-5 px-6">
                      <p className="font-bold text-[#1A1A1A]">{c.phone}</p>
                      <p className="text-sm text-[#52525B] font-medium mt-0.5">{c.city || '—'}</p>
                    </td>
                    <td className="py-5 px-6 font-bold text-lg text-[#1A1A1A]">
                      {formatCurrency(c.totalFinanceReceived)}
                    </td>
                    <td className="py-5 px-6 font-extrabold text-lg text-[#B45309]">
                      {formatCurrency(c.outstandingAmount)}
                    </td>
                    <td className="py-5 px-6">
                      <span className="px-3 py-1 rounded-lg bg-[#FAF7F2] border border-[#D6CFC4] text-sm font-bold text-[#1A1A1A]">
                        {c.dealsCount} deals
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <StatusBadge status={c.status || 'ACTIVE'} size="sm" />
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          title="Edit Client"
                          onClick={(e) => handleOpenEdit(c, e)}
                          className="h-11 px-3 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#1E3A8A] border-2 border-[#D6CFC4] hover:border-[#1E3A8A] font-bold text-sm flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Edit2 className="h-4 w-4 stroke-[2.3]" />
                          <span>Edit</span>
                        </button>
                        <button
                          title="Delete Client"
                          onClick={(e) => handleOpenDelete(c, e)}
                          className="h-11 px-3 rounded-xl bg-white hover:bg-[#FEE2E2] text-[#B91C1C] border-2 border-[#FECACA] hover:border-[#B91C1C] font-bold text-sm flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <Trash2 className="h-4 w-4 stroke-[2.3]" />
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
          <div className="p-8 text-center text-lg font-bold text-[#52525B]">
            Loading client directory...
          </div>
        ) : clients?.length > 0 ? (
          clients.map((c: any) => (
            <AccessibleCard
              key={c.id}
              onClick={() => navigate(`/clients/${c.id}`)}
              className="p-5"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b-2 border-[#EDE7DE]">
                <div>
                  <span className="font-mono text-sm font-bold text-[#8B1A1A] block">
                    {c.clientCode}
                  </span>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mt-0.5">{c.fullName}</h3>
                  <p className="text-base font-semibold text-[#52525B] mt-0.5">
                    {c.businessName || 'Individual'}
                  </p>
                </div>
                <StatusBadge status={c.status || 'ACTIVE'} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-b-2 border-[#EDE7DE] text-base">
                <div>
                  <p className="text-sm font-bold text-[#52525B] uppercase">Total Finance</p>
                  <p className="text-lg font-bold text-[#1A1A1A] mt-0.5">
                    {formatCurrency(c.totalFinanceReceived)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#B45309] uppercase">Outstanding</p>
                  <p className="text-lg font-extrabold text-[#B45309] mt-0.5">
                    {formatCurrency(c.outstandingAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#52525B] uppercase">Phone</p>
                  <p className="text-base font-bold text-[#1A1A1A] mt-0.5">{c.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#52525B] uppercase">Deals Count</p>
                  <p className="text-base font-bold text-[#1A1A1A] mt-0.5">{c.dealsCount} deals</p>
                </div>
              </div>

              <div
                className="flex items-center justify-between gap-2 pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleOpenEdit(c, e)}
                    className="h-12 px-4 rounded-xl bg-white border-2 border-[#D6CFC4] text-[#1E3A8A] font-bold text-base flex items-center gap-1.5 shadow-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => handleOpenDelete(c, e)}
                    className="h-12 px-4 rounded-xl bg-white border-2 border-[#FECACA] text-[#B91C1C] font-bold text-base flex items-center gap-1.5 shadow-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>

                <AccessibleButton
                  variant="secondary"
                  size="compact"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => navigate(`/clients/${c.id}`)}
                >
                  View
                </AccessibleButton>
              </div>
            </AccessibleCard>
          ))
        ) : (
          <AccessibleEmptyState
            icon={Users}
            title="No clients found"
            description="Add your first client profile to get started."
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
