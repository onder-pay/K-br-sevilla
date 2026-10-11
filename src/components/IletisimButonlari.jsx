import { ilanTelefonu, telLink, whatsappLink, telefonGoster } from "../lib/iletisim";

export default function IletisimButonlari({ ilan, mesaj }) {
  const tel = ilanTelefonu(ilan);
  if (!tel) return <p className="soluk kucuk">İletişim numarası henüz eklenmemiş.</p>;
  return (
    <div className="iletisim-butonlari">
      <a className="buton whatsapp" href={whatsappLink(tel, mesaj)} target="_blank" rel="noreferrer">WhatsApp ile yaz</a>
      <a className="buton ikincil" href={telLink(tel)}>Ara: {telefonGoster(tel)}</a>
    </div>
  );
}
