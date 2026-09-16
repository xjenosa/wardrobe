# wardrobe

**Photograph your clothes. Each morning it tells you what to wear, and why.**

A React Native app that reads the day's forecast, looks at what is actually in
your closet, and picks an outfit for it. Not a style feed and not a shopping
app: it only ever recommends things you already own.

> **Status: in progress.** The app is not scaffolded yet, so the commands under
> Getting started describe the target rather than something that runs today.
>
> Built as a capstone project. See [Acknowledgements](#acknowledgements) - this
> is not the first wardrobe app and it does not pretend to be.

## Screens

| | | |
|---|---|---|
| 1 | **Closet** | everything you own, as a grid |
| 2 | **Add garment** | photograph it, confirm what it is, save |
| 3 | **Today** | the weather, and one outfit chosen for it |
| 4 | **Weather** | the day's temperature and precipitation, hour by hour |
| 5 | **Item editor** | fix anything the app got wrong |
| 6 | **No forecast** | what you see when the forecast cannot be reached |

**Screen 6 is not a footnote.** An app that only draws sunshine is a demo. The
failure state is built early and kept working, because a forecast that fails is
a Tuesday and not an edge case.

## How it decides what to wear

**The recommendation is not computed in this repository.** The app sends what you
own and what the weather is doing to a recommendation service, and gets back
which garments to wear and the temperature range they suit.

```
POST /pick

{
  "weather":  { "lowC": -4, "highC": 2, "feelsLowC": -9, "feelsHighC": -1,
                "condition": "light snow", "windKph": 12, "humidity": 78 },
  "garments": [ { "id": "g1", "category": "wholebody_up", "row": "Coat" },
                { "id": "g2", "category": "lowerbody",    "row": "Flannel trousers" },
                { "id": "g3", "category": "shoes",        "row": "Thick-soled shoes" } ],
  "vibe":     "Everyday"
}

200

{
  "wear":    ["g1", "g2", "g3"],
  "suitsC":  { "lowC": -3, "highC": 5 },
  "because": "Cold, and this is the warmest thing you own that is not a parka."
}
```

**A garment is described by a WORD, not by a number.** The app says `"Coat"`; the
service knows what a coat is worth in insulation terms. That is the whole
boundary: the client owns the screens and the service owns the physics, and
neither needs to know how the other works.

**The app runs without the service.** A saved response lives in `fixtures/` and
drives every screen, so the UI can be built, tested and demonstrated with the
network off.

## Architecture

```
  React Native app  ──────►  recommendation service
  ─────────────────         ─────────────────────────
  closet storage            clothing insulation values
  camera and photos         the comfort-range model
  the forecast fetch        the ranking
  every screen              ISO 9920 tables
  the charts

           └──►  fixtures/pick.json  (offline, and for tests)
```

## Getting started

```bash
git clone https://github.com/xjenosa/wardrobe.git
cd wardrobe
npm install
npm start
```

No API key is needed to run against the fixture. Point `PICK_URL` at the service
when you have one.

## Acknowledgements

This project stands on open work.

### Wardrobe, by Thijs Simonian

The idea of a photographed wardrobe that recommends an outfit, and the approach
to cutting a garment out of a photograph, are adapted from
[Wardrobe](https://github.com/tandpfun/wardrobe), used under the MIT License.

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

> Once this project has npm dependencies, their licences belong in a generated
> `THIRD-PARTY-NOTICES.txt` rather than here. A hand-maintained list of hundreds
> of transitive licences goes stale the first time somebody runs `npm install`.

## Licence

MIT. See [LICENSE](LICENSE).
