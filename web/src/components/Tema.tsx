import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui";

type Tema = "claro" | "oscuro";

const CLAVE = "mercuria.tema";

/** Tema actual, leído del atributo que deja el script de `index.html`. */
function leerTema(): Tema {
  if (typeof document === "undefined") return "claro";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "oscuro" : "claro";
}

/** Estado del tema con persistencia en `localStorage` (solo al alternar). */
export function useTema() {
  const [tema, setTema] = useState<Tema>(leerTema);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema === "oscuro" ? "dark" : "light");
  }, [tema]);

  const alternar = useCallback(() => {
    setTema((actual) => {
      const siguiente: Tema = actual === "oscuro" ? "claro" : "oscuro";
      try {
        localStorage.setItem(CLAVE, siguiente);
      } catch {
        // Sin almacenamiento disponible: el tema vale solo para esta sesión.
      }
      return siguiente;
    });
  }, []);

  return { tema, alternar };
}

export function BotonTema() {
  const { tema, alternar } = useTema();
  const oscuro = tema === "oscuro";
  return (
    <Button variante="secundario" onClick={alternar}>
      {oscuro ? <Sun size={15} /> : <Moon size={15} />}
      {oscuro ? "Tema claro" : "Tema oscuro"}
    </Button>
  );
}
