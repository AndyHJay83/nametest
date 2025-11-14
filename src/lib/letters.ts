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
  
  // Ensure all unique first letters appear at least once
  const uniqueFirstLetters = [...new Set(firstLetters)];
  const usedFirstLetters = new Set<string>();

  for (let i = 0; i < pageCount; i++) {
    // For the first few pages, prioritize unused first letters
    let first: string;
    if (i < uniqueFirstLetters.length && !usedFirstLetters.has(uniqueFirstLetters[i])) {
      first = uniqueFirstLetters[i];
      usedFirstLetters.add(first);
    } else {
      // After covering unique first letters, pick randomly
      first = firstLetters.length
        ? pickOne(rng, firstLetters)
        : 'A';
    }

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

