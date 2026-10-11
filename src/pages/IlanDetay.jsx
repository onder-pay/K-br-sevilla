import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ilanGetir, talepGonder } from "../lib/api";
import { aralikMusait, geceSayisi, gecerliTarih, tarihYaz, bugun } from "../lib/tarih";
import { paraYaz, SITE_ADI } from "../lib/iletisim";
import Takvim from "../components/Takvim";
import Foto from "../components/Foto";
import IletisimButonlari from "../components/IletisimButonlari";

export default function IlanDetay() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [ilan, setIlan] = useState(undefined);
  const [secim, setSecim] = useState({ giris: null, cikis: null });
  const [form, setForm] = useState({ ad: "", telefon: "", misafir: Number(params.get("misafir")) || 2, not: "" });
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState("");
  const [sonuc, setSonuc] = useState(null);
  const [fotoNo, setFotoNo] = useState(0);

  useEffect(() => {
    ilanGetir(id).then((i) => {
      setIlan(i);
      if (!i) return;
      document.title = `${i.baslik} · ${SITE_ADI}`;
      // Aramadan gelen tarihler hâlâ müsaitse önceden seçili gelsin.
      const g = params.get("giris"), c = params.get("cikis");
      if (gecerliTarih(g) && gecerliTarih(c) && g >= bugun() && g < c && aralikMusait(g, c, i.dolu)) {
        setSecim({ giris: g, cikis: c });
      }
    }).catch(() => setIlan(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (ilan === undefined) return <main className="kap"><p className="soluk">Yükleniyor…</p></main>;
  if (ilan === null) return <main className="kap"><h2>İlan bulunamadı</h2><Link to="/">Tüm konaklamalar</Link></main>;

  const { giris, cikis } = secim;
  const gece = giris && cikis ? geceSayisi(giris, cikis) : 0;
  const fotolar = ilan.fotolar?.length ? ilan.fotolar : [null];
  const alan = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const mesaj = sonuc
    ? `Merhaba, ${sonuc.kod} kodlu rezervasyon talebim hakkında yazıyorum: "${ilan.baslik}", ${tarihYaz(giris)} – ${tarihYaz(cikis)}, ${form.misafir} kişi.`
    : `Merhaba, "${ilan.baslik}" için yazıyorum${gece ? ` (${tarihYaz(giris)} – ${tarihYaz(cikis)})` : ""}. Müsait mi?`;

  async function gonder(e) {
    e.preventDefault();
    setHata("");
    if (!gece) return setHata("Önce takvimden giriş ve çıkış tarihini seçin.");
    if (form.ad.trim().length < 2) return setHata("Adınızı yazın.");
    if (form.telefon.replace(/\D/g, "").length < 7) return setHata("Geçerli bir telefon numarası yazın.");
    const misafir = Number(form.misafir);
    if (!(misafir >= 1 && misafir <= ilan.kapasite)) return setHata(`Misafir sayısı 1–${ilan.kapasite} arasında olmalı.`);
    setGonderiliyor(true);
    try {
      const r = await talepGonder({
        ilanId: ilan.id, ilanBaslik: ilan.baslik, giris, cikis, misafir,
        ad: form.ad.trim(), telefon: form.telefon.trim(), not: form.not.trim().slice(0, 500),
      });
      setSonuc(r);
    } catch {
      setHata("Talep gönderilemedi. Lütfen doğrudan arayın veya WhatsApp'tan yazın.");
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <main className="kap detay">
      <Link to="/" className="soluk kucuk">← Tüm konaklamalar</Link>
      <h1>{ilan.baslik}</h1>
      <p className="soluk">{ilan.bolge} · {ilan.tip}</p>

      <div className="galeri">
        <Foto src={fotolar[fotoNo]} alt={ilan.baslik} etiket={ilan.bolge} className="galeri-ana" />
        {fotolar.length > 1 && (
          <div className="galeri-kucuk">
            {fotolar.map((f, i) => (
              <button type="button" key={i} className={i === fotoNo ? "aktif" : ""} onClick={() => setFotoNo(i)}>
                <img src={f} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="detay-duzen">
        <div className="detay-sol">
          <section>
            <h2>{ilan.tip} · {ilan.kapasite} misafir</h2>
            <p className="soluk">{ilan.yatakOdasi} yatak odası · {ilan.banyo} banyo · en az {ilan.minGece || 1} gece</p>
            <p className="aciklama">{ilan.aciklama}</p>
          </section>
          {ilan.olanaklar?.length > 0 && (
            <section>
              <h2>Olanaklar</h2>
              <ul className="olanaklar">{ilan.olanaklar.map((o) => <li key={o}>✓ {o}</li>)}</ul>
            </section>
          )}
          <section>
            <h2>Müsaitlik</h2>
            <p className="soluk kucuk">Giriş ve çıkış gününe tıklayın.</p>
            <Takvim dolu={ilan.dolu} secim={secim} onSecim={(s) => { setSecim(s); setSonuc(null); }} minGece={ilan.minGece || 1} />
          </section>
        </div>

        <aside className="rez-kutu">
          <div className="rez-fiyat"><strong>{paraYaz(ilan.gecelikFiyat, ilan.paraBirimi)}</strong> <span className="soluk">/ gece</span></div>

          {sonuc ? (
            <div className="talep-tamam">
              <h3>Talebiniz alındı ✓</h3>
              <p>Talep kodunuz: <b className="kod">{sonuc.kod}</b></p>
              <p className="kucuk">
                {tarihYaz(giris, true)} – {tarihYaz(cikis, true)} ({gece} gece).
                Rezervasyon, ev sahibi sizinle görüşüp onayladığında kesinleşir. Hızlı dönüş için şimdi yazın:
              </p>
              <IletisimButonlari ilan={ilan} mesaj={mesaj} />
            </div>
          ) : (
            <form onSubmit={gonder} className="rez-form">
              <div className="rez-tarihler">
                <div><span className="kucuk soluk">GİRİŞ</span><div>{giris ? tarihYaz(giris) : "—"}</div></div>
                <div><span className="kucuk soluk">ÇIKIŞ</span><div>{cikis ? tarihYaz(cikis) : "—"}</div></div>
              </div>
              {gece > 0 && (
                <div className="rez-toplam">
                  <span>{paraYaz(ilan.gecelikFiyat, ilan.paraBirimi)} × {gece} gece</span>
                  <strong>{paraYaz(ilan.gecelikFiyat * gece, ilan.paraBirimi)}</strong>
                </div>
              )}
              <label>Ad Soyad<input value={form.ad} onChange={alan("ad")} maxLength={80} autoComplete="name" /></label>
              <label>Telefon<input type="tel" value={form.telefon} onChange={alan("telefon")} maxLength={25} placeholder="+90 533 ..." autoComplete="tel" /></label>
              <label>Misafir sayısı<input type="number" min="1" max={ilan.kapasite} value={form.misafir} onChange={alan("misafir")} /></label>
              <label>Not (isteğe bağlı)<textarea rows="2" value={form.not} onChange={alan("not")} maxLength={500} /></label>
              {hata && <p className="hata">{hata}</p>}
              <button type="submit" disabled={gonderiliyor}>{gonderiliyor ? "Gönderiliyor…" : "Rezervasyon talebi gönder"}</button>
              <p className="kucuk soluk">Sitede ödeme alınmaz. Fiyat ve ödeme ev sahibiyle görüşülür.</p>
              <div className="ayrac"><span>veya</span></div>
              <IletisimButonlari ilan={ilan} mesaj={mesaj} />
            </form>
          )}
        </aside>
      </div>
    </main>
  );
}
