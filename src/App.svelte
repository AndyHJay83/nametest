<script lang="ts">
  import { onMount } from 'svelte';
  import NameScreen from './NameScreen.svelte';
  import LetterScreen from './LetterScreen.svelte';
  import { createRng } from './lib/random';
  import { parseNames } from './lib/names';
  import type { LetterPage } from './lib/letters';
  import { buildLetterPages } from './lib/letters';

  let allNames: string[] = [];
  let ready = false;
  let screen: 'names' | 'letters' = 'names';
  let namestop1: string[] = [];
  let letterPages: LetterPage[] = [];

  const seed = Date.now();
  const rng = createRng(seed);

  onMount(async () => {
    const base = import.meta.env.BASE_URL;
    const res = await fetch(`${base}assets/namelist.txt`);
    const text = await res.text();
    allNames = parseNames(text);
    ready = true;
  });

  function handleNamesCaptured(event: CustomEvent<string[]>) {
    namestop1 = event.detail;
    letterPages = buildLetterPages(namestop1, rng, 80);
    screen = 'letters';
  }

  function resetAll() {
    screen = 'names';
    namestop1 = [];
    letterPages = [];
  }
</script>

{#if !ready}
  <main>Loading…</main>
{:else}
  {#if screen === 'names'}
    <NameScreen
      {allNames}
      on:capture={handleNamesCaptured}
    />
  {:else}
    <LetterScreen
      {namestop1}
      {letterPages}
      {allNames}
      on:reset={resetAll}
    />
  {/if}
{/if}

<style>
  main {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, sans-serif;
  }
</style>

