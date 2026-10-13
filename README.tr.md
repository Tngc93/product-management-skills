# product-management-skills

**AI kodlama ajanları için ürün yönetimi skill'leri ve onları dürüst tutan bir linter.** Claude Code ve Codex için altı skill: dağınık notlardan PRD çıkarır, işi story'lere böler, Given/When/Then kabul kriterleri yazar, backlog'u RICE ya da ICE ile sıralar, paydaş güncellemesi hazırlar ve spec'leri gözden geçirir. Küçük bir CLI ifadeleri kontrol eder ve hesabı yapar; böylece çıktı, ekibin üzerine iş kurabileceği bir doküman olur.

[English](README.md) | Türkçe

[![CI](https://github.com/Tngc93/product-management-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/Tngc93/product-management-skills/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
![Dependencies: 0](https://img.shields.io/badge/dependencies-0-blue)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/how-it-works-dark.svg">
  <img src="docs/assets/how-it-works-light.svg" alt="Animasyonlu diyagram: dağınık notlar write-prd skill'iyle PRD'ye dönüşür, pm-skills lint belirsiz ifadeleri ve mevcut değeri olmayan metrikleri yakalar, düzeltilen PRD story'lere bölünür ve Given/When/Then kriterleri yazılır, backlog RICE betiğiyle puanlanır ve sonuç paydaş güncellemesine girer" width="100%">
</picture>

## Neden

Bir dil modeli saniyeler içinde akıcı bir PRD yazar. Ama akıcı olmak, üzerine iş kurulabilir olmak demek değil: "ödeme adımını daha hızlı ve sezgisel yap", mevcut değeri olmayan bir başarı metriği, aksiyonu olmayan bir senaryo, çarpımı yanlış bir RICE tablosu. Bunlar kıdemli bir PM'in gözden geçirmede yakaladığı hatalar ve çoğu mekanik.

Bu paket işi ikiye böler:

- **Skill'ler yöntemi taşır:** yazmadan önce ne sorulur, bir PRD'de hangi bölümler olur, SPIDR ile dikey dilimleme nasıl yapılır, uç durumlar nasıl bulunur, göz gezdiren bir yönetici için nasıl yazılır.
- **Deterministik bir CLI kontrol edilebilir olanı kontrol eder:** eksik bölümler; her biri için somut bir öneriyle belirsiz ifadeler; sayısı, mevcut değeri ya da tarihi olmayan metrikler; Given, When ya da Then'i eksik Gherkin senaryoları; "böylece" kısmı olmayan story'ler. RICE ve ICE hesabının tamamını da CLI yapar, çünkü sıralama bir modelin doğru çarpma yapmasına bağlı olmamalı.

Her şey düz Markdown. Hiçbir yere veri gönderilmez, hiçbir proje yönetim aracı gerekmez. Çıktıyı ekibin nerede çalışıyorsa oraya yapıştırırsın.

## Skill'ler

| Skill | Ne için | Çıktı |
| --- | --- | --- |
| `write-prd` | Not, yazışma ya da fikirden tek sayfalık PRD. Önce en fazla üç soru sorar, sayı uydurmaz. | Kanıtlı problem, kullanıcılar, metrik tablosu (mevcut değer, hedef, tarih, koruma metriği), kapsam dışı, numaralı gereksinimler, yayın planı, sahibi belli açık sorular |
| `slice-stories` | Epic'i ya da PRD'yi SPIDR ile ince dikey dilimlere böler. | Bölme yöntemi ve sürümüyle dilim tablosu, "böylece"li story'ler, INVEST kontrolü |
| `acceptance-criteria` | Bir story için sınır değerler, hatalar, yetkiler ve fonksiyonel olmayan kontroller dahil Given/When/Then senaryoları. | İngilizce ya da Türkçe anahtar kelimelerle Gherkin |
| `prioritize` | Her tahmine bir gerekçeyle RICE ya da ICE sıralaması. Hesabı betik yapar. | Sıralı tablo, birbirine çok yakın olanlar, sıralamayı en çok etkileyen tahminler |
| `stakeholder-update` | Durumla, değişiklikle ve taleplerle başlayan durum güncellemesi. | Durum, özet, sayılarla ilerleme, sıradakiler, riskler, talepler |
| `review-spec` | Bir dokümanı mühendis, tasarımcı ve yönetici gözüyle inceler. | Engelleyici / önemli / küçük bulgular ve önerilen yeniden yazımlar, lint sonuçları, üç soru |

Her skill senin yazdığın dilde yazar. Linter İngilizce ve Türkçe anlar: belirsiz ifadeler, bölüm adları, Gherkin anahtar kelimeleri ve zaman ifadeleri.

## Kurulum

**Node.js 18.17+** yeterli, bağımlılık yok.

### Claude Code plugin'i

```text
/plugin marketplace add Tngc93/product-management-skills
/plugin install product-management-skills@product-management-skills
```

Sonra doğal bir şekilde iste: *"bu notlardan PRD çıkar"*, *"bu epic'i dilimle"*, *"bu beş fikri RICE ile sırala"*, *"2. story için kabul kriterleri yaz"*, *"bu listeden yönetime haftalık güncelleme yaz"*, *"bu spec'i gözden geçir"*.

### Codex

Repo, aynı altı skill'i Codex plugin marketplace'leri için `.codex-plugin/plugin.json` ile sunar. `skills/` altındaki klasörleri Codex sürümünün skill okuduğu klasöre de kopyalayabilirsin.

### Yalnızca CLI

```bash
npx github:Tngc93/product-management-skills lint prd.md
npx github:Tngc93/product-management-skills score backlog.md --write
npx github:Tngc93/product-management-skills template write-prd > prd.md
```

`lint` hata varsa 1 ile çıkar; `--strict` uyarıları da hata sayar; `--json` makinenin okuyabileceği çıktı verir. Bir satırı muaf tutmak için satıra `<!-- pm-lint:ignore -->` ekle. Kuralların tam listesi [İngilizce README](README.md#pm-skills-lint-file-or-folder)'de.

`score`, Reach / Impact / Confidence / Effort (RICE) ya da Impact / Confidence / Ease (ICE) sütunlu ilk tabloyu bulur; Türkçe başlıkları da (Erişim, Etki, Güven, Efor, Kolaylık) tanır. `12.000`, `12k`, `%80` ya da `80` gibi yazımları okur, ölçek dışı değerleri reddeder, %80'in üstündeki güveni sorgular ve aralarında %10'dan az fark olan çiftleri "karar stratejiyle verilmeli" diye işaretler.

## Örnekler

[`examples/`](examples) klasörü, kurgusal bir mobilya mağazası için teslimat tarihi aralığı özelliğini baştan sona izler: [toplantı notları](examples/before/meeting-notes.md), [PRD](examples/good/prd-delivery-estimate.md), [story'ler](examples/good/stories-delivery-estimate.md), [kabul kriterleri](examples/good/criteria-delivery-window.md), [RICE sıralaması](examples/good/backlog-rice.md) ve [durum güncellemesi](examples/good/update-week-42.md).

## Sınırlar

- Linter biçimi kontrol eder, muhakemeyi değil. Bir PRD linter'dan geçip yine de yanlış problemi çözebilir; `review-spec` ve ekibin bunun için var.
- Belirsiz ifade tespiti bir kelime listesine dayanır ve bazen yerinde kullanılmış bir kelimeyi işaretler. İfadeyi düzelt ya da satırı `pm-lint:ignore` ile işaretle.
- RICE ve ICE, girdileri kadar iyidir. Betik girdileri görünür, hesabı doğru yapar; tahminleri doğru yapmaz.

## Lisans

MIT © Berk Arcak
