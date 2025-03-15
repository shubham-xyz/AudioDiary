export interface MotivationEntry {
  date: string;
  level: number;
  label: string;
}

export const getMotivationLabel = (level: number): string => {
  switch (level) {
    case 1:
      return 'Very Low';
    case 2:
      return 'Low';
    case 3:
      return 'Moderate';
    case 4:
      return 'High';
    case 5:
      return 'Very High';
    default:
      return 'Unknown';
  }
}; 