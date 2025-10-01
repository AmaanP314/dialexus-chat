// import React from "react";

// interface AvatarProps {
//   name: string;
//   className?: string;
//   isOnline?: boolean;
// }

// const Avatar: React.FC<AvatarProps> = ({ name, className, isOnline }) => {
//   const initial = name ? name.charAt(0).toUpperCase() : "?";
//   return (
//     <div
//       className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary select-none ${className}`}
//     >
//       <span className="text-xl font-bold">{initial}</span>
//       {isOnline && (
//         <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
//       )}
//     </div>
//   );
// };

// export default Avatar;

import React from "react";

interface AvatarProps {
  name: string;
  className?: string;
  isOnline?: boolean;
}

// Custom function to generate a consistent, vibrant color based on the name
const generateColor = (str: string): { bg: string; text: string } => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    // Generate a hash based on the name
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to pick a hue
  const hue = hash % 360;

  // Create a vibrant HSL color string
  const bgColor = `hsl(${hue}, 70%, 50%)`; // High saturation (70%) and medium lightness (50%) for vibrancy
  const textColor = "white"; // White text ensures readability on the vibrant background

  return { bg: bgColor, text: textColor };
};

const Avatar: React.FC<AvatarProps> = ({ name, className, isOnline }) => {
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  // Use the generated color
  const { bg: bgColor, text: textColor } = generateColor(name);

  return (
    <div
      // Apply the generated color and add a transition for a smoother look
      style={{ backgroundColor: bgColor, color: textColor }}
      className={`relative flex items-center justify-center w-10 h-10 rounded-full select-none transition-colors duration-300 ease-in-out ${className}`}
    >
      <span className="text-xl font-bold">{initial}</span>

      {isOnline && (
        // Moved the online status to the top-right corner
        <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
      )}
    </div>
  );
};

export default Avatar;
