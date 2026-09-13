# myPhoto

Browserbaseret billedbehandlingsværktøj. Alt arbejde sker lokalt på canvas i
brugerens browser — **ingen upload, ingen backend, ingen API-kald**. Det er appens
kerneløfte og står eksplicit i footeren ("Behandles lokalt, intet uploades").

Oprindeligt bygget i Google AI Studio, nu videreudviklet i Claude Code.
Repo: `websitesmadsdam/Pixel`.

## Kommandoer

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # -> dist/
npm run preview  # server dist/ lokalt
npm run lint     # tsc --noEmit (strict) && eslint .
```

Service workeren findes kun i build. PWA/offline testes derfor med
`npm run build && npm run preview` (port 4173) — ikke med `npm run dev`.

Node 20+. Der er ingen `.env` og ingen hemmeligheder — opret ikke nogen.

## Stak

React 19 · TypeScript 5.8 (`strict`) · Vite 6 · Tailwind CSS 4 · lucide-react.
ESLint 10 (flad config i `eslint.config.js`) med `typescript-eslint` og
`eslint-plugin-react-hooks` 7 — inkl. React Compiler-reglerne.

Tailwind 4 konfigureres via `@tailwindcss/vite`-pluginet og `@theme`-blokken i
`src/index.css` — der er **ingen** `tailwind.config.js`, og der skal ikke laves en.

## Arkitektur

Hele redigeringen er ét deklarativt objekt, `ImageState` (`src/types.ts`), der bor i
`App.tsx`. Originalbilledet holdes uændret i hukommelsen som `HTMLImageElement` og
røres aldrig.

`drawImageWithState()` i `src/utils/filters.ts` er kernen: den gentegner hele
billedet fra bunden ved hver ændring, i ti faste trin:

1. canvasstørrelse → 2. transform (rotation/flip) → 3. CSS-filtre → 4. tegn (evt.
beskåret) → 5. pixelniveau (skarphed, baggrundsfjernelse) → 6. varme-overlay →
7. vignette → 8. vandmærker → 9. tekst → 10. hjørnemaske

**Alle nye effekter skal ind i denne pipeline** — ikke som CSS på preview-elementet,
for så kommer de ikke med i eksporten.

Undo/redo er en simpel historikstak i `App.tsx` med 550 ms debounce på
sliderændringer.

### Filer

```
public/
├── manifest.webmanifest # PWA-manifest (navn, farver, ikoner)
├── icon.svg             # favicon + skalerbart app-ikon
└── icons/               # 192/512 px, maskable 512 px, apple-touch-icon 180 px
vite.config.ts           # indeholder serviceWorker()-pluginet, der bygger dist/sw.js
src/
├── main.tsx             # monterer App; registrerer service workeren (kun i build)
├── pwa/
│   └── sw-template.js   # service worker-skabelon, udfyldes ved build
├── App.tsx              # al tilstand, historik, canvas-render, træk-og-slip
├── types.ts             # ImageState, Adjustments, TextOverlay, ExifData m.fl.
├── index.css            # Google Fonts, Tailwind-tema, animationer
├── components/
│   ├── Header.tsx       # undo/redo/reset/tema/upload/eksport
│   ├── Sidebar.tsx      # kun fanevælger + udpegning til tabs/ (ingen fane-logik)
│   ├── Dropzone.tsx     # start-skærm, træk-og-slip, prøvebillede
│   ├── CropOverlay.tsx  # interaktiv beskæringsramme
│   ├── ExportModal.tsx  # format, kvalitet, live størrelsesestimat, download
│   └── tabs/            # én fil pr. værktøjsfane
│       ├── SizeTab.tsx        # ejer resize-felter, lås og fejlbesked
│       ├── CropTab.tsx
│       ├── RotateTab.tsx
│       ├── AdjustTab.tsx      # ejer handleAdjustmentChange + reset
│       ├── FilterTab.tsx
│       ├── TextTab.tsx        # ejer tekstlag og vandmærke-upload
│       ├── BackgroundTab.tsx
│       ├── UpscaleTab.tsx
│       └── MetadataTab.tsx
└── utils/
    ├── filters.ts       # canvas-renderingspipeline
    └── exif.ts          # egen EXIF/TIFF/GPS-parser, ingen afhængigheder
