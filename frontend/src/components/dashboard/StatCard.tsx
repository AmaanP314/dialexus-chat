import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  onClick?: () => void;
  isActive?: boolean;
}

export const StatCardSkeleton = () => (
  <div className="bg-background p-6 rounded-lg border border-border animate-pulse">
    <div className="h-8 w-8 bg-muted rounded-md mb-4"></div>
    <div className="h-4 w-3/4 bg-muted rounded mb-2"></div>
    <div className="h-8 w-1/2 bg-muted rounded"></div>
  </div>
);

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  onClick,
  isActive,
}) => {
  const cardClasses = `bg-background p-6 rounded-lg border transition-all duration-300 ${
    onClick ? "cursor-pointer hover:border-primary" : ""
  } ${isActive ? "border-primary ring-2 ring-primary/50" : "border-border"}`;

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="p-2 bg-muted rounded-md">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
    </div>
  );
};
export default StatCard;
