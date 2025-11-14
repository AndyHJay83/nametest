import { pickOne, shuffle } from './random';
import { buildLetterPools } from './names';

export type LetterPage = {
  letters: string[];        // length 6
  firstLetter: string;      // the conceptual "first" letter
};

export function buildLetterPages(
  names: string[],
  rng: () => number,
  pageCount = 50
): LetterPage[] {
  const { firstLetters, middleConsonants, deadLetters } = buildLetterPools(names);

  const pages: LetterPage[] = [];

  for (let i = 0; i < pageCount; i++) {
    // basic fallbacks if pools are oddly small
    const first = firstLetters.length
      ? pickOne(rng, firstLetters)
      : 'A';

    const dead = deadLetters.length
      ? pickOne(rng, deadLetters)
      : 'Z';

    const mids: string[] = [];
    for (let j = 0; j < 4; j++) {
      if (middleConsonants.length) {
        mids.push(pickOne(rng, middleConsonants));
      } else {
        // if no middle consonants (edge case), reuse first letters
        mids.push(pickOne(rng, firstLetters.length ? firstLetters : ['B']));
      }
    }

    const letters = shuffle(rng, [first, dead, ...mids]);

    pages.push({ letters, firstLetter: first });
  }

  return pages;
}

