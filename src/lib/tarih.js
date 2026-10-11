// Tüm tarihler yerel saatte "YYYY-MM-DD" string olarak tutulur.
// Aralıklar [bas, bit) şeklindedir: `bit` çıkış günüdür, o gece dolu sayılmaz.
// Bu formatta string karşılaştırma tarih karşılaştırmasıyla aynıdır.

const iki = (n) => String(n).padStart(2, "0");

export function iso(d) {
  return `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;
}

export function tarihOku(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const bugun = () => iso(new Date());

export function gunEkle(s, n) {
  const d = tarihOku(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

export function geceSayisi(giris, cikis) {
  return Math.round((tarihOku(cikis) - tarihOku(giris)) / 86400000);
}

export const gecerliTarih = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

export const cakisir = (a1, b1, a2, b2) => a1 < b2 && a2 < b1;

// O günün gecesi dolu mu?
export const geceDolu = (gun, araliklar = []) =>
  araliklar.some((r) => r.bas <= gun && gun < r.bit);

export const aralikMusait = (giris, cikis, araliklar = []) =>
  !araliklar.some((r) => cakisir(giris, cikis, r.bas, r.bit));

export function tarihYaz(s, uzun = false) {
  return tarihOku(s).toLocaleDateString("tr-TR", uzun
    ? { day: "numeric", month: "long", year: "numeric" }
    : { day: "numeric", month: "short" });
}
