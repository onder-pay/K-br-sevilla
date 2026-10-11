import { Link } from "react-router-dom";
import { paraYaz } from "../lib/iletisim";
import Foto from "./Foto";

export default function IlanKarti({ ilan, sorgu = "" }) {
  return (
    <Link to={`/ilan/${ilan.id}${sorgu}`} className="ilan-karti">
      <Foto src={ilan.fotolar?.[0]} alt={ilan.baslik} etiket={ilan.bolge} />
      <div className="ilan-karti-govde">
        <div className="ilan-karti-ust">
          <strong>{ilan.bolge}</strong>
          <span className="soluk">{ilan.tip}</span>
        </div>
        <div className="ilan-karti-baslik">{ilan.baslik}</div>
        <div className="soluk">{ilan.kapasite} misafir · {ilan.yatakOdasi} yatak odası</div>
        <div><strong>{paraYaz(ilan.gecelikFiyat, ilan.paraBirimi)}</strong> <span className="soluk">/ gece</span></div>
      </div>
    </Link>
  );
}
