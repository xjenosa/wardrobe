# Every state, and the plate that draws it

**A screen is not one thing.** It is loading, it is empty, it has failed, and it
is working. Five of us building different screens will each invent the first
three differently unless they are written down, so here they are, with the figure that
draws each one.

Open [`docs/design/mobile.html`](design/mobile.html) and find the figure. **The
drawing wins over this table wherever they disagree**, and if they disagree the
table is what gets fixed.

**A state with no plate is still a state.** Where the mockup draws none, this
table says in words what to build, and that row is the specification.

## First run

| state | when | what it shows | plate |
|---|---|---|---|
| **Reference photo** | the first launch, before anything is owned | the one screen asking for a photo of you, so renders have somebody to dress | **Fig 05** |
| **Camera refused** | Take a photo, with the camera not allowed for the app | no plate. Keep the screen, say the camera is not allowed and offer to open Settings. Choose a photo and Skip for now still work |
| **Photo not kept** | the photo could not be copied onto the phone | no plate. Keep the screen and any photo kept before, say so, and offer Try again the same way. Skip for now still works |

## Closet

| state | when | what it shows | plate |
|---|---|---|---|
| **Empty** | nothing owned yet | the real first screen: one instruction and one way forward | **Fig 06** |
| **Normal** | garments exist | the grid | **Fig 15** |
| **Loading** | reading from storage | no plate. Draw the grid with its tiles as empty boxes, never a spinner over a blank screen |
| **Failed** | storage cannot be read | no plate. One line saying so and a way to retry. Do not show an empty closet, which reads as "you own nothing" |

## Add garment

| state | when | what it shows | plate |
|---|---|---|---|
| **Capture** | the camera is open | the viewfinder. **The shutter is the whole wait**: tagging starts the moment it fires | **Fig 17** |
| **Reading the garment** | after the shutter | the photograph itself is the progress. This is the only wait in the flow | **Fig 17b** |
| **Confirm** | reading finished | what the app thinks it is, editable, and a save | **Fig 18** |
| **Reading failed** | the service did not answer | no plate. Keep the photograph, say the tagging failed, offer to retry or to fill it in by hand. **Never discard the photograph** |

## Today

| state | when | what it shows | plate |
|---|---|---|---|
| **Normal** | a forecast and a closet | the weather, the outfit, and why | **Fig 08** |
| **Render pending** | the pick is made, the picture is not | the pieces, listed, while the render comes | **Fig 08d** |
| **Loading** | before anything has arrived | the final boxes, empty, in their final positions | **Fig 12** |
| **Nothing fits, too cold** | the closet cannot cover the day | says so plainly, and offers to wear it anyway | **Fig 09** |
| **Nothing in the closet** | the forecast is fine, the closet is empty | points at the closet, not at the weather | **Fig 10b** |
| **The forecast failed** | no weather to pick from | **Fig 11**, and ADR 0003 says this is built first |
| **The pick failed, today's answer kept** | the ask failed, and `pick()` hands back an answer made today for the closet and the units as they are now | no plate. That answer as it was, and one line saying it is from earlier today. The line's words are Today's to choose (ADR 0021) |
| **The pick failed** | the ask failed and nothing from today is kept | no plate. Keep the weather, say the outfit could not be picked, and offer to try again. **Never the fixture** (ADR 0021) |
| **No service yet** | no service address is set and the closet is not the sample one, so `pick()` fails as `noService` | no plate. Say there is no recommendation service yet. A state of the build, never of a release |

## Weather

| state | when | what it shows | plate |
|---|---|---|---|
| **Normal** | a forecast is cached or fresh | the day the pick was made from, and the hours it covers | **Fig 14** |
| **No cached forecast** | nothing to fall back on | the only weather failure with nothing behind it | **Fig 14d** |
| **Stale** | a cached forecast, refresh failed | no plate here. Show the cached day and say when it was fetched. **Never show a stale forecast without its time** |

## Item editor

| state | when | what it shows | plate |
|---|---|---|---|
| **Page one** | opened from a garment | the cut-out | **Fig 19** |
| **Page two** | swiped | your photograph | **Fig 19b** |
| **Unsaved on leaving** | edited, then dismissed | no plate. Close discards the edit and nothing asks, and so does every other way out but Save, the back gesture and the back button included. The garment opens next time as it was saved |

## You

| state | when | what it shows | plate |
|---|---|---|---|
| **Normal** | always | the settings list | **Fig 23** |
| **Not known yet** | no place found and no key kept | no plate. Location and the key show the dash Fig 14d draws for a value nobody knows, and open nothing (ADR 0026) |
| **Preferences unreadable** | the saved preferences cannot be read | no plate. Say so at the top with Try again, show Celsius and change nothing until they can be read. Never write over them |
| **Change not saved** | a choice or a reset could not be written | no plate. Say so at the top with Try again, and keep showing what is saved |
| **Photo not removed** | the reference photo could not be removed | no plate. Say so at the top with Try again, and keep showing the photo |

## The rules behind the empty rows

- **An empty state names what is missing, not what failed.** "Nothing in the
  closet yet" is not "no outfit could be found".
- **A failure keeps what it already had.** A stale forecast, a captured
  photograph and an in-progress edit all survive the thing that went wrong.
- **A wait is drawn in the shape of what is coming**, which is why Today's
  loading state is its final boxes and not a spinner.
