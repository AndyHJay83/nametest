import { pickOne, shuffle } from './random';
import { buildLetterPools, getMiddleConsonants } from './names';

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
    // Pick 2 different first letters
    let first1: string;
    let first2: string;
    
    if (i < uniqueFirstLetters.length && !usedFirstLetters.has(uniqueFirstLetters[i])) {
      first1 = uniqueFirstLetters[i];
      usedFirstLetters.add(first1);
      // Pick a different second first letter
      const remaining = uniqueFirstLetters.filter(fl => fl !== first1);
      first2 = remaining.length > 0 
        ? pickOne(rng, remaining)
        : (firstLetters.length > 1 ? pickOne(rng, firstLetters.filter(fl => fl !== first1)) : 'B');
    } else {
      // Pick 2 different first letters randomly
      if (firstLetters.length >= 2) {
        const shuffled = shuffle(rng, [...firstLetters]);
        first1 = shuffled[0];
        first2 = shuffled[1];
      } else if (firstLetters.length === 1) {
        first1 = firstLetters[0];
        first2 = 'A';
      } else {
        first1 = 'A';
        first2 = 'B';
      }
    }

    // Get middle consonants from names starting with first1
    const namesWithFirst1 = names.filter(n => n.toUpperCase().startsWith(first1));
    const midsFromFirst1: string[] = [];
    for (const name of namesWithFirst1) {
      midsFromFirst1.push(...getMiddleConsonants(name));
    }
    
    // Get middle consonants from names starting with first2
    const namesWithFirst2 = names.filter(n => n.toUpperCase().startsWith(first2));
    const midsFromFirst2: string[] = [];
    for (const name of namesWithFirst2) {
      midsFromFirst2.push(...getMiddleConsonants(name));
    }

    // Pick 2 middle consonants from each group
    const selectedMids1: string[] = [];
    const selectedMids2: string[] = [];
    
    for (let j = 0; j < 2; j++) {
      if (midsFromFirst1.length > 0) {
        selectedMids1.push(pickOne(rng, midsFromFirst1));
      } else {
        // Fallback to general middle consonants or first letters
        selectedMids1.push(middleConsonants.length ? pickOne(rng, middleConsonants) : pickOne(rng, firstLetters));
      }
      
      if (midsFromFirst2.length > 0) {
        selectedMids2.push(pickOne(rng, midsFromFirst2));
      } else {
        // Fallback to general middle consonants or first letters
        selectedMids2.push(middleConsonants.length ? pickOne(rng, middleConsonants) : pickOne(rng, firstLetters));
      }
    }

    const letters = shuffle(rng, [first1, first2, ...selectedMids1, ...selectedMids2]);

    // Store first1 as the primary first letter for backwards compatibility
    pages.push({ letters, firstLetter: first1 });
  }

  return pages;
}

