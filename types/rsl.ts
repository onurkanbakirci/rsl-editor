// RSL data structure from API
export interface RSL {
  id: string;
  websiteUrl: string;
  xmlContent?: string;
  createdAt: string;
  updatedAt: string;
}

// Extended RSL interface for card component props
export interface RSLCardProps {
  rsl: RSL;
  onDelete?: (rsl: RSL) => void;
  onCardClick?: (rsl: RSL) => void;
  className?: string;
}
