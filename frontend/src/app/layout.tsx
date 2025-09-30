import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { PresenceProvider } from "@/context/PresenceContext";
import { NotificationProvider } from "@/context/NotificationContext";
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
            <PresenceProvider>
              <NotificationProvider>{children}</NotificationProvider>
            </PresenceProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
