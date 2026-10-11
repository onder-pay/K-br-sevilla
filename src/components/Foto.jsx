import { useState } from "react";

// Foto yoksa veya yüklenemezse bölge adıyla sade bir yer tutucu gösterir.
export default function Foto({ src, alt, etiket, className = "foto" }) {
  const [bozuk, setBozuk] = useState(false);
  if (!src || bozuk) {
    return <div className={`${className} foto-yok`} role="img" aria-label={alt}><span>{etiket || "Fotoğraf yok"}</span></div>;
  }
  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setBozuk(true)} />;
}
