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
const generateBtn = document.getElementById('generateBtn');
const challengeMode = document.getElementById('challengeMode');
const challengeResult = document.getElementById('challengeResult');
const challengeTitle = document.getElementById('challengeTitle');
const challengeText = document.getElementById('challengeText');
const challengeSwatches = document.getElementById('challengeSwatches');

let palettes = [];
let activePaletteIndex = -1;

// Image Upload
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

// --- DRAG TO PICK LOGIC (UPDATED WITH POINTER EVENTS) ---
let isDragging = false;
let currentCanvasX = 0;
let currentCanvasY = 0;

function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    // Pointer events have clientX/Y natively, no need to check for touches array
    const clientX = e.clientX;
    const clientY = e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        screenX: clientX,
        screenY: clientY,
        canvasX: (clientX - rect.left) * scaleX,
        canvasY: (clientY - rect.top) * scaleY
    };
}

function updateMagnifier(coords) {
    currentCanvasX = coords.canvasX;
    currentCanvasY = coords.canvasY;

    magContainer.style.display = 'block';
    magContainer.style.left = (coords.screenX - 40) + 'px'; 
    magContainer.style.top = (coords.screenY - 90) + 'px';

    magCtx.imageSmoothingEnabled = false; 
    magCtx.clearRect(0, 0, magCanvas.width, magCanvas.height);
    magCtx.drawImage(
        canvas, 
        currentCanvasX - 10, currentCanvasY - 10, 20, 20, 
        0, 0, magCanvas.width, magCanvas.height
    );
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
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    
    palettes[activePaletteIndex].colors.push(hex);
    updatePaletteDisplay();
}

function cancelPick() {
    isDragging = false;
    magContainer.style.display = 'none';
}

// Unified Pointer Events - fixes the "ghost double click" bug entirely
canvas.addEventListener('pointerdown', startPick);
window.addEventListener('pointermove', movePick, { passive: false }); 
window.addEventListener('pointerup', endPick);
window.addEventListener('pointercancel', cancelPick); // Handles interruptions (like phone calls) smoothly

function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
}

// Render Palettes & Individual Delete
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

// Clear Entire Pool
clearPaletteBtn.addEventListener('click', () => {
    palettes = [];
    activePaletteIndex = -1;
    updatePaletteDisplay();
    challengeResult.classList.add('hidden');
    canvasWrapper.classList.add('hidden');
    tapInstruction.style.display = 'none';
    clearPaletteBtn.classList.add('hidden');
    document.querySelector('.file-upload-btn').innerText = "Upload a Palette";
});

// Generator Logic
generateBtn.addEventListener('click', () => {
    let allColors = [];
    palettes.forEach(p => {
        p.colors.forEach(c => allColors.push({ color: c, paletteName: p.name }));
    });

    if (allColors.length < 3) {
        alert("Please extract at least 3 colors into your digital pool first!");
        return;
    }

    const mode = challengeMode.value;
    challengeResult.classList.remove('hidden');
    challengeSwatches.innerHTML = ''; 

    const getRandomColors = (num) => {
        const shuffled = [...allColors].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(num, allColors.length));
    };

    let selectedColors = [];

    switch (mode) {
        case 'roulette':
            challengeTitle.innerText = "Palette Roulette";
            challengeText.innerText = "Here is your randomized 4-pan look!";
            selectedColors = getRandomColors(4);
            break;
        case 'haloEye':
            challengeTitle.innerText = "The Halo Eye";
            challengeText.innerHTML = `Use <b>Color 1</b> for the inner and outer corners.<br>Pop <b>Color 2</b> directly in the center of the lid.<br>Blend the edges seamlessly with <b>Color 3</b>.`;
            selectedColors = getRandomColors(3);
            break;
        case 'innerCorner':
            challengeTitle.innerText = "Inner Corner Pop";
            challengeText.innerHTML = `Create a soft base with <b>Colors 1 & 2</b>.<br>Pack <b>Color 3</b> intensely on the inner corner for a bright pop!`;
            selectedColors = getRandomColors(3);
            break;
        case 'oneAndDone':
            challengeTitle.innerText = "The One & Done";
            challengeText.innerText = "Keep it simple! Wash this single color all over the lid and buff it out for a beautiful monochromatic look.";
            selectedColors = getRandomColors(1);
            break;
        case 'panProject':
            challengeTitle.innerText = "The Pan Project";
            challengeText.innerText = "Time to hit pan! Create a full look focusing entirely on these shades.";
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
        case 'vibeCheck':
            const vibes = ["Grunge", "Ethereal", "Everyday Soft", "Night Out"];
            const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];
            challengeTitle.innerText = `Vibe Check: ${randomVibe}`;
            challengeText.innerText = `Create a ${randomVibe} look using these random selections as your anchor.`;
            selectedColors = getRandomColors(4);
            break;
    }

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
});

// PWA Service Worker & Install Logic
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
        if (outcome === 'accepted') {
            installBtn.classList.add('hidden');
        }
        deferredPrompt = null;
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}

