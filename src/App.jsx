import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { OturumSaglayici } from "./oturum";
import Ust from "./components/Ust";
import AnaSayfa from "./pages/AnaSayfa";
import IlanDetay from "./pages/IlanDetay";
import Yonetim from "./pages/Yonetim";
import IlanDuzenle from "./pages/IlanDuzenle";
import { SITE_ADI } from "./lib/iletisim";

export default function App() {
  return (
    <BrowserRouter>
      <OturumSaglayici>
        <Ust />
        <Routes>
          <Route path="/" element={<AnaSayfa />} />
          <Route path="/ilan/:id" element={<IlanDetay />} />
          <Route path="/yonetim" element={<Yonetim />} />
          <Route path="/yonetim/ilan/:id" element={<IlanDuzenle />} />
          <Route path="*" element={<main className="kap"><h2>Sayfa bulunamadı</h2><Link to="/">Ana sayfa</Link></main>} />
        </Routes>
        <footer className="alt kap soluk kucuk">© {new Date().getFullYear()} {SITE_ADI} · Ödeme sitede alınmaz; rezervasyon ev sahibinin onayıyla kesinleşir.</footer>
      </OturumSaglayici>
    </BrowserRouter>
  );
}
