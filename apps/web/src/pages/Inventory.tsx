import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useAuthStore } from '../store/auth';
import { Briefcase, Check, Sparkles, AlertCircle } from 'lucide-react';

export default function Inventory() {
  const { profile, updateEquippedItems } = useAuthStore();

  // Fetch owned items
  const { data: items, isLoading, refetch } = useQuery({
    queryKey: ['myInventory'],
    queryFn: async () => {
      const res = await api.get('/students/inventory');
      return res.data.data;
    },
  });

  const handleEquip = async (itemId: string, category: string) => {
    try {
      const res = await api.post('/students/equip', { itemId, category });
      updateEquippedItems(res.data.data);
      refetch();
      alert('Avatar customization equipped!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to equip item.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-gold"></div>
        <p className="text-slate-400 font-medium">Opening Inventory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      
      {/* Inventory Header */}
      <div className="glass-card p-6 flex items-center justify-between bg-gradient-to-r from-slate-900/80 to-cyan-950/10 border-cyan-500/10">
        <div className="flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-black font-sans">Player Inventory</h1>
            <p className="text-xs text-slate-400">Equip items to customize your character appearance</p>
          </div>
        </div>
      </div>

      {/* Grid List */}
      {items && items.length === 0 ? (
        <div className="text-center p-12 glass-card border-slate-800">
          <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">Your inventory is empty</h3>
          <p className="text-xs text-slate-500 mt-1">Unlock items from the Armory Shop using coins.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {items?.map((item: any) => {
            // Check if equipped
            const activeEquippedAsset = profile?.selectedInventoryItems?.[item.category as keyof typeof profile.selectedInventoryItems];
            const isEquipped = activeEquippedAsset === item.assetUrl;

            return (
              <div key={item._id} className="glass-card p-4 flex flex-col justify-between gap-4 border-slate-850">
                <div className="flex flex-col gap-2">
                  <div className="aspect-square bg-slate-950/60 rounded-xl flex items-center justify-center text-3xl border border-slate-900 relative">
                    {item.category === 'helmet' ? '🪖' : item.category === 'weapon' ? '✏️' : item.category === 'outfit' ? '👕' : '🖼️'}
                    <span className="absolute bottom-2 left-2 text-[8px] bg-slate-900 px-2 py-0.5 rounded font-black tracking-widest text-slate-500 uppercase">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-xs text-slate-300">{item.name}</h3>
                </div>

                {isEquipped ? (
                  <div className="flex items-center justify-center gap-1 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold rounded-xl w-full">
                    <Check className="h-4 w-4" /> EQUIPPED
                  </div>
                ) : (
                  <button
                    onClick={() => handleEquip(item._id, item.category)}
                    className="btn-gold w-full text-xs py-2 shadow-sm font-bold"
                  >
                    Equip Item
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
