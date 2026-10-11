import { Link } from "react-router-dom";
import { SITE_ADI } from "../lib/iletisim";
import { firebaseAyarli } from "../lib/api";

export default function Ust() {
  return (
    <>
      {!firebaseAyarli && (
        <div className="demo-bant">
          Demo modu — veriler sadece bu tarayıcıda tutulur. Yönetim girişi şifresi: <b>demo</b>
        </div>
      )}
      <header className="ust">
        <div className="kap ust-ic">
          <Link to="/" className="logo">☀ {SITE_ADI}</Link>
          <Link to="/yonetim" className="soluk kucuk">Ev sahibi girişi</Link>
        </div>
      </header>
    </>
  );
}
