export interface Quote { text: string; author: string; }

const QUOTES: Quote[] = [
  { text: "Every application is a rep. The work compounds even on days it doesn't feel like it.", author: "" },
  { text: "You don't need a perfect week. You need to not skip two days in a row.", author: "" },
  { text: "Rejection is data, not a verdict.", author: "" },
  { text: "The search rewards whoever keeps showing up after it stops being fun.", author: "" },
  { text: "Progress here is invisible until it isn't.", author: "" },
  { text: "One more application than yesterday is still a trend.", author: "" },
  { text: "A slow week isn't a lost week if you didn't stop.", author: "" },
  { text: "You can't control the callback. You can control whether you sent the application.", author: "" },
  { text: "Consistency beats intensity when the timeline is measured in months, not days.", author: "" },
  { text: "The version of you three weeks in has more evidence to work with than the version today.", author: "" },
  { text: "Nobody sees the applications that didn't get a reply. Send them anyway.", author: "" },
  { text: "Momentum is just yesterday's effort, still moving.", author: "" },
  { text: "A tracker only works if you keep feeding it. So does a search.", author: "" },
  { text: "The right offer doesn't care how many wrong ones came before it.", author: "" },
  { text: "Some days the goal is just not breaking the streak.", author: "" },
  { text: "Burnout comes from intensity without rest, not from steady effort.", author: "" },
  { text: "You're not behind. You're mid-process.", author: "" },
  { text: "A closed door is information, not a dead end.", author: "" },
  { text: "The search has no leaderboard. Compare today to yesterday, not to anyone else's timeline.", author: "" },
  { text: "Small daily effort is the whole strategy. Everything else is decoration.", author: "" },
];

export function getCachedQuoteOfTheDay(): Quote {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - start) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}
