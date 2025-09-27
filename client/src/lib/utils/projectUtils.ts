/**
 * Utility functions for project management
 */

const backgroundColors = [
  'bg-gradient-to-br from-orange-400 to-red-500',
  'bg-gradient-to-br from-gray-700 to-gray-900',
  'bg-gradient-to-br from-blue-500 to-purple-600',
  'bg-gradient-to-br from-green-400 to-blue-500',
  'bg-gradient-to-br from-purple-400 to-pink-500',
  'bg-gradient-to-br from-yellow-400 to-orange-500',
];

/**
 * Returns a random background color from the predefined set
 */
export function getRandomBackgroundColor(): string {
  return backgroundColors[Math.floor(Math.random() * backgroundColors.length)];
}

/**
 * Formats a date into a human-readable time ago string
 * @param date - The date to format
 * @returns A formatted string like "2 days ago" or "Just now"
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Project categories configuration
 */
export const categories = [
  { id: 'web', label: 'Web app' },
  { id: 'data', label: 'Data app' },
  { id: 'game', label: '3D Game' },
  { id: 'general', label: 'General' },
  { id: 'agents', label: 'Agents & Automations', badge: 'Beta' as const },
] as const;

export type CategoryId = typeof categories[number]['id'];