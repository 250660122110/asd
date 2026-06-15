// ----------------- THEME MANAGEMENT (DARK / LIGHT) -----------------
const htmlElement = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

if (localStorage.getItem("theme") === "dark" || (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  htmlElement.classList.add("dark");
  themeIcon.className = "fa-solid fa-sun text-yellow-400";
} else {
  htmlElement.classList.remove("dark");
  themeIcon.className = "fa-solid fa-moon text-indigo-600";
}

themeToggle.addEventListener("click", () => {
  if (htmlElement.classList.contains("dark")) {
    htmlElement.classList.remove("dark");
    themeIcon.className = "fa-solid fa-moon text-indigo-600";
    localStorage.setItem("theme", "light");
  } else {
    htmlElement.classList.add("dark");
    themeIcon.className = "fa-solid fa-sun text-yellow-400";
    localStorage.setItem("theme", "dark");
  }
});

// ----------------- WEB AUDIO SONIFICATION ENGINE (WOW FACTOR) -----------------
let audioCtx = null;
let isMuted = false;

function toggleMute() {
  isMuted = !isMuted;
  const soundIcon = document.getElementById("soundIcon");
  if (isMuted) {
    soundIcon.className = "fa-solid fa-volume-xmark text-slate-400";
  } else {
    soundIcon.className = "fa-solid fa-volume-high text-indigo-600 dark:text-indigo-400";
  }
}

function playTone(value, maxValue, actionType = "compare") {
  if (isMuted) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const ratio = Math.max(0.05, Math.min(1, value / maxValue));
    const freq = 220 + ratio * 660;

    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    if (actionType === "swap") {
      osc.type = "sawtooth";
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } else {
      osc.type = "sine";
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    }
  } catch (err) {
    console.warn("Web Audio API blocked or not supported:", err);
  }
}

// ----------------- DYNAMIC SPEED CONTROLLER -----------------
function getDelay(type) {
  const slider = document.getElementById(`speed-${type}`);
  return slider ? parseInt(slider.value) : 600;
}

["selection", "bubble", "insertion"].forEach((type) => {
  const slider = document.getElementById(`speed-${type}`);
  const label = document.getElementById(`speed-label-${type}`);
  if (slider && label) {
    slider.addEventListener("input", () => {
      label.textContent = `${slider.value}ms`;
    });
  }
});

// ----------------- SCROLL TO TOP ACTIONS -----------------
const scrollToTopBtn = document.getElementById("scrollToTop");
window.addEventListener("scroll", () => {
  if (window.scrollY > 400) {
    scrollToTopBtn.classList.remove("opacity-0", "translate-y-10", "scale-90");
    scrollToTopBtn.classList.add("opacity-100", "translate-y-0", "scale-100");
  } else {
    scrollToTopBtn.classList.remove("opacity-100", "translate-y-0", "scale-100");
    scrollToTopBtn.classList.add("opacity-0", "translate-y-10", "scale-90");
  }
});

// ----------------- DATASET MANIPULATORS -----------------
function generateData(type, mode) {
  let size = 6;
  if (type === "bubble") size = 8;
  if (type === "insertion") size = 6;

  let arr = [];
  if (mode === "random") {
    for (let i = 0; i < size; i++) {
      arr.push(Math.floor(Math.random() * 95) + 5);
    }
  } else if (mode === "best") {
    arr = Array.from({ length: size }, (_, i) => (i + 1) * 12);
    if (type === "bubble") {
      arr.reverse(); // Descending adalah best case untuk Bubble sort Descending!
    }
  } else if (mode === "worst") {
    arr = Array.from({ length: size }, (_, i) => (i + 1) * 12);
    if (type !== "bubble") {
      arr.reverse();
    }
  }

  const inputField = document.getElementById(`${type}-input`);
  if (inputField) {
    inputField.value = arr.join(", ");
  }

  if (type === "selection") resetSelectionSort();
  if (type === "bubble") resetBubbleSort();
  if (type === "insertion") resetInsertionSort();
}

function parseCustomInput(inputId, defaultArray) {
  const inputVal = document.getElementById(inputId).value;
  const parsed = inputVal
    .split(",")
    .map((num) => parseInt(num.trim()))
    .filter((num) => !isNaN(num));
  return parsed.length > 0 ? parsed : defaultArray;
}

// ----------------- PSEUDOCODE HIGHLIGHTER ENGINE -----------------
function highlightLine(type, lineNum) {
  const container = document.getElementById(`${type}-code-tracer`);
  if (container) {
    const lines = container.children;
    for (let i = 0; i < lines.length; i++) {
      lines[i].classList.remove("code-line-active");
    }
    const target = document.getElementById(`${type}-line-${lineNum}`);
    if (target) {
      target.classList.add("code-line-active");
    }
  }
}

function clearHighlights(type) {
  const container = document.getElementById(`${type}-code-tracer`);
  if (container) {
    const lines = container.children;
    for (let i = 0; i < lines.length; i++) {
      lines[i].classList.remove("code-line-active");
    }
  }
}

// ----------------- CONTROLS & STEPPING LOGIC STATE -----------------
let isSelectionPaused = false;
let isSelectionRunning = false;
let selectionResolvePause = null;
let selectionTimeoutId = null;
let isSelectionStepByStep = false;
let nextSelectionResolve = null;
let selectionActiveResolve = null;

let isBubblePaused = false;
let isBubbleRunning = false;
let bubbleResolvePause = null;
let bubbleTimeoutId = null;
let isBubbleStepByStep = false;
let nextBubbleResolve = null;
let bubbleActiveResolve = null;

let isInsertionPaused = false;
let isInsertionRunning = false;
let insertionResolvePause = null;
let insertionTimeoutId = null;
let isInsertionStepByStep = false;
let nextInsertionResolve = null;
let insertionActiveResolve = null;

