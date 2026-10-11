import { createContext, useContext, useEffect, useState } from "react";
import { oturumDinle } from "./lib/api";

const OturumCtx = createContext({ kullanici: undefined, hata: "" });

export function OturumSaglayici({ children }) {
  const [durum, setDurum] = useState({ kullanici: undefined, hata: "" });
  useEffect(() => {
    let kapat = () => {};
    let iptal = false;
    oturumDinle((kullanici, hata = "") => setDurum({ kullanici, hata })).then((k) => {
      if (iptal) k(); else kapat = k;
    });
    return () => { iptal = true; kapat(); };
  }, []);
  return <OturumCtx.Provider value={durum}>{children}</OturumCtx.Provider>;
}

export const useOturum = () => useContext(OturumCtx);
