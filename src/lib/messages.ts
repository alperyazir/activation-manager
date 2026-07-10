// RPC'lerden dönen 'reason' kodları için Türkçe mesajlar

export const codeReasonMessages: Record<string, string> = {
  not_found: 'Bu aktivasyon kodu sistemde kayıtlı değil.',
  used: 'Bu aktivasyon kodu daha önce kullanılmış.',
  expired: 'Bu aktivasyon kodunun süresi dolmuş.',
  passive: 'Bu aktivasyon kodu şu an pasif durumda.',
  invalid_name: 'Lütfen ad ve soyad bilgisini eksiksiz girin.',
  invalid_grade: 'Lütfen geçerli bir sınıf seçin.',
  invalid_language: 'Lütfen geçerli bir dil seçin.',
  rate_limited: 'Çok fazla deneme yapıldı. Lütfen bir dakika sonra tekrar deneyin.',
}

export function codeMessage(reason: string | undefined): string {
  if (!reason) return 'Bilinmeyen bir hata oluştu.'
  return codeReasonMessages[reason] ?? 'Kod doğrulanamadı.'
}
