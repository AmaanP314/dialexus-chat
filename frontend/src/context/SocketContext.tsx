// "use client";

// import React, {
//   createContext,
//   useContext,
//   useState,
//   ReactNode,
//   useEffect,
//   useRef,
// } from "react";
// import { useAuth } from "./AuthContext";

// interface SocketContextType {
//   sendMessage: (payload: object) => void;
//   lastEvent: any | null;
//   isConnected: boolean;
// }

// const SocketContext = createContext<SocketContextType | undefined>(undefined);

// export const SocketProvider = ({ children }: { children: ReactNode }) => {
//   const { isAuthenticated } = useAuth();
//   const [lastEvent, setLastEvent] = useState<any | null>(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const ws = useRef<WebSocket | null>(null);

//   useEffect(() => {
//     if (isAuthenticated && !ws.current) {
//       const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
//       if (!wsUrl) {
//         console.error("WebSocket URL is not defined.");
//         return;
//       }
//       ws.current = new WebSocket(wsUrl);

//       ws.current.onopen = () => {
//         console.log("WebSocket Connected");
//         setIsConnected(true);
//       };

//       ws.current.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data);
//           setLastEvent({ ...data, key: Date.now() }); // Add unique key to ensure state update
//         } catch (error) {
//           console.error("Failed to parse incoming message:", error);
//         }
//       };

//       ws.current.onclose = () => {
//         console.log("WebSocket Disconnected");
//         setIsConnected(false);
//         ws.current = null;
//       };

//       ws.current.onerror = (error) => {
//         console.error("WebSocket Error:", error);
//         setIsConnected(false);
//       };
//     } else if (!isAuthenticated && ws.current) {
//       ws.current.close();
//     }

//     // Cleanup on component unmount
//     return () => {
//       if (ws.current && ws.current.readyState === WebSocket.OPEN) {
//         ws.current.close();
//       }
//     };
//   }, [isAuthenticated]);

//   const sendMessage = (payload: object) => {
//     if (ws.current?.readyState === WebSocket.OPEN) {
//       ws.current.send(JSON.stringify(payload));
//     } else {
//       console.error("WebSocket is not connected or ready.");
//     }
//   };

//   return (
//     <SocketContext.Provider value={{ sendMessage, lastEvent, isConnected }}>
//       {children}
//     </SocketContext.Provider>
//   );
// };

// export const useSocket = (): SocketContextType => {
//   const context = useContext(SocketContext);
//   if (context === undefined) {
//     throw new Error("useSocket must be used within a SocketProvider");
//   }
//   return context;
// };

"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  sendMessage: (payload: object) => void;
  lastEvent: any | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [lastEvent, setLastEvent] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Only establish connection if the user is authenticated
    if (isAuthenticated && !ws.current) {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!wsUrl) {
        console.error("WebSocket URL is not defined.");
        return;
      }
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket Connected");
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Add a unique key to the event to ensure React detects the change
          setLastEvent({ ...data, key: Date.now() });
        } catch (error) {
          console.error("Failed to parse incoming message:", error);
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket Disconnected");
        setIsConnected(false);
        ws.current = null;
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket Error:", error);
        setIsConnected(false);
      };
    } else if (!isAuthenticated && ws.current) {
      // Disconnect if user logs out
      ws.current.close();
    }

    // Cleanup on component unmount
    return () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, [isAuthenticated]);

  const sendMessage = (payload: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    } else {
      console.error("WebSocket is not connected or ready to send messages.");
    }
  };

  return (
    <SocketContext.Provider value={{ sendMessage, lastEvent, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
