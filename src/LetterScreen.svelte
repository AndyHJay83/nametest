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
  }

  function openModal() {
    modalOpen = true;
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

    // Ensure all letters on screen are uppercase for comparison
    const lettersOnScreen = new Set(page.letters.map(l => l.toUpperCase().trim()).filter(Boolean));
    
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
          // We count how many different letters (besides the first) appear both on screen and in the name
          const matchingOtherLetters = new Set<string>();
          for (const l of lettersOnScreen) {
            // l is already uppercase from the map above
            // set contains uppercase letters from lettersInName
            const upperL = l.toUpperCase().trim();
            if (upperL && upperL !== first && set.has(upperL)) {
              matchingOtherLetters.add(upperL);
            }
          }
          
          // The user entered the number of "other letters" (besides first)
          // This should be the count of unique letters, not occurrences
          return matchingOtherLetters.size === n;
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
          <input
            type="number"
            bind:value={extraMatches}
            min="0"
          />
        </label>
        <button on:click={submitCount}>SUBMIT</button>
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
        <div style="margin-top: 12px; font-size: 0.8rem; color: #666;">
          Debug: {namestop1.length} names captured
          {#if namestop1.length > 0}
            <br />First few: {namestop1.slice(0, 5).join(', ')}
          {/if}
        </div>
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

  input {
    width: 100%;
    margin-top: 4px;
    margin-bottom: 8px;
    padding: 4px 6px;
  }

  button {
    margin-top: 4px;
  }
</style>

