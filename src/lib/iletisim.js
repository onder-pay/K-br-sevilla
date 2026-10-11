export const SITE_ADI = import.meta.env.VITE_SITE_ADI || "Kıbrıs Konaklama";
const GENEL_TEL = import.meta.env.VITE_ILETISIM_TEL || "";

// "+90 533 123 45 67" / "0090..." → "905331234567". Numaralar uluslararası formatta girilmeli
// (KKTC +90, Güney Kıbrıs +357); başında 0 olan yerel numarayı tahmin etmeye çalışmıyoruz.
export function telefonRakam(tel) {
  return String(tel || "").replace(/\D/g, "").replace(/^00/, "");
}

export const ilanTelefonu = (ilan) => telefonRakam(ilan?.telefon) || telefonRakam(GENEL_TEL);

export const telLink = (rakam) => `tel:+${rakam}`;

export const whatsappLink = (rakam, mesaj) =>
  `https://wa.me/${rakam}${mesaj ? `?text=${encodeURIComponent(mesaj)}` : ""}`;

// +90 533 123 45 67 (TR/KKTC) ve +357 99 123 456 (Güney) okunur şekilde; diğerleri olduğu gibi.
export function telefonGoster(rakam) {
  if (!rakam) return "";
  let m = rakam.match(/^90(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (m) return `+90 ${m[1]} ${m[2]} ${m[3]} ${m[4]}`;
  m = rakam.match(/^357(\d{2})(\d{3})(\d{3})$/);
  if (m) return `+357 ${m[1]} ${m[2]} ${m[3]}`;
  return `+${rakam}`;
}

export function paraYaz(tutar, birim = "GBP") {
  try {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: birim, maximumFractionDigits: 0 }).format(tutar);
  } catch {
    return `${tutar} ${birim}`;
  }
}
