/**
 * Renderiq mascot messages with Japanese kaomojis
 * Messages change at specific stages: 0%, 25%, 50%, 90%
 */
export function getRenderiqMessage(
  progress: number,
  isVideo: boolean = false,
  failed: boolean = false
): string {
  if (failed) {
    const failedMessages = [
      "Oops! I tripped (´･ω･`) Retrying...",
      "My bad! Dropped it (´；ω；`) One sec!",
      "Whoops! Got distracted (´∀｀) Again!",
      "Sorry I fell! Trying now (＾▽＾)",
      "Fumbled it! Let me fix that (´･_･`)"
    ];
    return failedMessages[Math.floor(Math.random() * failedMessages.length)];
  }

  // Stage 1: 0-24% - Starting
  if (progress < 25) {
    const startMessages = [
      "Asking viz lords... (◕‿◕)",
      "Running to AI... (｡◕‿◕｡)",
      "Delivering prompt... (＾ω＾)",
      "Summoning magic... (≧▽≦)",
      "Knocking on AI door... (◕‿-｡)",
      "Waking up the AI... (´∀｀) zzz",
      "Bribing the algorithm... (¬‿¬)"
    ];
    return startMessages[Math.floor(Math.random() * startMessages.length)];
  } 
  // Stage 2: 25-49% - Working
  else if (progress < 50) {
    const midMessages = [
      "Viz lords working... (◕‿◕)",
      "Cooking render... (＾▽＾)",
      "AI thinking... (´･ω･`)",
      "Making it pretty... (｡◕‿◕｡)",
      "Adding sparkles... (≧▽≦)",
      "Pixels assembling... (◕‿-｡)",
      "Magic happening... (＾ω＾)"
    ];
    return midMessages[Math.floor(Math.random() * midMessages.length)];
  } 
  // Stage 3: 50-89% - Almost there
  else if (progress < 90) {
    const lateMessages = [
      "Almost done! (◕‿◕)",
      "Final touches... (＾▽＾)",
      "On my way back... (｡◕‿◕｡)",
      "Polishing... (≧▽≦)",
      "Just a sec... (´∀｀)",
      "Almost there! (◕‿-｡)",
      "Wrapping up... (＾ω＾)"
    ];
    return lateMessages[Math.floor(Math.random() * lateMessages.length)];
  } 
  // Stage 4: 90-100% - Final
  else {
    const finalMessages = [
      "Almost there! (≧▽≦)",
      "One last check... (◕‿◕)",
      "Wrapping it up... (＾▽＾)",
      "Final polish... (｡◕‿◕｡)",
      "Almost ready! (◕‿-｡)",
      "Just finishing... (＾ω＾)",
      "Last touches... (´∀｀)"
    ];
    return finalMessages[Math.floor(Math.random() * finalMessages.length)];
  }
}

