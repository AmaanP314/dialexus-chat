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

// import { AuthProvider } from "@/context/AuthContext";
// import { SocketProvider } from "@/context/SocketContext";
// import { NotificationProvider } from "@/context/NotificationContext";
// import { PresenceProvider } from "@/context/PresenceContext";
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
//           <SocketProvider>
//             <PresenceProvider>
//               <NotificationProvider>{children}</NotificationProvider>
//             </PresenceProvider>
//           </SocketProvider>
//         </AuthProvider>
//       </body>
//     </html>
//   );
// }

import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
// We will add NotificationProvider here in the next step
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
          <SocketProvider>{children}</SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
