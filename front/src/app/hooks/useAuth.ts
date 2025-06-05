import { useEffect, useState } from "react";

export function useAuth() {
  const [pseudo, setPseudo] = useState<string | null>(() =>
    localStorage.getItem("pseudo")
  );

  useEffect(() => {
    const onStorage = () => {
      setPseudo(localStorage.getItem("pseudo"))
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = (pseudo: string) => {
    localStorage.setItem("pseudo", pseudo);
    setPseudo(pseudo);
  };

  const logout = () => {
    localStorage.removeItem("pseudo");
    setPseudo(null);
  };

  return { pseudo, isAuthenticated: !!pseudo, login, logout };
}