async function waitSegment(type) {
  if (type === "selection") {
    if (isSelectionStepByStep) {
      return new Promise((resolve) => {
        nextSelectionResolve = resolve;
      });
    }
    if (isSelectionPaused) {
      return new Promise((resolve) => {
        selectionResolvePause = resolve;
      });
    }
    return new Promise((resolve) => {
      selectionActiveResolve = resolve;
      selectionTimeoutId = setTimeout(() => {
        selectionActiveResolve = null;
        resolve();
      }, getDelay("selection"));
    });
  } else if (type === "bubble") {
    if (isBubbleStepByStep) {
      return new Promise((resolve) => {
        nextBubbleResolve = resolve;
      });
    }
    if (isBubblePaused) {
      return new Promise((resolve) => {
        bubbleResolvePause = resolve;
      });
    }
    return new Promise((resolve) => {
      bubbleActiveResolve = resolve;
      bubbleTimeoutId = setTimeout(() => {
        bubbleActiveResolve = null;
        resolve();
      }, getDelay("bubble"));
    });
  } else if (type === "insertion") {
    if (isInsertionStepByStep) {
      return new Promise((resolve) => {
        nextInsertionResolve = resolve;
      });
    }
    if (isInsertionPaused) {
      return new Promise((resolve) => {
        insertionResolvePause = resolve;
      });
    }
    return new Promise((resolve) => {
      insertionActiveResolve = resolve;
      insertionTimeoutId = setTimeout(() => {
        insertionActiveResolve = null;
        resolve();
      }, getDelay("insertion"));
    });
  }
  return Promise.resolve();
}

// ----------------- VISUALIZER 1: SELECTION SORT (ASCENDING) -----------------
const defaultSelectionData = [12, 30, 21, 22, 10, 92];
let selectionData = [...defaultSelectionData];
let selCompCount = 0;
let selSwapCount = 0;

function renderSelectionBars(activeIdx = [], minIdx = null, sortedIdx = [], currentSwapping = []) {
  const container = document.getElementById("selection-bars-container");
  container.innerHTML = "";
  const maxVal = Math.max(...selectionData, 1);

  selectionData.forEach((val, i) => {
    const barWrapper = document.createElement("div");
    barWrapper.className = "flex flex-col items-center justify-end h-full flex-1 max-w-[48px] min-w-[24px] mx-0.5 sm:mx-1.5 transition-all duration-300";
    const pctHeight = Math.max((val / maxVal) * 85, 20);

    let barColorClass = "bg-indigo-400 dark:bg-indigo-600 text-white border border-transparent";
    if (sortedIdx.includes(i)) {
      barColorClass = "bg-emerald-500 text-white bar-sorted shadow-lg shadow-emerald-500/20";
    } else if (currentSwapping.includes(i)) {
      barColorClass = "bg-yellow-500 text-slate-900 font-extrabold bar-swapping shadow-lg shadow-yellow-500/20";
    } else if (i === minIdx) {
      barColorClass = "bg-amber-500 text-slate-900 font-extrabold animate-pulse shadow-lg shadow-amber-500/20";
    } else if (activeIdx.includes(i)) {
      barColorClass = "bg-rose-500 text-white bar-comparing shadow-lg shadow-rose-500/20";
    }

    barWrapper.innerHTML = `
            <span class="text-[10px] sm:text-xs font-bold font-mono mb-1 text-slate-600 dark:text-slate-300">${val}</span>
            <div class="w-full ${barColorClass} rounded-t-lg flex items-center justify-center text-[10px] font-bold font-mono" style="height: ${pctHeight}%;">
              [${i}]
            </div>
          `;
    container.appendChild(barWrapper);
  });
}

function reloadSelectionData() {
  selectionData = parseCustomInput("selection-input", defaultSelectionData);
  resetSelectionSort();
}

function toggleSelectionSort() {
  const btnText = document.getElementById("btn-selection-control");
  const btnIcon = document.getElementById("icon-selection-control");

  if (!isSelectionRunning) {
    isSelectionRunning = true;
    isSelectionPaused = false;
    isSelectionStepByStep = false;
    btnIcon.className = "fa-solid fa-pause";
    btnText.querySelector("span").textContent = "Jeda";
    startSelectionSort();
  } else {
    if (isSelectionStepByStep) {
      isSelectionStepByStep = false;
      isSelectionPaused = false;
      btnIcon.className = "fa-solid fa-pause";
      btnText.querySelector("span").textContent = "Jeda";
      if (nextSelectionResolve) {
        const tempResolve = nextSelectionResolve;
        nextSelectionResolve = null;
        tempResolve();
      }
    } else if (isSelectionPaused) {
      isSelectionPaused = false;
      btnIcon.className = "fa-solid fa-pause";
      btnText.querySelector("span").textContent = "Jeda";
      if (selectionResolvePause) {
        const tempResolve = selectionResolvePause;
        selectionResolvePause = null;
        tempResolve();
      }
    } else {
      isSelectionPaused = true;
      btnIcon.className = "fa-solid fa-play";
      btnText.querySelector("span").textContent = "Main";
    }
  }
}

function stepSelectionSort() {
  const btnText = document.getElementById("btn-selection-control");
  const btnIcon = document.getElementById("icon-selection-control");

  if (!isSelectionRunning) {
    isSelectionRunning = true;
    isSelectionStepByStep = true;
    isSelectionPaused = false;
    btnIcon.className = "fa-solid fa-play";
    btnText.querySelector("span").textContent = "Mulai";
    startSelectionSort();
  } else {
    isSelectionStepByStep = true;
    isSelectionPaused = false;
    btnIcon.className = "fa-solid fa-play";
    btnText.querySelector("span").textContent = "Mulai";

    if (selectionActiveResolve) {
      const tempResolve = selectionActiveResolve;
      selectionActiveResolve = null;
      clearTimeout(selectionTimeoutId);
      tempResolve();
    } else if (nextSelectionResolve) {
      const tempResolve = nextSelectionResolve;
      nextSelectionResolve = null;
      tempResolve();
    } else if (selectionResolvePause) {
      const tempResolve = selectionResolvePause;
      selectionResolvePause = null;
      tempResolve();
    }
  }
}

