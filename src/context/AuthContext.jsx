import { createContext, useState, useEffect, useContext } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // Manually structure the user object to include displayName immediately if available
                // or fall back to what we have. 
                setUser({
                    uid: currentUser.uid,
                    email: currentUser.email,
                    name: currentUser.displayName
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signup = async (name, email, password) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Update user profile with name
        await updateProfile(userCredential.user, {
            displayName: name
        });

        // Force update local state to include the name immediately
        setUser({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            name: name
        });

        return userCredential;
    };

    const logout = () => {
        return signOut(auth);
    };

    const googleSignIn = () => {
        return signInWithPopup(auth, googleProvider);
    };

    const value = {
        user,
        login,
        signup,
        logout,
        googleSignIn,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
