import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage on mount
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (email, password) => {
        // Simulated login logic
        // In a real app, this would verify credentials with a server
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const storedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
                const foundUser = storedUsers.find(u => u.email === email && u.password === password);

                if (foundUser) {
                    const userSession = { name: foundUser.name, email: foundUser.email };
                    localStorage.setItem('user', JSON.stringify(userSession));
                    setUser(userSession);
                    resolve(userSession);
                } else {
                    reject(new Error('Invalid email or password'));
                }
            }, 800); // Simulate network delay
        });
    };

    const signup = (name, email, password) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const storedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

                if (storedUsers.some(u => u.email === email)) {
                    reject(new Error('Email already registered'));
                    return;
                }

                const newUser = { name, email, password };
                storedUsers.push(newUser);
                localStorage.setItem('registeredUsers', JSON.stringify(storedUsers));

                // Auto login after signup
                const userSession = { name, email };
                localStorage.setItem('user', JSON.stringify(userSession));
                setUser(userSession);
                resolve(userSession);
            }, 800);
        });
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    const value = {
        user,
        login,
        signup,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
