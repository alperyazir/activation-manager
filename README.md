# Voca Tooki — Aktivasyon & Öğrenci Kayıt Sistemi

Tek kullanımlık aktivasyon kodu tabanlı öğrenci kayıt sistemi.
**Stack:** Vite + React + TypeScript + Tailwind + Supabase (yerel, Docker).

Ayrıntılı tasarım için: [`docs/PLAN.md`](docs/PLAN.md)

## Özellikler

**Öğrenci akışı (public)**
- Aktivasyon kodu girişi — 4 kontrol: kayıtlı / aktif / süresi dolmamış / kullanılmamış
- Bilgi formu: ad, soyad, **sınıf ▼**, **dil ▼** (seçilebilir liste, serbest metin yok)
- Form gönderiminde kod **atomik** olarak `Kullanıldı` olur (çift kullanım imkânsız)
- Kayıt **otomatik `Tamamlandı`** olur — ayrı bir admin onayı/kredential adımı yoktur

**Admin paneli**
- Kayıtlar: ad soyad, sınıf, dil, kod, kayıt tarihi + filtreler (ad soyad, sınıf, dil, tarih) + Excel export
- Kod yönetimi: sistemde **üret** (adet + son kullanma tarihi), **elle tekil ekle**, **Excel ile toplu import** (şablon indirilebilir) ve **Excel'e export**
- Kod durumları: Aktif / Kullanıldı / Pasif / Süresi Doldu
- Sınıf & dil listelerini yönetme
- **Çoklu admin yönetimi**: panelden yönetici ekleme (Edge Function), aktif/pasif yapma (kendini pasifleştiremez)
- **KVKK**: tek kayıt silme + retention (N günden eski kayıtları toplu silme)
- Admin işlem logları (append-only denetim kaydı)
- Tüm liste sayfalarında sayfalama (pagination, sayfa başına 15)

## Kurulum

Gereksinimler: Node 20+, Docker (çalışır durumda).

```bash
npm install
npx supabase start           # yerel Supabase'i Docker'da başlatır (migration + seed uygular)
cp .env.example .env.local   # gerekirse start çıktısındaki anon key ile güncelleyin
npm run dev                  # http://localhost:5173
```

`.env.local` yerel varsayılan değerlerle hazır gelir (yerel Supabase anon key deterministiktir).

### Yerel demo admin
```
E-posta: admin@vocatooki.test
Şifre:   Admin123!
```
> Yalnızca yerel geliştirme içindir. Prod'da kullanılmaz.

Faydalı adresler (start çıktısında):
- Uygulama: http://localhost:5173 · Admin: http://localhost:5173/admin/login
- Supabase Studio: http://localhost:54323

## Komutlar

```bash
npm run dev       # geliştirme sunucusu
npm run build     # tsc -b && vite build
npm run preview   # üretim build önizleme
npx supabase stop # yerel Supabase'i durdur
```

## Mimari Notları

- **Güvenlik/KVKK:** Öğrenci tabloları anon'a kapalı; kayıt yalnızca `redeem_code` RPC (SECURITY DEFINER) üzerinden. Kod tabloları anon'a görünmez (kod tahminini engeller). Admin işlemleri loglanır. Minimum veri (veli iletişimi yok).
- **Rate limit:** Kod doğrulama IP bazında sınırlı (`check_code` 20/dk, `redeem_code` 10/dk) — brute-force koruması (migration `0006`). IP, `X-Forwarded-For`'un son değerinden alınır (tek güvenilir gateway varsayımı); farklı proxy topolojisinde bu değer ayarlanmalıdır.
- **Sıkılaştırma (migration `0010`):** Internal SQL helper fonksiyonları (`log_admin_action`, `check_rate_limit`, `client_ip` vb.) Data API'ye kapalı (anon/public'ten `REVOKE`) — yalnızca SECURITY DEFINER fonksiyonların içinden çağrılır. Kodlar `gen_random_bytes` ile üretilir. Public sign-up kapalı (`enable_signup = false`) — admin yalnızca Edge Function ile oluşturulur.
- **RPC'ler:** `check_code`, `redeem_code` (anon); `generate_codes`, `bulk_import_codes`, `set_code_status`, `create_student_credentials` (admin — `is_admin()` kontrolü).
- **Migration'lar:** `supabase/migrations/0001`–`0008`. Seed: `supabase/seed.sql`. Yeni yönetici oluşturma `supabase/functions/create-admin` Edge Function'ı (service_role) ile yapılır.
- Yerel Supabase'de realtime/storage/analytics kapalı; **edge_runtime açık** (create-admin için).
