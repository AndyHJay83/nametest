const VOWELS = new Set(['A','E','I','O','U']);

export function parseNames(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.trim().toUpperCase())
    .filter(Boolean);
}

export function getFirstLetter(name: string): string {
  return name[0];
}

export function getMiddleConsonants(name: string): string[] {
  const chars = name.toUpperCase().split('');
  if (chars.length <= 2) return [];
  const inner = chars.slice(1, -1);
  return inner.filter(c => c >= 'A' && c <= 'Z' && !VOWELS.has(c));
}

export function getMiddleVowels(name: string): string[] {
  const chars = name.toUpperCase().split('');
  if (chars.length <= 2) return [];
  const inner = chars.slice(1, -1);
  return inner.filter(c => VOWELS.has(c));
}

export function buildLetterPools(names: string[]) {
  const firstLetters: string[] = [];
  const middleConsonants: string[] = [];
  const middleVowels: string[] = [];
  const usedLetters = new Set<string>();

  for (const name of names) {
    const upper = name.toUpperCase();
    if (!upper) continue;

    const chars = upper.split('');
    for (const c of chars) {
      if (c >= 'A' && c <= 'Z') usedLetters.add(c);
    }

    firstLetters.push(getFirstLetter(upper));
    middleConsonants.push(...getMiddleConsonants(upper));
    middleVowels.push(...getMiddleVowels(upper));
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const deadLetters = alphabet.filter(l => !usedLetters.has(l));

  return { firstLetters, middleConsonants, middleVowels, deadLetters };
}

// Calculate letter frequency: how many names contain each letter
export function calculateLetterFrequency(names: string[]): Map<string, number> {
  const frequency = new Map<string, number>();
  
  for (const name of names) {
    const upper = name.toUpperCase();
    const uniqueLetters = new Set(upper.split('').filter(c => c >= 'A' && c <= 'Z'));
    for (const letter of uniqueLetters) {
      frequency.set(letter, (frequency.get(letter) || 0) + 1);
    }
  }
  
  return frequency;
}

export function lettersInName(name: string): Set<string> {
  const set = new Set<string>();
  for (const c of name.toUpperCase()) {
    if (c >= 'A' && c <= 'Z') set.add(c);
  }
  return set;
}

