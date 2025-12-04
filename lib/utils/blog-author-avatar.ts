/**
 * Get the avatar path for a blog author based on their name/initial
 * Falls back to 'a.svg' if no author name is provided
 * 
 * @param authorName - The author's name (can be authorName or author field)
 * @returns The path to the author's avatar SVG
 */
export function getBlogAuthorAvatar(authorName?: string | null): string {
  if (!authorName || authorName.trim() === '') {
    return '/blog/author/a.svg';
  }

  // Extract the first letter and convert to uppercase
  const initial = authorName.trim().charAt(0).toUpperCase();
  
  // Validate that it's a letter (A-Z)
  if (!/^[A-Z]$/.test(initial)) {
    return '/blog/author/a.svg';
  }

  return `/blog/author/${initial.toLowerCase()}.svg`;
}

/**
 * Get the author's initial for display purposes
 * 
 * @param authorName - The author's name
 * @returns The uppercase initial letter
 */
export function getBlogAuthorInitial(authorName?: string | null): string {
  if (!authorName || authorName.trim() === '') {
    return 'A';
  }

  const initial = authorName.trim().charAt(0).toUpperCase();
  
  // Validate that it's a letter (A-Z)
  if (!/^[A-Z]$/.test(initial)) {
    return 'A';
  }

  return initial;
}

