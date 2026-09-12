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
npm run lint     # tsc --noEmit
```

Node 20+. Der er ingen `.env` og ingen hemmeligheder — opret ikke nogen.

## Stak

React 19 · TypeScript 5.8 · Vite 6 · Tailwind CSS 4 · lucide-react.

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
src/
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
- Ændringer i `ImageState` skal med i undo-historikken.

## Kendte fejl (ikke rettet)

Fundet ved kodegennemgang 12-09-2026, verificér i browseren før du retter.

1. ~~**Rotation 90°/270° forvrænger billedet.**~~ **Rettet 12-09-2026.**
   `handleRotate()` i `App.tsx` bytter nu `width`/`height` sammen med rotationen, og
   `updateViewportDims` byttede dem om én gang til — den dobbelte ombytning er væk.
   Verificeret i browser: 2000×1500 → 1500×2000 ved 90°, tilbage ved 180°.
2. ~~**2× opskalering virker ikke ved eksport.**~~ **Rettet 12-09-2026.**
   `ExportModal` får nu `originalImage` + `imageState` i stedet for `canvasRef` og
   tegner sit eget off-screen lærred med `isExporting = true`. Både
   størrelsesestimatet og downloadet kommer fra det lærred, og modalen viser
   eksportopløsningen. Verificeret: 2000×1500 → 4000×3000 med 2×, 3000×4000 med
   2× + 90° rotation. **Regel:** eksport må aldrig genbruge preview-lærredet.
3. ~~**Rotation, spejlvending og resize ryger ikke i undo-historikken.**~~
   **Rettet 12-09-2026.** `App.tsx` har nu `handleRotate`, `handleFlip` og
   `handleResize`, der alle kalder `pushNewState`. `Sidebar` kalder dem via
   props (`onRotate`, `onFlip`, `onResize`) i stedet for at skrive direkte i
   `setImageState`. **Mønster:** enhver ændring af `ImageState`, der skal kunne
   fortrydes, hører hjemme som en handler i `App.tsx` — ikke i `Sidebar`.
3b. ~~**Beskæring efter rotation sidder forkert.**~~ **Rettet 12-09-2026.**
   `displayCropToSourceCrop()` i `filters.ts` oversætter rammen fra visningsrummet
   (roteret/spejlvendt) til kildens koordinatsystem, før `handleApplyCrop` lægger
   udsnittene sammen. Begge rum er normaliserede enhedskvadrater, så lærredets mål
   går ud med hinanden — transformationen er ren rotation + spejling.
   Verificeret: venstre halvdel efter 90° rotation giver et udsnit, der er
   pixel-identisk (afvigelse 0,00/255) med rammen.
4. ~~**"Fjern baggrund" er ikke AI.**~~ **Teksten rettet 12-09-2026** — funktionen er
   uændret. Fanen hedder nu "Fjern ensfarvet baggrund" og beskriver, hvad
   `removeBackgroundAlpha()` faktisk gør: aflæser farven i de fire hjørner og gør
   lignende pixels gennemsigtige. De opdigtede fremdriftstekster om at hente en
   segmenteringsmodel fra et CDN er væk.
   **Åben mulighed:** en rigtig model (MediaPipe Selfie Segmentation eller
   `@imgly/background-removal`) kan køre lokalt. Begge henter dog modelfiler fra et
   CDN ved første brug — det bryder ikke privatlivsløftet (ingen billeddata
   sendes), men det bryder husreglen om ingen CDN-kald og lægger et par MB til.
   Kræver en beslutning, ikke bare en implementering.
5. ~~**"Opskalér 2×" er ikke opskalering.**~~ **Teksten rettet 12-09-2026** —
   funktionen er uændret. Hed "Super-opskalering" og påstod "bicubisk
   interpolering"; hedder nu "Dobbelt opløsning (2×)" og siger, at billedet bliver
   større, men ikke skarpere.
6. ~~**Vandmærker tegnes ustabilt.**~~ **Rettet 12-09-2026.** `filters.ts` har nu en
   `watermarkCache` og en `preloadWatermarks(urls)`, der skal afventes før tegning.
   `App.tsx` kalder den, når `watermarks` ændrer sig, og gentegner; `ExportModal`
   afventer den før hver eksport-tegning.
7. ~~**Bivirkning i state-updater.**~~ **Rettet 12-09-2026.** `pushNewState` læser
   nu historikken gennem refs (`historyRef` / `historyIndexRef`) og er dermed stabil
   og altid ajour — også når den kaldes fra en timeout.
   `handleTriggerBackgroundRemoval` bygger sin nye state fra `imageStateRef` og
   kalder `setImageState` + `pushNewState` ved siden af hinanden i stedet for inde i
   updateren. **Regel:** aldrig bivirkninger inde i `setState(prev => …)`.

## Prioriteret backlog

Alt fundet ved kodegennemgangen 12-09-2026 er rettet, og `Sidebar.tsx` er delt op.
Herfra:
4. Flyt rendering til `OffscreenCanvas` + worker, hvis store billeder skal føles hurtige
5. Overvej PWA (manifest + service worker) — appen er offline-egnet i forvejen
6. Slå `"strict": true` til i `tsconfig.json`, tilføj ESLint + `eslint-plugin-react-hooks`

## Rester fra Google AI Studio

`.env.example` (beder om en `GEMINI_API_KEY` der aldrig bruges) og `metadata.json`
(erklærer `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`) er begge uden funktion i koden.
Behold kun `metadata.json`, hvis projektet stadig skal kunne synkroniseres tilbage
til AI Studio. Gør det ikke: AI Studio og Claude Code, der begge pusher til `main`,
giver konflikter. GitHub er sandheden.
