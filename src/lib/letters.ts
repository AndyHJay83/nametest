import { pickOne, shuffle } from './random';
import { buildLetterPools, getMiddleConsonants, getMiddleVowels, calculateLetterFrequency } from './names';

export type LetterPage = {
  letters: string[];        // length 6
  firstLetter: string;      // the conceptual "first" letter
};

// Calculate overlap between two sets of names (by first letter)
function calculateNameOverlap(names1: string[], names2: string[]): number {
  const letters1 = new Set<string>();
  const letters2 = new Set<string>();
  
  for (const name of names1) {
    for (const c of name.toUpperCase()) {
      if (c >= 'A' && c <= 'Z') letters1.add(c);
    }
  }
  
  for (const name of names2) {
    for (const c of name.toUpperCase()) {
      if (c >= 'A' && c <= 'Z') letters2.add(c);
    }
  }
  
  // Count overlapping letters
  let overlap = 0;
  for (const letter of letters1) {
    if (letters2.has(letter)) overlap++;
  }
  
  return overlap;
}

// Pick letter with preference for rarer ones (lower frequency = rarer)
function pickRareLetter(rng: () => number, letters: string[], frequency: Map<string, number>): string {
  if (letters.length === 0) return 'A';
  
  // Sort by frequency (ascending - rarer first)
  const sorted = [...letters].sort((a, b) => {
    const freqA = frequency.get(a) || 0;
    const freqB = frequency.get(b) || 0;
    return freqA - freqB;
  });
  
  // Prefer rarer letters (pick from first 30% of sorted list, or random if list is small)
  const rarePool = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.3)));
  return pickOne(rng, rarePool);
}