async function startSelectionSort() {
  const log = document.getElementById("selection-log");
  selectionData = parseCustomInput("selection-input", defaultSelectionData);
  const n = selectionData.length;
  const maxVal = Math.max(...selectionData, 1);

  selCompCount = 0;
  selSwapCount = 0;
  document.getElementById("stat-sel-comp").textContent = selCompCount;
  document.getElementById("stat-sel-swap").textContent = selSwapCount;

  highlightLine("selection", 1);
  log.textContent = "Mulai Selection Sort Ascending...";
  await waitSegment("selection");

  highlightLine("selection", 2);
  log.innerHTML = `Inisialisasi panjang array: <span class="font-mono font-bold">n = ${n}</span>`;
  await waitSegment("selection");

  for (let i = 0; i < n - 1; i++) {
    highlightLine("selection", 3);
    log.innerHTML = `<strong>Iterasi Terluar (i = ${i}):</strong> Memulai pass pencarian elemen terkecil.`;
    await waitSegment("selection");

    let min_idx = i;
    highlightLine("selection", 4);
    log.innerHTML = `Anggap sementara indeks terkecil <strong class="text-amber-500">min_idx = ${i}</strong> (${selectionData[i]}).`;
    renderSelectionBars(
      [i],
      min_idx,
      Array.from({ length: i }, (_, k) => k),
    );
    playTone(selectionData[i], maxVal, "compare");
    await waitSegment("selection");

    for (let j = i + 1; j < n; j++) {
      selCompCount++;
      document.getElementById("stat-sel-comp").textContent = selCompCount;

      highlightLine("selection", 5);
      log.innerHTML = `Iterasi dalam: Bandingkan indeks <strong class="text-rose-500">[${j}]</strong> dengan minimum sementara indeks <strong class="text-amber-500">[${min_idx}]</strong>.`;
      renderSelectionBars(
        [j],
        min_idx,
        Array.from({ length: i }, (_, k) => k),
      );
      playTone(selectionData[j], maxVal, "compare");
      await waitSegment("selection");

      highlightLine("selection", 6);
      if (selectionData[j] < selectionData[min_idx]) {
        min_idx = j;
        highlightLine("selection", 7);
        log.innerHTML = `Kondisi terpenuhi! Nilai baru yang lebih kecil ditemukan. Ubah <strong class="text-amber-500">min_idx = ${min_idx}</strong> (${selectionData[min_idx]}).`;
        renderSelectionBars(
          [j],
          min_idx,
          Array.from({ length: i }, (_, k) => k),
        );
        playTone(selectionData[min_idx], maxVal, "compare");
        await waitSegment("selection");
      }
    }

    highlightLine("selection", 10);
    log.innerHTML = `Memeriksa apakah minimum baru ditemukan (<strong class="font-mono">min_idx (${min_idx}) !== i (${i})</strong>).`;
    await waitSegment("selection");

    if (min_idx !== i) {
      selSwapCount++;
      document.getElementById("stat-sel-swap").textContent = selSwapCount;

      highlightLine("selection", 11);
      log.innerHTML = `Ya! Tukar posisi antara elemen indeks <strong class="text-rose-500">[${i}]</strong> (${selectionData[i]}) dengan indeks terkecil <strong class="text-amber-500">[${min_idx}]</strong> (${selectionData[min_idx]}).`;

      let temp = selectionData[min_idx];
      selectionData[min_idx] = selectionData[i];
      selectionData[i] = temp;

      renderSelectionBars(
        [],
        null,
        Array.from({ length: i }, (_, k) => k),
        [i, min_idx],
      );
      playTone(selectionData[i], maxVal, "swap");
      await waitSegment("selection");
    } else {
      log.innerHTML = `Tidak perlu pertukaran (swap), elemen di indeks <strong class="font-bold">[${i}]</strong> sudah berada di posisi yang benar.`;
      await waitSegment("selection");
    }
  }

  highlightLine("selection", 14);
  log.innerHTML = "<strong class='text-emerald-500'><i class='fa-solid fa-check-double'></i> Selesai!</strong> Seluruh data berhasil diurutkan secara Ascending.";
  renderSelectionBars(
    [],
    null,
    Array.from({ length: n }, (_, k) => k),
  );
  clearHighlights("selection");

  isSelectionRunning = false;
  isSelectionPaused = false;
  isSelectionStepByStep = false;
  selectionActiveResolve = null;
  document.getElementById("icon-selection-control").className = "fa-solid fa-play";
  document.getElementById("btn-selection-control").querySelector("span").textContent = "Mulai";
}

function resetSelectionSort() {
  if (selectionTimeoutId) clearTimeout(selectionTimeoutId);
  isSelectionRunning = false;
  isSelectionPaused = false;
  isSelectionStepByStep = false;
  selectionActiveResolve = null;
  if (selectionResolvePause) {
    selectionResolvePause();
    selectionResolvePause = null;
  }
  if (nextSelectionResolve) {
    nextSelectionResolve();
    nextSelectionResolve = null;
  }

  document.getElementById("icon-selection-control").className = "fa-solid fa-play";
  document.getElementById("btn-selection-control").querySelector("span").textContent = "Mulai";
  selectionData = parseCustomInput("selection-input", defaultSelectionData);
  selCompCount = 0;
  selSwapCount = 0;
  document.getElementById("stat-sel-comp").textContent = selCompCount;
  document.getElementById("stat-sel-swap").textContent = selSwapCount;
  renderSelectionBars();
  clearHighlights("selection");
  document.getElementById("selection-log").textContent = "Visualizer di-reset ke data semula.";
}

// ----------------- VISUALIZER 2: BUBBLE SORT (DESCENDING) -----------------
const defaultBubbleData = [102, 302, 213, 202, 109, 92, 111, 22];
let bubbleData = [...defaultBubbleData];
let bubCompCount = 0;
let bubSwapCount = 0;

function renderBubbleBars(activeIdx = [], sortedIdx = [], currentSwapping = []) {
  const container = document.getElementById("bubble-bars-container");
  if (!container) return;
  container.innerHTML = "";
  const maxVal = Math.max(...bubbleData, 1);

  bubbleData.forEach((val, i) => {
    const barWrapper = document.createElement("div");
    barWrapper.className = "flex flex-col items-center justify-end h-full flex-1 max-w-[48px] min-w-[20px] mx-0.5 sm:mx-1 transition-all duration-300";
    const pctHeight = Math.max((val / maxVal) * 85, 20);

    let barColorClass = "bg-rose-400 dark:bg-rose-600 text-white border border-transparent";
    if (sortedIdx.includes(i)) {
      barColorClass = "bg-emerald-500 text-white bar-sorted shadow-lg shadow-emerald-500/20";
    } else if (currentSwapping.includes(i)) {
      barColorClass = "bg-yellow-500 text-slate-900 font-extrabold bar-swapping shadow-lg shadow-yellow-500/20";
    } else if (activeIdx.includes(i)) {
      barColorClass = "bg-rose-500 text-white bar-comparing shadow-lg shadow-rose-500/20";
    }

    barWrapper.innerHTML = `
            <span class="text-[10px] sm:text-xs font-bold font-mono mb-1 text-slate-600 dark:text-slate-300">${val}</span>
            <div class="w-full ${barColorClass} rounded-t-lg flex items-center justify-center text-[10px] font-bold font-mono" style="height: ${pctHeight}%;">
              [${i}]
            </div>
          `;
    container.appendChild(barWrapper);
  });
}

function reloadBubbleData() {
  bubbleData = parseCustomInput("bubble-input", defaultBubbleData);
  resetBubbleSort();
}

