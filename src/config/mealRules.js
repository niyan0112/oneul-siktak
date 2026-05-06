export const menuNameRules = {
  bannedWords: ['스타일'],
  replacements: [
    { from: '순대국밥 스타일 국물', to: '순대국밥' },
    { from: '순대국밥 스타일', to: '순대국밥' },
    { from: '순대국밥 국물', to: '순대국밥' },
    { from: '닭개장 스타일 국물', to: '닭개장' },
    { from: '닭개장 스타일 국', to: '닭개장' },
    { from: '참치비빔밥 스타일', to: '참치비빔밥' },
    { from: '국물', to: '국' },
  ],
};

export const mealPlanningRules = {
  maxCookingTimeMinutes: 60,

  soupRules: {
    keywords: ['국', '찌개', '탕', '전골'],
    canRepeatConsecutively: true,
    maxConsecutiveDays: 2,
    preferConsecutivePlacement: true,
    preferredPatterns: ['day1-day2', 'day2-day3'],
  },

  repetitionRules: {
    avoidSameMainDishInSameWeek: true,
    avoidSameMainDishInSameMonth: true,
    allowSameSoupForTwoDays: true,
  },
};
