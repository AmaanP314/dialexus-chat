// // src/context/AuthContext.tsx

// "use client";
// import React, {
//   createContext,
//   useContext,
//   useState,
//   ReactNode,
//   useEffect,
//   useCallback,
// } from "react";
// import { CurrentUser } from "@/components/types";
// import { getCurrentUser, logoutUser } from "@/lib/api";
// import { useRouter } from "next/navigation";

// interface AuthContextType {
//   user: CurrentUser | null;
//   isAuthenticated: boolean;
//   logout: (reason?: string) => void;
//   isLoading: boolean;
//   updateUser: (updatedFields: Partial<CurrentUser>) => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<CurrentUser | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const router = useRouter();

//   const logout = async (reason?: string) => {
//     try {
//       await logoutUser();
//     } catch (error) {
//       console.error(
//         "Logout API call failed, proceeding with client-side logout:",
//         error
//       );
//     } finally {
//       setUser(null);

//       if (reason) {
//         const encodedReason = encodeURIComponent(reason);
//         router.push(`/login?reason=${encodedReason}`);
//       } else {
//         router.push("/login");
//       }
//     }
//   };

//   const updateUser = (updatedFields: Partial<CurrentUser>) => {
//     setUser((prevUser) =>
//       prevUser ? { ...prevUser, ...updatedFields } : null
//     );
//   };

//   useEffect(() => {
//     const checkUserSession = async () => {
//       try {
//         const currentUser = await getCurrentUser();
//         setUser(currentUser);
//       } catch (error) {
//         setUser(null);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     checkUserSession();
//   }, []);

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         isAuthenticated: !!user,
//         logout,
//         isLoading,
//         updateUser,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = (): AuthContextType => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };

// src/context/AuthContext.tsx

"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback, // --- 1. Import useCallback ---
} from "react";
import { CurrentUser } from "@/components/types";
import { getCurrentUser, logoutUser } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  logout: (reason?: string) => void;
  isLoading: boolean;
  updateUser: (updatedFields: Partial<CurrentUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // --- 2. Wrap the logout function in useCallback ---
  // It only depends on 'router', which is stable.
  const logout = useCallback(
    async (reason?: string) => {
      try {
        await logoutUser();
      } catch (error) {
        console.error(
          "Logout API call failed, proceeding with client-side logout:",
          error
        );
      } finally {
        setUser(null);

        if (reason) {
          const encodedReason = encodeURIComponent(reason);
          router.push(`/login?reason=${encodedReason}`);
        } else {
          router.push("/login");
        }
      }
    },
    [router]
  );

  // --- 3. Wrap the updateUser function in useCallback ---
  // It has no dependencies, so the array is empty.
  const updateUser = useCallback((updatedFields: Partial<CurrentUser>) => {
    setUser((prevUser) =>
      prevUser ? { ...prevUser, ...updatedFields } : null
    );
  }, []);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkUserSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        logout,
        isLoading,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