function toggleBubbleSort() {
  const btnText = document.getElementById("btn-bubble-control");
  const btnIcon = document.getElementById("icon-bubble-control");

  if (!isBubbleRunning) {
    isBubbleRunning = true;
    isBubblePaused = false;
    isBubbleStepByStep = false;
    btnIcon.className = "fa-solid fa-pause";
    btnText.querySelector("span").textContent = "Jeda";
    startBubbleSort();
  } else {
    if (isBubbleStepByStep) {
      isBubbleStepByStep = false;
      isBubblePaused = false;
      btnIcon.className = "fa-solid fa-pause";
      btnText.querySelector("span").textContent = "Jeda";
      if (nextBubbleResolve) {
        const tempResolve = nextBubbleResolve;
        nextBubbleResolve = null;
        tempResolve();
      }
    } else if (isBubblePaused) {
      isBubblePaused = false;
      btnIcon.className = "fa-solid fa-pause";
      btnText.querySelector("span").textContent = "Jeda";
      if (bubbleResolvePause) {
        const tempResolve = bubbleResolvePause;
        bubbleResolvePause = null;
        tempResolve();
      }
    } else {
      isBubblePaused = true;
      btnIcon.className = "fa-solid fa-play";
      btnText.querySelector("span").textContent = "Main";
    }
  }
}

function stepBubbleSort() {
  const btnText = document.getElementById("btn-bubble-control");
  const btnIcon = document.getElementById("icon-bubble-control");

  if (!isBubbleRunning) {
    isBubbleRunning = true;
    isBubbleStepByStep = true;
    isBubblePaused = false;
    btnIcon.className = "fa-solid fa-play";
    btnText.querySelector("span").textContent = "Mulai";
    startBubbleSort();
  } else {
    isBubbleStepByStep = true;
    isBubblePaused = false;
    btnIcon.className = "fa-solid fa-play";
    btnText.querySelector("span").textContent = "Mulai";

    if (bubbleActiveResolve) {
      const tempResolve = bubbleActiveResolve;
      bubbleActiveResolve = null;
      clearTimeout(bubbleTimeoutId);
      tempResolve();
    } else if (nextBubbleResolve) {
      const tempResolve = nextBubbleResolve;
      nextBubbleResolve = null;
      tempResolve();
    } else if (bubbleResolvePause) {
      const tempResolve = bubbleResolvePause;
      bubbleResolvePause = null;
      tempResolve();
    }
  }
}

async function startBubbleSort() {
  const log = document.getElementById("bubble-log");
  bubbleData = parseCustomInput("bubble-input", defaultBubbleData);
  const n = bubbleData.length;
  const maxVal = Math.max(...bubbleData, 1);

  bubCompCount = 0;
  bubSwapCount = 0;
  document.getElementById("stat-bub-comp").textContent = bubCompCount;
  document.getElementById("stat-bub-swap").textContent = bubSwapCount;

  highlightLine("bubble", 1);
  log.textContent = "Mulai Bubble Sort Descending...";
  await waitSegment("bubble");

  highlightLine("bubble", 2);
  log.innerHTML = `Inisialisasi panjang array: <span class="font-mono font-bold">n = ${n}</span>`;
  await waitSegment("bubble");

  let sortedCount = 0;
  for (let i = 0; i < n - 1; i++) {
    highlightLine("bubble", 3);
    log.innerHTML = `<strong class="text-rose-500">Pass ${i + 1}:</strong> Memulai pemindaian elemen yang berdekatan.`;
    await waitSegment("bubble");

    highlightLine("bubble", 4);
    let swapped = false;
    log.innerHTML = `Atur flag <span class="font-mono font-semibold text-rose-500">swapped = false</span> di awal putaran.`;
    await waitSegment("bubble");

    for (let j = 0; j < n - i - 1; j++) {
      bubCompCount++;
      document.getElementById("stat-bub-comp").textContent = bubCompCount;

      highlightLine("bubble", 5);
      log.innerHTML = `Memeriksa sepasang tetangga: Bandingkan indeks <span class="text-amber-500 font-bold">[${j}]</span> (${bubbleData[j]}) dengan indeks <span class="text-amber-500 font-bold">[${j + 1}]</span> (${bubbleData[j + 1]}).`;
      renderBubbleBars(
        [j, j + 1],
        Array.from({ length: sortedCount }, (_, k) => n - 1 - k),
      );
      playTone(bubbleData[j], maxVal, "compare");
      await waitSegment("bubble");

      highlightLine("bubble", 6);
      log.innerHTML = `Evaluasi: Apakah <span class="font-bold">${bubbleData[j]} &lt; ${bubbleData[j + 1]}</span>?`;
      await waitSegment("bubble");

      if (bubbleData[j] < bubbleData[j + 1]) {
        bubSwapCount++;
        document.getElementById("stat-bub-swap").textContent = bubSwapCount;

        highlightLine("bubble", 7);
        log.innerHTML = `Ya! Lakukan pertukaran (swap) elemen untuk mengurutkan secara menurun (descending).`;

        let temp = bubbleData[j];
        bubbleData[j] = bubbleData[j + 1];
        bubbleData[j + 1] = temp;
        swapped = true;

        renderBubbleBars(
          [],
          Array.from({ length: sortedCount }, (_, k) => n - 1 - k),
          [j, j + 1],
        );
        playTone(bubbleData[j], maxVal, "swap");
        await waitSegment("bubble");

        highlightLine("bubble", 8);
        log.innerHTML = `Ubah flag <span class="font-mono font-bold text-emerald-500">swapped = true</span>.`;
        await waitSegment("bubble");
      }
    }

    highlightLine("bubble", 11);
    log.innerHTML = `Selesai pass ${i + 1}. Memeriksa apakah terjadi penukaran (<strong class="font-mono">!swapped</strong>).`;
    await waitSegment("bubble");

    sortedCount++;
    if (!swapped) {
      log.innerHTML = "Optimasi Swap Flag bekerja! Tidak terjadi swap sepanjang Pass ini, data dijamin telah rapi sempurna!";
      break;
    }
  }

  highlightLine("bubble", 13);
  log.innerHTML = "<strong class='text-emerald-500'><i class='fa-solid fa-check-double'></i> Selesai!</strong> Seluruh data berhasil diurutkan secara Descending.";
  renderBubbleBars(
    [],
    Array.from({ length: n }, (_, k) => k),
  );
  clearHighlights("bubble");

  isBubbleRunning = false;
  isBubblePaused = false;
  isBubbleStepByStep = false;
  bubbleActiveResolve = null;
  document.getElementById("icon-bubble-control").className = "fa-solid fa-play";
  document.getElementById("btn-bubble-control").querySelector("span").textContent = "Mulai";
}

