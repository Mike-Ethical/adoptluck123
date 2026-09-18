import { Pet, PetCategory, PetDemand, PetRarity } from '../types';
import rawAmvggCatalog from './amvggCatalog.json';

export interface AmvggRawItem {
  id: string;
  itemId?: string;
  name: string;
  rarity: string;
  image: string;
  proxyImage?: string;
  value: number;
  frostValue?: number;
  neonValue?: number;
  megaValue?: number;
  demand?: number;
  category?: string;
  origin?: string;
}

function mapRarity(r: string): PetRarity {
  switch (r) {
    case 'Legendary':
      return 'Legendary';
    case 'Ultra-Rare':
      return 'Ultra-Rare';
    case 'Rare':
      return 'Rare';
    case 'Uncommon':
      return 'Uncommon';
    default:
      return 'Common';
  }
}

function mapDemand(d?: number): PetDemand {
  if (typeof d !== 'number') return 'High';
  if (d >= 8) return 'Extreme';
  if (d >= 6) return 'High';
  if (d >= 4) return 'Decent';
  if (d >= 2) return 'Medium';
  return 'Low';
}

function mapCategory(item: AmvggRawItem): PetCategory {
  if (item.value >= 100) return 'High Tier';
  if (item.value >= 15) return 'Mid Tier';
  if (item.name.toLowerCase().includes('egg')) return 'Eggs & Gifts';
  if (item.rarity === 'Legendary') return 'Mid Tier';
  return 'Low Tier';
}

// Convert all extracted AMVGG items into typed Pet records (values 1 or higher only)
export function generateFullAmvggCatalog(): Pet[] {
  return (rawAmvggCatalog as AmvggRawItem[])
    .filter((item) => typeof item.value === 'number' && item.value >= 1)
    .map((item) => ({
      id: item.id || `amvgg-${item.itemId || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: item.name,
      // Always route to AMVGG item image via proxy to guarantee valid webp image load
      image: item.itemId ? `/api/adoptme/item-image/${item.itemId}` : (item.image || ''),
      rarity: mapRarity(item.rarity),
      value: Math.max(1, Math.round(item.value * 10) / 10),
      neonValue: typeof item.neonValue === 'number' ? Math.round(item.neonValue * 10) / 10 : undefined,
      megaValue: typeof item.megaValue === 'number' ? Math.round(item.megaValue * 10) / 10 : undefined,
      frostValue: typeof item.frostValue === 'number' ? item.frostValue : undefined,
      demand: mapDemand(item.demand),
      neon: true,
      mega: true,
      fly: true,
      ride: true,
      category: mapCategory(item),
      lastUpdated: new Date().toISOString(),
    }));
}

export const initialPets: Pet[] = generateFullAmvggCatalog();

export function getPetImageUrl(name: string, fallback?: string): string {
  const norm = name.trim().toLowerCase();
  const found = initialPets.find((p) => p.name.toLowerCase() === norm);
  if (found && found.image) return found.image;
  const partial = initialPets.find((p) => p.name.toLowerCase().includes(norm) || norm.includes(p.name.toLowerCase()));
  if (partial && partial.image) return partial.image;
  return fallback || '/api/adoptme/item-image/1';
}

// Compute pet value with AMVGG True Values (Neon, Mega, Fly, Ride)
export function calculatePetItemValue(
  baseValueOrPet: number | Pet,
  variant: 'Normal' | 'Neon' | 'Mega' = 'Normal',
  fly: boolean = false,
  ride: boolean = false,
  petNameOrId?: string
): number {
  let baseVal = 1;
  let targetPet: Pet | undefined;

  if (typeof baseValueOrPet === 'object' && baseValueOrPet !== null) {
    targetPet = baseValueOrPet;
    baseVal = targetPet.value;
  } else if (typeof baseValueOrPet === 'number') {
    baseVal = baseValueOrPet;
    if (petNameOrId) {
      const norm = petNameOrId.trim().toLowerCase();
      targetPet = initialPets.find((p) => p.name.toLowerCase() === norm || p.id === petNameOrId);
    }
  }

  // 1. Base value based on true AMVGG variant
  let variantVal = baseVal;
  if (targetPet) {
    if (variant === 'Neon') {
      variantVal = targetPet.neonValue ?? Math.round(baseVal * 3.8 * 10) / 10;
    } else if (variant === 'Mega') {
      variantVal = targetPet.megaValue ?? Math.round(baseVal * 15.2 * 10) / 10;
    } else {
      variantVal = targetPet.value;
    }
  } else {
    if (variant === 'Neon') {
      variantVal = Math.round(baseVal * 3.8 * 10) / 10;
    } else if (variant === 'Mega') {
      variantVal = Math.round(baseVal * 15.2 * 10) / 10;
    } else {
      variantVal = baseVal;
    }
  }

  // 2. Add true AMVGG potions (Fly / Ride)
  let potionBonus = 0;
  if (variantVal < 100) {
    if (fly) potionBonus += 1.2;
    if (ride) potionBonus += 0.8;
  } else {
    // For high tier pets (>= 100 value), standard AMVGG catalog values already reflect FR
    if (fly && !ride) potionBonus += 0.5;
    if (ride && !fly) potionBonus += 0.3;
  }

  return Math.max(1, Math.round((variantVal + potionBonus) * 10) / 10);
}
