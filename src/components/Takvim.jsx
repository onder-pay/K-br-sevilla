import { useState } from "react";
import { iso, bugun, geceDolu, aralikMusait, geceSayisi } from "../lib/tarih";

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const GUNLER = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

function ayGunleri(yil, ay) {
  const ilk = new Date(yil, ay, 1);
  const bosluk = (ilk.getDay() + 6) % 7; // Pazartesi başlangıç
  const gunSayisi = new Date(yil, ay + 1, 0).getDate();
  return [
    ...Array(bosluk).fill(null),
    ...Array.from({ length: gunSayisi }, (_, i) => iso(new Date(yil, ay, i + 1))),
  ];
}

/**
 * Müsaitlik takvimi. `secim` = { giris, cikis } (cikis = çıkış günü, o gece dahil değil).
 * Dolu gecesi olan gün giriş olamaz ama önceki geceler boşsa çıkış günü olabilir.
 * `onSecim` verilmezse sadece görüntüleme yapar.
 */
export default function Takvim({ dolu = [], secim = {}, onSecim, minGece = 1, ayAdedi = 2 }) {
  const simdi = new Date();
  const [bas, setBas] = useState({ yil: simdi.getFullYear(), ay: simdi.getMonth() });
  const [uyari, setUyari] = useState("");
  const b = bugun();
  const { giris, cikis } = secim;
  const geriOlur = bas.yil > simdi.getFullYear() || bas.ay > simdi.getMonth();

  function kaydir(n) {
    const d = new Date(bas.yil, bas.ay + n, 1);
    setBas({ yil: d.getFullYear(), ay: d.getMonth() });
  }

  function tikla(gun) {
    if (!onSecim || gun < b) return;
    setUyari("");
    const girisSec = () => {
      if (geceDolu(gun, dolu)) return setUyari("Bu gece dolu.");
      onSecim({ giris: gun, cikis: null });
    };
    if (!giris || cikis || gun <= giris) return girisSec();
    if (!aralikMusait(giris, gun, dolu)) return girisSec();
    if (geceSayisi(giris, gun) < minGece) return setUyari(`En az ${minGece} gece konaklama gerekiyor.`);
    onSecim({ giris, cikis: gun });
  }

  const aylar = Array.from({ length: ayAdedi }, (_, i) => {
    const d = new Date(bas.yil, bas.ay + i, 1);
    return { yil: d.getFullYear(), ay: d.getMonth() };
  });

  return (
    <div className="takvim">
      <div className="takvim-nav">
        <button type="button" className="ikon" onClick={() => kaydir(-1)} disabled={!geriOlur} aria-label="Önceki ay">‹</button>
        <button type="button" className="ikon" onClick={() => kaydir(1)} aria-label="Sonraki ay">›</button>
      </div>
      <div className="takvim-aylar">
        {aylar.map(({ yil, ay }) => (
          <div key={`${yil}-${ay}`} className="takvim-ay">
            <div className="takvim-baslik">{AYLAR[ay]} {yil}</div>
            <div className="takvim-izgara">
              {GUNLER.map((g) => <div key={g} className="takvim-gun-adi">{g}</div>)}
              {ayGunleri(yil, ay).map((gun, i) => {
                if (!gun) return <div key={`b${i}`} />;
                const gecmis = gun < b;
                const doluGece = geceDolu(gun, dolu);
                const secili = gun === giris || gun === cikis;
                const arada = giris && cikis && gun > giris && gun < cikis;
                const sinif = ["takvim-gun",
                  gecmis && "gecmis", doluGece && "dolu", secili && "secili", arada && "arada",
                  onSecim && !gecmis && "tiklanir"].filter(Boolean).join(" ");
                return (
                  <button type="button" key={gun} className={sinif} onClick={() => tikla(gun)}
                    disabled={gecmis || !onSecim} title={doluGece ? "Dolu" : undefined}>
                    {Number(gun.slice(8))}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="takvim-alt">
        <span className="lejant"><i className="l-bos" /> Müsait</span>
        <span className="lejant"><i className="l-dolu" /> Dolu</span>
        {uyari && <span className="hata">{uyari}</span>}
      </div>
    </div>
  );
}