function resetBubbleSort() {
  if (bubbleTimeoutId) clearTimeout(bubbleTimeoutId);
  isBubbleRunning = false;
  isBubblePaused = false;
  isBubbleStepByStep = false;
  bubbleActiveResolve = null;
  if (bubbleResolvePause) {
    bubbleResolvePause();
    bubbleResolvePause = null;
  }
  if (nextBubbleResolve) {
    nextBubbleResolve();
    nextBubbleResolve = null;
  }

  document.getElementById("icon-bubble-control").className = "fa-solid fa-play";
  document.getElementById("btn-bubble-control").querySelector("span").textContent = "Mulai";
  bubbleData = parseCustomInput("bubble-input", defaultBubbleData);
  bubCompCount = 0;
  bubSwapCount = 0;
  document.getElementById("stat-bub-comp").textContent = bubCompCount;
  document.getElementById("stat-bub-swap").textContent = bubSwapCount;
  renderBubbleBars();
  clearHighlights("bubble");
  document.getElementById("bubble-log").textContent = "Visualizer di-reset ke data semula.";
}

// ----------------- VISUALIZER 3: INSERTION SORT (ASCENDING) -----------------
const defaultInsertionData = [102, 302, 213, 202, 109];
let insertionData = [...defaultInsertionData];
let insCompCount = 0;
let insSwapCount = 0;

function renderInsertionBars(activeIdx = [], keyIdx = null, sortedIdx = [], currentSwapping = []) {
  const container = document.getElementById("insertion-bars-container");
  container.innerHTML = "";
  const maxVal = Math.max(...insertionData, 1);

  insertionData.forEach((val, i) => {
    const barWrapper = document.createElement("div");
    barWrapper.className = "flex flex-col items-center justify-end h-full flex-1 max-w-[48px] min-w-[24px] mx-0.5 sm:mx-1.5 transition-all duration-300";
    const pctHeight = Math.max((val / maxVal) * 85, 20);

    let barColorClass = "bg-emerald-400 dark:bg-emerald-600 text-white";
    if (currentSwapping.includes(i)) {
      barColorClass = "bg-yellow-500 text-slate-900 font-extrabold bar-swapping shadow-lg shadow-yellow-500/20";
    } else if (i === keyIdx) {
      barColorClass = "bg-amber-500 text-slate-900 font-extrabold animate-bounce shadow-lg shadow-amber-500/20";
    } else if (sortedIdx.includes(i)) {
      barColorClass = "bg-indigo-500 text-white bar-sorted shadow-lg shadow-indigo-500/20";
    } else if (activeIdx.includes(i)) {
      barColorClass = "bg-rose-500 text-white bar-comparing shadow-lg shadow-rose-500/20";
    }

    barWrapper.innerHTML = `
            <span class="text-[10px] sm:text-xs font-bold font-mono mb-1 text-slate-600 dark:text-slate-300">${val}</span>
            <div class="w-full ${barColorClass} rounded-t-lg flex items-center justify-center text-[10px] font-bold font-mono" style="height: ${pctHeight}%;">
              [${i}]
            </div>
          `;
    container.appendChild(barWrapper);
  });
}

function reloadInsertionData() {
  insertionData = parseCustomInput("insertion-input", defaultInsertionData);
  resetInsertionSort();
}

function toggleInsertionSort() {
  const btnText = document.getElementById("btn-insertion-control");
  const btnIcon = document.getElementById("icon-insertion-control");

  if (!isInsertionRunning) {
    isInsertionRunning = true;
    isInsertionPaused = false;
    isInsertionStepByStep = false;
    btnIcon.className = "fa-solid fa-pause";
    btnText.querySelector("span").textContent = "Jeda";
    startInsertionSort();
  } else {
    if (isInsertionStepByStep) {
      isInsertionStepByStep = false;
      isInsertionPaused = false;
      btnIcon.className = "fa-solid fa-pause";
      btnText.querySelector("span").textContent = "Jeda";
      if (nextInsertionResolve) {
        const tempResolve = nextInsertionResolve;
        nextInsertionResolve = null;
        tempResolve();
      }
    } else if (isInsertionPaused) {
      isInsertionPaused = false;
      btnIcon.className = "fa-solid fa-pause";
      btnText.querySelector("span").textContent = "Jeda";
      if (insertionResolvePause) {
        const tempResolve = insertionResolvePause;
        insertionResolvePause = null;
        tempResolve();
      }
    } else {
      isInsertionPaused = true;
      btnIcon.className = "fa-solid fa-play";
      btnText.querySelector("span").textContent = "Main";
    }
  }
}

function stepInsertionSort() {
  const btnText = document.getElementById("btn-insertion-control");
  const btnIcon = document.getElementById("icon-insertion-control");

  if (!isInsertionRunning) {
    isInsertionRunning = true;
    isInsertionStepByStep = true;
    isInsertionPaused = false;
    btnIcon.className = "fa-solid fa-play";
    btnText.querySelector("span").textContent = "Mulai";
    startInsertionSort();
  } else {
    isInsertionStepByStep = true;
    isInsertionPaused = false;
    btnIcon.className = "fa-solid fa-play";
    btnText.querySelector("span").textContent = "Mulai";

    if (insertionActiveResolve) {
      const tempResolve = insertionActiveResolve;
      insertionActiveResolve = null;
      clearTimeout(insertionTimeoutId);
      tempResolve();
    } else if (nextInsertionResolve) {
      const tempResolve = nextInsertionResolve;
      nextInsertionResolve = null;
      tempResolve();
    } else if (insertionResolvePause) {
      const tempResolve = insertionResolvePause;
      insertionResolvePause = null;
      tempResolve();
    }
  }
}

