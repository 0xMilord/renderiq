/**
 * Smart Blog Recommendation Algorithm
 * Combines content-based filtering with diversity/randomness
 * Uses TF-IDF-like scoring, tag similarity, category matching, and recency
 */

interface Blog {
  slug: string;
  title: string;
  excerpt?: string;
  tags?: string[];
  category?: string;
  collection?: string;
  publishedAt?: string;
  body?: {
    raw?: string;
  };
}

interface ScoredBlog extends Blog {
  score: number;
  reasons: string[];
}

/**
 * Calculate text similarity using simple word overlap
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(
    text1
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
  const words2 = new Set(
    text2
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  // Jaccard similarity
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Calculate tag similarity score
 */
function calculateTagSimilarity(tags1: string[], tags2: string[]): number {
  if (!tags1.length || !tags2.length) return 0;

  const set1 = new Set(tags1.map((t) => t.toLowerCase()));
  const set2 = new Set(tags2.map((t) => t.toLowerCase()));

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Calculate recency score (newer articles get higher score)
 */
function calculateRecencyScore(publishedAt?: string): number {
  if (!publishedAt) return 0.1;

  try {
    const published = new Date(publishedAt).getTime();
    const now = Date.now();
    const daysSincePublished = (now - published) / (1000 * 60 * 60 * 24);

    // Exponential decay: articles older than 365 days get very low score
    if (daysSincePublished > 365) return 0.1;
    if (daysSincePublished > 180) return 0.3;
    if (daysSincePublished > 90) return 0.5;
    if (daysSincePublished > 30) return 0.7;
    return 1.0; // Very recent articles
  } catch {
    return 0.1;
  }
}

/**
 * Extract keywords from text (simple keyword extraction)
 */
function extractKeywords(text: string, maxKeywords = 20): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  // Simple frequency counting
  const frequency: Record<string, number> = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Smart recommendation algorithm
 * Returns 4 articles: 50% related (high similarity) + 50% diverse/random
 */
export function getSmartRecommendations(
  currentBlog: Blog,
  allBlogs: Blog[],
  count = 4
): Blog[] {
  // Filter out current blog
  const otherBlogs = allBlogs.filter((b) => b.slug !== currentBlog.slug);

  if (otherBlogs.length === 0) return [];

  // Extract features from current blog
  const currentTitle = currentBlog.title || '';
  const currentExcerpt = currentBlog.excerpt || '';
  const currentBody = currentBlog.body?.raw || '';
  const currentText = `${currentTitle} ${currentExcerpt} ${currentBody}`.substring(0, 2000);
  const currentKeywords = extractKeywords(currentText);
  const currentTags = currentBlog.tags || [];
  const currentCategory = currentBlog.category || currentBlog.collection || '';

  // Score all blogs
  const scoredBlogs: ScoredBlog[] = otherBlogs.map((blog) => {
    const reasons: string[] = [];
    let score = 0;

    // 1. Tag similarity (weight: 40%)
    const tagSimilarity = calculateTagSimilarity(currentTags, blog.tags || []);
    if (tagSimilarity > 0) {
      score += tagSimilarity * 0.4;
      reasons.push(`${Math.round(tagSimilarity * 100)}% tag match`);
    }

    // 2. Category match (weight: 20%)
    const blogCategory = blog.category || blog.collection || '';
    if (blogCategory && blogCategory === currentCategory) {
      score += 0.2;
      reasons.push('Same category');
    }

    // 3. Title similarity (weight: 20%)
    const titleSimilarity = calculateTextSimilarity(currentTitle, blog.title || '');
    if (titleSimilarity > 0.1) {
      score += titleSimilarity * 0.2;
      reasons.push(`${Math.round(titleSimilarity * 100)}% title similarity`);
    }

    // 4. Content similarity (weight: 10%)
    const blogText = `${blog.title || ''} ${blog.excerpt || ''} ${blog.body?.raw || ''}`.substring(0, 2000);
    const contentSimilarity = calculateTextSimilarity(currentText, blogText);
    if (contentSimilarity > 0.1) {
      score += contentSimilarity * 0.1;
      reasons.push(`${Math.round(contentSimilarity * 100)}% content similarity`);
    }

    // 5. Recency boost (weight: 10%)
    const recencyScore = calculateRecencyScore(blog.publishedAt);
    score += recencyScore * 0.1;
    if (recencyScore > 0.7) {
      reasons.push('Recent article');
    }

    return {
      ...blog,
      score,
      reasons,
    };
  });

  // Sort by score (highest first)
  scoredBlogs.sort((a, b) => b.score - a.score);

  // Strategy: 50% related (top scored) + 50% diverse (random from remaining)
  const relatedCount = Math.ceil(count / 2);
  const diverseCount = count - relatedCount;

  // Get top related articles
  const relatedArticles = scoredBlogs.slice(0, Math.max(relatedCount * 2, 10));

  // Get diverse articles (from middle/lower scores, but not too low)
  const middleTier = scoredBlogs.slice(
    relatedCount,
    Math.min(relatedCount + diverseCount * 3, scoredBlogs.length)
  );

  // Shuffle for randomness
  const shuffledMiddleTier = [...middleTier].sort(() => Math.random() - 0.5);
  const diverseArticles = shuffledMiddleTier.slice(0, diverseCount);

  // Combine: alternate between related and diverse for better UX
  const recommendations: Blog[] = [];
  const related = relatedArticles.slice(0, relatedCount);
  const diverse = diverseArticles.slice(0, diverseCount);

  // Interleave related and diverse articles
  for (let i = 0; i < Math.max(related.length, diverse.length); i++) {
    if (i < related.length) {
      recommendations.push(related[i]);
    }
    if (i < diverse.length && recommendations.length < count) {
      recommendations.push(diverse[i]);
    }
  }

  // Ensure we have exactly 'count' articles
  if (recommendations.length < count) {
    const remaining = scoredBlogs
      .filter((b) => !recommendations.some((r) => r.slug === b.slug))
      .slice(0, count - recommendations.length);
    recommendations.push(...remaining);
  }

  return recommendations.slice(0, count);
}