export function buildLetterPages(
  names: string[],
  rng: () => number,
  pageCount = 50
): LetterPage[] {
  const { firstLetters, middleConsonants, middleVowels, deadLetters } = buildLetterPools(names);
  const letterFrequency = calculateLetterFrequency(names);

  const pages: LetterPage[] = [];
  
  // Ensure all unique first letters appear at least once
  const uniqueFirstLetters = [...new Set(firstLetters)];
  const usedFirstLetters = new Set<string>();

  for (let i = 0; i < pageCount; i++) {
    // Strategy 7: Smart first letter pairing - minimize overlap
    let first1: string;
    let first2: string;
    
    if (i < uniqueFirstLetters.length && !usedFirstLetters.has(uniqueFirstLetters[i])) {
      first1 = uniqueFirstLetters[i];
      usedFirstLetters.add(first1);
      
      // Find first letter with least overlap
      const namesWithFirst1 = names.filter(n => n.toUpperCase().startsWith(first1));
      const remaining = uniqueFirstLetters.filter(fl => fl !== first1);
      
      if (remaining.length > 0) {
        let bestSecond = remaining[0];
        let minOverlap = Infinity;
        
        for (const candidate of remaining) {
          const namesWithCandidate = names.filter(n => n.toUpperCase().startsWith(candidate));
          const overlap = calculateNameOverlap(namesWithFirst1, namesWithCandidate);
          if (overlap < minOverlap) {
            minOverlap = overlap;
            bestSecond = candidate;
          }
        }
        first2 = bestSecond;
      } else {
        first2 = firstLetters.length > 1 ? pickOne(rng, firstLetters.filter(fl => fl !== first1)) : 'B';
      }
    } else {
      // Pick 2 different first letters with minimal overlap
      if (firstLetters.length >= 2) {
        const shuffled = shuffle(rng, [...uniqueFirstLetters]);
        first1 = shuffled[0];
        
        // Find best pairing
        const namesWithFirst1 = names.filter(n => n.toUpperCase().startsWith(first1));
        let bestSecond = shuffled[1];
        let minOverlap = Infinity;
        
        for (let j = 1; j < Math.min(shuffled.length, 10); j++) {
          const candidate = shuffled[j];
          const namesWithCandidate = names.filter(n => n.toUpperCase().startsWith(candidate));
          const overlap = calculateNameOverlap(namesWithFirst1, namesWithCandidate);
          if (overlap < minOverlap) {
            minOverlap = overlap;
            bestSecond = candidate;
          }
        }
        first2 = bestSecond;
      } else if (firstLetters.length === 1) {
        first1 = firstLetters[0];
        first2 = 'A';
      } else {
        first1 = 'A';
        first2 = 'B';
      }
    }

    // Get middle consonants and vowels from names starting with first1
    const namesWithFirst1 = names.filter(n => n.toUpperCase().startsWith(first1));
    const midsFromFirst1: string[] = [];
    const vowelsFromFirst1: string[] = [];
    for (const name of namesWithFirst1) {
      midsFromFirst1.push(...getMiddleConsonants(name));
      vowelsFromFirst1.push(...getMiddleVowels(name));
    }
    
    // Get middle consonants and vowels from names starting with first2
    const namesWithFirst2 = names.filter(n => n.toUpperCase().startsWith(first2));
    const midsFromFirst2: string[] = [];
    const vowelsFromFirst2: string[] = [];
    for (const name of namesWithFirst2) {
      midsFromFirst2.push(...getMiddleConsonants(name));
      vowelsFromFirst2.push(...getMiddleVowels(name));
    }

    // Strategy 2: Asymmetric distribution - 1 from first1, 3 from first2
    const selectedMids1: string[] = [];
    const selectedMids2: string[] = [];
    
    // Pick 1 from first1 (prefer rarer)
    if (midsFromFirst1.length > 0) {
      selectedMids1.push(pickRareLetter(rng, midsFromFirst1, letterFrequency));
    } else {
      selectedMids1.push(middleConsonants.length ? pickRareLetter(rng, middleConsonants, letterFrequency) : pickOne(rng, firstLetters));
    }
    
    // Pick 3 from first2 (prefer rarer)
    for (let j = 0; j < 3; j++) {
      if (midsFromFirst2.length > 0) {
        selectedMids2.push(pickRareLetter(rng, midsFromFirst2, letterFrequency));
      } else {
        selectedMids2.push(middleConsonants.length ? pickRareLetter(rng, middleConsonants, letterFrequency) : pickOne(rng, firstLetters));
      }
    }

    // Strategy 3: Include 1 vowel strategically (from either group, prefer rarer)
    const allVowels = [...vowelsFromFirst1, ...vowelsFromFirst2];
    const selectedVowel: string[] = [];
    if (allVowels.length > 0) {
      selectedVowel.push(pickRareLetter(rng, allVowels, letterFrequency));
    } else if (middleVowels.length > 0) {
      selectedVowel.push(pickRareLetter(rng, middleVowels, letterFrequency));
    }

    // Strategy 6: Include 1 dead letter (helps eliminate candidates)
    const selectedDead: string[] = [];
    if (deadLetters.length > 0) {
      selectedDead.push(pickOne(rng, deadLetters));
    }

    // Combine letters: We need exactly 6 total
    // Strategy 2: 1+3 distribution (2 first + 1 mid1 + 3 mid2 = 6)
    // But we also want vowels and dead letters sometimes
    // So we'll do: 2 first + 1 mid1 + 3 mid2 = 6 (primary)
    // Or sometimes: 2 first + 1 mid1 + 2 mid2 + 1 vowel = 6 (if vowel available)
    // Or sometimes: 2 first + 1 mid1 + 2 mid2 + 1 dead = 6 (if dead available)
    
    let finalLetters: string[] = [];
    
    // 30% chance to include vowel, 20% chance for dead letter, 50% for pure 1+3
    const choice = rng();
    if (choice < 0.3 && selectedVowel.length > 0) {
      // Include vowel: 2 first + 1 mid1 + 2 mid2 + 1 vowel = 6
      finalLetters = [first1, first2, ...selectedMids1, ...selectedMids2.slice(0, 2), ...selectedVowel.slice(0, 1)];
    } else if (choice < 0.5 && selectedDead.length > 0) {
      // Include dead: 2 first + 1 mid1 + 2 mid2 + 1 dead = 6
      finalLetters = [first1, first2, ...selectedMids1, ...selectedMids2.slice(0, 2), ...selectedDead.slice(0, 1)];
    } else {
      // Pure 1+3: 2 first + 1 mid1 + 3 mid2 = 6
      finalLetters = [first1, first2, ...selectedMids1, ...selectedMids2];
    }
    
    const letters = shuffle(rng, finalLetters);

    // Store first1 as the primary first letter for backwards compatibility
    pages.push({ letters, firstLetter: first1 });
  }

  return pages;
}

