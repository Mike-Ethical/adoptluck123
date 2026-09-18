import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldAlert,
  PlusCircle,
  Users,
  Database,
  History,
  CheckCircle,
  AlertCircle,
  Upload,
  Lock,
  Trash2,
  MessageCircle,
  ExternalLink,
  Save,
  Search,
  Gift,
  Sparkles,
  Clock,
  RefreshCw,
  Trophy,
  Crown,
  UserCheck,
  Zap
} from 'lucide-react';
import { Pet, InventoryItem, AdminAuditLog, User, Giveaway } from '../types';
import { PetImage } from './PetImage';
import { calculatePetItemValue } from '../data/petsData';

interface AdminPanelModalProps {
  onImpersonate?: (user: User) => void;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onInventoryUpdated: () => void;
}

type AdminTab = 'add-pet' | 'users' | 'catalog' | 'importer' | 'discord' | 'audit' | 'impersonate' | 'giveaways';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  onImpersonate,
  isOpen,
  onClose,
  currentUser,
  onInventoryUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('add-pet');
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // Add Pet Form State
  const [targetUsername, setTargetUsername] = useState(currentUser.username);
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [petSearchFilter, setPetSearchFilter] = useState('');
  const [useCustomPet, setUseCustomPet] = useState(false);
  const [customPetName, setCustomPetName] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customValue, setCustomValue] = useState('1');
  const [variant, setVariant] = useState<'Normal' | 'Neon' | 'Mega'>('Normal');
  const [fly, setFly] = useState(true);
  const [ride, setRide] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const grantSubmittingRef = useRef(false);
  const [reason, setReason] = useState('Admin grant for testing/payout');

  // Giveaways Tab State
  const [giveawaysList, setGiveawaysList] = useState<Giveaway[]>([]);
  const [giveawaysLoading, setGiveawaysLoading] = useState(false);
  const [gwPetSearch, setGwPetSearch] = useState('');
  const [gwSelectedPetId, setGwSelectedPetId] = useState('');
  const [gwVariant, setGwVariant] = useState<'Normal' | 'Neon' | 'Mega'>('Normal');
  const [gwFly, setGwFly] = useState(true);
  const [gwRide, setGwRide] = useState(true);
  const [gwMinutes, setGwMinutes] = useState(60);
  const [gwRiggingId, setGwRiggingId] = useState<string | null>(null);
  const [gwRigUsername, setGwRigUsername] = useState('');
  const [gwActionMessage, setGwActionMessage] = useState<string | null>(null);

  // Impersonate Tab State
  const [impersonateSearch, setImpersonateSearch] = useState('');
  const [impersonateResult, setImpersonateResult] = useState<User | null>(null);
  const [impersonateLoading, setImpersonateLoading] = useState(false);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);

  // Value edit state
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [newPetValue, setNewPetValue] = useState<number>(0);

  // Status message
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Selected user for inventory inspection
  const [inspectUserId, setInspectUserId] = useState<string>(currentUser.id);
  const [inspectItems, setInspectItems] = useState<InventoryItem[]>([]);

  // AMVGG Importer State
  const [importJson, setImportJson] = useState('');

  // Discord Server Settings State (Owner editable)
  const [discordLinkInput, setDiscordLinkInput] = useState('https://discord.gg/bloxluck');
  const [savingDiscord, setSavingDiscord] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsUnauthorized(false);
      setMessage(null);
      return;
    }

    // Fast-path client check: cute240bunny (Roblox User ID: 3058833903)
    const rawId = String(currentUser.robloxUserId || '').trim();
    const isOwnerId = rawId === '3058833903' || rawId.includes('3058833903') || currentUser.id.includes('3058833903');
    const nameStr = (currentUser.robloxUsername || currentUser.username || '').toLowerCase().trim();
    const isOwnerName = nameStr === 'cute240bunny' || currentUser.id.toLowerCase().includes('cute240bunny');
    const isAdminRole = currentUser.role === 'admin';

    if (!currentUser.verified || !isAdminRole || (!isOwnerId && !isOwnerName)) {
      setIsUnauthorized(true);
      return;
    }
    setIsUnauthorized(false);

    // Load admin data with server-side check
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const headers = { 'x-user-id': currentUser.id || 'roblox-cute240bunny' };

        // 0. Verify server-side authorization check first
        const checkRes = await fetch('/api/admin/check', { headers });
        if (checkRes.status === 403 || !checkRes.ok) {
          setIsUnauthorized(true);
          return;
        }

        // 1. Fetch users
        const usersRes = await fetch('/api/admin/users', { headers });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }

        // 2. Fetch pets
        const petsRes = await fetch('/api/pets?limit=200');
        if (petsRes.ok) {
          const petsData = await petsRes.json();
          setPets(petsData.pets || []);
          if (petsData.pets?.length > 0 && !selectedPetId) {
            setSelectedPetId(petsData.pets[0].id);
          }
        }

        // 3. Fetch audit logs
        const auditRes = await fetch('/api/admin/audit-log', { headers });
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          setAuditLogs(auditData.logs || []);
        }

        // 4. Fetch system settings (Discord link)
        try {
          const setRes = await fetch('/api/settings');
          if (setRes.ok) {
            const setData = await setRes.json();
            if (setData.discordLink) {
              setDiscordLinkInput(setData.discordLink);
            }
          }
        } catch (e) {
          console.error(e);
        }

        // 5. Fetch inspect items
        fetchUserInventory(inspectUserId || currentUser.id);

        // 6. Fetch Giveaways
        fetchGiveaways();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [isOpen, currentUser.id, currentUser.robloxUserId, currentUser.role]);

  const fetchGiveaways = async () => {
    setGiveawaysLoading(true);
    try {
      const res = await fetch('/api/giveaways');
      if (res.ok) {
        const data = await res.json();
        setGiveawaysList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load giveaways:', err);
    } finally {
      setGiveawaysLoading(false);
    }
  };

  const handleCreateOfficialGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    const pet = pets.find((p) => p.id === gwSelectedPetId);
    if (!pet) {
      setGwActionMessage('Please select a pet from the catalog first.');
      return;
    }

    const calcVal = calculatePetItemValue(pet, gwVariant, gwFly, gwRide);
    setLoading(true);
    setGwActionMessage(null);

    try {
      const res = await fetch('/api/giveaways/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          petName: pet.name,
          petImage: pet.image,
          value: calcVal,
          minutes: gwMinutes,
          variant: gwVariant,
          fly: gwFly,
          ride: gwRide,
        }),
      });

      if (res.ok) {
        setGwActionMessage(`Giveaway for ${gwVariant} ${pet.name} created successfully!`);
        fetchGiveaways();
      } else {
        const err = await res.json();
        setGwActionMessage(err.error || 'Failed to create giveaway');
      }
    } catch (err: any) {
      setGwActionMessage(err.message || 'Error creating giveaway');
    } finally {
      setLoading(false);
      setGrantSubmitting(false);
    }
  };

  const handleRigGiveawayWinner = async (gwId: string) => {
    if (!gwRigUsername.trim()) return;
    setLoading(true);
    setGwActionMessage(null);

    try {
      // 1. Search or create the Roblox user
      const userRes = await fetch('/api/admin/search-create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ username: gwRigUsername.trim() }),
      });

      if (!userRes.ok) {
        setGwActionMessage('Failed to find or create Roblox user profile.');
        return;
      }

      const targetRobloxUser = await userRes.json();

      // 2. Rig winner (does NOT end timer early per owner requirements)
      const rigRes = await fetch(`/api/giveaways/${gwId}/rig`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          winnerId: targetRobloxUser.id,
          username: targetRobloxUser.username,
        }),
      });

      if (rigRes.ok) {
        setGwActionMessage(`Rigged to win: @${targetRobloxUser.username}! (Will automatically win when the timer ends)`);
        setGwRiggingId(null);
        setGwRigUsername('');
        fetchGiveaways();
      } else {
        const err = await rigRes.json();
        setGwActionMessage(err.error || 'Failed to rig winner');
      }
    } catch (err: any) {
      setGwActionMessage(err.message || 'Error rigging giveaway');
    } finally {
      setLoading(false);
    }
  };

  const handleEndGiveawayNow = async (gwId: string) => {
    try {
      const res = await fetch(`/api/giveaways/${gwId}/end-now`, {
        method: 'POST',
        headers: { 'x-user-id': currentUser.id },
      });
      if (res.ok) {
        setGwActionMessage('Giveaway marked to roll immediately!');
        setTimeout(fetchGiveaways, 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGiveaway = async (gwId: string) => {
    if (!confirm('Are you sure you want to cancel this giveaway?')) return;
    try {
      const res = await fetch(`/api/giveaways/${gwId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser.id },
      });
      if (res.ok) {
        setGwActionMessage('Giveaway cancelled');
        fetchGiveaways();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchRobloxUserForImpersonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!impersonateSearch.trim()) return;
    setImpersonateLoading(true);
    setImpersonateError(null);
    setImpersonateResult(null);

    try {
      const res = await fetch('/api/admin/search-create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ username: impersonateSearch.trim() }),
      });

      if (res.ok) {
        const userData = await res.json();
        setImpersonateResult(userData);
      } else {
        setImpersonateError('Could not find or create Roblox user profile.');
      }
    } catch (err: any) {
      setImpersonateError(err.message || 'Lookup error');
    } finally {
      setImpersonateLoading(false);
    }
  };

  const handleExecuteImpersonate = (userToImpersonate: User) => {
    if (onImpersonate) {
      onImpersonate(userToImpersonate);
      onClose();
    }
  };

  const fetchUserInventory = async (uid: string) => {
    try {
      const res = await fetch(`/api/admin/inventory/${uid}`, {
        headers: { 'x-user-id': currentUser.id || 'roblox-cute240bunny' },
      });
      if (res.ok) {
        const data = await res.json();
        setInspectItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPetToInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername) return;
    if (!useCustomPet && !selectedPetId) return;
    if (useCustomPet && !customPetName) return;

    if (grantSubmittingRef.current || grantSubmitting) return;
    grantSubmittingRef.current = true;
    setGrantSubmitting(true);
    setLoading(true);
    setMessage(null);
    try {
      const requestId = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      const res = await fetch('/api/admin/inventory/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          username: targetUsername.trim(),
          petId: useCustomPet ? undefined : selectedPetId,
          petName: useCustomPet ? customPetName.trim() : undefined,
          imageUrl: useCustomPet && customImageUrl ? customImageUrl.trim() : undefined,
          value: useCustomPet ? (Number(customValue) || 0) : undefined,
          variant,
          fly,
          ride,
          quantity: Number(quantity),
          reason,
          requestId,
        }),
      });

      if (res.status === 403) {
        setIsUnauthorized(true);
        setMessage({ type: 'error', text: '403 Forbidden: Only cute240bunny (Roblox ID 3058833903) can execute admin actions.' });
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        onInventoryUpdated();
        // Refresh audit logs
        const auditRes = await fetch('/api/admin/audit-log', {
          headers: { 'x-user-id': currentUser.id },
        });
        const auditData = await auditRes.json();
        setAuditLogs(auditData.logs || []);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add pet' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Server error' });
    } finally {
      setLoading(false);
      grantSubmittingRef.current = false;
      setGrantSubmitting(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this item from user inventory?')) return;
    try {
      const res = await fetch('/api/admin/inventory/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id || 'roblox-cute240bunny',
        },
        body: JSON.stringify({ itemId, reason: 'Admin manual removal' }),
      });
      if (res.status === 403) {
        setMessage({ type: 'error', text: '403 Forbidden: Admin privileges required.' });
        return;
      }
      if (res.ok) {
        fetchUserInventory(inspectUserId);
        onInventoryUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateValue = async (petId: string) => {
    try {
      const res = await fetch('/api/admin/pets/update-value', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id || 'roblox-cute240bunny',
        },
        body: JSON.stringify({ petId, newValue: newPetValue }),
      });
      if (res.status === 403) {
        setMessage({ type: 'error', text: '403 Forbidden: Admin privileges required.' });
        return;
      }
      if (res.ok) {
        setEditingPetId(null);
        // refresh pets
        const petsRes = await fetch('/api/pets?limit=200');
        const petsData = await petsRes.json();
        setPets(petsData.pets || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePetStatus = async (petId: string, currentDisabled: boolean) => {
    try {
      const res = await fetch('/api/admin/pets/toggle-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id || 'roblox-cute240bunny',
        },
        body: JSON.stringify({ petId, disabled: !currentDisabled }),
      });
      if (res.status === 403) {
        setMessage({ type: 'error', text: '403 Forbidden: Admin privileges required.' });
        return;
      }
      const petsRes = await fetch('/api/pets?limit=200');
      const petsData = await petsRes.json();
      setPets(petsData.pets || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportAmvggCatalog = async () => {
    if (!importJson.trim()) return;
    try {
      const parsed = JSON.parse(importJson);
      const res = await fetch('/api/pets/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id || 'roblox-cute240bunny',
        },
        body: JSON.stringify({ petsData: parsed, source: 'AMVGG JSON Import' }),
      });
      if (res.status === 403) {
        setMessage({ type: 'error', text: '403 Forbidden: Admin privileges required.' });
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Imported ${data.importedCount} pets successfully!` });
        setImportJson('');
        const petsRes = await fetch('/api/pets?limit=200');
        const petsData = await petsRes.json();
        setPets(petsData.pets || []);
      } else {
        setMessage({ type: 'error', text: data.error || 'Import failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Invalid JSON format: ' + err.message });
    }
  };

  const handleSaveDiscordLink = async () => {
    if (!discordLinkInput.trim().startsWith('http')) {
      setMessage({ type: 'error', text: 'Discord link must start with https://' });
      return;
    }
    setSavingDiscord(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id || 'roblox-cute240bunny',
        },
        body: JSON.stringify({ discordLink: discordLinkInput.trim() }),
      });
      if (res.status === 403) {
        setMessage({ type: 'error', text: '403 Forbidden: Admin privileges required.' });
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Discord server link updated to "${data.discordLink}"` });
        setDiscordLinkInput(data.discordLink);
        // Refresh audit logs
        const auditRes = await fetch('/api/admin/audit-log', {
          headers: { 'x-user-id': currentUser.id || 'roblox-cute240bunny' },
        });
        const auditData = await auditRes.json();
        setAuditLogs(auditData.logs || []);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save Discord link' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating settings' });
    } finally {
      setSavingDiscord(false);
    }
  };

  if (!isOpen) return null;

  // Keep the admin portal completely hidden from unauthorized users.
  // Server-side authorization remains enforced by /api/admin/* middleware.
  if (!currentUser.verified || currentUser.role !== 'admin' || isUnauthorized) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4 select-none">
      <div className="bg-[#0e131d] border-0 sm:border border-[#202c42] rounded-none sm:rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[#1b2538] flex items-center justify-between bg-[#121825] shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-gaming font-black text-white text-sm sm:text-base tracking-wider uppercase flex items-center gap-2 truncate">
                <span>AdmLuck Admin</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hidden sm:inline-block">
                  SERVER PROTECTED
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-1.5 rounded-lg bg-[#1a2335] hover:bg-[#25324c] text-slate-300 hover:text-white transition cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Close Admin Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alert Notice */}
        {message && (
          <div
            className={`px-4 sm:px-5 py-2 text-xs flex items-center gap-2 border-b shrink-0 ${
              message.type === 'success'
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                : 'bg-rose-500/20 border-rose-500/30 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate">{message.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-3 sm:px-5 py-2 bg-[#101521] border-b border-[#1b2538] flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none shrink-0 touch-pan-x">
          <button
            onClick={() => setActiveTab('impersonate')}
            className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-gaming font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px] active:scale-95 ${
              activeTab === 'impersonate'
                ? 'bg-purple-500 text-slate-950 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#20293b]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Impersonate</span>
          </button>

          <button
            onClick={() => setActiveTab('giveaways')}
            className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-gaming font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px] active:scale-95 ${
              activeTab === 'giveaways'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#20293b]'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Giveaways</span>
          </button>

          <button
            onClick={() => setActiveTab('add-pet')}
            className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-gaming font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px] active:scale-95 ${
              activeTab === 'add-pet'
                ? 'bg-[#3b82f6] text-slate-950 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#20293b]'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Pet</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-gaming font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px] active:scale-95 ${
              activeTab === 'users'
                ? 'bg-[#3b82f6] text-slate-950 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#20293b]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Inventories</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-gaming font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px] active:scale-95 ${
              activeTab === 'catalog'
                ? 'bg-[#3b82f6] text-slate-950 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#20293b]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Pet Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('importer')}
            className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-gaming font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px] active:scale-95 ${
              activeTab === 'importer'
                ? 'bg-[#3b82f6] text-slate-950 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#20293b]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>AMVGG Importer</span>
          </button>

          <button
            onClick={() => setActiveTab('discord')}
            className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-gaming font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px] active:scale-95 ${
              activeTab === 'discord'
                ? 'bg-[#3b82f6] text-slate-950 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#20293b]'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Discord Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`shrink-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-gaming font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px] active:scale-95 ${
              activeTab === 'audit'
                ? 'bg-[#3b82f6] text-slate-950 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#20293b]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Logs ({auditLogs.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-[#0b0f17]">
          {/* TAB 1: ADD PET TO INVENTORY */}
          {activeTab === 'add-pet' && (
            <form onSubmit={handleAddPetToInventory} className="max-w-2xl space-y-4 mx-auto">
              <div className="p-4 bg-[#111724] border border-[#1d273a] rounded-xl space-y-4">
                <span className="font-gaming font-bold text-sm text-white block uppercase tracking-wider">
                  Admin Add Pet Form
                </span>

                {/* 1. Target Username */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-gaming text-slate-400 block">
                      Target Username (Select or Type Any Username)
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={targetUsername}
                      onChange={(e) => setTargetUsername(e.target.value)}
                      placeholder="e.g. novapxa or Admin"
                      className="flex-1 bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-gaming"
                    />
                    {users.length > 0 && (
                      <select
                        value={targetUsername}
                        onChange={(e) => setTargetUsername(e.target.value)}
                        className="bg-[#151c2a] border border-[#232f45] rounded-lg px-2 py-2 text-xs text-slate-300 focus:border-amber-400 focus:outline-none max-w-[140px]"
                      >
                        <option value="">Choose user...</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.username}>
                            {u.username}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* 2. Pet Selector Mode: Catalog vs Custom */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-gaming text-slate-400 block">
                      Pet Selection Mode
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setUseCustomPet(false)}
                        className={`px-2 py-1 rounded text-[10px] font-gaming font-bold tracking-wider transition-colors cursor-pointer border ${
                          !useCustomPet
                            ? 'bg-[#3b82f6] text-slate-950 border-[#3b82f6]'
                            : 'bg-[#151c2a] text-slate-400 border-[#222c3f]'
                        }`}
                      >
                        Catalog ({pets.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseCustomPet(true)}
                        className={`px-2 py-1 rounded text-[10px] font-gaming font-bold tracking-wider transition-colors cursor-pointer border ${
                          useCustomPet
                            ? 'bg-[#3b82f6] text-slate-950 border-[#3b82f6]'
                            : 'bg-[#151c2a] text-slate-400 border-[#222c3f]'
                        }`}
                      >
                        Custom Pet URL
                      </button>
                    </div>
                  </div>

                  {!useCustomPet ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={petSearchFilter}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPetSearchFilter(val);
                            const matched = pets.filter((p) => p.name.toLowerCase().includes(val.toLowerCase()));
                            if (matched.length > 0 && !matched.some((p) => p.id === selectedPetId)) {
                              setSelectedPetId(matched[0].id);
                            }
                          }}
                          placeholder="Search pet by name (e.g. Bat Dragon, Shadow Dragon, Cow, Frost...)"
                          className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#3b82f6] focus:outline-none"
                        />
                      </div>

                      {/* Filtered Pet Grid / Quick Select */}
                      <div className="max-h-44 overflow-y-auto bg-[#0d121c] border border-[#1e283d] rounded-lg p-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {pets
                          .filter((p) => p.name.toLowerCase().includes(petSearchFilter.toLowerCase()))
                          .slice(0, 30)
                          .map((p) => {
                            const isSelected = p.id === selectedPetId;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedPetId(p.id)}
                                className={`flex items-center gap-2 p-1.5 rounded text-left transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#3b82f6]/20 border border-[#3b82f6] text-white'
                                    : 'hover:bg-[#141b29] text-slate-300 border border-transparent'
                                }`}
                              >
                                <PetImage src={p.image} alt={p.name} className="w-7 h-7 shrink-0" rarity={p.rarity} />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold font-gaming truncate">{p.name}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                                    <span className="text-[#3b82f6] font-bold">{p.value} Val</span>
                                    <span>•</span>
                                    <span>{p.rarity}</span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="w-3.5 h-3.5 text-[#3b82f6] shrink-0 mr-1" />
                                )}
                              </button>
                            );
                          })}
                        {pets.filter((p) => p.name.toLowerCase().includes(petSearchFilter.toLowerCase())).length === 0 && (
                          <div className="col-span-full py-4 text-center text-slate-500 text-xs font-gaming">
                            No pets found matching "{petSearchFilter}"
                          </div>
                        )}
                      </div>

                      {/* Selected Pet Details Preview */}
                      {(() => {
                        const sel = pets.find((p) => p.id === selectedPetId);
                        if (!sel) return null;
                        return (
                          <div className="p-2.5 bg-[#0e1420] border border-[#3b82f6]/40 rounded-lg flex items-center gap-3">
                            <PetImage src={sel.image} alt={sel.name} className="w-12 h-12" rarity={sel.rarity} />
                            <div>
                              <div className="text-xs font-bold text-white font-gaming flex items-center gap-2">
                                <span>{sel.name}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30 uppercase font-mono">Selected</span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="text-[#3b82f6] font-mono font-bold">Base: {sel.value} Val</span>
                                <span>•</span>
                                <span className="text-slate-300">{sel.rarity}</span>
                                <span>•</span>
                                <span className="text-blue-400 font-mono">Demand: {sel.demand}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-2.5 p-3 bg-[#0d121c] border border-[#1d273f] rounded-xl">
                      <div>
                        <label className="text-[11px] font-gaming text-slate-400 block mb-1">
                          Custom Pet Name
                        </label>
                        <input
                          type="text"
                          value={customPetName}
                          onChange={(e) => setCustomPetName(e.target.value)}
                          placeholder="e.g. Neon Shadow Dragon, Candy Cannon"
                          className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-2 text-xs text-white focus:border-[#3b82f6] focus:outline-none font-gaming"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-gaming text-slate-400 block mb-1">
                            Pet Image URL
                          </label>
                          <input
                            type="text"
                            value={customImageUrl}
                            onChange={(e) => setCustomImageUrl(e.target.value)}
                            placeholder="https://... (Adopt Me image URL)"
                            className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-2 text-xs text-white focus:border-[#3b82f6] focus:outline-none font-mono text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-gaming text-slate-400 block mb-1">
                            Value
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={customValue}
                            onChange={(e) => setCustomValue(e.target.value)}
                            className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-2 text-xs text-white focus:border-[#3b82f6] focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      {customImageUrl && (
                        <div className="flex items-center gap-2.5 p-2 bg-[#141b2a] rounded-lg border border-[#202c42]">
                          <img
                            src={customImageUrl}
                            alt="Custom Preview"
                            className="w-10 h-10 object-contain rounded"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="text-xs text-slate-300 font-gaming truncate">
                            Preview: {customPetName || 'Custom Pet'} ({Number(customValue) || 0} Val)
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Variant (Normal / Neon / Mega) */}
                <div>
                  <label className="text-xs font-gaming text-slate-400 block mb-1">Variant</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Normal', 'Neon', 'Mega'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVariant(v)}
                        className={`py-2 rounded font-gaming font-bold text-xs uppercase transition-colors cursor-pointer border ${
                          variant === v
                            ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]'
                            : 'bg-[#151c2a] border-[#222c3f] text-slate-400 hover:text-white'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Fly / Ride Toggles */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded bg-[#151c2a] border border-[#222c3f] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fly}
                      onChange={(e) => setFly(e.target.checked)}
                      className="w-4 h-4 rounded text-[#3b82f6] focus:ring-0"
                    />
                    <span className="text-xs font-gaming font-bold text-white">Fly (F)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded bg-[#151c2a] border border-[#222c3f] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ride}
                      onChange={(e) => setRide(e.target.checked)}
                      className="w-4 h-4 rounded text-[#3b82f6] focus:ring-0"
                    />
                    <span className="text-xs font-gaming font-bold text-white">Ride (R)</span>
                  </label>
                </div>

                {/* Live AMVGG Calculated Value Preview */}
                {(() => {
                  const selPet = pets.find((p) => p.id === selectedPetId);
                  const baseVal = useCustomPet ? (Number(customValue) || 0) : (selPet?.value || 0);
                  const previewCalculated = calculatePetItemValue(
                    useCustomPet ? baseVal : (selPet || baseVal),
                    variant,
                    fly,
                    ride,
                    useCustomPet ? customPetName : selPet?.name
                  );
                  return (
                    <div className="p-3 rounded-lg bg-[#0d121c] border border-[#202d44] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded bg-[#162033] flex items-center justify-center p-1">
                          <PetImage
                            src={useCustomPet ? (customImageUrl || '/api/adoptme/item-image/1') : (selPet?.image || '')}
                            alt="Preview"
                            className="w-8 h-8 object-contain"
                            variant={variant}
                            fly={fly}
                            ride={ride}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-gaming font-bold text-white flex items-center gap-1.5">
                            <span>{variant !== 'Normal' ? variant : ''} {useCustomPet ? (customPetName || 'Custom Pet') : (selPet?.name || 'Pet')}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-mono">
                              AMVGG True
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Each: <span className="text-amber-400 font-bold">{previewCalculated} Val</span>
                            {quantity > 1 && (
                              <span className="text-slate-300 ml-2">
                                (Total: <span className="text-amber-300 font-bold">{Math.round(previewCalculated * quantity * 10) / 10} Val</span>)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 5. Quantity & Reason */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-gaming text-slate-400 block mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-2 text-xs text-white focus:border-[#3b82f6] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-gaming text-slate-400 block mb-1">
                      Audit Reason
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-2 text-xs text-white focus:border-[#3b82f6] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded bg-[#3b82f6] hover:bg-[#00d980] text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] cursor-pointer active:scale-95"
                >
                  {loading ? 'Adding to Inventory...' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          )}

                    
          {/* TAB: IMPERSONATE */}
          {activeTab === 'impersonate' && (
            <div className="space-y-5 max-w-4xl mx-auto">
              {/* Impersonate Search Card */}
              <div className="bg-[#111724] border border-[#1b2538] rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-gaming font-bold text-white uppercase tracking-wider">
                      Search & Impersonate Any Roblox User
                    </h3>
                    <p className="text-xs text-slate-400">
                      Fetches authentic Roblox avatar, creates account profile if new, and switches your session.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSearchRobloxUserForImpersonate} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={impersonateSearch}
                      onChange={(e) => setImpersonateSearch(e.target.value)}
                      placeholder="Enter exact Roblox username (e.g. cute240bunny, Builderman)..."
                      className="w-full bg-[#151c2a] border border-[#232f45] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={impersonateLoading || !impersonateSearch.trim()}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-gaming font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition shadow-[0_0_12px_rgba(168,85,247,0.3)] shrink-0"
                  >
                    {impersonateLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Searching Roblox...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Lookup Profile</span>
                      </>
                    )}
                  </button>
                </form>

                {impersonateError && (
                  <div className="mt-3 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{impersonateError}</span>
                  </div>
                )}

                {/* Searched User Result Card */}
                {impersonateResult && (
                  <div className="mt-4 p-4 rounded-xl bg-[#0c1018] border border-purple-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={impersonateResult.avatarUrl || 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-310966282D3529E36976BF6B07B1DC90-Png/150/150/AvatarHeadshot/Png/isCircular'}
                        alt={impersonateResult.username}
                        className="w-14 h-14 rounded-full border-2 border-purple-500 object-cover bg-[#162033]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-gaming font-black text-white text-sm">
                            {impersonateResult.username}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                            Roblox Verified
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          ID: {impersonateResult.id}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                          <span>Games: <strong className="text-white">{impersonateResult.totalGames}</strong></span>
                          <span>•</span>
                          <span>Wins: <strong className="text-[#00f090]">{impersonateResult.wins}</strong></span>
                          <span>•</span>
                          <span>Profit: <strong className="text-amber-400">{impersonateResult.totalProfit}</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExecuteImpersonate(impersonateResult)}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)] active:scale-95"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Impersonate This User</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Impersonate Registered Users List */}
              <div className="bg-[#111724] border border-[#1b2538] rounded-xl p-4 sm:p-5">
                <h4 className="text-xs font-gaming font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Or 1-Click Impersonate Existing Users ({users.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="p-2.5 rounded-lg bg-[#0d121c] border border-[#1e283d] flex items-center justify-between gap-2 hover:border-[#2b3a56] transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={u.avatarUrl || 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-310966282D3529E36976BF6B07B1DC90-Png/150/150/AvatarHeadshot/Png/isCircular'}
                          alt={u.username}
                          className="w-8 h-8 rounded-full object-cover bg-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-gaming font-bold text-white truncate">
                            {u.username}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {u.role === 'admin' ? 'Admin' : 'Player'} • {u.totalGames} games
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleExecuteImpersonate(u)}
                        className="px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-slate-950 text-[10px] font-gaming font-bold transition shrink-0 cursor-pointer"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: GIVEAWAYS (Fixed & Dedicated Command Center) */}
          {activeTab === 'giveaways' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Header & Status Notice */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111724] border border-[#1b2538] rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-gaming font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      Giveaway Command Center
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                        {giveawaysList.filter(g => !g.winnerId && !g.resolved).length} LIVE
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Host official giveaways, search pet catalog with true AMVGG values, and pre-rig winners before timer ends.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchGiveaways}
                  disabled={giveawaysLoading}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#151c2a] hover:bg-[#1d273a] text-slate-300 text-xs font-gaming flex items-center gap-1.5 border border-[#232f45] transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${giveawaysLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh List</span>
                </button>
              </div>

              {gwActionMessage && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{gwActionMessage}</span>
                  </div>
                  <button
                    onClick={() => setGwActionMessage(null)}
                    className="text-amber-400 hover:text-white text-xs font-mono ml-2 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Grid: Create Giveaway on Left, Active Giveaways on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Create Official Giveaway Form (5 Cols) */}
                <div className="lg:col-span-5 bg-[#111724] border border-[#1b2538] rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="font-gaming font-bold text-xs text-amber-400 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                      <PlusCircle className="w-3.5 h-3.5" />
                      Create Official Pet Giveaway
                    </span>

                    <form onSubmit={handleCreateOfficialGiveaway} className="space-y-3.5">
                      {/* Search Pet Catalog */}
                      <div>
                        <label className="text-xs font-gaming text-slate-400 block mb-1">
                          1. Select Pet from AMVGG Catalog
                        </label>
                        <div className="relative mb-2">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={gwPetSearch}
                            onChange={(e) => setGwPetSearch(e.target.value)}
                            placeholder="Search catalog pet (e.g. Bat Dragon, Cow, Frost)..."
                            className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        {/* Pet Selection Grid */}
                        <div className="max-h-36 overflow-y-auto bg-[#0d121c] border border-[#1e283d] rounded-lg p-1 grid grid-cols-2 gap-1 mb-2">
                          {pets
                            .filter((p) => p.name.toLowerCase().includes(gwPetSearch.toLowerCase()))
                            .slice(0, 18)
                            .map((p) => {
                              const isSelected = p.id === gwSelectedPetId;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => setGwSelectedPetId(p.id)}
                                  className={`flex items-center gap-1.5 p-1.5 rounded border transition-colors cursor-pointer text-left ${
                                    isSelected
                                      ? 'bg-amber-500/20 border-amber-500 text-white'
                                      : 'bg-[#151c2a] border-[#222c3f] text-slate-300 hover:border-[#2a3852]'
                                  }`}
                                >
                                  <img src={p.image} alt={p.name} className="w-7 h-7 rounded object-contain bg-slate-800 shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-[11px] font-gaming font-bold truncate">{p.name}</div>
                                    <div className="text-[10px] text-amber-400 font-mono">{p.value} Val</div>
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      {/* Variant Selector */}
                      <div>
                        <label className="text-xs font-gaming text-slate-400 block mb-1">
                          2. Variant
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['Normal', 'Neon', 'Mega'] as const).map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setGwVariant(v)}
                              className={`py-1.5 rounded text-xs font-gaming font-bold uppercase transition cursor-pointer border ${
                                gwVariant === v
                                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                                  : 'bg-[#151c2a] border-[#232f45] text-slate-400 hover:text-white'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fly / Ride Toggles */}
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 p-2 rounded bg-[#151c2a] border border-[#222c3f] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={gwFly}
                            onChange={(e) => setGwFly(e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-amber-500"
                          />
                          <span className="text-xs font-gaming font-bold text-white">Fly (F)</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 rounded bg-[#151c2a] border border-[#222c3f] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={gwRide}
                            onChange={(e) => setGwRide(e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-amber-500"
                          />
                          <span className="text-xs font-gaming font-bold text-white">Ride (R)</span>
                        </label>
                      </div>

                      {/* Live Calculated Value Card */}
                      {(() => {
                        const sel = pets.find((p) => p.id === gwSelectedPetId);
                        const calcVal = sel ? calculatePetItemValue(sel, gwVariant, gwFly, gwRide) : 0;
                        return (
                          <div className="p-2.5 rounded-lg bg-[#0d121c] border border-amber-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              {sel && (
                                <PetImage
                                  src={sel.image}
                                  alt={sel.name}
                                  className="w-8 h-8 object-contain shrink-0"
                                  variant={gwVariant}
                                  fly={gwFly}
                                  ride={gwRide}
                                />
                              )}
                              <div className="min-w-0">
                                <div className="text-xs font-gaming font-bold text-white truncate">
                                  {sel ? `${gwVariant !== 'Normal' ? gwVariant + ' ' : ''}${sel.name}` : 'Select a pet'}
                                </div>
                                <div className="text-[10px] text-slate-400">AMVGG True Valuation</div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-xs shrink-0">
                              {calcVal} Val
                            </span>
                          </div>
                        );
                      })()}

                      {/* Duration Preset Selector */}
                      <div>
                        <label className="text-xs font-gaming text-slate-400 block mb-1">
                          3. Timer Duration
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                          {[
                            { label: '1 Min', mins: 1 },
                            { label: '5 Mins', mins: 5 },
                            { label: '10 Mins', mins: 10 },
                            { label: '30 Mins', mins: 30 },
                            { label: '1 Hour', mins: 60 },
                            { label: '24 Hours', mins: 1440 },
                          ].map((d) => (
                            <button
                              key={d.mins}
                              type="button"
                              onClick={() => setGwMinutes(d.mins)}
                              className={`py-1.5 rounded text-[11px] font-gaming font-bold transition cursor-pointer border ${
                                gwMinutes === d.mins
                                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                                  : 'bg-[#151c2a] border-[#232f45] text-slate-400 hover:text-white'
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !gwSelectedPetId}
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer active:scale-95"
                      >
                        {loading ? 'Starting Giveaway...' : 'LAUNCH OFFICIAL GIVEAWAY'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right: Active & Ended Giveaways List (7 Cols) */}
                <div className="lg:col-span-7 bg-[#111724] border border-[#1b2538] rounded-xl p-4 sm:p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-gaming font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      All Giveaways ({giveawaysList.length})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Owner Pre-Selection Enabled
                    </span>
                  </div>

                  {giveawaysList.length === 0 ? (
                    <div className="p-8 text-center bg-[#0d121c] border border-[#1e283d] rounded-xl my-auto">
                      <Gift className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
                      <div className="font-gaming font-bold text-slate-300 text-sm">No Giveaways Created Yet</div>
                      <p className="text-xs text-slate-500 mt-1">
                        Use the form on the left to launch your first official Adopt Me pet giveaway!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                      {giveawaysList.map((gw) => {
                        const isEnded = Boolean(gw.winnerId || gw.resolved);
                        const msLeft = new Date(gw.endTime).getTime() - Date.now();
                        const isExpired = msLeft <= 0;
                        const isRiggingThis = gwRiggingId === gw.id;

                        return (
                          <div
                            key={gw.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isEnded
                                ? 'bg-[#0d121c]/60 border-[#1a2335] opacity-75'
                                : 'bg-[#0d121c] border-[#243147] hover:border-[#354869]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              {/* Pet Thumbnail with badges */}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-lg bg-[#151c2a] border border-[#232f45] flex items-center justify-center p-1 shrink-0 relative">
                                  <PetImage
                                    src={gw.petImage}
                                    alt={gw.petName}
                                    className="w-10 h-10 object-contain"
                                    variant={gw.variant || 'Normal'}
                                    fly={gw.fly}
                                    ride={gw.ride}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-gaming font-bold text-white text-xs truncate">
                                      {gw.variant && gw.variant !== 'Normal' ? `${gw.variant} ` : ''}{gw.petName}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                                      {gw.value} Val
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    Host: <span className="text-slate-300">@{gw.creatorUsername || 'AdmLuck Admin'}</span> • Participants: <strong className="text-white">{gw.participants?.length || 0}</strong>
                                  </div>
                                  {/* Status / Countdown */}
                                  <div className="flex items-center gap-2 mt-1">
                                    {isEnded ? (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                        <Trophy className="w-2.5 h-2.5 text-emerald-400" />
                                        Won by: @{gw.winnerUsername || 'Selected User'}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-mono">
                                        <Clock className="w-2.5 h-2.5" />
                                        {isExpired ? 'Ending soon...' : `${Math.ceil(msLeft / 60000)}m remaining`}
                                      </span>
                                    )}

                                    {/* Rigged status indicator */}
                                    {gw.riggedUsername && !isEnded && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/25 text-purple-300 border border-purple-500/40 flex items-center gap-1 font-mono">
                                        <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                                        Rigged: @{gw.riggedUsername} (Wins when timer ends)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Controls */}
                              {!isEnded && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGwRiggingId(isRiggingThis ? null : gw.id);
                                      setGwRigUsername(gw.riggedUsername || '');
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-[11px] font-gaming font-bold border border-purple-500/40 transition cursor-pointer"
                                  >
                                    Rig Winner
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleEndGiveawayNow(gw.id)}
                                    title="End immediately and roll winner"
                                    className="px-2 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-[11px] font-gaming font-bold border border-amber-500/30 transition cursor-pointer"
                                  >
                                    End Now
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteGiveaway(gw.id)}
                                    title="Cancel giveaway"
                                    className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Rig Winner Inline Popover */}
                            {isRiggingThis && !isEnded && (
                              <div className="mt-3 p-3 rounded-lg bg-[#141b2a] border border-purple-500/40 space-y-2">
                                <div className="text-xs font-gaming font-bold text-purple-300 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Pre-Decide Winner (Per owner rule: Winner will win when timer finishes)</span>
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={gwRigUsername}
                                    onChange={(e) => setGwRigUsername(e.target.value)}
                                    placeholder="Enter exact Roblox username to rig..."
                                    className="flex-1 bg-[#0c1018] border border-[#28354f] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRigGiveawayWinner(gw.id)}
                                    disabled={loading || !gwRigUsername.trim()}
                                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-gaming font-bold text-xs uppercase transition cursor-pointer shrink-0"
                                  >
                                    Save Rig
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setGwRiggingId(null)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-gaming cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER INVENTORIES */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-gaming text-slate-400">Select User:</span>
                <select
                  value={inspectUserId}
                  onChange={(e) => {
                    setInspectUserId(e.target.value);
                    fetchUserInventory(e.target.value);
                  }}
                  className="bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} (Games: {u.totalGames}, Profit: {u.totalProfit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {inspectItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#111724] border border-[#1b2538] rounded-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>{item.variant}</span>
                        <span>x{item.quantity}</span>
                      </div>
                      <PetImage src={item.petImage} alt={item.petName} className="w-12 h-12 mx-auto my-1"  rarity={item.rarity} variant={item.variant} fly={item.fly} ride={item.ride} />
                      <span className="font-gaming font-bold text-white text-xs block text-center truncate">
                        {item.petName}
                      </span>
                      <span className="text-amber-400 font-mono text-center block text-xs">
                        {item.totalValue} Val
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="mt-2 text-rose-400 hover:text-rose-300 text-[10px] font-gaming flex items-center justify-center gap-1 p-1 bg-rose-500/10 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Item</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PET CATALOG & VALUES */}
          {activeTab === 'catalog' && (
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-gaming block">
                Manage AMVGG pet base values and active trading status:
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-gaming">
                  <thead>
                    <tr className="border-b border-[#1b2538] text-slate-400 text-[10px] uppercase">
                      <th className="py-2 px-3">Pet</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Rarity</th>
                      <th className="py-2 px-3">AMVGG Value</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#161f30]">
                    {pets.map((p) => (
                      <tr key={p.id} className="hover:bg-[#121927]">
                        <td className="py-2 px-3 flex items-center gap-2">
                          <PetImage src={p.image} alt={p.name} className="w-6 h-6" />
                          <span className="font-bold text-white">{p.name}</span>
                        </td>
                        <td className="py-2 px-3 text-slate-400">{p.category}</td>
                        <td className="py-2 px-3 text-amber-400">{p.rarity}</td>
                        <td className="py-2 px-3 font-mono">
                          {editingPetId === p.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={newPetValue}
                              onChange={(e) => setNewPetValue(parseFloat(e.target.value) || 0)}
                              className="w-20 bg-slate-900 border border-amber-400 rounded px-1 text-white text-xs"
                            />
                          ) : (
                            <span className="text-white font-bold">{p.value}</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              p.disabled
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {p.disabled ? 'DISABLED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right space-x-2">
                          {editingPetId === p.id ? (
                            <button
                              onClick={() => handleUpdateValue(p.id)}
                              className="px-2 py-1 bg-[#3b82f6] text-slate-950 font-bold rounded text-[10px] cursor-pointer"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingPetId(p.id);
                                setNewPetValue(p.value);
                              }}
                              className="px-2 py-1 bg-slate-800 text-slate-300 hover:text-white rounded text-[10px] cursor-pointer"
                            >
                              Edit Val
                            </button>
                          )}
                          <button
                            onClick={() => handleTogglePetStatus(p.id, !!p.disabled)}
                            className="px-2 py-1 bg-slate-800 text-slate-300 hover:text-white rounded text-[10px] cursor-pointer"
                          >
                            {p.disabled ? 'Enable' : 'Disable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AMVGG IMPORTER */}
          {activeTab === 'importer' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="p-4 bg-[#111724] border border-[#1b2538] rounded-xl space-y-3">
                <span className="font-gaming font-bold text-sm text-white block uppercase tracking-wider">
                  Import AMVGG Pet Catalog JSON
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Paste authorized AMVGG dataset JSON format (array of pets with name, value, rarity, demand). The system merges into the live catalog with server-side caching.
                </p>
                <textarea
                  rows={8}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='[{"name": "Candy Hare", "value": 4.2, "rarity": "Legendary", "demand": "High"}]'
                  className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg p-3 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                />
                <button
                  onClick={handleImportAmvggCatalog}
                  className="w-full py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Import Dataset Into Catalog
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: DISCORD SERVER LINK SETTINGS (Owner Editable) */}
          {activeTab === 'discord' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="p-5 bg-[#111724] border border-[#1d273a] rounded-xl space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-[#5865F2]">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-gaming font-bold text-sm text-white uppercase tracking-wider">
                      Discord Server Link & Pet Withdrawals
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configure the official Discord server invite link. Users will be automatically redirected to this link after confirming a pet withdrawal or when requesting pet deposits.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-gaming font-bold text-slate-300 uppercase">
                    Official Discord Server Invite URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={discordLinkInput}
                      onChange={(e) => setDiscordLinkInput(e.target.value)}
                      placeholder="https://discord.gg/your-server"
                      className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Example: <span className="font-mono text-slate-300">https://discord.gg/bloxluck</span> or your custom vanity URL.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-[#1a2436]">
                  <button
                    onClick={handleSaveDiscordLink}
                    disabled={savingDiscord}
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-40"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingDiscord ? 'Saving...' : 'Save Discord Server Link'}</span>
                  </button>

                  <a
                    href={discordLinkInput}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-[#182338] text-slate-300 hover:text-white font-gaming text-xs flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test Link</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-gaming block">
                Immutable Admin Security & Action Audit Trail:
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-gaming border-collapse">
                  <thead>
                    <tr className="border-b border-[#1b2538] text-slate-400 text-[10px] uppercase">
                      <th className="py-2 px-3">Timestamp</th>
                      <th className="py-2 px-3">Admin</th>
                      <th className="py-2 px-3">Action</th>
                      <th className="py-2 px-3">Target User</th>
                      <th className="py-2 px-3">Pet</th>
                      <th className="py-2 px-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#161f30] font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#121927]">
                        <td className="py-2 px-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-2 px-3 text-amber-400 font-bold">{log.admin}</td>
                        <td className="py-2 px-3 text-[#3b82f6] font-bold">{log.action}</td>
                        <td className="py-2 px-3 text-white">{log.user}</td>
                        <td className="py-2 px-3 text-slate-200">{log.pet}</td>
                        <td className="py-2 px-3 text-slate-400 font-sans text-xs">{log.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
