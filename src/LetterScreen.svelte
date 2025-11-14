<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { LetterPage } from './lib/letters';
  import { lettersInName } from './lib/names';

  export let namestop1: string[] = [];
  export let letterPages: LetterPage[] = [];

  const dispatch = createEventDispatcher();

  let container: HTMLDivElement;
  let modalOpen = false;
  let modalResults: string[] = [];
  let extraMatches = '';
  let currentPageIndex = 0;
  let pagesLetterSets: { name: string; set: Set<string> }[] = [];
  let currentPage: LetterPage | null = null;

  function addDigit(digit: string) {
    extraMatches = extraMatches + digit;
  }

  function clearDigit() {
    extraMatches = extraMatches.slice(0, -1);
  }

  function clearAll() {
    extraMatches = '';
  }

  onMount(() => {
    pagesLetterSets = namestop1.map(name => ({
      name,
      set: lettersInName(name)
    }));
  });

  function onScroll() {
    if (!container) return;
    const viewportHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    currentPageIndex = Math.round(scrollTop / viewportHeight);
    currentPageIndex = Math.max(0, Math.min(currentPageIndex, letterPages.length - 1));
    currentPage = letterPages[currentPageIndex] || null;
  }

  function openModal() {
    modalOpen = true;
    // Update current page when modal opens
    if (container) {
      const viewportHeight = container.clientHeight;
      const scrollTop = container.scrollTop;
      currentPageIndex = Math.round(scrollTop / viewportHeight);
      currentPageIndex = Math.max(0, Math.min(currentPageIndex, letterPages.length - 1));
      currentPage = letterPages[currentPageIndex] || null;
    }
  }

  function closeModal() {
    modalOpen = false;
    extraMatches = '';
    modalResults = [];
  }

  function submitCount() {
    const n = parseInt(extraMatches, 10);
    if (isNaN(n)) return;

    const page = letterPages[currentPageIndex];
    if (!page) return;

    // Keep original array for occurrence counting, and Set for unique counting
    const lettersOnScreenArray = page.letters.map(l => l.toUpperCase().trim()).filter(Boolean);
    const lettersOnScreen = new Set(lettersOnScreenArray);
    
    // Find all possible first letters from names that could match
    // Check each name's first letter against letters on screen
    const possibleFirstLetters = new Set<string>();
    for (const { name } of pagesLetterSets) {
      const upperName = name.toUpperCase().trim();
      if (!upperName) continue;
      const firstLetter = upperName[0];
      if (firstLetter && lettersOnScreen.has(firstLetter)) {
        possibleFirstLetters.add(firstLetter);
      }
    }

    // Try each possible first letter and collect all matching names
    const allCandidates: string[] = [];
    
    for (const first of possibleFirstLetters) {
      const candidates = pagesLetterSets
        .filter(({ name, set }) => {
          const upperName = name.toUpperCase().trim();
          if (!upperName) return false;
          
          // Name must start with this first letter
          if (!upperName.startsWith(first)) return false;
          
          // The first letter must be on screen (redundant check but safe)
          if (!lettersOnScreen.has(first)) return false;
          
          // Count unique other letters that match
          const matchingOtherLetters = new Set<string>();
          // Count total occurrences of matching letters
          let occurrenceCount = 0;
          
          for (const l of lettersOnScreenArray) {
            const upperL = l.toUpperCase().trim();
            if (upperL && upperL !== first && set.has(upperL)) {
              matchingOtherLetters.add(upperL);
              occurrenceCount++;
            }
          }
          
          const uniqueCount = matchingOtherLetters.size;
          
          // Match if user entered either unique count OR occurrence count
          return uniqueCount === n || occurrenceCount === n;
        })
        .map(c => c.name);
      
      allCandidates.push(...candidates);
    }

    // Remove duplicates and sort
    modalResults = [...new Set(allCandidates)].sort((a, b) => a.localeCompare(b));
  }

  function reset() {
    dispatch('reset');
  }
