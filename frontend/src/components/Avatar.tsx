// import React from "react";

// interface AvatarProps {
//   name: string;
//   className?: string;
// }

// /**
//  * A reusable circular avatar component that displays the first letter of a name.
//  */
// const Avatar: React.FC<AvatarProps> = ({ name, className }) => {
//   const initial = name ? name.charAt(0).toUpperCase() : "?";
//   return (
//     <div
//       className={`flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary select-none ${className}`}
//     >
//       <span className="text-xl font-bold">{initial}</span>
//     </div>
//   );
// };

// export default Avatar;

// --- src/components/Avatar.tsx (Updated) ---
import React from "react";

interface AvatarProps {
  name: string;
  className?: string;
  isOnline?: boolean; // New optional prop
}

const Avatar: React.FC<AvatarProps> = ({ name, className, isOnline }) => {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary select-none">
        <span className="text-xl font-bold">{initial}</span>
      </div>
      {isOnline && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
      )}
    </div>
  );
};
export default Avatar;
