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

// Array of palette objects: { name: 'Palette 1', colors: ['#hex', '#hex'] }
let palettes = [];
let activePaletteIndex = -1;

// Handle Image Upload
imageLoader.addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Ask user for a palette name
            const defaultName = "Palette " + (palettes.length + 1);
            let paletteName = prompt("Name this palette (e.g., 'Neon Nights'):", defaultName);
            if (!paletteName) paletteName = defaultName;

            // Create new palette object and set as active
            palettes.push({
                name: paletteName,
                colors: []
            });
            activePaletteIndex = palettes.length - 1;

            // Show UI elements
            canvasWrapper.classList.remove('hidden');
            tapInstruction.style.display = 'block';
            clearPaletteBtn.classList.remove('hidden');
            document.querySelector('.file-upload-btn').innerText = "Upload Another Palette";
            
            updatePaletteDisplay();
        }
        img.src = event.target.result;
    }
    // Reset value so uploading the same file twice in a row still triggers 'change'
    if (e.target.files.length > 0) {
        reader.readAsDataURL(e.target.files[0]);
    }
    e.target.value = ''; 
});

// Eyedropper Zoom Logic
canvas.addEventListener('mousemove', (e) => {
    magContainer.style.display = 'block';
    magContainer.style.left = (e.clientX + 15) + 'px';
    magContainer.style.top = (e.clientY - 40) + 'px';

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    magCtx.imageSmoothingEnabled = false; 
    magCtx.clearRect(0, 0, magCanvas.width, magCanvas.height);
    magCtx.drawImage(
        canvas, 
        x - 10, y - 10, 20, 20, 
        0, 0, magCanvas.width, magCanvas.height
    );
});

canvas.addEventListener('mouseleave', () => magContainer.style.display = 'none');
window.addEventListener('scroll', () => magContainer.style.display = 'none');

// Tap to Pick Color
canvas.addEventListener('click', (e) => {
    if (activePaletteIndex === -1) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    
    palettes[activePaletteIndex].colors.push(hex);
    updatePaletteDisplay();
});

function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
}

// Render All Palettes in the Pool
function updatePaletteDisplay() {
    paletteDisplayContainer.innerHTML = '';
    
    palettes.forEach((palette) => {
        // Create container for this palette
        const groupDiv = document.createElement('div');
        groupDiv.classList.add('palette-group');
        
        // Palette Title
        const title = document.createElement('h4');
        title.innerText = palette.name;
        groupDiv.appendChild(title);

        // Grid for swatches
        const gridDiv = document.createElement('div');
        gridDiv.classList.add('palette-grid');

        palette.colors.forEach((color) => {
            const swatch = document.createElement('div');
            swatch.classList.add('color-swatch');
            swatch.style.backgroundColor = color;
            gridDiv.appendChild(swatch);
        });

        groupDiv.appendChild(gridDiv);
        paletteDisplayContainer.appendChild(groupDiv);
    });
}

// Clear Everything
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

// Challenge Generator
generateBtn.addEventListener('click', () => {
    // Flatten all colors into an array of objects: { color: '#hex', paletteName: 'Name' }
    let allColors = [];
    palettes.forEach(p => {
        p.colors.forEach(c => {
            allColors.push({ color: c, paletteName: p.name });
        });
    });

    if (allColors.length < 3) {
        alert("Please extract at least 3 colors into your digital pool first!");
        return;
    }

    const mode = challengeMode.value;
    challengeResult.classList.remove('hidden');
    challengeSwatches.innerHTML = ''; 

    // Helper to get random unique colors
    const getRandomColors = (num) => {
        const shuffled = [...allColors].sort(() => 0.5 - Math.random());
        // Ensure we only pick as many colors as exist in the pool
        return shuffled.slice(0, Math.min(num, allColors.length));
    };

    let selectedColors = [];

    switch (mode) {
        case 'roulette':
            challengeTitle.innerText = "Palette Roulette";
            challengeText.innerText = "Here is your randomized 4-pan look!";
            selectedColors = getRandomColors(4);
            break;
            
        case 'panProject':
            challengeTitle.innerText = "The Pan Project";
            challengeText.innerText = "Time to hit pan! Create a full look focusing entirely on these least-used shades.";
            selectedColors = getRandomColors(3);
            break;
            
        case 'colorClash':
            challengeTitle.innerText = "Color Theory Clash";
            challengeText.innerText = "Make it work! Create a cohesive look using these contrasting shades.";
            selectedColors = getRandomColors(2);
            break;
            
        case 'placement':
            challengeTitle.innerText = "Placement Prompts";
            selectedColors = getRandomColors(3);
            challengeText.innerHTML = `
                Use <b>Color 1</b> in the crease.<br>
                Pack <b>Color 2</b> all over the lid.<br>
                Smudge <b>Color 3</b> on the lower lash line.
            `;
            break;
            
        case 'vibeCheck':
            const vibes = ["Grunge", "Ethereal", "Everyday Soft", "Night Out"];
            const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];
            challengeTitle.innerText = `Vibe Check: ${randomVibe}`;
            challengeText.innerText = `Create a ${randomVibe} look using these random selections as your anchor.`;
            selectedColors = getRandomColors(4);
            break;
    }

    // Display generated colors with their parent palette name
    selectedColors.forEach((colorObj, index) => {
        const swatchWrap = document.createElement('div');
        swatchWrap.classList.add('swatch-wrapper');
        
        const swatch = document.createElement('div');
        swatch.classList.add('color-swatch');
        swatch.style.backgroundColor = colorObj.color;
        
        const label = document.createElement('small');
        if (mode === 'placement') {
            label.innerHTML = `<b>Color ${index + 1}</b><br>${colorObj.paletteName}`;
        } else {
            label.innerText = colorObj.paletteName;
        }
        
        swatchWrap.appendChild(swatch);
        swatchWrap.appendChild(label);
        challengeSwatches.appendChild(swatchWrap);
    });
});

// PWA Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}
