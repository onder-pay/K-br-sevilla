import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ilanlariGetir } from "../lib/api";
import { aralikMusait, bugun, gunEkle, gecerliTarih } from "../lib/tarih";
import IlanKarti from "../components/IlanKarti";

export default function AnaSayfa() {
  const [params, setParams] = useSearchParams();
  const [ilanlar, setIlanlar] = useState(null);
  const [hata, setHata] = useState("");
  const bolge = params.get("bolge") || "";
  const giris = params.get("giris") || "";
  const cikis = params.get("cikis") || "";
  const misafir = Number(params.get("misafir")) || 1;
  const tarihli = gecerliTarih(giris) && gecerliTarih(cikis) && giris < cikis;

  useEffect(() => {
    ilanlariGetir().then(setIlanlar).catch(() => setHata("İlanlar yüklenemedi. Sayfayı yenileyin."));
  }, []);

  const bolgeler = useMemo(() => [...new Set((ilanlar || []).map((i) => i.bolge))].sort((a, b) => a.localeCompare(b, "tr")), [ilanlar]);

  const sonuclar = (ilanlar || []).filter((i) =>
    (!bolge || i.bolge === bolge)
    && i.kapasite >= misafir
    && (!tarihli || aralikMusait(giris, cikis, i.dolu)));

  function guncelle(alan, deger) {
    const p = new URLSearchParams(params);
    if (deger) p.set(alan, deger); else p.delete(alan);
    if (alan === "giris" && deger && (!p.get("cikis") || p.get("cikis") <= deger)) p.set("cikis", gunEkle(deger, 3));
    setParams(p, { replace: true });
  }

  const sorgu = tarihli ? `?giris=${giris}&cikis=${cikis}&misafir=${misafir}` : "";

  return (
    <>
      <section className="kahraman">
        <div className="kap">
          <h1>Kıbrıs'ta tatil eviniz</h1>
          <p>Müsaitliği görün, talebinizi bırakın, ev sahibiyle doğrudan konuşun. Aracı yok, komisyon yok.</p>
          <form className="arama" onSubmit={(e) => e.preventDefault()}>
            <label>Bölge
              <select value={bolge} onChange={(e) => guncelle("bolge", e.target.value)}>
                <option value="">Tümü</option>
                {bolgeler.map((b) => <option key={b}>{b}</option>)}
              </select>
            </label>
            <label>Giriş
              <input type="date" min={bugun()} value={giris} onChange={(e) => guncelle("giris", e.target.value)} />
            </label>
            <label>Çıkış
              <input type="date" min={giris ? gunEkle(giris, 1) : bugun()} value={cikis} onChange={(e) => guncelle("cikis", e.target.value)} />
            </label>
            <label>Misafir
              <input type="number" min="1" max="30" value={misafir} onChange={(e) => guncelle("misafir", e.target.value)} />
            </label>
          </form>
        </div>
      </section>
      <main className="kap">
        {hata && <p className="hata">{hata}</p>}
        {!ilanlar && !hata && <p className="soluk">Yükleniyor…</p>}
        {ilanlar && (
          <p className="soluk">
            {sonuclar.length} konaklama{tarihli ? " bu tarihlerde müsait" : ""}
          </p>
        )}
        <div className="ilan-izgara">
          {sonuclar.map((i) => <IlanKarti key={i.id} ilan={i} sorgu={sorgu} />)}
        </div>
        {ilanlar && sonuclar.length === 0 && (
          <p>Aramanıza uygun konaklama bulunamadı. Tarihleri veya bölgeyi değiştirmeyi deneyin.</p>
        )}
      </main>
    </>
  );
}
