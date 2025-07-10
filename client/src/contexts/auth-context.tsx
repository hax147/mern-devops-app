import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  name: string;
  email: string;
  role: 'admin' | 'rescue-team' | 'user';
  // Add other user properties as needed
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (role?: 'admin' | 'rescue-team' | 'user') => void;
  logout: () => void;
  userType: "user" | "rescue" | "admin" | null;
  setUserType: (type: "user" | "rescue" | "admin") => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => { },
  logout: () => { },
  userType: null,
  setUserType: () => { },
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<"user" | "rescue" | "admin" | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Check for existing auth in localStorage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("role");

    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      setIsAuthenticated(authData.isAuthenticated);
      setUserType(authData.userType);
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (storedRole) {
      // Fallback for when we only have a role stored
      const role = storedRole as 'admin' | 'rescue-team' | 'user';
      const fallbackUser: User = {
        name: role === 'admin' ? 'Admin User' : role === 'rescue-team' ? 'Rescue Team Member' : 'Regular User',
        email: `${role}@example.com`,
        role: role
      };
      setUser(fallbackUser);
      localStorage.setItem("user", JSON.stringify(fallbackUser));
    }
  }, []);

  // Save auth state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("auth", JSON.stringify({ isAuthenticated, userType }));
  }, [isAuthenticated, userType]);

  // Update login function to create a mock user with role for testing
  const login = (role?: 'admin' | 'rescue-team' | 'user') => {
    setIsAuthenticated(true);
    
    // If a role is specified, use it; otherwise try to read from localStorage or default to 'user'
    const userRole = role || localStorage.getItem("role") as 'admin' | 'rescue-team' | 'user' || 'user';
    
    // Create a mock user based on the role
    const mockUser: User = {
      name: userRole === 'admin' ? 'Admin User' : userRole === 'rescue-team' ? 'Rescue Team Member' : 'Regular User',
      email: `${userRole}@example.com`,
      role: userRole
    };
    
    // Store the user in state and localStorage
    setUser(mockUser);
    localStorage.setItem("user", JSON.stringify(mockUser));
    
    // Set the user type
    const newUserType = userRole === 'admin' ? 'admin' : userRole === 'rescue-team' ? 'rescue' : 'user';
    setUserType(newUserType);
    localStorage.setItem('role', userRole);
    
    console.log(`Logged in as ${userRole} with userType ${newUserType}`);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout,
      userType,
      setUserType
    }}>
      {children}
    </AuthContext.Provider>
  );
};
