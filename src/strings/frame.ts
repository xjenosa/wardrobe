/* The words the frame's screens need where the mockup draws none, the states
   docs/States.md describes in words (First run, You). The sentences the mockup
   does draw are in drawn.ts. */
export const frame = {
  cameraRefused: 'The camera is not allowed for this app. Choose a photo instead, or allow the camera in Settings.',
  openSettings: 'Open Settings',
  photoNotKept: 'The photo could not be kept.',
  photoNotRemoved: 'The photo could not be removed.',
  photoUnreadable: 'Your reference photo could not be read.',
  prefsUnreadable: 'Your preferences could not be read.',
  prefsNotSaved: 'That change could not be saved.',
  sampleNotPutOn: 'The sample closet could not be put on the phone.',
} as const;
