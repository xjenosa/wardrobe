/* The words the capture track needs where the mockup draws none: the states
   docs/States.md describes in words (Add garment, Item editor). The sentences
   the mockup does draw are in drawn.ts. */
export const capture = {
  byHand: 'Fill it in by hand.',
  saveFailed: 'Could not save. What you entered is still here.',
  closetUnreadable: 'The closet could not be read.',
  tryAgain: 'Try again',
  notInCloset: 'This garment is not in your closet.',
  taggingFailed: 'The garment could not be read. Your photograph is still here.',
  fillByHand: 'Fill it in by hand',
  cameraRefused: 'Camera access was refused. You can upload a photo instead, or open Settings.',
  openSettings: 'Open Settings',
  photoFailed: 'The photograph could not be kept. Try again.',
} as const;
