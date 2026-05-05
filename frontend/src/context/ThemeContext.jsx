import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Logic: Initialize theme from localStorage, defaulting to dark mode
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("cricket_theme") !== "light";
  });

  // Action: Update localStorage and HTML attribute whenever the theme changes
  useEffect(() => {
    const themeValue = dark ? "dark" : "light";
    localStorage.setItem("cricket_theme", themeValue);
    document.documentElement.setAttribute("data-theme", themeValue);
  }, [dark]);

  const toggle = () => setDark(d => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook: Easy access to theme state and toggle function
export function useTheme() {
  return useContext(ThemeContext);
}