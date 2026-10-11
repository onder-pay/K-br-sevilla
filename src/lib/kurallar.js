// Firebase ve demo arka ucun ortak iş kuralları (rezervasyon onayı, takvim kapatma).
import { aralikMusait, gecerliTarih } from "./tarih";

export class IsHatasi extends Error {}

export function aralikEkleKontrol(ilan, yeni) {
  if (!gecerliTarih(yeni.bas) || !gecerliTarih(yeni.bit) || yeni.bas >= yeni.bit) {
    throw new IsHatasi("Geçersiz tarih aralığı.");
  }
  if (!aralikMusait(yeni.bas, yeni.bit, ilan.dolu || [])) {
    throw new IsHatasi("Bu tarihler başka bir rezervasyon veya kapatma ile çakışıyor.");
  }
  return [...(ilan.dolu || []), yeni].sort((a, b) => a.bas.localeCompare(b.bas));
}

export function talepAraligi(talepId, talep) {
  return { id: talepId, bas: talep.giris, bit: talep.cikis, tur: "rezervasyon", talepId, not: talep.ad };
}

// Misafirin telefonda/WhatsApp'ta söyleyeceği kısa kod (karışan harfler yok: 0/O, 1/I).
export function talepKoduUret() {
  const harfler = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const r = crypto.getRandomValues(new Uint32Array(6));
  return "KK-" + Array.from(r, (n) => harfler[n % harfler.length]).join("");
}

export const yeniId = () => crypto.randomUUID();
