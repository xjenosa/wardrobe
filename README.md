# wardrobe

**Photograph your clothes. Each morning it tells you what to wear, and why.**

A React Native app that reads the day's forecast, looks at what is actually in
your closet, and picks an outfit for it. Not a style feed and not a shopping
app: it only ever recommends things you already own.

> **Status: in progress.** The app runs as a shell: every screen below is a
> placeholder that shows its own name, the client for the recommendation service
> answers from the offline fixture, and the closet is saved on the phone. The
> screens themselves are being built, one track each (docs/Build_Plan.md).
>
> Built as a capstone project. See [Acknowledgements](#acknowledgements) - this
> is not the first wardrobe app and it does not pretend to be.

## Screens

| | | |
|---|---|---|
| 1 | **First run** | the one screen before you own anything: your reference photo |
| 2 | **Closet** | everything you own, as a grid |
| 3 | **Add garment** | photograph it, confirm what it is, save |
| 4 | **Today** | the weather, and one outfit chosen for it |
| 5 | **Weather** | the day's temperature and precipitation, hour by hour |
| 6 | **Item editor** | fix anything the app got wrong |
| 7 | **No forecast** | what you see when the forecast cannot be reached |
| 8 | **You** | your settings, and the documents |

**The no-forecast screen is not a footnote.** An app that only draws sunshine is
a demo. The failure state is built early and kept working, because a forecast
that fails is a Tuesday and not an edge case.

**All of them are drawn**, seventeen states across the eight, at full size in a
phone frame: [`docs/design/mobile.html`](docs/design/mobile.html). Open it in a
browser. It is generated and nobody edits it here; ADR 0006 says why.

## How it decides what to wear

**The recommendation is not computed in this repository.** The app sends what you
own and what the weather is doing to a recommendation service, and gets back
which garments to wear and the temperature range they suit.

```
POST /pick

{
  "weather":  { "lowC": -4, "highC": 2, "feelsLowC": -9, "feelsHighC": -1,
                "code": 71, "windKph": 12, "humidity": 78 },
  "garments": [ { "id": "g1", "name": "Navy overcoat", "category": "Outerwear", "warmth": "Warmest" },
                { "id": "g2", "name": "Oatmeal crewneck", "category": "Sweaters", "warmth": "Warm" },
                { "id": "g3", "name": "Charcoal trousers", "category": "Bottoms", "warmth": "Mid-season" },
                { "id": "g4", "name": "Espresso leather boot", "category": "Shoes", "warmth": "Warm" },
                { "id": "g5", "name": "Charcoal beanie", "category": "Accessories" } ],
  "vibe":     "Everyday",
  "units":    "C"
}

200

{
  "wear":     ["g1", "g2", "g3", "g4"],
  "suitsC":   { "lowC": -9, "highC": 1 },
  "because":  "Light snow and −7°. The navy overcoat over the oatmeal crewneck, with the espresso leather boot for fresh snow.",
  "dayLine":  "Cold, with snow on the wind.",
  "takeLine": "Take a beanie and gloves.",
  "fits":     true
}
```

**A garment is described by a WORD, not by a number.** The app says `"Warm"`; the
service knows what warm is worth in insulation terms. That is the whole
boundary: the client owns the screens and the service owns the physics, and
neither needs to know how the other works.

**The words are the ones the mockup draws** (ADR 0020). The app sends the word it
shows and keeps no lookup, and the service answers a word that is not on its
list with a 400 that names the field.

| field | one of |
|---|---|
| `category` | `Tops`, `Sweaters`, `Outerwear`, `Bottoms`, `Shoes`, `Accessories` |
| `warmth` | `Very light`, `Light`, `Mid-season`, `Warm`, `Warmest`; an accessory may leave it out |
| `vibe` | `Everyday`, `Smart`, `Active`, `Occasion` |
| `units` | `C`, `F`: what the sentences print degrees in; the numbers are always Celsius |

`code` is the forecast's own WMO weather code. The words Today prints for the
sky are the app's, from WMO's published table; the service never reads one.

**The answer is sentences, not codes** (ADR 0019). `dayLine` and `takeLine` are
drawn as they come, and left out when they are empty. `fits` is false on a day
nothing owned suits (Fig 09): `wear` is then the closest the closet comes,
`because` says how far it falls short, and the button says "Wear it anyway".
An empty closet is still sent, and its answer has an empty `wear` and `because`,
a `suitsC` of `null` and `fits` false; the app draws Fig 10b from its own empty
closet, never from the answer.

**The app runs without the service.** Saved answers live in `fixtures/`, with
the sample closet they were made for, and drive every screen whenever no service
address is set, so the UI can be built, tested and demonstrated before the
service exists (ADR 0021).

## Architecture

```
  React Native app  ──────►  recommendation service
  ─────────────────         ─────────────────────────
  closet storage            clothing insulation values
  camera and photos         the comfort-range model
  the forecast fetch        the ranking
  every screen              ISO 9920 tables
  the charts

           └──►  fixtures/  (no service set, and for tests)
```

## Getting started

```bash
git clone https://github.com/xjenosa/wardrobe.git
cd wardrobe
npm install
npm start
```

`npm start` prints a QR code. **Scan it with Expo Go** on your phone, from the
App Store or Google Play, and the app opens. Phone and computer need to be on
the same network.

- **On campus Wi-Fi, run `npx expo start --tunnel` instead.** A campus network
  usually stops its devices reaching each other; the tunnel goes through the
  internet. A phone hotspot with the computer on it works too.
- **If Expo Go is signed in to an Expo account, sign the computer in to the
  same one** with `npx expo login`, or sign Expo Go out. A signed-in phone does
  not open the app from a signed-out computer.
- **If Expo Go says the project is incompatible with it**, the two are on
  different SDKs. ADR 0018 says which one the project follows.

**No API key is needed to run against the fixture.** The fixture answers only
the sample closet: open You and tap **Use the sample closet** to put it on the
phone, and **Answer: nothing fits** to see Fig 09. When there is a service, set
`EXPO_PUBLIC_PICK_URL` to its address and the app posts to `/pick` there. Expo
builds that value into the app, so it has to be an address that may be public.

| command | checks |
|---|---|
| `npm test` | the tests: `pick()`, the closet store, the wear record, and that every screen is where its plate puts it |
| `npm run typecheck` | the types |
| `npm run lint` | the lint rules, with no warnings allowed |
| `npm run check:extract` | `tokens.ts`, `drawn.ts` and `icons.tsx` still match the mockup, and every icon has a name |
| `npm run check:leaks` | nothing from the private design repository is here |

Every pull request runs all five on GitHub, and a red one is not merged
(ADR 0015).

## Acknowledgements

This project stands on open work.

### Wardrobe, by Thijs Simonian

The idea of a photographed wardrobe that recommends an outfit, and the approach
to cutting a garment out of a photograph, are adapted from
[Wardrobe](https://github.com/tandpfun/wardrobe), used under the MIT License.
**The visual style follows Wardrobe's too**: the quiet off-white page,
near-black type, square corners and uppercase labels. The layouts and icons are
this project's own. ADR 0011 records why.

<details>
<summary>MIT License (Wardrobe)</summary>

```
MIT License

Copyright (c) 2026 Open Wardrobe contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
```

</details>

### Also

- **[Open-Meteo](https://open-meteo.com)** for hourly forecasts, free for
  non-commercial use under CC BY 4.0.
- **ISO 9920** for tabulated clothing insulation values. The recommendation
  service holds those values; this application does not.
- **[Inter](https://github.com/rsms/inter)**, the typeface every screen is set
  in, copyright The Inter Project Authors, under the SIL Open Font License 1.1.
  Each font file the app carries names its copyright and its licence inside
  itself.

> Once this project has npm dependencies, their licences belong in a generated
> `THIRD-PARTY-NOTICES.txt` rather than here. A hand-maintained list of hundreds
> of transitive licences goes stale the first time somebody runs `npm install`.

## Licence

**GPL-3.0-only.** Copyright (C) 2026 Maximilian Li. You may share and change
this project under the GNU General Public License, version 3, and whoever
publishes a changed version publishes its source under the same licence. It
comes with no warranty. The full text is in [LICENSE](LICENSE), and ADR 0010
says why it is not MIT.
