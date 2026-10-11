import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  girisYap, cikisYap, ilanlariGetir, talepleriGetir, talepOnayla, talepReddet, talepIptal,
} from "../lib/api";
import { tarihYaz, geceSayisi, bugun } from "../lib/tarih";
import { telefonRakam, telLink, whatsappLink } from "../lib/iletisim";
import { TALEP_DURUM } from "../lib/sabitler";
import { IsHatasi } from "../lib/kurallar";
import { useOturum } from "../oturum";

export default function Yonetim() {
  const { kullanici, hata } = useOturum();
  if (kullanici === undefined) return <main className="kap"><p className="soluk">Yükleniyor…</p></main>;
  if (!kullanici) return <Giris oturumHatasi={hata} />;
  return <Panel kullanici={kullanici} />;
}

function Giris({ oturumHatasi }) {
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  async function gonder(e) {
    e.preventDefault();
    setHata("");
    try { await girisYap(email, sifre); } catch (err) {
      setHata(err instanceof IsHatasi ? err.message : "E-posta veya şifre hatalı.");
    }
  }
  return (
    <main className="kap dar">
      <form className="kart form-dikey" onSubmit={gonder}>
        <h1>Ev sahibi girişi</h1>
        <label>E-posta<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></label>
        <label>Şifre<input type="password" value={sifre} onChange={(e) => setSifre(e.target.value)} required autoComplete="current-password" /></label>
        {(hata || oturumHatasi) && <p className="hata">{hata || oturumHatasi}</p>}
        <button type="submit">Giriş yap</button>
      </form>
    </main>
  );
}

function Panel({ kullanici }) {
  const [sekme, setSekme] = useState("talepler");
  return (
    <main className="kap">
      <div className="panel-ust">
        <h1>Yönetim</h1>
        <div className="soluk kucuk">{kullanici.email} · <button type="button" className="metin" onClick={cikisYap}>Çıkış</button></div>
      </div>
      <div className="sekmeler">
        <button type="button" className={sekme === "talepler" ? "aktif" : ""} onClick={() => setSekme("talepler")}>Rezervasyon talepleri</button>
        <button type="button" className={sekme === "ilanlar" ? "aktif" : ""} onClick={() => setSekme("ilanlar")}>İlanlar</button>
      </div>
      {sekme === "talepler" ? <Talepler /> : <Ilanlar />}
    </main>
  );
}

function Talepler() {
  const [talepler, setTalepler] = useState(null);
  const [filtre, setFiltre] = useState("aktif");
  const [hata, setHata] = useState("");
  const [mesgul, setMesgul] = useState(null);

  const yukle = () => talepleriGetir().then(setTalepler).catch(() => setHata("Talepler yüklenemedi."));
  useEffect(() => { yukle(); }, []);

  async function islem(fn, t, onayMetni) {
    if (onayMetni && !confirm(onayMetni)) return;
    setHata("");
    setMesgul(t.id);
    try { await fn(t.id); await yukle(); } catch (e) {
      setHata(e instanceof IsHatasi ? e.message : "İşlem başarısız. Tekrar deneyin.");
    } finally { setMesgul(null); }
  }

  if (!talepler) return <p className="soluk">{hata || "Yükleniyor…"}</p>;
  const b = bugun();
  const gorunen = talepler.filter((t) =>
    filtre === "tumu" || (t.durum === "beklemede" || (t.durum === "onaylandi" && t.cikis >= b)));
  const bekleyen = talepler.filter((t) => t.durum === "beklemede").length;

  return (
    <div>
      <div className="filtre-satir">
        <span>{bekleyen} bekleyen talep</span>
        <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
          <option value="aktif">Bekleyen + yaklaşan onaylı</option>
          <option value="tumu">Tümü</option>
        </select>
      </div>
      {hata && <p className="hata">{hata}</p>}
      {gorunen.length === 0 && <p className="soluk">Gösterilecek talep yok.</p>}
      <div className="talep-liste">
        {gorunen.map((t) => {
          const tel = telefonRakam(t.telefon);
          return (
            <div key={t.id} className={`kart talep durum-${t.durum}`}>
              <div className="talep-ust">
                <strong>{t.ad}</strong>
                <span className={`rozet rozet-${t.durum}`}>{TALEP_DURUM[t.durum]}</span>
              </div>
              <div>{t.ilanBaslik}</div>
              <div className="soluk kucuk">
                {tarihYaz(t.giris)} – {tarihYaz(t.cikis)} · {geceSayisi(t.giris, t.cikis)} gece · {t.misafir} kişi · <b>{t.kod}</b>
              </div>
              {t.not && <div className="kucuk">“{t.not}”</div>}
              <div className="talep-butonlar">
                <a className="buton ikincil kucuk-buton" href={telLink(tel)}>Ara {t.telefon}</a>
                <a className="buton ikincil kucuk-buton" href={whatsappLink(tel, `Merhaba ${t.ad}, ${t.kod} kodlu rezervasyon talebiniz hakkında yazıyoruz.`)} target="_blank" rel="noreferrer">WhatsApp</a>
                {t.durum === "beklemede" && <>
                  <button type="button" className="kucuk-buton" disabled={mesgul === t.id} onClick={() => islem(talepOnayla, t)}>Onayla (takvimi kapat)</button>
                  <button type="button" className="kucuk-buton tehlike" disabled={mesgul === t.id} onClick={() => islem(talepReddet, t, "Talep reddedilsin mi?")}>Reddet</button>
                </>}
                {t.durum === "onaylandi" && (
                  <button type="button" className="kucuk-buton tehlike" disabled={mesgul === t.id}
                    onClick={() => islem(talepIptal, t, "Rezervasyon iptal edilsin ve tarihler tekrar açılsın mı?")}>İptal et</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Ilanlar() {
  const [ilanlar, setIlanlar] = useState(null);
  useEffect(() => { ilanlariGetir({ tumu: true }).then(setIlanlar).catch(() => setIlanlar([])); }, []);
  if (!ilanlar) return <p className="soluk">Yükleniyor…</p>;
  return (
    <div>
      <div className="filtre-satir">
        <span>{ilanlar.length} ilan</span>
        <Link className="buton" to="/yonetim/ilan/yeni">+ Yeni ilan</Link>
      </div>
      <div className="talep-liste">
        {ilanlar.map((i) => (
          <Link key={i.id} to={`/yonetim/ilan/${i.id}`} className="kart ilan-satir">
            <div>
              <strong>{i.baslik}</strong>
              <div className="soluk kucuk">{i.bolge} · {i.tip} · {i.kapasite} kişi</div>
            </div>
            <span className={`rozet ${i.yayinda ? "rozet-onaylandi" : "rozet-iptal"}`}>{i.yayinda ? "Yayında" : "Taslak"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
