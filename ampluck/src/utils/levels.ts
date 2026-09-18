export interface LevelInfo {
  level: number;
  currentXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  tierName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  glowColor: string;
  iconName: string;
}

// XP = totalWageredValue * 10
// XP required to reach Level L: formula with progressive scaling
export function getXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  // Level 2: 50 XP (5 Val wagered)
  // Level 5: 500 XP (50 Val wagered)
  // Level 10: 2,500 XP (250 Val wagered)
  // Level 25: 20,000 XP (2,000 Val wagered)
  // Level 50: 100,000 XP (10,000 Val wagered)
  // Level 100: 500,000 XP (50,000 Val wagered)
  return Math.floor(40 * Math.pow(level - 1, 1.75));
}

export function calculateLevel(totalWageredVal: number = 0): LevelInfo {
  const totalXp = Math.max(0, Math.floor((totalWageredVal || 0) * 10));

  let level = 1;
  while (getXpRequiredForLevel(level + 1) <= totalXp && level < 999) {
    level++;
  }

  const currentLevelBaseXp = getXpRequiredForLevel(level);
  const nextLevelBaseXp = getXpRequiredForLevel(level + 1);
  const neededInLevel = Math.max(1, nextLevelBaseXp - currentLevelBaseXp);
  const earnedInLevel = Math.max(0, totalXp - currentLevelBaseXp);
  const progressPercent = Math.min(100, Math.max(0, Math.round((earnedInLevel / neededInLevel) * 100)));

  let tierName = 'Bronze';
  let badgeBg = 'bg-[#182030]';
  let badgeText = 'text-slate-300';
  let badgeBorder = 'border-slate-600';
  let glowColor = 'rgba(148, 163, 184, 0.2)';
  let iconName = 'fa-shield';

  if (level >= 100) {
    tierName = 'Legendary';
    badgeBg = 'bg-gradient-to-r from-amber-400 to-yellow-300';
    badgeText = 'text-slate-950 font-black';
    badgeBorder = 'border-amber-300';
    glowColor = 'rgba(245, 158, 11, 0.6)';
    iconName = 'fa-crown';
  } else if (level >= 75) {
    tierName = 'Ruby Grandmaster';
    badgeBg = 'bg-rose-950/80';
    badgeText = 'text-rose-300';
    badgeBorder = 'border-rose-500';
    glowColor = 'rgba(244, 63, 94, 0.4)';
    iconName = 'fa-gem';
  } else if (level >= 50) {
    tierName = 'Diamond High Roller';
    badgeBg = 'bg-purple-950/80';
    badgeText = 'text-purple-300';
    badgeBorder = 'border-purple-500';
    glowColor = 'rgba(168, 85, 247, 0.4)';
    iconName = 'fa-diamond';
  } else if (level >= 25) {
    tierName = 'Sapphire VIP';
    badgeBg = 'bg-cyan-950/80';
    badgeText = 'text-cyan-300';
    badgeBorder = 'border-cyan-400';
    glowColor = 'rgba(34, 211, 238, 0.35)';
    iconName = 'fa-bolt';
  } else if (level >= 10) {
    tierName = 'Emerald Pro';
    badgeBg = 'bg-blue-950/80';
    badgeText = 'text-blue-300';
    badgeBorder = 'border-blue-500';
    glowColor = 'rgba(16, 185, 129, 0.35)';
    iconName = 'fa-star';
  } else if (level >= 5) {
    tierName = 'Gold';
    badgeBg = 'bg-amber-950/60';
    badgeText = 'text-amber-300';
    badgeBorder = 'border-amber-600/80';
    glowColor = 'rgba(245, 158, 11, 0.25)';
    iconName = 'fa-medal';
  } else if (level >= 2) {
    tierName = 'Silver';
    badgeBg = 'bg-[#1b2538]';
    badgeText = 'text-slate-200';
    badgeBorder = 'border-slate-500';
    glowColor = 'rgba(203, 213, 225, 0.2)';
    iconName = 'fa-shield';
  }

  return {
    level,
    currentXp: totalXp,
    currentLevelXp: earnedInLevel,
    nextLevelXp: neededInLevel,
    progressPercent,
    tierName,
    badgeBg,
    badgeText,
    badgeBorder,
    glowColor,
    iconName,
  };
}
