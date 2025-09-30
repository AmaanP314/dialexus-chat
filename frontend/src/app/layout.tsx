// import { AuthProvider } from "@/context/AuthContext";
// import { PresenceProvider } from "@/context/PresenceContext"; // Import new provider
// import "./globals.css";

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en" className="dark">
//       <body>
//         <AuthProvider>
//           <PresenceProvider>
//             {" "}
//             {/* Wrap AuthProvider's children */}
//             {children}
//           </PresenceProvider>
//         </AuthProvider>
//       </body>
//     </html>
//   );
// }

// src/app/layout.tsx

import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext"; // Import new provider
import { PresenceProvider } from "@/context/PresenceContext";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          <SocketProvider>
            {" "}
            {/* Wrap PresenceProvider */}
            <PresenceProvider>{children}</PresenceProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
