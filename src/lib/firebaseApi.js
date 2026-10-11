import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc, deleteDoc, updateDoc,
  query, where, orderBy, serverTimestamp, runTransaction,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { aralikEkleKontrol, talepAraligi, IsHatasi, talepKoduUret, yeniId } from "./kurallar";

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const veri = (snap) => ({ id: snap.id, ...snap.data() });

// --- İlanlar ---
// Herkese açık sorgu `yayinda == true` filtresi taşımak zorunda (kurallar başka türlü listelemeye izin vermez).
export async function ilanlariGetir({ tumu = false } = {}) {
  const q = tumu ? collection(db, "ilanlar") : query(collection(db, "ilanlar"), where("yayinda", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map(veri).sort((a, b) => a.baslik.localeCompare(b.baslik, "tr"));
}

export async function ilanGetir(id) {
  try {
    const snap = await getDoc(doc(db, "ilanlar", id));
    return snap.exists() ? veri(snap) : null;
  } catch (e) {
    // Yayında olmayan ilanı ziyaretçi okuyamaz → "bulunamadı" gibi davran.
    if (e.code === "permission-denied") return null;
    throw e;
  }
}

export async function ilanKaydet({ id, dolu, ...alanlar }) {
  // `dolu` (takvim) burada yazılmaz; sadece transaction'lı fonksiyonlar değiştirir.
  if (id) {
    await updateDoc(doc(db, "ilanlar", id), { ...alanlar, guncelleme: serverTimestamp() });
    return id;
  }
  const yeni = await addDoc(collection(db, "ilanlar"), { ...alanlar, dolu: [], olusturma: serverTimestamp() });
  return yeni.id;
}

export const ilanSil = (id) => deleteDoc(doc(db, "ilanlar", id));

export async function fotoYukle(dosya) {
  const r = ref(storage, `ilan-fotolar/${yeniId()}-${dosya.name.replace(/[^\w.-]/g, "_")}`);
  await uploadBytes(r, dosya, { contentType: dosya.type });
  return getDownloadURL(r);
}

// --- Rezervasyon talepleri ---
export async function talepGonder(talep) {
  const kod = talepKoduUret();
  // Misafir talebi oluşturabilir ama okuyamaz; bu yüzden id'yi istemci üretiyor.
  await setDoc(doc(db, "talepler", yeniId()), {
    ...talep, kod, durum: "beklemede", olusturma: serverTimestamp(),
  });
  return { kod };
}

export async function talepleriGetir() {
  const snap = await getDocs(query(collection(db, "talepler"), orderBy("olusturma", "desc")));
  return snap.docs.map((s) => {
    const t = veri(s);
    return { ...t, olusturma: t.olusturma?.toDate?.().toISOString() ?? null };
  });
}

// Onay: talep beklemede mi + tarihler hâlâ boş mu, ikisi de tek transaction'da kontrol edilir.
export function talepOnayla(talepId) {
  return runTransaction(db, async (tx) => {
    const talepRef = doc(db, "talepler", talepId);
    const talepSnap = await tx.get(talepRef);
    if (!talepSnap.exists()) throw new IsHatasi("Talep bulunamadı.");
    const talep = talepSnap.data();
    if (talep.durum !== "beklemede") throw new IsHatasi("Bu talep artık beklemede değil.");
    const ilanRef = doc(db, "ilanlar", talep.ilanId);
    const ilanSnap = await tx.get(ilanRef);
    if (!ilanSnap.exists()) throw new IsHatasi("İlan silinmiş.");
    const dolu = aralikEkleKontrol(ilanSnap.data(), talepAraligi(talepId, talep));
    tx.update(ilanRef, { dolu });
    tx.update(talepRef, { durum: "onaylandi" });
  });
}

export const talepReddet = (talepId) => updateDoc(doc(db, "talepler", talepId), { durum: "reddedildi" });

export function talepIptal(talepId) {
  return runTransaction(db, async (tx) => {
    const talepRef = doc(db, "talepler", talepId);
    const talep = (await tx.get(talepRef)).data();
    const ilanRef = doc(db, "ilanlar", talep.ilanId);
    const ilanSnap = await tx.get(ilanRef);
    if (ilanSnap.exists()) {
      tx.update(ilanRef, { dolu: (ilanSnap.data().dolu || []).filter((r) => r.talepId !== talepId) });
    }
    tx.update(talepRef, { durum: "iptal" });
  });
}

// --- Takvim (telefonla gelen rezervasyonlar, bakım vb. için elle kapatma) ---
export function aralikEkle(ilanId, { bas, bit, not = "" }) {
  return runTransaction(db, async (tx) => {
    const ilanRef = doc(db, "ilanlar", ilanId);
    const ilan = (await tx.get(ilanRef)).data();
    tx.update(ilanRef, { dolu: aralikEkleKontrol(ilan, { id: yeniId(), bas, bit, tur: "kapali", not }) });
  });
}

export function aralikSil(ilanId, aralikId) {
  return runTransaction(db, async (tx) => {
    const ilanRef = doc(db, "ilanlar", ilanId);
    const ilan = (await tx.get(ilanRef)).data();
    const aralik = (ilan.dolu || []).find((r) => r.id === aralikId);
    if (aralik?.talepId) throw new IsHatasi("Bu bir rezervasyon; Talepler sekmesinden iptal edin.");
    tx.update(ilanRef, { dolu: (ilan.dolu || []).filter((r) => r.id !== aralikId) });
  });
}

// --- Yönetici oturumu ---
// Yönetici = `yoneticiler/{uid}` dokümanı olan hesap. Sadece Auth hesabı yetmez.
export async function girisYap(email, sifre) {
  await signInWithEmailAndPassword(auth, email, sifre);
}

export const cikisYap = () => signOut(auth);

export function oturumDinle(cb) {
  return onAuthStateChanged(auth, async (kullanici) => {
    if (!kullanici) return cb(null);
    const yonetici = await getDoc(doc(db, "yoneticiler", kullanici.uid)).catch(() => null);
    if (yonetici?.exists()) return cb({ email: kullanici.email });
    await signOut(auth);
    cb(null, "Bu hesabın yönetici yetkisi yok.");
  });
}