async function startInsertionSort() {
  const log = document.getElementById("insertion-log");
  insertionData = parseCustomInput("insertion-input", defaultInsertionData);
  const n = insertionData.length;
  const maxVal = Math.max(...insertionData, 1);

  insCompCount = 0;
  insSwapCount = 0;
  document.getElementById("stat-ins-comp").textContent = insCompCount;
  document.getElementById("stat-ins-swap").textContent = insSwapCount;

  highlightLine("insertion", 1);
  log.innerHTML = "Mulai Insertion Sort Ascending...";
  renderInsertionBars([], null, [0]);
  await waitSegment("insertion");

  highlightLine("insertion", 2);
  log.innerHTML = `Elemen indeks ke-0 secara teoritis diasumsikan sudah terurut di awal.`;
  await waitSegment("insertion");

  for (let i = 1; i < n; i++) {
    highlightLine("insertion", 3);
    log.innerHTML = `<strong>Iterasi Terluar (i = ${i}):</strong> Memulai pass untuk menyisipkan elemen.`;
    await waitSegment("insertion");

    let key = insertionData[i];
    highlightLine("insertion", 4);
    log.innerHTML = `Pilih nilai penanda kustom: <strong class="text-amber-500">Key = ${key}</strong> (indeks [${i}]).`;
    renderInsertionBars(
      [],
      i,
      Array.from({ length: i }, (_, k) => k),
    );
    playTone(key, maxVal, "compare");
    await waitSegment("insertion");

    let j = i - 1;
    highlightLine("insertion", 5);
    log.innerHTML = `Atur indeks pembanding di kiri penanda: <strong class="font-bold">j = ${j}</strong>.`;
    await waitSegment("insertion");

    highlightLine("insertion", 6);
    log.innerHTML = `Evaluasi: Apakah <strong class="font-mono">j >= 0</strong> dan nilai <strong class="text-rose-500">arr[j] (${insertionData[j]}) > Key (${key})</strong>?`;
    await waitSegment("insertion");

    while (j >= 0) {
      insCompCount++;
      document.getElementById("stat-ins-comp").textContent = insCompCount;

      if (insertionData[j] <= key) {
        break;
      }

      insSwapCount++;
      document.getElementById("stat-ins-swap").textContent = insSwapCount;

      highlightLine("insertion", 7);
      log.innerHTML = `Ya! Geser nilai <strong class="text-rose-500">${insertionData[j]}</strong> ke kanan (indeks [${j + 1}]).`;

      insertionData[j + 1] = insertionData[j];
      renderInsertionBars(
        [],
        i,
        Array.from({ length: i }, (_, k) => k),
        [j, j + 1],
      );
      playTone(insertionData[j], maxVal, "swap");

      j = j - 1;
      await waitSegment("insertion");

      highlightLine("insertion", 8);
      log.innerHTML = `Kurangi pointer pembanding: <strong class="font-bold">j = ${j}</strong>.`;
      await waitSegment("insertion");

      highlightLine("insertion", 6);
      if (j >= 0) {
        log.innerHTML = `Evaluasi kembali: Apakah <strong class="font-mono">j >= 0</strong> dan nilai <strong class="text-rose-500">arr[j] (${insertionData[j]}) > Key (${key})</strong>?`;
      } else {
        log.innerHTML = `Loop selesai karena indeks <strong class="font-mono">j = ${j}</strong> kurang dari 0.`;
      }
      await waitSegment("insertion");
    }

    highlightLine("insertion", 10);
    log.innerHTML = `Sisipkan kembali nilai <strong class="text-amber-500">Key (${key})</strong> pada ruang sisa di indeks <span class="text-emerald-500 font-bold">[${j + 1}]</span>.`;

    insertionData[j + 1] = key;
    renderInsertionBars(
      [],
      j + 1,
      Array.from({ length: i + 1 }, (_, k) => k),
    );
    playTone(key, maxVal, "swap");
    await waitSegment("insertion");
  }

  highlightLine("insertion", 12);
  log.innerHTML = "<strong class='text-emerald-500'><i class='fa-solid fa-check-double'></i> Selesai!</strong> Seluruh data berhasil disisipkan dan diurutkan secara Ascending.";
  renderInsertionBars(
    [],
    null,
    Array.from({ length: n }, (_, k) => k),
  );
  clearHighlights("insertion");

  isInsertionRunning = false;
  isInsertionPaused = false;
  isInsertionStepByStep = false;
  insertionActiveResolve = null;
  document.getElementById("icon-insertion-control").className = "fa-solid fa-play";
  document.getElementById("btn-insertion-control").querySelector("span").textContent = "Mulai";
}

function resetInsertionSort() {
  if (insertionTimeoutId) clearTimeout(insertionTimeoutId);
  isInsertionRunning = false;
  isInsertionPaused = false;
  isInsertionStepByStep = false;
  insertionActiveResolve = null;
  if (insertionResolvePause) {
    insertionResolvePause();
    insertionResolvePause = null;
  }
  if (nextInsertionResolve) {
    nextInsertionResolve();
    nextInsertionResolve = null;
  }

  document.getElementById("icon-insertion-control").className = "fa-solid fa-play";
  document.getElementById("btn-insertion-control").querySelector("span").textContent = "Mulai";
  insertionData = parseCustomInput("insertion-input", defaultInsertionData);
  insCompCount = 0;
  insSwapCount = 0;
  document.getElementById("stat-ins-comp").textContent = insCompCount;
  document.getElementById("stat-ins-swap").textContent = insSwapCount;
  renderInsertionBars();
  clearHighlights("insertion");
  document.getElementById("insertion-log").textContent = "Visualizer di-reset ke data semula.";
}

// =========================================================================
//              THE GRAND RACE ARENA LOGIC (SINKRON MULTI-ALGORITMA)
// =========================================================================
let raceIntervals = [];
let raceActive = false;
let raceArr = [];

function renderRaceTrack(elementId, arr, activeIdx = [], sortedIdx = []) {
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = "";
  const maxVal = Math.max(...arr, 1);

  arr.forEach((val, i) => {
    const barWrapper = document.createElement("div");
    barWrapper.className = "flex flex-col items-center justify-end h-full flex-1 max-w-[24px] mx-0.5 transition-all duration-200";
    const pctHeight = Math.max((val / maxVal) * 80, 15);

    let barColor = "bg-slate-400 dark:bg-slate-600";
    if (sortedIdx.includes(i)) {
      barColor = "bg-emerald-500 shadow-lg shadow-emerald-500/20";
    } else if (activeIdx.includes(i)) {
      barColor = "bg-rose-500 animate-pulse";
    }

    barWrapper.innerHTML = `
            <div class="w-full ${barColor} rounded-t-sm" style="height: ${pctHeight}%;"></div>
          `;
    container.appendChild(barWrapper);
  });
}

