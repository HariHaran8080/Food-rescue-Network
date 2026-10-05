export const FOOD_TYPE_IMAGES: Record<string, string> = {
  'Cooked meals': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
  'Produce': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
  'Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
  'Dairy': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80',
  'Packaged goods': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
  'Other': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
};

export function getFoodImage(foodType?: string, customUrl?: string | null): string {
  if (customUrl && customUrl.trim().startsWith('http')) {
    return customUrl.trim();
  }
  if (!foodType) return FOOD_TYPE_IMAGES['Other'];
  return FOOD_TYPE_IMAGES[foodType] || FOOD_TYPE_IMAGES['Other'];
}

export function formatFriendlyDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear();

  const timeString = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) {
    return `Today at ${timeString}`;
  }
  if (isTomorrow) {
    return `Tomorrow at ${timeString}`;
  }

  const monthName = d.toLocaleDateString([], { month: 'short' });
  const day = d.getDate();
  return `${monthName} ${day} at ${timeString}`;
}
