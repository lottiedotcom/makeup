const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const canvasWrapper = document.getElementById('canvasWrapper');
const tapInstruction = document.getElementById('tapInstruction');

const magContainer = document.getElementById('magnifier-container');
const magCanvas = document.getElementById('magnifier');
const magCtx = magCanvas.getContext('2d');

const paletteDisplayContainer = document.getElementById('paletteDisplayContainer');
const clearPaletteBtn = document.getElementById('clearPaletteBtn');
const challengeResult = document.getElementById('challengeResult');
const challengeTitle = document.getElementById('challengeTitle');
const challengeText = document.getElementById('challengeText');
const challengeSwatches = document.getElementById('challengeSwatches');

// Quiz Elements
const startQuizBtn = document.getElementById('startQuizBtn');
const quickRollBtn = document.getElementById('quickRollBtn');
const quizModal = document.getElementById('quizModal');
const quizQuestionText = document.getElementById('quizQuestionText');
const quizOptionsContainer = document.getElementById('quizOptionsContainer');

let palettes = [];
let activePaletteIndex = -1;

// --- IMAGE UPLOAD & CANVAS (Unchanged) ---
imageLoader.addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const defaultName = "Palette " + (palettes.length + 1);
            let paletteName = prompt("Name this palette (e.g., 'Neon Nights'):", defaultName);
            if (!paletteName) paletteName = defaultName;

            palettes.push({ name: paletteName, colors: [] });
            activePaletteIndex = palettes.length - 1;

            canvasWrapper.classList.remove('hidden');
            tapInstruction.style.display = 'block';
            clearPaletteBtn.classList.remove('hidden');
            document.querySelector('.file-upload-btn').innerText = "Upload Another Palette";
            
            updatePaletteDisplay();
        }
        img.src = event.target.result;
    }
    if (e.target.files.length > 0) reader.readAsDataURL(e.target.files[0]);
    e.target.value = ''; 
});

// --- DRAG TO PICK LOGIC (Unchanged) ---
let isDragging = false;
let currentCanvasX = 0, currentCanvasY = 0;

function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        screenX: e.clientX, screenY: e.clientY,
        canvasX: (e.clientX - rect.left) * scaleX,
        canvasY: (e.clientY - rect.top) * scaleY
    };
}

function updateMagnifier(coords) {
    currentCanvasX = coords.canvasX; currentCanvasY = coords.canvasY;
    magContainer.style.display = 'block';
    magContainer.style.left = (coords.screenX - 40) + 'px'; 
    magContainer.style.top = (coords.screenY - 90) + 'px';
    magCtx.imageSmoothingEnabled = false; 
    magCtx.clearRect(0, 0, magCanvas.width, magCanvas.height);
    magCtx.drawImage(canvas, currentCanvasX - 10, currentCanvasY - 10, 20, 20, 0, 0, magCanvas.width, magCanvas.height);
}

function startPick(e) {
    if (activePaletteIndex === -1) return;
    isDragging = true;
    updateMagnifier(getCoordinates(e));
}
function movePick(e) {
    if (!isDragging) return;
    e.preventDefault(); 
    updateMagnifier(getCoordinates(e));
}
function endPick(e) {
    if (!isDragging) return;
    isDragging = false;
    magContainer.style.display = 'none';
    const pixel = ctx.getImageData(currentCanvasX, currentCanvasY, 1, 1).data;
    palettes[activePaletteIndex].colors.push(rgbToHex(pixel[0], pixel[1], pixel[2]));
    updatePaletteDisplay();
}
function cancelPick() { isDragging = false; magContainer.style.display = 'none'; }

canvas.addEventListener('pointerdown', startPick);
window.addEventListener('pointermove', movePick, { passive: false }); 
window.addEventListener('pointerup', endPick);
window.addEventListener('pointercancel', cancelPick); 

function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
}

// --- COLOR MATH (Converts Hex to HSL for intelligent filtering) ---
function getHSL(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin;
    let h = 0, s = 0, l = (cmax + cmin) / 2;
    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));
    }
    return { h: h, s: +(s * 100).toFixed(1), l: +(l * 100).toFixed(1) };
}

