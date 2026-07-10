# Voca Tooki — Aktivasyon & Öğrenci Kayıt Sistemi · Uygulama Planı

> Tek kullanımlık aktivasyon kodu tabanlı öğrenci kayıt sistemi.
> Stack: **Vite + React + TypeScript + Supabase**.

## 1. Onaylanmış Kararlar

| Konu | Karar |
|------|-------|
| Backend | Supabase (Postgres + Auth + Edge Functions), ayrı sunucu yok |
| Frontend | Vite + React + TypeScript + Tailwind + shadcn/ui |
| Öğrenci login | **Kapsam dışı** — bu sistem sadece kayıt yapar |
| Kod kilitleme | Form gönderilince kod **anında `Kullanıldı`** olur (atomik) |
| Kod üretimi | **Sistem üretir** (arayüzden adet + son kullanma tarihi) → indirilip dağıtılır; **ek olarak Excel ile toplu import da desteklenir** |
| Ortam | **Yerel Supabase** (CLI + Docker), migration'lar repo'da |
| Kod süresi | **Her kodun kendi `expires_at` tarihi** var |
| Admin sayısı | **Çoklu admin**, her işlem loglanır |
| Sınıf/Dil listeleri | **Admin panelinden yönetilebilir** |
| Şifre | Düz metin YOK — `bcrypt`/`argon2` hash |

## 2. Akış Özeti

**Öğrenci:** Kod gir → (kayıtlı / aktif / süresi dolmamış / kullanılmamış kontrolü) → Form (ad, soyad, sınıf▼, dil▼) → Gönder → kod `Kullanıldı` + kayıt `Onay Bekliyor` → Başarılı ekranı.

**Admin:** Onay bekleyen kaydı gör → kullanıcı adı + geçici şifre üret (hash'lenir, ekranda tek sefer gösterilir) → kayıt `Tamamlandı`.

**Kod yönetimi:** Adet + son kullanma tarihi gir → sistem tekil kod üretir → Excel/CSV indir → dağıt.

## 3. Veri Modeli

```sql
grades      (id, name, sort_order, active)          -- admin yönetir
languages   (id, name, sort_order, active)          -- admin yönetir

activation_codes (
  id uuid pk, code text unique not null,
  status text check in ('active','used','passive','expired') default 'active',
  expires_at timestamptz,                 -- her kodun kendi tarihi
  batch_id uuid,                          -- hangi üretim partisi
  created_at timestamptz default now(), used_at timestamptz,
  created_by uuid
)

code_batches (id, label, quantity, expires_at, created_by, created_at)  -- üretim partisi

student_registrations (
  id uuid pk, code_id uuid fk -> activation_codes,
  first_name text, last_name text,
  grade_id uuid fk, language_id uuid fk,
  status text check in ('pending','completed') default 'pending',
  username text unique, temp_password_hash text,     -- düz metin ASLA
  registered_at timestamptz default now(),
  completed_at timestamptz, completed_by uuid
)

admin_audit_log (id, admin_id, action, target_type, target_id, detail jsonb, created_at)  -- append-only
```

**Kod formatı önerisi:** 10-12 karakter, karışabilen karakterler hariç (O/0, I/1/l yok), gruplanmış (örn. `VT-XXXX-XXXX`). Üretimde tekillik DB unique + çakışmada yeniden üret ile garanti.

**`expired` mantığı:** `expires_at` alanı tutulur; listelerde anlık hesaplanır (`expires_at < now()` → süresi doldu). Opsiyonel günlük cron ile kalıcı işaretleme.

## 4. Ekranlar / Rotalar

**Public (öğrenci):**
- `/` — Kod giriş
- `/register` — Bilgi formu (kod geçerliyse)
- `/success` — Kayıt alındı

**Admin (auth):**
- `/admin/login`
- `/admin/registrations` — Liste + filtreler (tarih, kod durumu, ad soyad, sınıf, dil, kayıt durumu) + Excel export + kredential üret
- `/admin/codes` — Kod üretim arayüzü + parti/kod listesi + durumlar + Excel/CSV indir
- `/admin/settings` — Sınıf/dil listesi yönetimi
- `/admin/logs` — İşlem logları

## 5. Sunucu Tarafı Fonksiyonlar

| İşlev | Tip | Neden |
|-------|-----|-------|
| `redeem_code` | Postgres RPC | Atomik: kodu kilitle+doğrula, kayıt insert, kodu `used` yap |
| `generate_codes` | Edge Function / RPC | N tekil kod üret, parti oluştur, expires_at ata |
| `bulk_import_codes` | Edge Function | Excel'den kod parse + tekillik/format doğrulama + import |
| `create_student_credentials` | Edge Function | Kullanıcı adı üret + şifre hash + `completed` + log |

## 6. RLS / Güvenlik / KVKK

- `student_registrations`: anon doğrudan INSERT edemez → sadece `redeem_code` RPC. SELECT sadece admin.
- `activation_codes`: anon SELECT edemez; doğrulama RPC üzerinden (kod tahminini engeller).
- `admin_audit_log`: append-only (UPDATE/DELETE yok).
- Şifreler hash; geçici şifre tek sefer gösterilir.
- Kod doğrulama RPC'sine rate limit.
- Minimum veri (veli iletişimi yok). Retention politikası sonra tanımlanacak.

## 7. Aşamalar

1. Kurulum: Supabase projesi + Vite iskeleti + Tailwind/shadcn
2. Şema + RLS migration + seed
3. Öğrenci akışı (kod giriş + `redeem_code` + form + success)
4. Admin auth + kayıt listesi + filtreler
5. Kredential üretimi (hash + log)
6. Kod üretim arayüzü + Excel/CSV indir
7. Sınıf/dil yönetimi + audit log ekranı + export + rate limit/cila
