import { useState } from "react";

function readStoredUser() {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export default function usePersistedUser() {
    const [currentUser, setCurrentUser] = useState(readStoredUser);

    const storeUser = (user) => {
        localStorage.setItem("currentUser", JSON.stringify(user));
        setCurrentUser(user);
    };

    const clearUser = () => {
        localStorage.removeItem("currentUser");
        setCurrentUser(null);
    };

    return {
        currentUser,
        setCurrentUser: storeUser,
        clearCurrentUser: clearUser,
    };
}