```

**Hvor hører en ændring hjemme?** En fanes egen tilstand — feltværdier, valg,
fejlbeskeder, der ikke overlever et faneskift — bor i fanens egen fil. Alt, der
ændrer `ImageState` og skal kunne fortrydes, er en handler i `App.tsx`, som fanen
får via en prop (`onResize`, `onRotate`, `onFlip`, `onApplyCrop`). `Sidebar.tsx`
skal ikke vide noget om, hvad en fane gør — tilføj en fane ved at lave filen,
tilføje den til `TABS` og udpege den i panelet.

## Regler for arbejdet

- **UI-tekster skal være på dansk.** Kode, kommentarer og commit-beskeder også.
- **Intet må forlade browseren.** Ingen netværkskald, ingen analytics, ingen CDN-kald
  ud over de Google Fonts der allerede importeres i `index.css`.
- **Ingen tunge afhængigheder** uden at det er aftalt. Appen klarer sig i dag med
  React, Tailwind og lucide-react.
- `CropAspectRatio` og andre delte typer bor i `src/types.ts` — skriv dem ikke af
  som inline unions rundt omkring.
- Ny funktionalitet, der påvirker det færdige billede, skal ind i
  `drawImageWithState()` og skal virke både i preview og ved eksport.
- Ændringer i `ImageState` skal med i undo-historikken — som en handler i `App.tsx`,
  der kalder `pushNewState`, ikke direkte fra en fane.
- **Eksport må aldrig genbruge preview-lærredet.** Preview er skaleret ned til
  skærmen; eksporten tegner selv i fuld opløsning (`getExportScale`).
- **Aldrig bivirkninger inde i `setState(prev => …)`.** StrictMode kører updaters to
  gange i udvikling.
- **PWA uden afhængigheder.** Service workeren er skrevet i hånden
  (`src/pwa/sw-template.js`). `serviceWorker()` i `vite.config.ts` indsætter ved
  build alle byggede filer + `public/` som precache og en indholdshash som version.
  Nye filer i `public/` kommer automatisk med. Tilføj ikke `vite-plugin-pwa`/Workbox.
  Strategier: sider netværk først med den cachede `index.html` som offline-fallback
  (gemmes ikke ved netværkssvar, så den altid passer til de cachede assets), egne
  filer cache først, Google Fonts stale-while-revalidate. Service workeren må aldrig
  røre billeddata eller sende noget.
- `npm run lint` skal være grøn. Slå ikke regler fra for at få den grøn — ret koden.
  Typiske løsninger på react-hooks-fund: afled værdien under render i stedet for
  `setState` i en effekt (se `isCalculating` i `ExportModal`), justér state under
  render ved ændrede props (se `syncedDims` i `SizeTab`), eller brug
  `useEffectEvent`, når en effekt skal læse friske værdier uden at køre igen (se
  `CropOverlay`).

## Åbne opgaver

Ingen igangværende udviklingsopgaver. Tilbage er kun:

1. **Test "Åbn med myPhoto" i den installerede app.** Installér appen fra
   https://myphoto.madsdam.dk i Chrome/Edge på desktop, højreklik et billede →
   "Åbn med" → myPhoto. Billedet skal åbne i et nyt vindue. Kan ikke testes i en
   almindelig fane, og er derfor ikke verificeret.
2. **(Valgfri) Skarphed ser kraftigere ud i preview end i eksport.** Skarphed virker
   pr. pixel og køres på det nedskalerede preview-lærred. Kan udlignes ved at skalere
   `amount` med `scale` i `sharpenImageData`-kaldet — sammenlign visuelt med eksporten
   før det rettes.

## Parkeret

Bevidst fravalgt indtil videre. Tag først op efter aftale.

- **Ægte baggrundsfjernelse** (besluttet 13-09-2026). I dag gør
  `removeBackgroundAlpha()` pixels, der ligner farven i hjørnerne, gennemsigtige —
  virker kun på ensfarvede baggrunde, og fanen siger det. Muligheder til senere:
  - `@imgly/background-removal`: bedst til alle motiver, men **AGPL-3.0** (hele appen
    skulle være AGPL) og 40–80 MB modelfiler.
  - MediaPipe (`@mediapipe/tasks-vision`, Apache-2.0): lille, men primært til personer.
  - transformers.js (Apache-2.0) + RMBG: RMBG-modellerne er ikke-kommercielle.

  Alle kan køre lokalt uden at sende billeddata. Modelfiler skal selv-hostes, ikke
  hentes fra et CDN (husregel).
- **Worker/`OffscreenCanvas` til eksport.** Preview er hurtigt nu (se historik), men
  eksport tegner stadig i fuld opløsning på UI-tråden: ~0,7 s for 24 MP med effekter,
  plus ~0,4 s PNG-kodning. Først relevant, hvis det mærkes i praksis.

## Løst (historik)

Nyeste først. Detaljer står i commit-beskederne.

**13-09-2026**
- **Hosting på Vercel** (`b6ef364`, `e30f063`). Se afsnittet Hosting. AI Studio-appen og
  Simplys viderestilling er slettet.
- **Hurtigt preview for store billeder** (`80e02f1`). Målt: preview gentegnede i fuld
  opløsning ved hver ændring — 24 MP med skarphed + baggrund + filter tog 1703 ms pr.
  slidertræk. En worker ville kun flytte ventetiden, så i stedet tager
  `drawImageWithState` en `scale` (`getPreviewScale` / `getExportScale`) → ~113 ms.
  `ExportModal` gentegner ikke ved skift af format/kvalitet.
- **"Åbn med myPhoto"** (`80e02f1`). `file_handlers` + `launch_handler: navigate-new` i
  manifestet, `launchQueue`-consumer i `App.tsx`.
- **Rester fra AI Studio fjernet** (`80e02f1`, `466367c`): `.env.example`,
  `metadata.json`, `assets/.aistudio/`, `--host=0.0.0.0` i dev-scriptet.
- **PWA** (`af386a0`). Manifest, ikoner, håndskrevet service worker. Verificeret med
  `npm run preview`: precacher 9 filer ved første besøg og virker med serveren slukket.
- **TypeScript strict + ESLint** (`14d1282`). `strict` gav 0 fejl; ESLint fandt 13, alle
  rettet — bl.a. paste-handler brugt før deklaration og `setState` i effekter.

**12-09-2026** — kodegennemgang (`3726781`)
- Rotation 90°/270° forvrængede billedet (bredde/højde blev byttet to gange).
- 2× opskalering kom ikke med i eksporten (eksporten genbrugte preview-lærredet).
- Rotation, spejlvending og resize manglede i undo-historikken.
- Beskæring efter rotation sad forkert → `displayCropToSourceCrop()` oversætter rammen
  til kildens koordinater. Verificeret pixel-identisk.
- Vandmærker blev tegnet ustabilt → `watermarkCache` + `preloadWatermarks()`.
- Bivirkning i state-updater → `pushNewState` læser historikken via refs.
- Misvisende tekster: "AI"-baggrundsfjernelse hedder nu "Fjern ensfarvet baggrund",
  "Super-opskalering" hedder "Dobbelt opløsning (2×)".
- `Sidebar.tsx` delt op i én fil pr. fane under `components/tabs/`.

## Hosting

Vercel, projekt `myphoto` i teamet "websitesmadsdam's projects" (Hobby), forbundet
til `websitesmadsdam/Pixel`. Hvert push til `main` udruller til produktion.

- Produktion: https://myphoto.madsdam.dk (Vercel-adresse: https://myphoto-psi.vercel.app)
- DNS for madsdam.dk ligger hos Simply.com: `myphoto` er en CNAME til
  `0f761ff84ce3d458.vercel-dns-017.com` (sat 13-09-2026, afløste en Simply-viderestilling
  til myphoto.ai.studio)
- Vite-preset, ingen `vercel.json`, ingen miljøvariabler. Vercel sender
  `Cache-Control: public, max-age=0, must-revalidate` på `sw.js`, så nye versioner af
  service workeren slår igennem.

## Google AI Studio

Rester fra AI Studio (`.env.example` med en ubrugt `GEMINI_API_KEY`, `metadata.json`
og `assets/.aistudio/`) er fjernet 13-09-2026. Appen i AI Studio og Simplys
URL-viderestilling til myphoto.ai.studio er slettet samme dag. Projektet har ingen
forbindelse til AI Studio længere — GitHub er sandheden, Vercel er hostingen.
