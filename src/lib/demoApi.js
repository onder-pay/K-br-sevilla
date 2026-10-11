// Firebase ayarlanmadan siteyi denemek için: veriler bu tarayıcının localStorage'ında tutulur.
// Yönetici girişi: herhangi bir e-posta + şifre "demo".
import { aralikEkleKontrol, talepAraligi, IsHatasi, talepKoduUret, yeniId } from "./kurallar";
import { bugun, gunEkle } from "./tarih";

const ANAHTAR = "kk-demo-v1";
const dinleyiciler = new Set();

function ornekVeri() {
  const b = bugun();
  const ilan = (id, alanlar, dolu = []) => ({
    id, yayinda: true, telefon: "+90 533 000 00 00", fotolar: [], minGece: 2, paraBirimi: "GBP", banyo: 1,
    dolu: dolu.map(([s, n], i) => ({ id: `${id}-${i}`, bas: gunEkle(b, s), bit: gunEkle(b, s + n), tur: "kapali", not: "Örnek" })),
    ...alanlar,
  });
  return {
    ilanlar: [
      ilan("girne-villa", {
        baslik: "Deniz manzaralı havuzlu villa", bolge: "Girne", tip: "Villa", kapasite: 8, yatakOdasi: 4,
        banyo: 3, gecelikFiyat: 220, minGece: 3,
        aciklama: "Girne limanına 10 dakika, Beşparmak Dağları eteğinde özel havuzlu villa. Geniş teras, barbekü ve tam donanımlı mutfak.",
        olanaklar: ["Özel havuz", "Deniz manzarası", "Klima", "Wi-Fi", "Tam mutfak", "Barbekü", "Otopark"],
      }, [[4, 5], [16, 7]]),
      ilan("bafra-daire", {
        baslik: "Bafra'da plaja sıfır 2+1 daire", bolge: "Bafra", tip: "Daire", kapasite: 4, yatakOdasi: 2,
        gecelikFiyat: 95,
        aciklama: "Site içinde, ortak havuzlu ve plaja yürüme mesafesinde daire. Aileler için ideal.",
        olanaklar: ["Ortak havuz", "Denize yürüme mesafesi", "Klima", "Wi-Fi", "Çamaşır makinesi"],
      }, [[1, 3], [10, 4]]),
      ilan("karpaz-bungalov", {
        baslik: "Karpaz'da sakin bungalov", bolge: "Karpaz", tip: "Bungalov", kapasite: 2, yatakOdasi: 1,
        gecelikFiyat: 60, paraBirimi: "EUR", minGece: 1,
        aciklama: "Altınkum plajına yakın, doğa içinde, kafa dinlemek isteyenler için küçük bungalov.",
        olanaklar: ["Bahçe", "Deniz manzarası", "Jeneratör", "Evcil hayvan kabul"],
      }, [[0, 2]]),
      ilan("iskele-studyo", {
        baslik: "Long Beach stüdyo daire", bolge: "Long Beach", tip: "Stüdyo", kapasite: 2, yatakOdasi: 1,
        gecelikFiyat: 55,
        aciklama: "Long Beach sahilinde, sitenin tüm imkânlarından yararlanan modern stüdyo.",
        olanaklar: ["Ortak havuz", "Denize yürüme mesafesi", "Klima", "Wi-Fi"],
      }),
    ],
    talepler: [],
  };
}

function oku() {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (ham) return JSON.parse(ham);
  } catch { /* bozuk/erişilemeyen depolama → örnek veriyle devam */ }
  const v = ornekVeri();
  yaz(v);
  return v;
}

function yaz(v) {
  try { localStorage.setItem(ANAHTAR, JSON.stringify(v)); } catch { /* gizli sekme vb. */ }
}

function degistir(fn) {
  const v = oku();
  const sonuc = fn(v);
  yaz(v);
  return sonuc;
}

const kopya = (x) => JSON.parse(JSON.stringify(x));
const ilanBul = (v, id) => {
  const i = v.ilanlar.find((x) => x.id === id);
  if (!i) throw new IsHatasi("İlan bulunamadı.");
  return i;
};

