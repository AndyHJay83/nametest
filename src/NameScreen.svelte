<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { createRng, pickOne } from './lib/random';

  export let allNames: string[] = [];

  const dispatch = createEventDispatcher();

  const PAGE_COUNT = 40;        // plenty for infinite-feel
  const BOXES_PER_PAGE = 6;     // 3 rows × 2 cols

  type Box = { names: string[] };
  type Page = { boxes: Box[] };

  let pages: Page[] = [];
  const rng = createRng(123456); // you can mix this with a session seed if you like

  function randomBox(): Box {
    const count = 1 + Math.floor(rng() * 6);
    const chosen: string[] = [];
    for (let i = 0; i < count; i++) {
      chosen.push(pickOne(rng, allNames));
    }
    return { names: chosen };
  }

  function buildPages() {
    pages = [];
    for (let p = 0; p < PAGE_COUNT; p++) {
      const boxes: Box[] = [];
      for (let b = 0; b < BOXES_PER_PAGE; b++) {
        boxes.push(randomBox());
      }
      pages.push({ boxes });
    }
  }

  let container: HTMLDivElement;
  let lastScrollTime = Date.now();
  let idleTimer: number;
  let captured = false;

  function onScroll() {
    lastScrollTime = Date.now();
    captured = false;
  }

  onMount(() => {
    buildPages();
    idleTimer = window.setInterval(() => {
      const now = Date.now();
      if (!captured && now - lastScrollTime > 10000) {
        captured = true;
        captureVisiblePage();
      }
    }, 500);
  });

  onDestroy(() => {
    window.clearInterval(idleTimer);
  });

  function captureVisiblePage() {
    if (!container) return;
    const viewportHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    const pageIndex = Math.round(scrollTop / viewportHeight);
    const page = pages[Math.min(Math.max(pageIndex, 0), pages.length - 1)];
    if (!page) return;
    const all = page.boxes.flatMap(box => box.names);
    dispatch('capture', all);
  }
</script>

<div class="screen">
  <header>
    <button class="disabled">R</button>
    <div class="title">Names</div>
    <button class="link" on:click={captureVisiblePage}>L</button>
  </header>
  <div class="scroll" bind:this={container} on:scroll={onScroll}>
    {#each pages as page}
      <section class="page">
        {#each page.boxes as box, i}
          <div class="box">
            {#each box.names as n}
              <div class="name">{n}</div>
            {/each}
          </div>
        {/each}
      </section>
    {/each}
  </div>
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

  .title {
    font-weight: 600;
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
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(3, 1fr);
  }

  .box {
    border: 1px solid #eee;
    padding: 6px;
    font-size: 1.1rem;
    overflow-y: auto;
  }

  button {
    border: none;
    background: transparent;
    font-size: 1rem;
  }

  .link {
    font-weight: 700;
  }

  .disabled {
    opacity: 0.3;
  }
</style>