// --- RENDER PALETTES (Unchanged) ---
function updatePaletteDisplay() {
    paletteDisplayContainer.innerHTML = '';
    palettes.forEach((palette, paletteIndex) => {
        if (palette.colors.length === 0) return;
        const groupDiv = document.createElement('div');
        groupDiv.classList.add('palette-group');
        const title = document.createElement('h4');
        title.innerText = palette.name;
        groupDiv.appendChild(title);
        const gridDiv = document.createElement('div');
        gridDiv.classList.add('palette-grid');

        palette.colors.forEach((color, colorIndex) => {
            const swatch = document.createElement('div');
            swatch.classList.add('color-swatch', 'deletable-swatch'); 
            swatch.style.backgroundColor = color;
            swatch.title = "Tap to delete";
            swatch.addEventListener('click', () => {
                palettes[paletteIndex].colors.splice(colorIndex, 1);
                updatePaletteDisplay(); 
            });
            gridDiv.appendChild(swatch);
        });
        groupDiv.appendChild(gridDiv);
        paletteDisplayContainer.appendChild(groupDiv);
    });
}

clearPaletteBtn.addEventListener('click', () => {
    palettes = []; activePaletteIndex = -1; updatePaletteDisplay();
    challengeResult.classList.add('hidden'); canvasWrapper.classList.add('hidden');
    tapInstruction.style.display = 'none'; clearPaletteBtn.classList.add('hidden');
    document.querySelector('.file-upload-btn').innerText = "Upload a Palette";
});

// --- THE VIBE QUIZ ENGINE ---
const allModes = ['roulette', 'haloEye', 'innerCorner', 'oneAndDone', 'panProject', 'colorClash', 'placement'];

const quizData = [
    {
        question: "How much time do we have?",
        options: [
            { text: "I literally have 5 minutes.", weight: { 'oneAndDone': 3, 'innerCorner': 2 } },
            { text: "I have a little time to play.", weight: { 'roulette': 2, 'placement': 2, 'colorClash': 1 } },
            { text: "I'm settling in for a full session.", weight: { 'haloEye': 3, 'placement': 1, 'colorClash': 2 } }
        ]
    },
    {
        question: "What is the aesthetic energy today?",
        options: [
            { text: "Soft and ethereal.", vibe: "soft" },
            { text: "Bold, bright, and loud.", vibe: "bold" },
            { text: "Dark, moody, nocturnal.", vibe: "dark" },
            { text: "Whatever my least used colors are.", weight: { 'panProject': 5 }, vibe: "any" }
        ]
    },
    {
        question: "Choose your finishing touch:",
        options: [
            { text: "Matte everything.", finish: "Keep all shades completely matte." },
            { text: "Drench it in shimmer.", finish: "Add extreme shimmer/glitter over the top." },
            { text: "Sharp graphic liner.", finish: "Pair this look with a sharp graphic eyeliner." },
            { text: "Smudged and lived-in.", finish: "Smudge out the edges for a lived-in, grunge feel." }
        ]
    }
];

let currentQuestion = 0;
let quizScores = { roulette: 0, haloEye: 0, innerCorner: 0, oneAndDone: 0, panProject: 0, colorClash: 0, placement: 0 };
let chosenVibe = "any";
let chosenFinish = "";

startQuizBtn.addEventListener('click', () => {
    if (getFlatColors().length < 3) {
        alert("Please extract at least 3 colors into your digital pool first!");
        return;
    }
    // Reset Quiz State
    currentQuestion = 0;
    Object.keys(quizScores).forEach(k => quizScores[k] = 0);
    chosenVibe = "any";
    chosenFinish = "";
    
    quizModal.classList.remove('hidden');
    renderQuestion();
});

function renderQuestion() {
    const q = quizData[currentQuestion];
    quizQuestionText.innerText = q.question;
    quizOptionsContainer.innerHTML = '';
    
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.classList.add('quiz-btn');
        btn.innerText = opt.text;
        btn.addEventListener('click', () => handleOptionClick(opt));
        quizOptionsContainer.appendChild(btn);
    });
}

function handleOptionClick(option) {
    // Add points
    if (option.weight) {
        for (const [mode, points] of Object.entries(option.weight)) {
            quizScores[mode] += points;
        }
    }
    // Save modifiers
    if (option.vibe) chosenVibe = option.vibe;
    if (option.finish) chosenFinish = option.finish;

    currentQuestion++;
    
    if (currentQuestion < quizData.length) {
        renderQuestion();
    } else {
        quizModal.classList.add('hidden');
        processQuizResults();
    }
}

// --- GENERATOR LOGIC ---
function getFlatColors() {
    let allColors = [];
    palettes.forEach(p => p.colors.forEach(c => allColors.push({ color: c, paletteName: p.name })));
    return allColors;
}

quickRollBtn.addEventListener('click', () => {
    if (getFlatColors().length < 3) {
        alert("Please extract at least 3 colors into your digital pool first!");
        return;
    }
    // Completely random mode
    const randomMode = allModes[Math.floor(Math.random() * allModes.length)];
    generateChallenge(randomMode, "any", "");
});

