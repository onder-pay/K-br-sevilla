# Kıbrıs Konaklama

Airbnb tarzı tatil evi sitesi — **ödeme yok**. Ziyaretçi müsaitliği görür, rezervasyon talebi bırakır,
ardından ev sahibini telefonla arar veya WhatsApp'tan yazar. Rezervasyon, yönetici onaylayınca kesinleşir.

React + Vite + Firebase (Auth, Firestore, Storage). Firebase ayarları yoksa **demo modunda** çalışır
(veriler tarayıcının localStorage'ında; yönetici şifresi `demo`).

> Firebase için vize projesinden **ayrı bir proje** açın; veriler karışmasın.

## Geliştirme
```
npm install
npm run dev          # .env yoksa demo modu
```

## Akış
1. **Ziyaretçi**: ana sayfada bölge / tarih / kişi ile arar (sadece müsait evler listelenir) →
   ilan sayfasında takvimden giriş-çıkış seçer → ad + telefon ile talep gönderir → talep kodu (ör. `KK-7HQ2MX`)
   ve "WhatsApp ile yaz / Ara" butonları çıkar. Formsuz, doğrudan WhatsApp da mümkün.
2. **Yönetici** (`/yonetim`): talepleri görür, misafiri tek tıkla arar/WhatsApp'lar,
   **Onayla** → tarihler takvimde kapanır (çakışma varsa onay reddedilir). **İptal** → tarihler yeniden açılır.
3. Telefonla gelen rezervasyonlar ve kapalı günler ilan düzenleme sayfasındaki **Takvim**'den elle kapatılır.

### Bilinçli tasarım kararları
- **Bekleyen talep takvimi kapatmaz.** Kapatsaydı, tek bir kötü niyetli kişi sahte taleplerle bütün
  takvimi doldurabilirdi. Sadece onaylanan rezervasyon ve elle kapatma tarihleri bloke eder.
- Misafirin adı/telefonu `talepler` koleksiyonundadır ve **sadece yönetici okuyabilir**.
  Herkese açık `ilanlar` dokümanındaki `dolu` listesinde sadece tarih + not tutulur.
- Onay ve kapatma işlemleri Firestore transaction'ı ile yapılır → iki kişi aynı anda onaylasa da çifte rezervasyon olmaz.

## Firebase kurulumu (canlıya alma)
1. Firebase Console'da **yeni proje** → Web app ekle → değerleri `.env` dosyasına yazın (`.env.example`'a bakın).
   Netlify'da aynı değerleri Site settings → Environment variables'a girin.
2. Authentication → Email/Password'ü açın → yönetici kullanıcıyı ekleyin.
3. Firestore'da `yoneticiler` koleksiyonu → doküman ID = yöneticinin **UID**'si (içerik boş olabilir).
4. `firestore.rules` ve `storage.rules`'u Console'dan yayınlayın.
5. İlk girişte Firestore "index gerekli" uyarısı verirse hatadaki linke tıklayıp oluşturun.

## Deploy (Netlify)
- Build command: `npm run build` · Publish directory: `dist`

## Firestore koleksiyonları
- `ilanlar` — ilan bilgileri + `dolu: [{id, bas, bit, tur: "rezervasyon"|"kapali", talepId?, not}]` (bit = çıkış günü)
- `talepler` — rezervasyon talepleri (kişisel veri; sadece yönetici)
- `yoneticiler` — yönetici UID'leri

## Eksikler / sonraki adımlar
- **iCal senkronu yok.** Ev Airbnb/Booking'de de ilanlıysa takvimler elle eşitlenmeli; yoksa çifte rezervasyon olur.
- **Spam koruması sadece kurallar düzeyinde** (alan doğrulama). Canlıda Firebase App Check (reCAPTCHA) açılmalı.
- Talep gelince yöneticiye bildirim (e-posta/Telegram) yok; şimdilik panelden kontrol edilir.
