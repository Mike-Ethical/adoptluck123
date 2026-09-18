import React, { useState, useEffect } from 'react';
import { X, Gift, Search, Sparkles, CheckCircle2 } from 'lucide-react';
import { User, InventoryItem, Pet } from '../types';
import { PetImage } from './PetImage';

interface CreateGiveawayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  inventory: InventoryItem[];
  onGiveawayCreated: () => void;
}

export const CreateGiveawayModal: React.FC<CreateGiveawayModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  inventory,
  onGiveawayCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [minutes, setMinutes] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Admin free pet catalog fallback
  const [adminCatalog, setAdminCatalog] = useState<Pet[]>([]);
  const isAdmin = currentUser.role === 'admin' || currentUser.robloxUsername?.toLowerCase() === 'cute240bunny';

  useEffect(() => {
    if (isAdmin && isOpen && adminCatalog.length === 0) {
      fetch('/api/pets?limit=100')
        .then((r) => r.json())
        .then((d) => {
          if (d.pets) setAdminCatalog(d.pets);
        })
        .catch(() => {});
    }
  }, [isAdmin, isOpen]);

  if (!isOpen) return null;

  // Filter available inventory items (unlocked items)
  const availableInventory = inventory.filter((item) => !item.locked);
  const filteredInventory = availableInventory.filter((item) =>
    item.petName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter admin catalog if admin has empty inventory
  const filteredCatalog = adminCatalog.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetId) {
      setErrorMsg('Please select a pet to host the giveaway!');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let body: any = { minutes };
      // Check if selected from inventory
      const invItem = availableInventory.find((i) => i.id === selectedPetId);
      if (invItem) {
        body.petId = invItem.id;
        body.petName = invItem.petName;
        body.petImage = invItem.petImage;
        body.value = invItem.value;
        body.variant = invItem.variant;
        body.fly = invItem.fly;
        body.ride = invItem.ride;
      } else if (isAdmin) {
        const catPet = adminCatalog.find((p) => p.id === selectedPetId);
        if (catPet) {
          body.petName = catPet.name;
          body.petImage = catPet.image;
          body.value = catPet.value;
          body.variant = 'Normal';
          body.fly = true;
          body.ride = true;
        }
      }

      const res = await fetch('/api/giveaways/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onGiveawayCreated();
        onClose();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || 'Failed to create giveaway');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error creating giveaway');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedItem =
    availableInventory.find((i) => i.id === selectedPetId) ||
    (isAdmin ? adminCatalog.find((p) => p.id === selectedPetId) : null);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 select-none animate-fadeIn">
      <div className="bg-[#0e1422] border border-[#202c44] rounded-2xl w-full max-w-lg flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a253a] bg-[#12192a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-white font-gaming font-black text-base tracking-wide flex items-center gap-2">
                Host a Giveaway
              </h2>
              <p className="text-[11px] text-slate-400">Give back to the community in chat!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a253a] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-gaming font-bold">
              {errorMsg}
            </div>
          )}

          {/* Search Pets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-gaming font-bold text-slate-300">
                1. Select Pet from Inventory
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {availableInventory.length} Available
              </span>
            </div>

            <div className="relative mb-2.5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pets by name..."
                className="w-full bg-[#141c2c] border border-[#232f48] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Pet Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-[#090d16] border border-[#1a2438] rounded-xl">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => {
                  const isSelected = selectedPetId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedPetId(item.id)}
                      className={`relative p-2 rounded-xl cursor-pointer transition-all flex flex-col items-center text-center gap-1 border ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                          : 'bg-[#121929] border-[#1f2c42] hover:border-[#2d3e5c] hover:bg-[#162033]'
                      }`}
                    >
                      <PetImage
                        src={item.petImage}
                        alt={item.petName}
                        className="w-12 h-12 object-contain"
                        variant={item.variant}
                      />
                      <div className="text-[11px] font-gaming font-bold text-white truncate w-full">
                        {item.petName}
                      </div>
                      <div className="text-[10px] text-amber-400 font-mono font-bold">
                        {item.value} Val
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400 absolute top-1.5 right-1.5" />
                      )}
                    </div>
                  );
                })
              ) : isAdmin && filteredCatalog.length > 0 ? (
                filteredCatalog.slice(0, 30).map((pet) => {
                  const isSelected = selectedPetId === pet.id;
                  return (
                    <div
                      key={pet.id}
                      onClick={() => setSelectedPetId(pet.id)}
                      className={`relative p-2 rounded-xl cursor-pointer transition-all flex flex-col items-center text-center gap-1 border ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                          : 'bg-[#121929] border-[#1f2c42] hover:border-[#2d3e5c] hover:bg-[#162033]'
                      }`}
                    >
                      <PetImage src={pet.image} alt={pet.name} className="w-12 h-12 object-contain" />
                      <div className="text-[11px] font-gaming font-bold text-white truncate w-full">
                        {pet.name}
                      </div>
                      <div className="text-[10px] text-amber-400 font-mono font-bold">
                        {pet.value} Val
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400 absolute top-1.5 right-1.5" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-6 text-center text-slate-500 text-xs font-gaming">
                  {inventory.length === 0
                    ? 'No pets in your inventory to give away. Deposit pets or withdraw some first!'
                    : `No pets match "${searchQuery}"`}
                </div>
              )}
            </div>
          </div>

          {/* Duration Selector: 1, 5, 10, 30, 60 mins and 1 day */}
          <div>
            <label className="block text-xs font-gaming font-bold text-slate-300 mb-2">
              2. Giveaway Duration
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: '1 Min', mins: 1 },
                { label: '5 Mins', mins: 5 },
                { label: '10 Mins', mins: 10 },
                { label: '30 Mins', mins: 30 },
                { label: '60 Mins', mins: 60 },
                { label: '1 Day', mins: 1440 },
              ].map((item) => (
                <button
                  type="button"
                  key={item.mins}
                  onClick={() => setMinutes(item.mins)}
                  className={`py-2 px-1 rounded-xl text-xs font-gaming font-bold transition cursor-pointer border text-center ${
                    minutes === item.mins
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : 'bg-[#121929] border-[#1f2c42] text-slate-400 hover:text-white hover:border-[#2b3a55]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Summary Card */}
          {selectedItem && (
            <div className="p-3 bg-[#111827] border border-amber-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PetImage
                  src={(selectedItem as any).petImage || (selectedItem as any).image}
                  alt={(selectedItem as any).petName || (selectedItem as any).name}
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <div className="text-xs font-bold text-white font-gaming">
                    {(selectedItem as any).petName || (selectedItem as any).name}
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono font-bold">
                    {(selectedItem as any).value} Val • {minutes === 1440 ? '1 Day' : `${minutes} Min`} Timer
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  No Join Limit
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#151d2d] hover:bg-[#1d273c] text-slate-300 font-gaming text-xs font-bold transition cursor-pointer border border-[#222f46]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedPetId}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Starting...' : 'Start Giveaway'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
