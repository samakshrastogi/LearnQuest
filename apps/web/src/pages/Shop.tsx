import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useAuthStore } from '../store/auth';
import { 
  ShoppingBag, 
  Coins, 
  Gem, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  Star, 
  Layers, 
  Shirt, 
  Crown, 
  Feather, 
  Zap, 
  Gift, 
  X, 
  Check, 
  Flame,
  Award
} from 'lucide-react';

export default function Shop() {
  const { profile, updateWallet, updateEquippedItems } = useAuthStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inspectItem, setInspectItem] = useState<any | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  // Mystery Chest Modal
  const [showChestModal, setShowChestModal] = useState(false);
  const [unboxing, setUnboxing] = useState(false);
  const [chestReward, setChestReward] = useState<any | null>(null);

  // 1. Fetch Shop items
  const { data: shopItems = [], isLoading, refetch: refetchShop } = useQuery({
    queryKey: ['shopItems'],
    queryFn: async () => {
      const res = await api.get('/students/shop');
      return res.data.data;
    },
  });

  // 2. Fetch User Inventory
  const { data: ownedItems = [], refetch: refetchOwned } = useQuery({
    queryKey: ['ownedItems'],
    queryFn: async () => {
      const res = await api.get('/students/inventory');
      return res.data.data;
    },
  });

  const level = profile ? Math.floor(profile.xp / 1000) + 1 : 1;

  // Show Toast helper
  const triggerToast = (title: string, desc: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Purchase
  const handlePurchase = async (item: any) => {
    try {
      await api.post('/students/purchase', { itemId: item._id });
      
      triggerToast('🎉 Purchase Successful!', `Unlocked ${item.name}`);

      // Deduct coins & gems in Zustand store
      const updatedCoins = Math.max(0, profile.coins - (item.priceCoins || 0));
      const updatedGems = Math.max(0, profile.gems - (item.priceGems || 0));
      
      updateWallet({
        xp: profile.xp,
        coins: updatedCoins,
        gems: updatedGems,
        energy: profile.energy,
      });

      refetchShop();
      refetchOwned();
      setInspectItem(null);
    } catch (err: any) {
      triggerToast('❌ Purchase Failed', err.response?.data?.message || 'Insufficient funds or level requirement.');
    }
  };

  // Handle Instant Equip from Shop
  const handleEquip = async (item: any) => {
    try {
      const res = await api.post('/students/equip', {
        itemId: item._id,
        category: item.category,
      });
      
      updateEquippedItems(res.data.data);
      triggerToast('✨ Item Equipped!', `${item.name} is now active on your avatar.`);
      setInspectItem(null);
    } catch (err: any) {
      triggerToast('❌ Equip Failed', err.response?.data?.message || 'Could not equip item.');
    }
  };

  // Open Mystery Chest
  const handleOpenMysteryChest = async () => {
    if (profile.coins < 50 && profile.gems < 5) {
      triggerToast('❌ Insufficient Currency', 'Opening a Mystery Chest costs 50 Coins or 5 Gems.');
      return;
    }

    setUnboxing(true);
    setChestReward(null);
    setShowChestModal(true);

    setTimeout(() => {
      // Pick random loot
      const rewardsList = [
        { type: 'coins', amount: 100, label: '100 Gold Coins', icon: '🪙' },
        { type: 'gems', amount: 10, label: '10 Magic Gems', icon: '💎' },
        { type: 'xp', amount: 300, label: '300 XP Booster', icon: '⚡' },
      ];
      const randomReward = rewardsList[Math.floor(Math.random() * rewardsList.length)];
      
      if (randomReward.type === 'coins') {
        updateWallet({ xp: profile.xp, coins: profile.coins + randomReward.amount, gems: profile.gems, energy: profile.energy });
      } else if (randomReward.type === 'gems') {
        updateWallet({ xp: profile.xp, coins: profile.coins, gems: profile.gems + randomReward.amount, energy: profile.energy });
      } else if (randomReward.type === 'xp') {
        updateWallet({ xp: profile.xp + randomReward.amount, coins: profile.coins, gems: profile.gems, energy: profile.energy });
      }

      setChestReward(randomReward);
      setUnboxing(false);
    }, 2000);
  };

  // Filter items by category
  const filteredItems = shopItems.filter((item: any) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  // Helper to determine item rarity
  const getItemRarity = (item: any) => {
    if (item.priceGems >= 10 || item.requiredLevel >= 5) return { name: 'Legendary', color: 'border-amber-400 bg-amber-500/15 text-amber-400 shadow-amber-500/20' };
    if (item.priceGems >= 5 || item.requiredLevel >= 3) return { name: 'Epic', color: 'border-purple-400 bg-purple-500/15 text-purple-400 shadow-purple-500/20' };
    if (item.priceCoins >= 100 || item.requiredLevel >= 2) return { name: 'Rare', color: 'border-cyan-400 bg-cyan-500/15 text-cyan-400 shadow-cyan-500/20' };
    return { name: 'Common', color: 'border-slate-700 bg-slate-800 text-slate-400' };
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-gold"></div>
        <p className="text-slate-400 font-medium">Opening Rewards Shop...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 p-4 md:p-6 relative">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-amber-500/30 text-slate-100 p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-bounce">
          <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <h4 className="font-extrabold text-xs text-amber-400">{toastMessage.title}</h4>
            <p className="text-xs text-slate-300">{toastMessage.desc}</p>
          </div>
        </div>
      )}

      {/* 1. Header Banner with Wallet & Mystery Chest Launcher */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 border-amber-500/20 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-accent-gold shadow-lg shadow-amber-500/10">
            <ShoppingBag className="h-8 w-8 animate-pulse-glow" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
              Rewards Shop & Armory
              <span className="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Level {level} Student
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Unlock avatars, power-ups, gear, and rare titles with your earned Coins and Gems!
            </p>
          </div>
        </div>

        {/* Right side: Wallet + Mystery Chest */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Wallet Coins & Gems */}
          <div className="flex items-center gap-4 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3">
              <Coins className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="font-black text-sm text-slate-200">{profile?.coins || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gem className="h-4 w-4 text-purple-400 fill-purple-400" />
              <span className="font-black text-sm text-slate-200">{profile?.gems || 0}</span>
            </div>
          </div>

          {/* Mystery Chest Button */}
          <button
            onClick={handleOpenMysteryChest}
            className="btn-gold px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transform hover:scale-105 transition-all"
          >
            <Gift className="h-4 w-4 animate-bounce" />
            <span>Mystery Chest</span>
          </button>
        </div>
      </div>

      {/* 2. Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800 backdrop-blur-md">
        {[
          { id: 'all', label: 'All Gear', icon: Layers },
          { id: 'outfit', label: 'Outfits', icon: Shirt },
          { id: 'helmet', label: 'Helmets', icon: Crown },
          { id: 'weapon', label: 'Magic Pens', icon: Feather },
          { id: 'powerup', label: 'Power-Ups', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Items Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredItems.map((item: any) => {
          const isOwned = ownedItems.some((owned: any) => owned._id === item._id);
          const isLevelLocked = level < item.requiredLevel;
          const isAffordable = (profile?.coins || 0) >= item.priceCoins && (profile?.gems || 0) >= item.priceGems;
          const rarity = getItemRarity(item);

          return (
            <div
              key={item._id}
              onClick={() => setInspectItem(item)}
              className={`glass-card p-5 flex flex-col justify-between gap-4 transition-all cursor-pointer relative overflow-hidden group border-slate-800 hover:border-amber-500/40 hover:scale-[1.02] shadow-xl ${
                isLevelLocked ? 'opacity-60' : ''
              }`}
            >
              {/* Rarity Ribbon Badge */}
              <div className="flex items-center justify-between z-10">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${rarity.color} uppercase tracking-wider`}>
                  {rarity.name}
                </span>

                {isOwned && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Check className="h-3 w-3 stroke-[3]" /> Owned
                  </span>
                )}
              </div>

              {/* Item Canvas Preview */}
              <div className="aspect-square bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden group-hover:border-amber-500/30 transition-all">
                <span className="text-5xl transform group-hover:scale-125 transition-all duration-300">
                  {item.category === 'helmet' ? '🪖' : item.category === 'weapon' ? '✏️' : item.category === 'outfit' ? '👕' : item.category === 'powerup' ? '⚡' : '🖼️'}
                </span>
                
                <span className="absolute bottom-2 left-2 text-[9px] bg-slate-900/90 text-slate-400 font-extrabold px-2 py-0.5 rounded border border-slate-800 uppercase tracking-widest">
                  {item.category}
                </span>
              </div>

              {/* Title & Level requirement */}
              <div className="flex flex-col gap-1">
                <h3 className="font-extrabold text-sm text-slate-200 line-clamp-1 group-hover:text-amber-400 transition-colors">
                  {item.name}
                </h3>
                
                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                  <Award className="h-3 w-3 text-slate-400" />
                  Requires Level {item.requiredLevel}
                </span>
              </div>

              {/* Price & Action button */}
              <div className="pt-2 border-t border-slate-800/80">
                {isOwned ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEquip(item);
                    }}
                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-black text-xs py-2.5 rounded-xl border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="h-4 w-4" /> Equip Gear
                  </button>
                ) : isLevelLocked ? (
                  <div className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 text-slate-600 text-xs font-bold rounded-xl border border-slate-800 w-full">
                    Locked (Lvl {item.requiredLevel})
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(item);
                    }}
                    disabled={!isAffordable}
                    className="btn-gold w-full text-xs py-2.5 font-black flex items-center justify-center gap-2 shadow-md disabled:opacity-40"
                  >
                    <span>Unlock</span>
                    {item.priceCoins > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Coins className="h-3.5 w-3.5 fill-slate-950 text-slate-950" /> {item.priceCoins}
                      </span>
                    )}
                    {item.priceGems > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Gem className="h-3.5 w-3.5 fill-slate-950 text-slate-950" /> {item.priceGems}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Item Inspector Preview Modal Dialog */}
      {inspectItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card p-6 flex flex-col gap-6 relative border-amber-500/20 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getItemRarity(inspectItem).color} uppercase`}>
                  {getItemRarity(inspectItem).name}
                </span>
                <h3 className="font-black text-sm text-slate-100">{inspectItem.name}</h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Artwork Frame */}
            <div className="aspect-video bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col items-center justify-center gap-2 relative overflow-hidden shadow-inner">
              <span className="text-6xl animate-bounce-slow">
                {inspectItem.category === 'helmet' ? '🪖' : inspectItem.category === 'weapon' ? '✏️' : inspectItem.category === 'outfit' ? '👕' : inspectItem.category === 'powerup' ? '⚡' : '🖼️'}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                {inspectItem.category} GEAR
              </span>
            </div>

            {/* RPG Stat Boost Indicators */}
            <div className="flex flex-col gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                Gear Attributes & Stat Boosts
              </span>
              
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold">Required Level:</span>
                <span className="font-black text-cyan-400">Level {inspectItem.requiredLevel}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold">XP Bonus Multiplier:</span>
                <span className="font-black text-emerald-400">+10% XP Boost</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold">Streak Protection:</span>
                <span className="font-black text-amber-400">+1 Shield Active</span>
              </div>
            </div>

            {/* Action Buttons */}
            {ownedItems.some((o: any) => o._id === inspectItem._id) ? (
              <button
                onClick={() => handleEquip(inspectItem)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" /> Equip Now
              </button>
            ) : (
              <button
                onClick={() => handlePurchase(inspectItem)}
                disabled={(profile?.coins || 0) < inspectItem.priceCoins || (profile?.gems || 0) < inspectItem.priceGems || level < inspectItem.requiredLevel}
                className="btn-gold w-full py-3.5 font-black text-xs flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <span>Unlock Item</span>
                {inspectItem.priceCoins > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Coins className="h-4 w-4 fill-slate-950" /> {inspectItem.priceCoins}
                  </span>
                )}
                {inspectItem.priceGems > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Gem className="h-4 w-4 fill-slate-950" /> {inspectItem.priceGems}
                  </span>
                )}
              </button>
            )}

          </div>
        </div>
      )}

      {/* 5. Mystery Chest Unboxing Modal */}
      {showChestModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-card p-8 text-center flex flex-col items-center gap-6 relative border-amber-500/30 shadow-2xl">
            
            <button
              onClick={() => setShowChestModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>

            {unboxing ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Gift className="h-16 w-16 text-amber-400 animate-bounce" />
                <h3 className="font-black text-lg text-slate-100">Unboxing Mystery Chest...</h3>
                <p className="text-xs text-slate-400">Revealing rare student rewards!</p>
              </div>
            ) : chestReward ? (
              <div className="flex flex-col items-center gap-5 py-4">
                <span className="text-6xl animate-bounce">{chestReward.icon}</span>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Loot Unlocked!
                  </span>
                  <h3 className="text-xl font-black text-slate-100">{chestReward.label}</h3>
                </div>
                <button
                  onClick={() => setShowChestModal(false)}
                  className="btn-gold px-8 py-3 text-xs font-black"
                >
                  Collect Loot
                </button>
              </div>
            ) : null}

          </div>
        </div>
      )}

    </div>
  );
}