function processQuizResults() {
    // Find the mode with the highest score
    let winningMode = 'roulette';
    let maxScore = -1;
    for (const [mode, score] of Object.entries(quizScores)) {
        if (score > maxScore) {
            maxScore = score;
            winningMode = mode;
        }
    }
    generateChallenge(winningMode, chosenVibe, chosenFinish);
}

function generateChallenge(mode, vibe, finishText) {
    let allColors = getFlatColors();
    
    // Filter colors based on vibe choice
    let filteredColors = [...allColors];
    if (vibe === 'dark') {
        filteredColors = allColors.filter(c => getHSL(c.color).l < 45); // Low lightness
    } else if (vibe === 'soft') {
        filteredColors = allColors.filter(c => getHSL(c.color).l > 60); // High lightness
    } else if (vibe === 'bold') {
        filteredColors = allColors.filter(c => getHSL(c.color).s > 50); // High saturation
    }

    // Fallback: If filtering leaves us with too few colors, use the whole pool 
    // and rely on the text prompt to guide the user.
    if (filteredColors.length < 3) {
        filteredColors = [...allColors];
    }

    const getRandomColors = (num) => {
        const shuffled = [...filteredColors].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(num, filteredColors.length));
    };

    challengeResult.classList.remove('hidden');
    challengeSwatches.innerHTML = ''; 
    let selectedColors = [];

    switch (mode) {
        case 'roulette':
            challengeTitle.innerText = "Palette Roulette";
            challengeText.innerText = "Here is your randomized 4-pan look!";
            selectedColors = getRandomColors(4);
            break;
        case 'haloEye':
            challengeTitle.innerText = "The Halo Eye";
            challengeText.innerHTML = `Use <b>Color 1</b> for inner/outer corners.<br>Pop <b>Color 2</b> in the center of the lid.<br>Blend the edges with <b>Color 3</b>.`;
            selectedColors = getRandomColors(3);
            break;
        case 'innerCorner':
            challengeTitle.innerText = "Inner Corner Pop";
            challengeText.innerHTML = `Create a soft base with <b>Colors 1 & 2</b>.<br>Pack <b>Color 3</b> intensely on the inner corner!`;
            selectedColors = getRandomColors(3);
            break;
        case 'oneAndDone':
            challengeTitle.innerText = "The One & Done";
            challengeText.innerText = "Wash this single color all over the lid and buff it out for a beautiful monochromatic look.";
            selectedColors = getRandomColors(1);
            break;
        case 'panProject':
            challengeTitle.innerText = "The Pan Project";
            challengeText.innerText = "Time to hit pan! Dig deep and create a look focusing entirely on these least-used shades.";
            selectedColors = getRandomColors(3);
            break;
        case 'colorClash':
            challengeTitle.innerText = "Color Theory Clash";
            challengeText.innerText = "Make it work! Create a cohesive look using these contrasting shades.";
            selectedColors = getRandomColors(2);
            break;
        case 'placement':
            challengeTitle.innerText = "Placement Prompts";
            challengeText.innerHTML = `Use <b>Color 1</b> in the crease.<br>Pack <b>Color 2</b> all over the lid.<br>Smudge <b>Color 3</b> on the lower lash line.`;
            selectedColors = getRandomColors(3);
            break;
    }

    // Append Finishing Touch if quiz was taken
    if (finishText) {
        challengeText.innerHTML += `<br><br><b>Finishing Touch:</b> <i>${finishText}</i>`;
    }

    // Render Swatches
    selectedColors.forEach((colorObj, index) => {
        const swatchWrap = document.createElement('div');
        swatchWrap.classList.add('swatch-wrapper');
        
        const swatch = document.createElement('div');
        swatch.classList.add('color-swatch');
        swatch.style.backgroundColor = colorObj.color;
        
        const label = document.createElement('small');
        if (mode === 'placement' || mode === 'haloEye' || mode === 'innerCorner') {
            label.innerHTML = `<b>Color ${index + 1}</b><br>${colorObj.paletteName}`;
        } else {
            label.innerText = colorObj.paletteName;
        }
        
        swatchWrap.appendChild(swatch);
        swatchWrap.appendChild(label);
        challengeSwatches.appendChild(swatchWrap);
    });
}

// --- PWA INSTALL (Unchanged) ---
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove('hidden');
});
installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') installBtn.classList.add('hidden');
        deferredPrompt = null;
    }
});
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}

