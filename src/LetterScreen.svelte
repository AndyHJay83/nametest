<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { LetterPage } from './lib/letters';
  import { lettersInName } from './lib/names';

  export let namestop1: string[] = [];
  export let letterPages: LetterPage[] = [];
  export let allNames: string[] = [];

  const dispatch = createEventDispatcher();

  let container: HTMLDivElement;
  let modalOpen = false;
  let filteredResults: string[] = [];
  let positionInput = '1';
  let letterString = '';
  let matchCountInput = '';
  let formError = '';
  let submitted = false;
  let currentPageIndex = 0;
  let pagesLetterSets: { name: string; set: Set<string> }[] = [];
  let currentPage: LetterPage | null = null;
  let lastGeneratedLetters = '';
  $: sourceNames = allNames.length ? allNames : namestop1;
  $: pagesLetterSets = sourceNames.map(name => ({
    name,
    set: lettersInName(name)
  }));

  function updateCurrentPageFromScroll() {
    if (!container) return;
    const viewportHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    currentPageIndex = Math.round(scrollTop / viewportHeight);
    currentPageIndex = Math.max(0, Math.min(currentPageIndex, letterPages.length - 1));
    currentPage = letterPages[currentPageIndex] || null;
  }

  function onScroll() {
    updateCurrentPageFromScroll();
  }

  function openModal() {
    updateCurrentPageFromScroll();
    modalOpen = true;
    formError = '';
    submitted = false;
    filteredResults = [];
    if (currentPage) {
      letterString = currentPage.letters.join('');
    } else if (lastGeneratedLetters) {
      letterString = lastGeneratedLetters;
    }
  }

  function closeModal() {
    modalOpen = false;
    filteredResults = [];
    positionInput = '1';
    matchCountInput = '';
    formError = '';
    submitted = false;
  }

  function parseLetters(value: string): string[] {
    return value
      .toUpperCase()
      .split('')
      .map(c => c.trim())
      .filter(c => c >= 'A' && c <= 'Z');
  }

  function handleSubmit() {
    formError = '';
    filteredResults = [];
    submitted = false;

    const position = parseInt(positionInput, 10);
    if (isNaN(position) || position < 1 || position > 6) {
      formError = 'Position must be between 1 and 6.';
      return;
    }

    const lettersArray = parseLetters(letterString);
    if (!lettersArray.length) {
      formError = 'Enter at least one valid letter.';
      return;
    }

    const matchCount = parseInt(matchCountInput, 10);
    if (isNaN(matchCount) || matchCount < 0) {
      formError = 'Enter a valid match count.';
      return;
    }

    submitted = true;

    const lettersSet = new Set(lettersArray);
    const results = new Set<string>();

    for (const { name, set } of pagesLetterSets) {
      const upperName = name.toUpperCase().trim();
      if (!upperName || upperName.length < position) continue;

      const targetLetter = upperName[position - 1];
      if (!lettersSet.has(targetLetter)) continue;

      const matchingOtherLetters = new Set<string>();
      let occurrenceCount = 0;

      for (const letter of lettersArray) {
        if (letter === targetLetter) continue;
        if (set.has(letter)) {
          matchingOtherLetters.add(letter);
          occurrenceCount++;
        }
      }

      if (matchingOtherLetters.size === matchCount || occurrenceCount === matchCount) {
        results.add(name);
      }
    }

    filteredResults = [...results].sort((a, b) => a.localeCompare(b));
  }

  function generateLetterString() {
    if (!letterPages.length) {
      return;
    }
    const randomIndex = Math.floor(Math.random() * letterPages.length);
    const page = letterPages[randomIndex];
    if (!page) return;
    lastGeneratedLetters = page.letters.join('');
    letterString = lastGeneratedLetters;
  }

  function useCurrentLetters() {
    if (currentPage) {
      letterString = currentPage.letters.join('');
    }
  }

  function handleOverlayKey(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      closeModal();
    }
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  function reset() {
    dispatch('reset');
  }
</script>

<div class="screen">
  <header>
    <div class="left-actions">
      <button on:click={reset}>Reset</button>
      <button on:click={openModal}>Filter</button>
    </div>
    <div class="title">Letters ({namestop1.length})</div>
    <div class="spacer"></div>
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
    <div
      class="overlay"
      role="button"
      tabindex="0"
      aria-label="Close filter"
      on:click={handleOverlayClick}
      on:keydown={handleOverlayKey}
    >
      <div class="modal" role="dialog" aria-modal="true">
        <h2>Filter names</h2>
        <div class="field">
          <label for="position-input">Position (1-6)</label>
          <input
            id="position-input"
            type="number"
            min="1"
            max="6"
            bind:value={positionInput}
          />
        </div>
        <div class="field">
          <label for="letters-input">Letters</label>
          <div class="letter-input-row">
            <input
              id="letters-input"
              type="text"
              placeholder="e.g. ABCDEF"
              bind:value={letterString}
            />
          </div>
          <div class="actions-row">
            <button class="action-btn" type="button" on:click={useCurrentLetters} disabled={!currentPage}>
              Use screen
            </button>
            <button class="action-btn" type="button" on:click={generateLetterString}>
              Generate
            </button>
          </div>
        </div>
        <div class="field">
          <label for="matches-input">Matching letters in word</label>
          <input
            id="matches-input"
            type="number"
            min="0"
            bind:value={matchCountInput}
          />
        </div>
        <button class="submit-btn" on:click={handleSubmit}>SUBMIT</button>
        {#if formError}
          <p class="error">{formError}</p>
        {/if}
        {#if filteredResults.length}
          <h3>Possible names ({filteredResults.length})</h3>
          <ul>
            {#each filteredResults as n}
              <li>{n}</li>
            {/each}
          </ul>
        {:else if submitted}
          <p>No matches found.</p>
        {/if}
        {#if currentPage}
          <div class="hint">
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

  .left-actions {
    display: flex;
    gap: 8px;
  }

  .spacer {
    width: 48px;
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
    width: 90%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  label {
    font-size: 0.9rem;
    font-weight: 600;
  }

  input[type='number'],
  input[type='text'] {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  .letter-input-row {
    width: 100%;
  }

  .actions-row {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    flex: 1;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #ccc;
    background: #f5f5f5;
    cursor: pointer;
    font-weight: 600;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  .error {
    color: #c62828;
    font-weight: 600;
  }

  ul {
    max-height: 200px;
    overflow-y: auto;
    margin: 0;
    padding-left: 16px;
  }

  .hint {
    margin-top: 12px;
    font-size: 0.85rem;
    color: #666;
  }
</style>