</script>

<div class="screen">
  <header>
    <button on:click={reset}>R</button>
    <div class="title">Letters ({namestop1.length})</div>
    <button on:click={openModal}>#</button>
  </header>
  <div class="scroll" bind:this={container} on:scroll={onScroll}>
    {#each letterPages as page}
      <section class="page">
        {#each page.letters as l}
          <div class="box">{l}</div>
        {/each}
      </section>
    {/each}
  </div>
  {#if modalOpen}
    <div class="overlay" on:click={closeModal}>
      <div class="modal" on:click|stopPropagation>
        <label>
          Other letters in your name:
        </label>
        <div class="numpad-display">{extraMatches || '0'}</div>
        <div class="numpad">
          <div class="numpad-row">
            <button class="numpad-btn" on:click={() => addDigit('1')}>1</button>
            <button class="numpad-btn" on:click={() => addDigit('2')}>2</button>
            <button class="numpad-btn" on:click={() => addDigit('3')}>3</button>
          </div>
          <div class="numpad-row">
            <button class="numpad-btn" on:click={() => addDigit('4')}>4</button>
            <button class="numpad-btn" on:click={() => addDigit('5')}>5</button>
            <button class="numpad-btn" on:click={() => addDigit('6')}>6</button>
          </div>
          <div class="numpad-row">
            <button class="numpad-btn" on:click={() => addDigit('7')}>7</button>
            <button class="numpad-btn" on:click={() => addDigit('8')}>8</button>
            <button class="numpad-btn" on:click={() => addDigit('9')}>9</button>
          </div>
          <div class="numpad-row">
            <button class="numpad-btn clear-btn" on:click={clearAll}>C</button>
            <button class="numpad-btn" on:click={() => addDigit('0')}>0</button>
            <button class="numpad-btn backspace-btn" on:click={clearDigit}>⌫</button>
          </div>
        </div>
        <button class="submit-btn" on:click={submitCount}>SUBMIT</button>
        {#if modalResults.length}
          <h2>Possible names ({modalResults.length})</h2>
          <ul>
            {#each modalResults as n}
              <li>{n}</li>
            {/each}
          </ul>
        {:else if extraMatches !== ''}
          <p>No matches found.</p>
        {/if}
        {#if currentPage}
          <div style="margin-top: 12px; font-size: 0.8rem; color: #666;">
            Screen letters: {currentPage.letters.join(', ')}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .screen {
    height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: system-ui, sans-serif;
  }

  header {
    flex: 0 0 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    border-bottom: 1px solid #ddd;
  }

  .scroll {
    flex: 1;
    overflow-y: auto;
    scroll-snap-type: y mandatory;
  }

  .page {
    height: 100vh;
    scroll-snap-align: start;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }

  .box {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    border: 1px solid #eee;
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal {
    background: white;
    padding: 16px;
    border-radius: 12px;
    width: 80%;
    max-width: 360px;
  }

  .numpad-display {
    width: 100%;
    margin: 8px 0;
    padding: 12px;
    font-size: 2rem;
    text-align: center;
    background: transparent;
    border: none;
    font-weight: 600;
  }

  .numpad {
    display: grid;
    grid-template-rows: repeat(4, 1fr);
    gap: 8px;
    margin: 12px 0;
  }

  .numpad-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .numpad-btn {
    padding: 16px;
    font-size: 1.5rem;
    border: 2px solid #ddd;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
  }

  .numpad-btn:active {
    background: #e0e0e0;
  }

  .clear-btn {
    background: #ffebee;
    color: #c62828;
  }

  .backspace-btn {
    background: #fff3e0;
    color: #e65100;
  }

  .submit-btn {
    width: 100%;
    margin-top: 8px;
    padding: 12px;
    font-size: 1.1rem;
    font-weight: 600;
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }

  .submit-btn:active {
    background: #1565c0;
  }
</style>

