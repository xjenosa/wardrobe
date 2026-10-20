import closet from '../../fixtures/closet.json';
import type { PickGarment } from './pick';

/* The closet the fixtures were made for, and the only one they answer with no
   service (src/lib/pick.ts). JSON reads its words as any string, so the store's
   tests hold it to the closet's own check. */
export const sampleCloset = closet as PickGarment[];
