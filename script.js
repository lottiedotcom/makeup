const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const wrapper = document.getElementById('canvasWrapper');
const magnifier = document.getElementById('magnifier');
const magCtx = magnifier.getContext('2d');

const paletteNameInput = document.getElementById('paletteName');
const currentExtractionGrid = document.getElementById('currentExtractionGrid');
const savePaletteBtn = document.getElementById('savePaletteBtn');
const libraryDisplay = document.getElementById('libraryDisplay');
const clearLibraryBtn = document.getElementById('clearLibraryBtn');

const generateBtn = document.getElementById('generateBtn');
const challengeMode = document.getElementById('challengeMode');
const challengeResult = document.getElementById('challengeResult');
const challengeTitle = document.getElementById('challengeTitle');
const challengeText = document.getElementById('challengeText');
const challengeSwatches = document.getElementById('challengeSwatches');

let currentExtraction = []; // Colors being picked right now
let allPalettes = []; // Array of saved palette objects

// Handle Image Upload
imageLoader.addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        }
        img.src = event.target.result;
    }
    if(e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
});

// --- EYEDROPPER & MAGNIFIER LOGIC ---

let isDragging = false;
let lastPickedColor = null;

function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Coordinates for CSS positioning of magnifier
    const cssX = clientX - rect.left;
    const cssY = clientY - rect.top;

    // Coordinates mapped to actual canvas pixels
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = cssX * scaleX;
    const canvasY = cssY * scaleY;

    return { cssX, cssY, canvasX, canvasY };
}

function updateMagnifier(e) {
    const { cssX, cssY, canvasX, canvasY } = getCoordinates(e);

    // Position the magnifier slightly above the finger/cursor
    magnifier.style.left = `${cssX}px`;
    magnifier.style.top = `${cssY - 50}px`; 

    // Clear magnifier and draw zoomed portion
    magCtx.clearRect(0, 0, magnifier.width, magnifier.height);
    
    // We sample a 20x20 pixel area and draw it at 80x80 (4x zoom)
    magCtx.drawImage(
        canvas, 
        canvasX - 10, canvasY - 10, 20, 20, // Source area
        0, 0, magnifier.width, magnifier.height // Destination area
    );

    // Draw a small crosshair in the center of the magnifier
    magCtx.strokeStyle = 'white';
    magCtx.beginPath();
    magCtx.moveTo(40, 35); magCtx.lineTo(40, 45);
    magCtx.moveTo(35, 40); magCtx.lineTo(45, 40);
    magCtx.stroke();

    // Get exact pixel color
    const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
    lastPickedColor = rgbToHex(pixel[0], pixel[1], pixel[2]);
    
    // Give the magnifier a colored border matching the pixel
    magnifier.style.borderColor = lastPickedColor;
}

function startPicking(e) {
    isDragging = true;
    magnifier.style.display = 'block';
    updateMagnifier(e);
}

function stopPicking(e) {
    if (!isDragging) return;
    isDragging = false;
    magnifier.style.display = 'none';
    
    if (lastPickedColor) {
        currentExtraction.push(lastPickedColor);
        renderCurrentExtraction();
    }
}

// Mouse Events
canvas.addEventListener('mousedown', startPicking);
canvas.addEventListener('mousemove', (e) => { if (isDragging) updateMagnifier(e); });
window.addEventListener('mouseup', stopPicking);

// Touch Events (Mobile)
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startPicking(e); }, {passive: false});
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); updateMagnifier(e); }, {passive: false});
canvas.addEventListener('touchend', stopPicking);


// --- PALETTE MANAGEMENT ---

function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
}

function renderCurrentExtraction() {
    currentExtractionGrid.innerHTML = '';
    currentExtraction.forEach(color => {
        const swatch = document.createElement('div');
        swatch.classList.add('color-swatch');
        swatch.style.backgroundColor = color;
        currentExtractionGrid.appendChild(swatch);
    });
}

savePaletteBtn.addEventListener('click', () => {
    if (currentExtraction.length === 0) {
        alert("Pick some colors first!");
        return;
    }
    
    const pName = paletteNameInput.value.trim() || `Palette ${allPalettes.length + 1}`;
    
    allPalettes.push({
        name: pName,
        colors: [...currentExtraction]
    });
    
    // Reset for next palette
    currentExtraction = [];
    paletteNameInput.value = '';
    renderCurrentExtraction();
    renderLibrary();
});

function renderLibrary() {
    libraryDisplay.innerHTML = '';
    allPalettes.forEach(palette => {
        const group = document.createElement('div');
        group.classList.add('saved-palette-group');
        
        const title = document.createElement('h4');
        title.innerText = palette.name;
        group.appendChild(title);
        
        const grid = document.createElement('div');
        grid.classList.add('palette-grid');
        
        palette.colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.classList.add('color-swatch');
            swatch.style.backgroundColor = color;
            grid.appendChild(swatch);
        });
        
        group.appendChild(grid);
        libraryDisplay.appendChild(group);
    });
}

clearLibraryBtn.addEventListener('click', () => {
    if(confirm("Delete all saved palettes?")) {
        allPalettes = [];
        renderLibrary();
    }
});


// --- CHALLENGE GENERATOR ---

generateBtn.addEventListener('click', () => {
    // Flatten all colors from all palettes into one big array
    let allSavedColors = [];
    allPalettes.forEach(p => {
        allSavedColors = allSavedColors.concat(p.colors);
    });

    if (allSavedColors.length < 3) {
        alert("Save at least 3 colors to your library first!");
        return;
    }

    const mode = challengeMode.value;
    challengeResult.classList.remove('hidden');
    challengeSwatches.innerHTML = '';

    const getRandomColors = (num, sourceArray) => {
        const shuffled = [...sourceArray].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, num);
    };

    let selectedColors = [];

    switch (mode) {
        case 'roulette':
            challengeTitle.innerText = "Palette Roulette";
            challengeText.innerText = "Here is a randomized 4-pan look pulled from across your entire collection!";
            selectedColors = getRandomColors(4, allSavedColors);
            break;
            
        case 'colorClash':
            challengeTitle.innerText = "Color Theory Clash";
            challengeText.innerText = "Make it work! Create a cohesive look using these contrasting shades.";
            selectedColors = getRandomColors(2, allSavedColors);
            break;
            
        case 'placement':
            challengeTitle.innerText = "Placement Prompts";
            selectedColors = getRandomColors(3, allSavedColors);
            challengeText.innerHTML = `
                Use <b>Color 1</b> in the crease.<br>
                Pack <b>Color 2</b> all over the lid.<br>
                Smudge <b>Color 3</b> on the lower lash line.
            `;
            break;
            
        case 'vibeCheck':
            const vibes = ["Grunge", "Ethereal", "Everyday Soft", "Night Out", "Sunset", "Vampy"];
            const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];
            challengeTitle.innerText = `Vibe Check: ${randomVibe}`;
            challengeText.innerText = `Create a ${randomVibe} look using these random selections as your anchor.`;
            selectedColors = getRandomColors(4, allSavedColors);
            break;
    }

    selectedColors.forEach((color, index) => {
        const swatchWrap = document.createElement('div');
        swatchWrap.style.textAlign = 'center';
        
        const swatch = document.createElement('div');
        swatch.classList.add('color-swatch');
        swatch.style.backgroundColor = color;
        
        const label = document.createElement('small');
        label.innerText = mode === 'placement' ? `Color ${index + 1}` : '';
        
        swatchWrap.appendChild(swatch);
        swatchWrap.appendChild(label);
        challengeSwatches.appendChild(swatchWrap);
    });
});

