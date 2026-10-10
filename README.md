# ONYX CRM — interni klicni center

Preprost, hiter interni CRM za telefonsko klicanje s tedenskim
leaderboardom. Teče lokalno (SQLite), koda pa je zgrajena tako, da jo je
kasneje mogoče brez večjih sprememb objaviti v oblak (Vercel) z lastno
domeno.

## Tehnologije

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** za vmesnik
- **SQLite + Prisma** za bazo podatkov
- **xlsx** za uvoz Excel/CSV datotek

## Glavne funkcionalnosti

- Izbira agenta ob vstopu (brez gesel) — `/`
- **Lestvica (Leaderboard)** — `/lestvica`: tedenska razvrstitev
  (ponedeljek–nedelja) po številu klicev in uspešnih klicev, z navigacijo
  med tedni
- **Klicanje** — `/klici`: seznam kontaktov, iskanje/filtriranje, `tel:`
  klic, hitri gumbi za status (⚪ Nov, 🟡 Ni odgovora, 🟢
  Zainteresiran/Sestanek, 🔴 Zavrnil) in opombe. Vsaka sprememba statusa se
  samodejno šteje kot klic na leaderboardu.
- **Admin** — `/admin`: uvoz Excel/CSV (drag & drop), upravljanje agentov,
  pregled statistike ekipe in celotne baze kontaktov

## 1. Namestitev in lokalni zagon

Potrebujete [Node.js](https://nodejs.org/) 18 ali novejši.

```bash
# 1. Namestite odvisnosti
npm install

# 2. Ustvarite lokalno SQLite bazo in tabele
npx prisma db push

# 3. (priporočeno) Dodajte nekaj začetnih agentov in primer kontaktov
npm run db:seed

# 4. Zaženite razvojni strežnik
npm run dev
```

Aplikacija bo na voljo na [http://localhost:3000](http://localhost:3000).

Bazo (`prisma/dev.db`) lahko kadarkoli pregledate v grafičnem vmesniku z
ukazom:

```bash
npm run db:studio
```

## 2. Dostop iz lokalnega omrežja (ostali računalniki v pisarni)

Da lahko do aplikacije dostopajo tudi drugi računalniki v isti pisarniški
mreži (ne samo ta, na katerem teče strežnik), zaženite razvojni strežnik
tako, da posluša na vseh omrežnih vmesnikih:

```bash
npm run dev -- -H 0.0.0.0
# ali enakovredno:
npm run dev:lan
```

Nato na računalniku, kjer aplikacija teče, poiščite svoj lokalni IP naslov:

- **Windows:** odprite ukazno vrstico (cmd) in vpišite `ipconfig` → poiščite
  "IPv4 Address" (npr. `192.168.1.25`)
- **macOS/Linux:** odprite terminal in vpišite `ifconfig` ali `ip a` →
  poiščite naslov v obliki `192.168.x.x`

Ostali v pisarni nato v brskalniku obiščejo:

```
http://<VAŠ-LOKALNI-IP>:3000
```

npr. `http://192.168.1.25:3000`

> Opomba: vsi računalniki morajo biti v istem lokalnem omrežju (WiFi/LAN).
> Če povezava ne deluje, preverite požarni zid (firewall) na računalniku,
> kjer teče strežnik — mora dovoliti dohodne povezave na vrata (port) 3000.

## 3. Objava v oblak (Vercel) — kasneje

Projekt je pripravljen za objavo na [Vercel](https://vercel.com) brez
sprememb v strukturi kode. Ker pa Vercelova gostovana okolja (serverless)
nimajo trajnega datotečnega sistema, **lokalna SQLite datoteka
(`prisma/dev.db`) na Vercelu ne bo obstojna** (podatki bi se ob vsakem
novem "deploymentu" oz. restartu izgubili). Zato je pred objavo priporočljivo
preklopiti na gostovano bazo (npr. [Vercel Postgres](https://vercel.com/storage/postgres),
[Neon](https://neon.tech) ali [Supabase](https://supabase.com) — vsi imajo
brezplačen začetni paket).

Ker projekt uporablja Prisma kot ORM plast, je preklop enostaven in ne
zahteva sprememb v API poteh ali komponentah:

1. V `prisma/schema.prisma` spremenite:
   ```prisma
   datasource db {
     provider = "postgresql"   // namesto "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
2. V nastavitvah projekta na Vercelu dodajte spremenljivko okolja
   `DATABASE_URL` s povezovalnim nizom vaše Postgres baze (dobite ga pri
   ponudniku baze).
3. Lokalno poženite `npx prisma migrate dev --name init`, da ustvarite
   migracijsko datoteko, in jo dodajte v git repozitorij.
4. Projekt povežite z Vercel (`vercel` CLI ali uvoz Git repozitorija na
   [vercel.com/new](https://vercel.com/new)) in dodajte lastno domeno v
   nastavitvah projekta (Settings → Domains).
5. Vercel ob vsaki objavi samodejno požene `npm run build`, kar vključuje
   `prisma generate` (glej `postinstall` skripto v `package.json`).

Do takrat aplikacija normalno teče lokalno s SQLite — ni potrebno ničesar
spreminjati za vsakdanjo uporabo v pisarni.

## Struktura projekta

```
onyx-crm/
├── prisma/
│   ├── schema.prisma      # podatkovni model (Agent, Contact, CallLog)
│   └── seed.ts            # začetni podatki
├── src/
│   ├── app/
│   │   ├── page.tsx           # izbira agenta ("prijava")
│   │   ├── klici/page.tsx     # vmesnik za klicanje
│   │   ├── lestvica/page.tsx  # tedenski leaderboard
│   │   ├── admin/page.tsx     # admin nadzorna plošča
│   │   └── api/                # REST API poti (agents, contacts, leaderboard, …)
│   ├── components/             # UI komponente (Navbar, ImportDropzone, …)
│   ├── lib/                    # Prisma klient, tedenski obračun, pomožne funkcije
│   └── types/                  # skupni TypeScript tipi
└── README.md
```

## Pogosta vprašanja

**Kako se klic prišteje na leaderboard?**
Vsakič, ko agent na strani "Klicanje" klikne enega od štirih statusnih
gumbov (Nov / Ni odgovora / Zainteresiran / Zavrnil), se to shrani kot
zapis v tabeli `CallLog` z agentom in časovnim žigom. Leaderboard nato za
izbrani teden sešteje vse zapise po agentu — brez ročnega poseganja.

**Kaj šteje kot "uspešen klic"?**
Status **🟢 Zainteresiran / Sestanek**. To lahko po želji razširite v
`src/types/contact.ts` (konstanta `SUCCESS_STATUSES`).

**Kako ponastavim teden?**
Lestvica se samodejno računa glede na datum (ponedeljek–nedelja), zato
ročna ponastavitev ni potrebna — vsak nov teden se šteje od začetka. S
puščicama "← Prejšnji teden" / "Naslednji teden →" lahko kadarkoli
pogledate pretekle tedne, ne da bi izgubili zgodovino.
