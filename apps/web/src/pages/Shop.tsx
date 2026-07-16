import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { useAuthStore } from '../store/auth';
import { ShoppingBag, Coins, Gem, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Shop() {
  const { profile, updateWallet } = useAuthStore();

  // Fetch shop items
  const { data: shopItems, isLoading, refetch } = useQuery({
    queryKey: ['shopItems'],
    queryFn: async () => {
      const res = await api.get('/students/shop');
      return res.data.data;
    },
  });

  // Fetch owned items (to prevent buying duplicate items)
  const { data: ownedItems, refetch: refetchOwned } = useQuery({
    queryKey: ['ownedItems'],
    queryFn: async () => {
      const res = await api.get('/students/inventory');
      return res.data.data;
    },
  });

  const handlePurchase = async (itemId: string) => {
    try {
      const res = await api.post('/students/purchase', { itemId });
      alert('Item purchased successfully!');
      
      // Update coins/gems in state
      const updatedCoins = profile.coins - (shopItems?.find((i: any) => i._id === itemId)?.priceCoins || 0);
      const updatedGems = profile.gems - (shopItems?.find((i: any) => i._id === itemId)?.priceGems || 0);
      
      updateWallet({
        xp: profile.xp,
        coins: updatedCoins,
        gems: updatedGems,
        energy: profile.energy,
      });

      refetch();
      refetchOwned();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Purchase failed.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent-gold"></div>
        <p className="text-slate-400 font-medium">Loading Shop Catalog...</p>
      </div>
    );
  }

  const level = profile ? Math.floor(profile.xp / 1000) + 1 : 1;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      
      {/* Shop Header */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-900/80 to-amber-950/10 border-amber-500/10">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-accent-gold" />
          <div>
            <h1 className="text-2xl font-black font-sans">Avatar Armory</h1>
            <p className="text-xs text-slate-400">Upgrade your knight outfit and study tools</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/60 px-5 py-2.5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-1.5 border-r border-slate-800 pr-4">
            <Coins className="h-4 w-4 text-accent-gold fill-accent-gold" />
            <span className="font-extrabold text-sm text-slate-200">{profile?.coins}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gem className="h-4 w-4 text-accent-violet fill-accent-violet" />
            <span className="font-extrabold text-sm text-slate-200">{profile?.gems}</span>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {shopItems?.map((item: any) => {
          const isOwned = ownedItems?.some((owned: any) => owned._id === item._id);
          const isLevelLocked = level < item.requiredLevel;
          const isAffordable = profile.coins >= item.priceCoins && profile.gems >= item.priceGems;

          return (
            <div
              key={item._id}
              className={`glass-card p-5 flex flex-col justify-between gap-4 transition-all relative ${
                isLevelLocked ? 'opacity-60' : 'hover:scale-[1.01]'
              }`}
            >
              <div className="flex flex-col gap-3">
                {/* Item category card preview */}
                <div className="aspect-square bg-slate-950/60 rounded-2xl border border-slate-850 flex items-center justify-center relative overflow-hidden">
                  <span className="text-4xl">
                    {item.category === 'helmet' ? '🪖' : item.category === 'weapon' ? '✏️' : item.category === 'outfit' ? '👕' : '🖼️'}
                  </span>
                  <span className="absolute bottom-2 left-2 text-[9px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-bold tracking-widest text-slate-500 uppercase">
                    {item.category}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-slate-200 text-sm">{item.name}</h3>
                  <span className="text-[10px] text-slate-500">Requires Level {item.requiredLevel}</span>
                </div>
              </div>

              {/* Buying Actions */}
              <div>
                {isOwned ? (
                  <div className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500/10 text-accent-emerald text-xs font-bold rounded-xl border border-emerald-500/20 w-full">
                    <CheckCircle2 className="h-4 w-4" /> UNLOCKED
                  </div>
                ) : isLevelLocked ? (
                  <div className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 text-slate-500 text-xs font-bold rounded-xl border border-slate-700/50 w-full">
                    LOCKED (LVL {item.requiredLevel})
                  </div>
                ) : (
                  <button
                    onClick={() => handlePurchase(item._id)}
                    disabled={!isAffordable}
                    className="btn-gold w-full text-xs py-2.5 flex items-center justify-center gap-1.5 shadow-md disabled:opacity-40"
                  >
                    Buy (
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
                    )
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
