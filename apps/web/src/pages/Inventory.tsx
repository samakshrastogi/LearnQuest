import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useAuthStore } from '../store/auth';
import { 
  Briefcase, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Layers, 
  Shirt, 
  Crown, 
  Feather, 
  ShieldCheck, 
  User, 
  ShoppingBag, 
  ArrowRight,
  Zap,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Inventory() {
  const { profile, updateEquippedItems } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch owned items
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['myInventory'],
    queryFn: async () => {
      const res = await api.get('/students/inventory');
      return res.data.data;
    },
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleEquip = async (itemId: string, category: string) => {
    try {
      const res = await api.post('/students/equip', { itemId, category });
      updateEquippedItems(res.data.data);
      refetch();
      triggerToast('✨ Gear Equipped to Avatar!');
    } catch (err: any) {
      triggerToast('❌ Failed to equip item.');
    }
  };

  const handleUnequip = async (category: string) => {
    try {
      const updated = {
        ...profile?.selectedInventoryItems,
        [category]: '',
      };
      const res = await api.post('/students/equip', { itemId: '', category });
      updateEquippedItems(res.data.data || updated);
      refetch();
      triggerToast('↩️ Gear Unequipped');
    } catch (err: any) {
      triggerToast('❌ Failed to unequip item.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-gold"></div>
        <p className="text-slate-400 font-medium text-xs">Loading Equipment Vault...</p>
      </div>
    );
  }

  // Filter items by category
  const filteredItems = items.filter((item: any) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  // Calculate equipped loadout items
  const equippedHelmet = items.find((i: any) => i.category === 'helmet' && profile?.selectedInventoryItems?.helmet === i.assetUrl);
  const equippedOutfit = items.find((i: any) => i.category === 'outfit' && profile?.selectedInventoryItems?.outfit === i.assetUrl);
  const equippedWeapon = items.find((i: any) => i.category === 'weapon' && profile?.selectedInventoryItems?.weapon === i.assetUrl);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 p-4 md:p-6 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-cyan-500/30 text-slate-100 p-4 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/20 border-cyan-500/20 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Briefcase className="h-8 w-8 animate-pulse-glow" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
              Player Vault & Inventory
              <span className="text-xs bg-cyan-500/10 text-cyan-400 font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                {items.length} Items Owned
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Customize your hero avatar, view stat bonuses, and switch gear loadouts!
            </p>
          </div>
        </div>

        <Link
          to="/shop"
          className="btn-gold px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transform hover:scale-105 transition-all"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Visit Armory Shop</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 2. Main Grid: Left Avatar Loadout Card + Right Equipment Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left: Active Hero Loadout Card */}
        <div className="md:col-span-4 glass-card p-6 flex flex-col gap-6 border-slate-800 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-400" />
              Active Avatar Loadout
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">
              Level {Math.floor((profile?.xp || 0) / 1000) + 1}
            </span>
          </div>

          {/* Avatar Graphic Display Frame */}
          <div className="aspect-square bg-slate-950 rounded-3xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-inner p-4">
            <div className="relative flex flex-col items-center justify-center">
              {/* Crown / Helmet Layer */}
              <div className="text-4xl -mb-2 z-10 animate-bounce-slow">
                {equippedHelmet ? '🪖' : '👑'}
              </div>
              {/* Avatar Face */}
              <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-4xl shadow-xl">
                🧙‍♂️
              </div>
              {/* Outfit Layer */}
              <div className="text-3xl -mt-2 z-10">
                {equippedOutfit ? '👕' : '🥋'}
              </div>
              {/* Weapon Layer */}
              <div className="absolute -right-6 top-8 text-3xl">
                {equippedWeapon ? '✏️' : '🪄'}
              </div>
            </div>

            <span className="absolute bottom-3 text-[11px] font-black text-slate-300">
              {profile?.userId?.username || 'Hero Student'}
            </span>
          </div>

          {/* Combined RPG Stat Attributes */}
          <div className="flex flex-col gap-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Equipped Stat Bonuses
            </span>
            
            <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
              <span className="font-bold flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-yellow-400" /> XP Multiplier:
              </span>
              <span className="font-black text-yellow-400">+15% Boost</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-amber-400" /> Streak Shield:
              </span>
              <span className="font-black text-amber-400">1 Active</span>
            </div>
          </div>
        </div>

        {/* Right: Equipment Vault Grid */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800 backdrop-blur-md">
            {[
              { id: 'all', label: 'All Gear', icon: Layers },
              { id: 'outfit', label: 'Outfits', icon: Shirt },
              { id: 'helmet', label: 'Helmets', icon: Crown },
              { id: 'weapon', label: 'Magic Pens', icon: Feather },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 scale-105'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Owned Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="text-center p-12 glass-card border-slate-800 flex flex-col items-center gap-4">
              <AlertCircle className="h-10 w-10 text-slate-500" />
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-slate-300">No Items in this Category</h3>
                <p className="text-xs text-slate-500">Unlock gear from the Armory Shop using Gold Coins & Gems.</p>
              </div>
              <Link to="/shop" className="btn-gold px-5 py-2.5 text-xs font-black">
                Browse Armory Shop
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredItems.map((item: any) => {
                const activeEquippedAsset = profile?.selectedInventoryItems?.[item.category as keyof typeof profile.selectedInventoryItems];
                const isEquipped = activeEquippedAsset === item.assetUrl;

                return (
                  <div
                    key={item._id}
                    className={`glass-card p-5 flex flex-col justify-between gap-4 transition-all relative overflow-hidden group border-slate-800 ${
                      isEquipped ? 'border-cyan-500/60 bg-cyan-950/10 shadow-lg shadow-cyan-500/10' : 'hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="aspect-square bg-slate-950/80 rounded-2xl flex items-center justify-center text-5xl border border-slate-800 relative overflow-hidden group-hover:scale-105 transition-all duration-300">
                        {item.category === 'helmet' ? '🪖' : item.category === 'weapon' ? '✏️' : item.category === 'outfit' ? '👕' : '🖼️'}
                        
                        <span className="absolute bottom-2 left-2 text-[9px] bg-slate-900 text-slate-400 font-extrabold px-2 py-0.5 rounded border border-slate-800 uppercase tracking-widest">
                          {item.category}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <h3 className="font-extrabold text-sm text-slate-200 line-clamp-1">{item.name}</h3>
                        <span className="text-[10px] text-slate-500 font-bold">Unlocked Equipment</span>
                      </div>
                    </div>

                    <div>
                      {isEquipped ? (
                        <button
                          onClick={() => handleUnequip(item.category)}
                          className="flex items-center justify-center gap-1.5 py-2.5 bg-cyan-500/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 text-cyan-400 border border-cyan-500/40 text-xs font-black rounded-xl w-full transition-all"
                        >
                          <Check className="h-4 w-4 stroke-[3]" /> EQUIPPED (Click to Unequip)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEquip(item._id, item.category)}
                          className="btn-gold w-full text-xs py-2.5 font-black flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <Sparkles className="h-4 w-4" /> Equip Gear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
