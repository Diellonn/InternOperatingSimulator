const keyFor = (userId: number) => `profile_photo_url_${userId}`;

export const getCachedProfilePhoto = (userId?: number | null): string | null => {
  if (!userId || userId <= 0) return null;
  return localStorage.getItem(keyFor(userId));
};

export const setCachedProfilePhoto = (userId: number, url?: string | null) => {
  if (!userId || userId <= 0) return;
  if (!url) {
    localStorage.removeItem(keyFor(userId));
    return;
  }
  localStorage.setItem(keyFor(userId), url);
};