export async function ilanlariGetir({ tumu = false } = {}) {
  return kopya(oku().ilanlar.filter((i) => tumu || i.yayinda))
    .sort((a, b) => a.baslik.localeCompare(b.baslik, "tr"));
}

export async function ilanGetir(id) {
  const i = oku().ilanlar.find((x) => x.id === id);
  if (!i || (!i.yayinda && !mevcutOturum())) return null;
  return kopya(i);
}

export async function ilanKaydet({ id, dolu, ...alanlar }) {
  return degistir((v) => {
    if (id) {
      Object.assign(ilanBul(v, id), alanlar);
      return id;
    }
    const yeni = { id: yeniId(), ...alanlar, dolu: [] };
    v.ilanlar.push(yeni);
    return yeni.id;
  });
}

export async function ilanSil(id) {
  degistir((v) => { v.ilanlar = v.ilanlar.filter((i) => i.id !== id); });
}

export async function fotoYukle(dosya) {
  // Demo: küçük dosyaları data URL olarak sakla (localStorage sınırı ~5MB).
  if (dosya.size > 400_000) throw new IsHatasi("Demo modunda 400KB'tan büyük foto yüklenemez; URL girin.");
  return new Promise((ok, hata) => {
    const r = new FileReader();
    r.onload = () => ok(r.result);
    r.onerror = () => hata(r.error);
    r.readAsDataURL(dosya);
  });
}

export async function talepGonder(talep) {
  const kod = talepKoduUret();
  degistir((v) => {
    v.talepler.unshift({ id: yeniId(), ...talep, kod, durum: "beklemede", olusturma: new Date().toISOString() });
  });
  return { kod };
}

export async function talepleriGetir() {
  return kopya(oku().talepler);
}

export async function talepOnayla(talepId) {
  degistir((v) => {
    const t = v.talepler.find((x) => x.id === talepId);
    if (!t || t.durum !== "beklemede") throw new IsHatasi("Bu talep artık beklemede değil.");
    const ilan = ilanBul(v, t.ilanId);
    ilan.dolu = aralikEkleKontrol(ilan, talepAraligi(talepId, t));
    t.durum = "onaylandi";
  });
}

export async function talepReddet(talepId) {
  degistir((v) => { v.talepler.find((x) => x.id === talepId).durum = "reddedildi"; });
}

export async function talepIptal(talepId) {
  degistir((v) => {
    const t = v.talepler.find((x) => x.id === talepId);
    const ilan = v.ilanlar.find((x) => x.id === t.ilanId);
    if (ilan) ilan.dolu = ilan.dolu.filter((r) => r.talepId !== talepId);
    t.durum = "iptal";
  });
}

export async function aralikEkle(ilanId, { bas, bit, not = "" }) {
  degistir((v) => {
    const ilan = ilanBul(v, ilanId);
    ilan.dolu = aralikEkleKontrol(ilan, { id: yeniId(), bas, bit, tur: "kapali", not });
  });
}

export async function aralikSil(ilanId, aralikId) {
  degistir((v) => {
    const ilan = ilanBul(v, ilanId);
    if (ilan.dolu.find((r) => r.id === aralikId)?.talepId) {
      throw new IsHatasi("Bu bir rezervasyon; Talepler sekmesinden iptal edin.");
    }
    ilan.dolu = ilan.dolu.filter((r) => r.id !== aralikId);
  });
}

function mevcutOturum() {
  try { return JSON.parse(sessionStorage.getItem("kk-demo-oturum")); } catch { return null; }
}

export async function girisYap(email, sifre) {
  if (sifre !== "demo") throw new IsHatasi("Demo modunda şifre: demo");
  try { sessionStorage.setItem("kk-demo-oturum", JSON.stringify({ email })); } catch { /* yoksay */ }
  dinleyiciler.forEach((cb) => cb({ email }));
}

export async function cikisYap() {
  try { sessionStorage.removeItem("kk-demo-oturum"); } catch { /* yoksay */ }
  dinleyiciler.forEach((cb) => cb(null));
}

export function oturumDinle(cb) {
  dinleyiciler.add(cb);
  cb(mevcutOturum());
  return () => dinleyiciler.delete(cb);
}
