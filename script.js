const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const canvasWrapper = document.getElementById('canvasWrapper');
const tapInstruction = document.getElementById('tapInstruction');

const magContainer = document.getElementById('magnifier-container');
const magCanvas = document.getElementById('magnifier');
const magCtx = magCanvas.getContext('2d');

const paletteDisplay = document.getElementById('paletteDisplay');
const clearPaletteBtn = document.getElementById('clearPaletteBtn');
const generateBtn = document.getElementById('generateBtn');
const challengeMode = document.getElementById('challengeMode');
const challengeResult = document.getElementById('challengeResult');
const challengeTitle = document.getElementById('challengeTitle');
const challengeText = document.getElementById('challengeText');
const challengeSwatches = document.getElementById('challengeSwatches');

let savedColors = [];

// Handle Image Upload (Allows multiple uploads without clearing colors)
imageLoader.addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Show canvas and instructions
            canvasWrapper.classList.remove('hidden');
            tapInstruction.style.display = 'block';
            
            // Change button text after first upload
            document.querySelector('.file-upload-btn').innerText = "Upload Another Palette";
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
});

// Eyedropper Zoom Logic on Mouse Move
canvas.addEventListener('mousemove', (e) => {
    // Show and position the magnifier slightly offset from the cursor
    magContainer.style.display = 'block';
    magContainer.style.left = (e.clientX + 15) + 'px';
    magContainer.style.top = (e.clientY - 40) + 'px';

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Draw a zoomed-in portion of the main canvas onto the magnifier canvas
    magCtx.imageSmoothingEnabled = false; // Keep it pixelated for precise picking
    magCtx.clearRect(0, 0, magCanvas.width, magCanvas.height);
    
    // Zoom factor: grabbing a 20x20 square around the cursor and stretching it to 80x80
    magCtx.drawImage(
        canvas, 
        x - 10, y - 10, 20, 20, 
        0, 0, magCanvas.width, magCanvas.height
    );
});

// Hide magnifier when leaving canvas
canvas.addEventListener('mouseleave', () => {
    magContainer.style.display = 'none';
});
// Hide magnifier when scrolling so it doesn't float weirdly
window.addEventListener('scroll', () => {
    magContainer.style.display = 'none';
});

// Tap/Click to Pick Color (No limits)
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    
    savedColors.push(hex);
    updatePaletteDisplay();
});

// Convert RGB to Hex
function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
}

// Render Palette Swatches
function updatePaletteDisplay() {
    paletteDisplay.innerHTML = '';
    savedColors.forEach((color, index) => {
        const swatch = document.createElement('div');
        swatch.classList.add('color-swatch');
        swatch.style.backgroundColor = color;
        swatch.title = `Color ${index + 1}`;
        paletteDisplay.appendChild(swatch);
    });
}

// Clear Entire Pool
clearPaletteBtn.addEventListener('click', () => {
    savedColors = [];
    updatePaletteDisplay();
    challengeResult.classList.add('hidden');
});

// Challenge Generator Logic
generateBtn.addEventListener('click', () => {
    if (savedColors.length < 3) {
        alert("Please add at least 3 colors to your pool first!");
        return;
    }

    const mode = challengeMode.value;
    challengeResult.classList.remove('hidden');
    challengeSwatches.innerHTML = ''; 

    // Helper function to get N random colors from the massive pool
    const getRandomColors = (num) => {
        const shuffled = [...savedColors].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, num);
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

    // Display the generated colors
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

// PWA Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}

