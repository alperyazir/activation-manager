import { useEffect, useState } from 'react'
import { Loader2, Plus, ShieldAlert, Trash2 } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase, callRpc } from '@/lib/supabase'
import type { Grade, Language } from '@/lib/database.types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'

// Dinamik tablo adıyla çalışırken jenerik şema tipi 'never'e daralıyor;
// bu bileşen için tipsiz client kullanıyoruz.
const db = supabase as unknown as SupabaseClient

type Item = Grade | Language

function ListEditor({
  title,
  table,
}: {
  title: string
  table: 'grades' | 'languages'
}) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await db.from(table).select('*').order('sort_order')
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function add() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const nextOrder =
      items.reduce((m, i) => Math.max(m, i.sort_order), 0) + 1
    const { error } = await db
      .from(table)
      .insert({ name: name.trim(), sort_order: nextOrder })
    setSaving(false)
    if (error) {
      setError('Eklenemedi (aynı isim olabilir).')
      return
    }
    setName('')
    load()
  }

  async function toggleActive(item: Item) {
    await db.from(table).update({ active: !item.active }).eq('id', item.id)
    load()
  }

  async function remove(item: Item) {
    const { error } = await db.from(table).delete().eq('id', item.id)
    if (error) {
      setError('Silinemedi. Bu öğe kayıtlarda kullanılıyor olabilir; pasife alın.')
      return
    }
    load()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Yeni ekle…"
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <Button onClick={add} disabled={saving}>
            <Plus className="h-4 w-4" />
            Ekle
          </Button>
        </div>
        {error && (
          <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-[var(--color-danger)]">
            {error}
          </p>
        )}
        {loading ? (
          <Loader2 className="mx-auto my-6 h-5 w-5 animate-spin text-[var(--color-muted)]" />
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2">
                <span className={item.active ? '' : 'text-[var(--color-muted)] line-through'}>
                  {item.name}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleActive(item)}
                  >
                    {item.active ? 'Pasife Al' : 'Aktifleştir'}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(item)}
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default function Settings() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Sınıf & Dil Yönetimi</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Öğrenci formundaki seçilebilir listeleri yönetin
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ListEditor title="Sınıflar" table="grades" />
        <ListEditor title="Diller" table="languages" />
      </div>

      <div className="mt-6">
        <RetentionCard />
      </div>
    </div>
  )
}

function RetentionCard() {
  const [days, setDays] = useState(365)
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function purge() {
    if (!days || days < 1) {
      setConfirm(false)
      setResult('Lütfen 1 veya daha büyük bir gün sayısı girin.')
      return
    }
    setLoading(true)
    const { data, error } = await callRpc('purge_registrations_older_than', {
      p_days: days,
    })
    setLoading(false)
    setConfirm(false)
    if (error) {
      setResult('İşlem başarısız. Yetkinizi kontrol edin.')
      return
    }
    setResult(`${data ?? 0} kayıt silindi.`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            KVKK — Veri Saklama (Retention)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          Belirtilen günden daha eski öğrenci kayıtlarını kalıcı olarak siler.
          KVKK saklama politikanıza göre düzenli olarak uygulanabilir.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
              Gün (bundan eski kayıtlar)
            </label>
            <Input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-40"
            />
          </div>
          <Button variant="danger" onClick={() => setConfirm(true)}>
            <Trash2 className="h-4 w-4" />
            Eski Kayıtları Sil
          </Button>
        </div>
        {result && (
          <p className="mt-3 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">
            {result}
          </p>
        )}
      </CardContent>

      {confirm && (
        <Modal open onClose={() => setConfirm(false)} title="Eski Kayıtları Sil">
          <p className="text-sm">
            <span className="font-semibold">{days} günden</span> eski tüm öğrenci
            kayıtları kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="danger" className="flex-1" onClick={purge} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Onayla ve Sil
            </Button>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Vazgeç
            </Button>
          </div>
        </Modal>
      )}
    </Card>
  )
}
