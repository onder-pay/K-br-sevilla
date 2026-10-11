import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ilanGetir, ilanKaydet, ilanSil, fotoYukle, aralikEkle, aralikSil } from "../lib/api";
import { IsHatasi } from "../lib/kurallar";
import { BOLGELER, TIPLER, OLANAKLAR, PARA_BIRIMLERI } from "../lib/sabitler";
import { tarihYaz, bugun } from "../lib/tarih";
import { useOturum } from "../oturum";
import Takvim from "../components/Takvim";

const BOS = {
  baslik: "", bolge: "", tip: "Villa", kapasite: 4, yatakOdasi: 2, banyo: 1, gecelikFiyat: 100,
  paraBirimi: "GBP", minGece: 2, aciklama: "", olanaklar: [], fotolar: [], telefon: "", yayinda: false,
};

export default function IlanDuzenle() {
  const { id } = useParams();
  const yeni = id === "yeni";
  const nav = useNavigate();
  const { kullanici } = useOturum();
  const [ilan, setIlan] = useState(yeni ? BOS : null);
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const yukle = () => ilanGetir(id).then((i) => setIlan(i ? { ...BOS, ...i } : null));
  useEffect(() => { if (!yeni && kullanici) yukle(); }, [id, kullanici]); // eslint-disable-line react-hooks/exhaustive-deps

  if (kullanici === undefined) return <main className="kap"><p className="soluk">Yükleniyor…</p></main>;
  if (!kullanici) return <main className="kap"><Link to="/yonetim">Giriş yapın</Link></main>;
  if (!ilan) return <main className="kap"><p className="soluk">Yükleniyor…</p></main>;

  const alan = (k, sayi = false) => (e) => setIlan({ ...ilan, [k]: sayi ? Number(e.target.value) : e.target.value });

  function olanakDegistir(o) {
    const var_ = ilan.olanaklar.includes(o);
    setIlan({ ...ilan, olanaklar: var_ ? ilan.olanaklar.filter((x) => x !== o) : [...ilan.olanaklar, o] });
  }

  async function fotoSec(e) {
    setHata("");
    const dosyalar = [...e.target.files];
    e.target.value = "";
    try {
      const urller = [];
      for (const d of dosyalar) {
        if (!d.type.startsWith("image/")) continue;
        if (d.size > 5_000_000) throw new IsHatasi(`${d.name}: 5MB'tan büyük.`);
        urller.push(await fotoYukle(d));
      }
      setIlan((i) => ({ ...i, fotolar: [...i.fotolar, ...urller] }));
    } catch (err) {
      setHata(err instanceof IsHatasi ? err.message : "Foto yüklenemedi.");
    }
  }

  const fotoTasi = (i, yon) => {
    const f = [...ilan.fotolar];
    const j = i + yon;
    if (j < 0 || j >= f.length) return;
    [f[i], f[j]] = [f[j], f[i]];
    setIlan({ ...ilan, fotolar: f });
  };

  async function kaydet(e) {
    e.preventDefault();
    setHata(""); setBilgi("");
    if (!ilan.baslik.trim() || !ilan.bolge.trim()) return setHata("Başlık ve bölge zorunlu.");
    if (ilan.telefon && !ilan.telefon.trim().startsWith("+")) {
      return setHata("Telefonu ülke koduyla yazın: KKTC için +90 533…, Güney için +357…");
    }
    setKaydediliyor(true);
    try {
      const { dolu, id: _id, olusturma, guncelleme, ...alanlar } = ilan;
      const yeniId = await ilanKaydet({ id: yeni ? undefined : id, ...alanlar, baslik: alanlar.baslik.trim(), bolge: alanlar.bolge.trim() });
      setBilgi("Kaydedildi.");
      if (yeni) nav(`/yonetim/ilan/${yeniId}`, { replace: true });
    } catch {
      setHata("Kaydedilemedi.");
    } finally {
      setKaydediliyor(false);
    }
  }

  async function sil() {
    if (!confirm("İlan kalıcı olarak silinsin mi? Bu işlem geri alınamaz.")) return;
    await ilanSil(id);
    nav("/yonetim");
  }

  return (
    <main className="kap">
      <Link to="/yonetim" className="soluk kucuk">← Yönetim</Link>
      <h1>{yeni ? "Yeni ilan" : ilan.baslik}</h1>
      {!yeni && ilan.yayinda && <p><Link to={`/ilan/${id}`} target="_blank">Sitedeki görünümü aç ↗</Link></p>}

      <form className="kart ilan-form" onSubmit={kaydet}>
        <label className="genis">Başlık<input value={ilan.baslik} onChange={alan("baslik")} maxLength={90} /></label>
        <label>Bölge
          <input list="bolgeler" value={ilan.bolge} onChange={alan("bolge")} />
          <datalist id="bolgeler">{BOLGELER.map((b) => <option key={b} value={b} />)}</datalist>
        </label>
        <label>Tip<select value={ilan.tip} onChange={alan("tip")}>{TIPLER.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label>Kapasite (kişi)<input type="number" min="1" max="30" value={ilan.kapasite} onChange={alan("kapasite", true)} /></label>
        <label>Yatak odası<input type="number" min="0" value={ilan.yatakOdasi} onChange={alan("yatakOdasi", true)} /></label>
        <label>Banyo<input type="number" min="0" value={ilan.banyo} onChange={alan("banyo", true)} /></label>
        <label>En az gece<input type="number" min="1" value={ilan.minGece} onChange={alan("minGece", true)} /></label>
        <label>Gecelik fiyat<input type="number" min="0" value={ilan.gecelikFiyat} onChange={alan("gecelikFiyat", true)} /></label>
        <label>Para birimi<select value={ilan.paraBirimi} onChange={alan("paraBirimi")}>{PARA_BIRIMLERI.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label className="genis">İletişim telefonu (boşsa sitenin genel numarası)
          <input type="tel" value={ilan.telefon} onChange={alan("telefon")} placeholder="+90 533 123 45 67" />
        </label>
        <label className="genis">Açıklama<textarea rows="5" value={ilan.aciklama} onChange={alan("aciklama")} /></label>

        <fieldset className="genis">
          <legend>Olanaklar</legend>
          <div className="olanak-sec">
            {OLANAKLAR.map((o) => (
              <label key={o} className="onay"><input type="checkbox" checked={ilan.olanaklar.includes(o)} onChange={() => olanakDegistir(o)} /> {o}</label>
            ))}
          </div>
        </fieldset>

        <fieldset className="genis">
          <legend>Fotoğraflar (ilk foto kapak olur)</legend>
          <div className="foto-liste">
            {ilan.fotolar.map((f, i) => (
              <div key={f + i} className="foto-oge">
                <img src={f} alt="" />
                <div>
                  <button type="button" className="ikon" onClick={() => fotoTasi(i, -1)} aria-label="Sola">‹</button>
                  <button type="button" className="ikon" onClick={() => fotoTasi(i, 1)} aria-label="Sağa">›</button>
                  <button type="button" className="ikon tehlike" onClick={() => setIlan({ ...ilan, fotolar: ilan.fotolar.filter((_, j) => j !== i) })} aria-label="Sil">×</button>
                </div>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*" multiple onChange={fotoSec} />
          <FotoUrlEkle onEkle={(u) => setIlan({ ...ilan, fotolar: [...ilan.fotolar, u] })} />
        </fieldset>

        <label className="onay genis"><input type="checkbox" checked={ilan.yayinda} onChange={(e) => setIlan({ ...ilan, yayinda: e.target.checked })} /> Sitede yayında</label>

        <div className="genis form-alt">
          {hata && <p className="hata">{hata}</p>}
          {bilgi && <p className="basari">{bilgi}</p>}
          <button type="submit" disabled={kaydediliyor}>{kaydediliyor ? "Kaydediliyor…" : "Kaydet"}</button>
          {!yeni && <button type="button" className="tehlike" onClick={sil}>İlanı sil</button>}
        </div>
      </form>

      {!yeni && <TakvimYonetimi ilan={ilan} onDegisti={yukle} />}
    </main>
  );
}

function FotoUrlEkle({ onEkle }) {
  const [url, setUrl] = useState("");
  return (
    <div className="satir">
      <input type="url" placeholder="veya foto URL'si yapıştırın" value={url} onChange={(e) => setUrl(e.target.value)} />
      <button type="button" className="ikincil" disabled={!/^https?:\/\//.test(url)} onClick={() => { onEkle(url); setUrl(""); }}>Ekle</button>
    </div>
  );
}

function TakvimYonetimi({ ilan, onDegisti }) {
  const [secim, setSecim] = useState({ giris: null, cikis: null });
  const [not, setNot] = useState("");
  const [hata, setHata] = useState("");

  async function calistir(fn) {
    setHata("");
    try { await fn(); await onDegisti(); } catch (e) {
      setHata(e instanceof IsHatasi ? e.message : "İşlem başarısız.");
    }
  }

  const ekle = () => calistir(async () => {
    await aralikEkle(ilan.id, { bas: secim.giris, bit: secim.cikis, not: not.trim() });
    setSecim({ giris: null, cikis: null }); setNot("");
  });

  const gelecek = (ilan.dolu || []).filter((r) => r.bit >= bugun());

  return (
    <section className="kart takvim-yonetim">
      <h2>Takvim</h2>
      <p className="soluk kucuk">
        Telefonla aldığınız rezervasyonları veya kapalı günleri buradan işleyin: takvimde giriş ve çıkış gününü seçip "Kapat"a basın.
        Siteden gelen talepler "Onayla" denince otomatik işlenir.
      </p>
      <Takvim dolu={ilan.dolu} secim={secim} onSecim={setSecim} minGece={1} />
      <div className="satir">
        <input placeholder="Not (ör. Ahmet Bey – telefonla)" value={not} onChange={(e) => setNot(e.target.value)} maxLength={120} />
        <button type="button" disabled={!secim.cikis} onClick={ekle}>
          {secim.cikis ? `${tarihYaz(secim.giris)} – ${tarihYaz(secim.cikis)} kapat` : "Tarih seçin"}
        </button>
      </div>
      {hata && <p className="hata">{hata}</p>}
      <h3>Dolu tarihler</h3>
      {gelecek.length === 0 && <p className="soluk">Yaklaşan dolu tarih yok.</p>}
      <ul className="aralik-liste">
        {gelecek.map((r) => (
          <li key={r.id}>
            <span>{tarihYaz(r.bas)} – {tarihYaz(r.bit)} (çıkış)</span>
            <span className="soluk">{r.tur === "rezervasyon" ? `Site rezervasyonu · ${r.not}` : r.not || "Kapalı"}</span>
            {r.tur !== "rezervasyon" && (
              <button type="button" className="metin tehlike-metin" onClick={() => calistir(() => aralikSil(ilan.id, r.id))}>Aç</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