function resetRace() {
  raceActive = false;
  raceIntervals.forEach(clearInterval);
  raceIntervals = [];

  raceArr = Array.from({ length: 12 }, () => Math.floor(Math.random() * 90) + 10);

  renderRaceTrack("race-selection-container", [...raceArr]);
  renderRaceTrack("race-bubble-container", [...raceArr]);
  renderRaceTrack("race-insertion-container", [...raceArr]);

  document.getElementById("race-status-selection").textContent = "Ready";
  document.getElementById("race-status-bubble").textContent = "Ready";
  document.getElementById("race-status-insertion").textContent = "Ready";

  document.getElementById("race-status-selection").className = "text-[10px] font-mono px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-bold text-slate-500";
  document.getElementById("race-status-bubble").className = "text-[10px] font-mono px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-bold text-slate-500";
  document.getElementById("race-status-insertion").className = "text-[10px] font-mono px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-bold text-slate-500";

  document.getElementById("race-stat-sel-comp").textContent = 0;
  document.getElementById("race-stat-sel-swap").textContent = 0;
  document.getElementById("race-stat-bub-comp").textContent = 0;
  document.getElementById("race-stat-bub-swap").textContent = 0;
  document.getElementById("race-stat-ins-comp").textContent = 0;
  document.getElementById("race-stat-ins-swap").textContent = 0;
}

async function startRace() {
  if (raceActive) return;
  raceActive = true;

  const maxVal = Math.max(...raceArr, 1);

  document.getElementById("race-status-selection").textContent = "Running";
  document.getElementById("race-status-bubble").textContent = "Running";
  document.getElementById("race-status-insertion").textContent = "Running";

  document.getElementById("race-status-selection").className = "text-[10px] font-mono px-2 py-0.5 bg-indigo-500 text-white rounded font-bold";
  document.getElementById("race-status-bubble").className = "text-[10px] font-mono px-2 py-0.5 bg-rose-500 text-white rounded font-bold";
  document.getElementById("race-status-insertion").className = "text-[10px] font-mono px-2 py-0.5 bg-emerald-500 text-white rounded font-bold";

  // 1. JALUR SELECTION SORT
  const runRaceSelection = async () => {
    let arr = [...raceArr];
    let comp = 0;
    let swapCount = 0;
    let n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      if (!raceActive) return;
      let min_idx = i;
      for (let j = i + 1; j < n; j++) {
        if (!raceActive) return;
        comp++;
        document.getElementById("race-stat-sel-comp").textContent = comp;
        renderRaceTrack(
          "race-selection-container",
          arr,
          [j, min_idx],
          Array.from({ length: i }, (_, k) => k),
        );
        playTone(arr[j], maxVal, "compare");
        await new Promise((r) => setTimeout(r, 120));
        if (arr[j] < arr[min_idx]) {
          min_idx = j;
        }
      }
      if (min_idx !== i) {
        swapCount++;
        document.getElementById("race-stat-sel-swap").textContent = swapCount;
        let temp = arr[min_idx];
        arr[min_idx] = arr[i];
        arr[i] = temp;
        playTone(arr[i], maxVal, "swap");
      }
    }
    renderRaceTrack(
      "race-selection-container",
      arr,
      [],
      Array.from({ length: n }, (_, k) => k),
    );
    document.getElementById("race-status-selection").textContent = "FINISH!";
    document.getElementById("race-status-selection").className = "text-[10px] font-mono px-2 py-0.5 bg-emerald-500 text-white rounded font-bold animate-bounce";
  };

  // 2. JALUR BUBBLE SORT (DESCENDING)
  const runRaceBubble = async () => {
    let arr = [...raceArr];
    let comp = 0;
    let swapCount = 0;
    let n = arr.length;
    let sortedCount = 0;
    for (let i = 0; i < n - 1; i++) {
      if (!raceActive) return;
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        if (!raceActive) return;
        comp++;
        document.getElementById("race-stat-bub-comp").textContent = comp;
        renderRaceTrack(
          "race-bubble-container",
          arr,
          [j, j + 1],
          Array.from({ length: sortedCount }, (_, k) => n - 1 - k),
        );
        playTone(arr[j], maxVal, "compare");
        await new Promise((r) => setTimeout(r, 120));
        if (arr[j] < arr[j + 1]) {
          swapCount++;
          document.getElementById("race-stat-bub-swap").textContent = swapCount;
          let temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
          swapped = true;
          playTone(arr[j], maxVal, "swap");
        }
      }
      sortedCount++;
      if (!swapped) break;
    }
    renderRaceTrack(
      "race-bubble-container",
      arr,
      [],
      Array.from({ length: n }, (_, k) => k),
    );
    document.getElementById("race-status-bubble").textContent = "FINISH!";
    document.getElementById("race-status-bubble").className = "text-[10px] font-mono px-2 py-0.5 bg-emerald-500 text-white rounded font-bold animate-bounce";
  };

  // 3. JALUR INSERTION SORT
  const runRaceInsertion = async () => {
    let arr = [...raceArr];
    let comp = 0;
    let swapCount = 0;
    let n = arr.length;
    for (let i = 1; i < n; i++) {
      if (!raceActive) return;
      let key = arr[i];
      let j = i - 1;
      while (j >= 0) {
        if (!raceActive) return;
        comp++;
        document.getElementById("race-stat-ins-comp").textContent = comp;
        renderRaceTrack(
          "race-insertion-container",
          arr,
          [j, j + 1],
          Array.from({ length: i }, (_, k) => k),
        );
        playTone(arr[j], maxVal, "compare");
        await new Promise((r) => setTimeout(r, 120));
        if (arr[j] > key) {
          swapCount++;
          document.getElementById("race-stat-ins-swap").textContent = swapCount;
          arr[j + 1] = arr[j];
          playTone(arr[j], maxVal, "swap");
          j = j - 1;
        } else {
          break;
        }
      }
      arr[j + 1] = key;
    }
    renderRaceTrack(
      "race-insertion-container",
      arr,
      [],
      Array.from({ length: n }, (_, k) => k),
    );
    document.getElementById("race-status-insertion").textContent = "FINISH!";
    document.getElementById("race-status-insertion").className = "text-[10px] font-mono px-2 py-0.5 bg-emerald-500 text-white rounded font-bold animate-bounce";
  };

  runRaceSelection();
  runRaceBubble();
  runRaceInsertion();
}

