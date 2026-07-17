import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { db } from "../services/database";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await db.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error("AuthInitError: Failed to fetch current user.", err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await db.signIn(email, password);
      if (result.success) {
        setUser(result.user);
      }
      return result;
    } catch (error) {
      return { success: false, message: error.message || "An authentication error occurred." };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await db.signOut();
      setUser(null);
    } catch (error) {
      console.error("LogoutError: Failed to sign out.", error);
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
