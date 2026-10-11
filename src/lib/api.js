// Veri katmanı: Firebase ayarları varsa Firestore, yoksa tarayıcıda çalışan demo.
// Sayfalar sadece bu dosyadaki fonksiyonları kullanır; arka uç değişse de arayüz aynı kalır.
import * as demo from "./demoApi";

export const firebaseAyarli = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID
);

const arkaUc = firebaseAyarli ? import("./firebaseApi") : Promise.resolve(demo);
const cagir = (ad) => async (...args) => (await arkaUc)[ad](...args);

export const ilanlariGetir = cagir("ilanlariGetir");
export const ilanGetir = cagir("ilanGetir");
export const ilanKaydet = cagir("ilanKaydet");
export const ilanSil = cagir("ilanSil");
export const fotoYukle = cagir("fotoYukle");
export const talepGonder = cagir("talepGonder");
export const talepleriGetir = cagir("talepleriGetir");
export const talepOnayla = cagir("talepOnayla");
export const talepReddet = cagir("talepReddet");
export const talepIptal = cagir("talepIptal");
export const aralikEkle = cagir("aralikEkle");
export const aralikSil = cagir("aralikSil");
export const girisYap = cagir("girisYap");
export const cikisYap = cagir("cikisYap");
export const oturumDinle = cagir("oturumDinle");