// ----------------- ADVANCED FEATURE: EMPIRICAL BENCHMARK ENGINE -----------------
function runBenchmark() {
  const sizeSelect = document.getElementById("benchmark-size");
  const size = parseInt(sizeSelect.value);

  const labelSelection = document.getElementById("bench-time-selection");
  const labelBubble = document.getElementById("bench-time-bubble");
  const labelInsertion = document.getElementById("bench-time-insertion");

  const barSelection = document.getElementById("bench-bar-selection");
  const barBubble = document.getElementById("bench-bar-bubble");
  const barInsertion = document.getElementById("bench-bar-insertion");

  labelSelection.textContent = "Sedang menguji...";
  labelBubble.textContent = "Sedang menguji...";
  labelInsertion.textContent = "Sedang menguji...";

  barSelection.style.width = "0%";
  barBubble.style.width = "0%";
  barInsertion.style.width = "0%";

  const benchmarkData = Array.from({ length: size }, () => Math.floor(Math.random() * 10000));

  setTimeout(() => {
    // 1. Benchmark Selection Sort
    const dataForSelection = [...benchmarkData];
    const t0 = performance.now();
    benchmarkSelectionSort(dataForSelection);
    const t1 = performance.now();
    const selectionTime = t1 - t0;

    // 2. Benchmark Bubble Sort
    const dataForBubble = [...benchmarkData];
    const t2 = performance.now();
    benchmarkBubbleSort(dataForBubble);
    const t3 = performance.now();
    const bubbleTime = t3 - t2;

    // 3. Benchmark Insertion Sort
    const dataForInsertion = [...benchmarkData];
    const t4 = performance.now();
    benchmarkInsertionSort(dataForInsertion);
    const t5 = performance.now();
    const insertionTime = t5 - t4;

    labelSelection.textContent = `${selectionTime.toFixed(2)} ms`;
    labelBubble.textContent = `${bubbleTime.toFixed(2)} ms`;
    labelInsertion.textContent = `${insertionTime.toFixed(2)} ms`;

    const maxTime = Math.max(selectionTime, bubbleTime, insertionTime);

    const pctSelection = Math.max(5, (selectionTime / maxTime) * 100);
    const pctBubble = Math.max(5, (bubbleTime / maxTime) * 100);
    const pctInsertion = Math.max(5, (insertionTime / maxTime) * 100);

    barSelection.style.width = `${pctSelection}%`;
    barBubble.style.width = `${pctBubble}%`;
    barInsertion.style.width = `${pctInsertion}%`;

    barSelection.innerHTML = `<span class="text-[10px] text-white font-mono font-bold">${pctSelection.toFixed(0)}%</span>`;
    barBubble.innerHTML = `<span class="text-[10px] text-white font-mono font-bold">${pctBubble.toFixed(0)}%</span>`;
    barInsertion.innerHTML = `<span class="text-[10px] text-white font-mono font-bold">${pctInsertion.toFixed(0)}%</span>`;
  }, 150);
}

function benchmarkSelectionSort(arr) {
  let n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let min_idx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[min_idx]) {
        min_idx = j;
      }
    }
    let temp = arr[min_idx];
    arr[min_idx] = arr[i];
    arr[i] = temp;
  }
}

function benchmarkBubbleSort(arr) {
  let n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] < arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swapped = true;
      }
    }
    if (!swapped) break;
  }
}

function benchmarkInsertionSort(arr) {
  let n = arr.length;
  for (let i = 1; i < n; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j = j - 1;
    }
    arr[j + 1] = key;
  }
}

// Logic ini membuat sistem simulasi graf dinamis yang merespons mouse cursor tanpa mengganggu fungsionalitas UI utama.
const bgCanvas = document.getElementById("canvas-network");
const bgCtx = bgCanvas.getContext("2d");
let bgParticles = [];
let bgMouse = { x: null, y: null, radius: 180 };

function resizeBgCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeBgCanvas);
resizeBgCanvas();

// Mendeteksi pergerakan mouse global
window.addEventListener("mousemove", (e) => {
  bgMouse.x = e.clientX;
  bgMouse.y = e.clientY;
});

window.addEventListener("mouseleave", () => {
  bgMouse.x = null;
  bgMouse.y = null;
});

class BgParticle {
  constructor() {
    this.x = Math.random() * bgCanvas.width;
    this.y = Math.random() * bgCanvas.height;
    // Kecepatan sangat lambat agar tetap minimalis dan tidak merusak konsentrasi user/dosen saat membaca materi
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.radius = Math.random() * 2 + 1.5;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > bgCanvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > bgCanvas.height) this.vy *= -1;

    // Reaksi interaktif mendorong node yang mendekati cursor mouse secara lembut (physics push effect)
    if (bgMouse.x !== null && bgMouse.y !== null) {
      let dx = this.x - bgMouse.x;
      let dy = this.y - bgMouse.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bgMouse.radius) {
        let force = (bgMouse.radius - dist) / bgMouse.radius;
        this.x += (dx / dist) * force * 1.5;
        this.y += (dy / dist) * force * 1.5;
      }
    }
  }

  draw() {
    bgCtx.beginPath();
    bgCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    const isDark = document.documentElement.classList.contains("dark");
    // Warna node disesuaikan dengan kontras mode gelap/terang
    bgCtx.fillStyle = isDark ? "rgba(129, 140, 248, 0.4)" : "rgba(79, 70, 229, 0.25)";
    bgCtx.fill();
  }
}

function initBgParticles() {
  bgParticles = [];
  // Menentukan kepadatan berdasarkan luas viewport browser agar tidak memberatkan browser lama
  const numParticles = Math.min(100, Math.floor((bgCanvas.width * bgCanvas.height) / 14000));
  for (let i = 0; i < numParticles; i++) {
    bgParticles.push(new BgParticle());
  }
}
initBgParticles();
window.addEventListener("resize", initBgParticles);

function animateBgParticles() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  const isDark = document.documentElement.classList.contains("dark");

  // Garis koneksi (edge) yang merepresentasikan struktur tautan (Linkage)
  const lineColor = isDark ? "rgba(99, 102, 241, 0.06)" : "rgba(79, 70, 229, 0.05)";

  bgParticles.forEach((p) => {
    p.update();
    p.draw();
  });

  // Menghubungkan node terdekat menggunakan Algoritma Euclidean Distance Sederhana
  for (let i = 0; i < bgParticles.length; i++) {
    for (let j = i + 1; j < bgParticles.length; j++) {
      let dx = bgParticles[i].x - bgParticles[j].x;
      let dy = bgParticles[i].y - bgParticles[j].y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      // Jarak threshold maksimum untuk membuat garis edge penghubung
      if (dist < 130) {
        bgCtx.beginPath();
        bgCtx.moveTo(bgParticles[i].x, bgParticles[i].y);
        bgCtx.lineTo(bgParticles[j].x, bgParticles[j].y);
        bgCtx.strokeStyle = lineColor;
        // Ketebalan garis disesuaikan agar tetap elegan
        bgCtx.lineWidth = 0.8;
        bgCtx.stroke();
      }
    }
  }
  requestAnimationFrame(animateBgParticles);
}
animateBgParticles();

// Initialize all visualizations on page load
window.onload = function () {
  renderSelectionBars();
  renderBubbleBars();
  renderInsertionBars();
  resetRace();
};
