let images = [];
let currentIndex = 0;
let isDragging = false;
let processingMode = 'quality'; // 'quality' or 'performance'
let processingWorker = null;
let updateTimeout = null;
let currentTaskId = 0;
let currentImage = null; // Добавляем переменную для текущего изображения

// DOM elements
const fileInput = document.getElementById('fileInput');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const imageCounter = document.getElementById('imageCounter');
const originalImage = document.getElementById('originalImage');
const enhancedImage = document.getElementById('enhancedImage');
const comparisonSlider = document.getElementById('comparisonSlider');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const mainContent = document.getElementById('mainContent');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const uploadSection = document.getElementById('uploadSection');
const aboutBtn = document.getElementById('aboutBtn');
const modal = document.getElementById('aboutModal');
const closeBtn = document.querySelector('.close');
const qualityDot = document.getElementById('qualityDot');
const qualityText = document.getElementById('qualityText');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const resetBtn = document.getElementById('resetBtn'); // Добавляем кнопку сброса

// Sliders
const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const saturationSlider = document.getElementById('saturation');
const sharpnessSlider = document.getElementById('sharpness');
const noiseReductionSlider = document.getElementById('noiseReduction');
const detailStrengthSlider = document.getElementById('detailStrength');
const claritySlider = document.getElementById('clarity');

// Values
const brightnessValue = document.getElementById('brightnessValue');
const contrastValue = document.getElementById('contrastValue');
const saturationValue = document.getElementById('saturationValue');
const sharpnessValue = document.getElementById('sharpnessValue');
const noiseReductionValue = document.getElementById('noiseReductionValue');
const detailStrengthValue = document.getElementById('detailStrengthValue');
const clarityValue = document.getElementById('clarityValue');

// File info
const fileName = document.getElementById('fileName');
const fileDimensions = document.getElementById('fileDimensions');
const fileSizeInfo = document.getElementById('fileSizeInfo');
const fileType = document.getElementById('fileType');

// Создаем элемент для отображения процесса AI обработки
const aiProcessing = document.createElement('div');
aiProcessing.id = 'aiProcessing';
aiProcessing.style.display = 'none';
aiProcessing.style.position = 'fixed';
aiProcessing.style.top = '50%';
aiProcessing.style.left = '50%';
aiProcessing.style.transform = 'translate(-50%, -50%)';
aiProcessing.style.background = 'rgba(0,0,0,0.7)';
aiProcessing.style.color = 'white';
aiProcessing.style.padding = '20px';
aiProcessing.style.borderRadius = '5px';
aiProcessing.style.zIndex = '1000';
aiProcessing.textContent = 'AI Processing...';
document.body.appendChild(aiProcessing);

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fileInput.addEventListener('change', handleFileSelect);
    prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
    nextBtn.addEventListener('click', () => showImage(currentIndex + 1));
    
    // Добавляем обработчик для кнопки сброса
    if (resetBtn) {
        resetBtn.addEventListener('click', resetToOriginal);
    }
    
    // Modal window
    aboutBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    // Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Deactivate all tabs
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            // Activate current tab
            tab.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Sliders with debouncing
    [brightnessSlider, contrastSlider, saturationSlider, sharpnessSlider, 
     noiseReductionSlider, detailStrengthSlider, claritySlider].forEach(slider => {
        slider.addEventListener('input', () => {
            updateValueDisplay();
            
            // Update settings immediately
            if (images.length) {
                images[currentIndex].settings = {
                    brightness: parseInt(brightnessSlider.value),
                    contrast: parseInt(contrastSlider.value),
                    saturation: parseInt(saturationSlider.value),
                    sharpness: parseFloat(sharpnessSlider.value),
                    noiseReduction: parseFloat(noiseReductionSlider.value),
                    detailStrength: parseFloat(detailStrengthSlider.value),
                    clarity: parseFloat(claritySlider.value)
                };
            }

            // Debounce the image update to prevent excessive processing
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                updateImage();
            }, 150);
        });
    });

    // Comparison slider
    comparisonSlider.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);

    // Fullscreen button
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Drag & Drop
    uploadSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadSection.style.borderColor = 'var(--accent-color)';
        uploadSection.style.backgroundColor = 'rgba(111, 66, 193, 0.05)';
    });

    uploadSection.addEventListener('dragleave', () => {
        uploadSection.style.borderColor = 'var(--light-border)';
        uploadSection.style.backgroundColor = '';
    });

    uploadSection.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadSection.style.borderColor = 'var(--light-border)';
        uploadSection.style.backgroundColor = '';
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect({ target: fileInput });
        }
    });

    // Добавляем обработчики для AI фильтров
    document.querySelectorAll('.ai-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filterType = e.target.getAttribute('data-filter');
            applyAIFilter(filterType);
        });
    });

    updateValueDisplay();
    setInitialClip();
    
    // Create Web Worker for image processing
    try {
        processingWorker = new Worker(URL.createObjectURL(new Blob([`
            let taskId = 0;
            
            self.addEventListener('message', function(e) {
                const data = e.data;
                if (data.type === 'process') {
                    taskId = data.taskId;
                    
                    // If this isn't the latest task, ignore it
                    if (taskId !== data.taskId) return;
                    
                    const imageData = new ImageData(
                        new Uint8ClampedArray(data.imageData.data),
                        data.imageData.width,
                        data.imageData.height
                    );
                    
                    const result = processImage(imageData, data.settings);
                    self.postMessage({
                        type: 'processed',
                        imageData: result,
                        taskId: taskId
                    }, [result.buffer]);
                }
            });
            
            function processImage(imageData, settings) {
                const data = imageData.data;
                const width = imageData.width;
                const height = imageData.height;
                
                // Create a copy of data for processing
                const output = new Uint8ClampedArray(data);
                
                // Apply improved noise reduction algorithm
                if (settings.noiseReduction > 0) {
                    applyAdvancedNoiseReduction(output, width, height, settings.noiseReduction);
                }
                
                // Apply basic adjustments
                for (let i = 0; i < output.length; i += 4) {
                    let r = output[i], g = output[i+1], b = output[i+2];
                    
                    // Brightness
                    r = Math.max(0, Math.min(255, r + settings.brightness));
                    g = Math.max(0, Math.min(255, g + settings.brightness));
                    b = Math.max(0, Math.min(255, b + settings.brightness));
                    
                    // Contrast
                    const cf = (settings.contrast - 100) / 100;
                    r = Math.max(0, Math.min(255, 128 + (r - 128) * (1 + cf)));
                    g = Math.max(0, Math.min(255, 128 + (g - 128) * (1 + cf)));
                    b = Math.max(0, Math.min(255, 128 + (b - 128) * (1 + cf)));
                    
                    // Saturation
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    const sf = (settings.saturation - 100) / 100;
                    r = Math.max(0, Math.min(255, gray + (r - gray) * (1 + sf)));
                    g = Math.max(0, Math.min(255, gray + (g - gray) * (1 + sf)));
                    b = Math.max(0, Math.min(255, gray + (b - gray) * (1 + sf)));
                    
                    output[i] = r;
                    output[i+1] = g;
                    output[i+2] = b;
                }
                
                // Apply improved sharpening
                if (settings.sharpness > 0) {
                    applyAdvancedSharpening(output, width, height, settings.sharpness);
                }
                
                // Apply detail enhancement
                if (settings.detailStrength > 0 || settings.clarity > 0) {
                    applyDetailEnhancement(output, width, height, settings.detailStrength, settings.clarity);
                }
                
                return output.buffer;
            }
            
            function applyAdvancedNoiseReduction(data, width, height, amount) {
                // Improved noise reduction algorithm based on bilateral filter
                const radius = Math.min(3, Math.floor(amount / 3));
                if (radius <= 0) return;
                
                const tempData = new Uint8ClampedArray(data);
                const spatialSigma = radius;
                const rangeSigma = amount * 5;
                
                for (let y = radius; y < height - radius; y++) {
                    for (let x = radius; x < width - radius; x++) {
                        for (let c = 0; c < 3; c++) {
                            const centerIdx = (y * width + x) * 4 + c;
                            const centerValue = tempData[centerIdx];
                            
                            let totalWeight = 0;
                            let sum = 0;
                            
                            for (let dy = -radius; dy <= radius; dy++) {
                                for (let dx = -radius; dx <= radius; dx++) {
                                    const idx = ((y + dy) * width + (x + dx)) * 4 + c;
                                    const value = tempData[idx];
                                    
                                    // Spatial weight (Gaussian distribution)
                                    const spatialDist = Math.sqrt(dx*dx + dy*dy);
                                    const spatialWeight = Math.exp(-0.5 * (spatialDist * spatialDist) / (spatialSigma * spatialSigma));
                                    
                                    // Value weight (Gaussian distribution)
                                    const valueDist = Math.abs(centerValue - value);
                                    const rangeWeight = Math.exp(-0.5 * (valueDist * valueDist) / (rangeSigma * rangeSigma));
                                    
                                    const weight = spatialWeight * rangeWeight;
                                    sum += value * weight;
                                    totalWeight += weight;
                                }
                            }
                            
                            data[centerIdx] = sum / totalWeight;
                        }
                    }
                }
            }
            
            function applyAdvancedSharpening(data, width, height, amount) {
                // Improved sharpening algorithm using unsharp mask
                const radius = 1;
                const strength = amount / 10;
                
                // Create a blurred copy
                const blurred = new Uint8ClampedArray(data);
                applyGaussianBlur(blurred, width, height, radius);
                
                // Apply unsharp masking
                for (let i = 0; i < data.length; i++) {
                    // Skip alpha channel
                    if ((i + 1) % 4 === 0) continue;
                    
                    const sharpened = data[i] + (data[i] - blurred[i]) * strength;
                    data[i] = Math.max(0, Math.min(255, sharpened));
                }
            }
            
            function applyDetailEnhancement(data, width, height, detailStrength, clarity) {
                // Enhanced detail extraction algorithm for fine details like hair
                const strength = detailStrength / 10;
                const clarityAmount = clarity / 20;
                
                // Create a copy for processing
                const tempData = new Uint8ClampedArray(data);
                
                // Apply bilateral filter to preserve edges while smoothing
                applyBilateralFilter(tempData, width, height, 2, 20);
                
                // Extract details by subtracting smoothed version
                for (let i = 0; i < data.length; i += 4) {
                    for (let c = 0; c < 3; c++) {
                        const idx = i + c;
                        const original = data[idx];
                        const smoothed = tempData[idx];
                        
                        // Calculate detail
                        const detail = original - smoothed;
                        
                        // Enhance details with adaptive strength
                        const enhancedDetail = detail * strength * (1 + clarityAmount);
                        
                        // Apply enhanced details back to the image
                        const result = original + enhancedDetail;
                        data[idx] = Math.max(0, Math.min(255, result));
                    }
                }
                
                // Apply local contrast enhancement for clarity
                if (clarity > 0) {
                    applyLocalContrastEnhancement(data, width, height, clarityAmount);
                }
            }
            
            function applyBilateralFilter(data, width, height, spatialSigma, rangeSigma) {
                const radius = Math.floor(spatialSigma * 1.5);
                const tempData = new Uint8ClampedArray(data);
                
                for (let y = radius; y < height - radius; y++) {
                    for (let x = radius; x < width - radius; x++) {
                        for (let c = 0; c < 3; c++) {
                            const centerIdx = (y * width + x) * 4 + c;
                            const centerValue = tempData[centerIdx];
                            
                            let totalWeight = 0;
                            let sum = 0;
                            
                            for (let dy = -radius; dy <= radius; dy++) {
                                for (let dx = -radius; dx <= radius; dx++) {
                                    const idx = ((y + dy) * width + (x + dx)) * 4 + c;
                                    const value = tempData[idx];
                                    
                                    // Spatial weight
                                    const spatialDist = Math.sqrt(dx*dx + dy*dy);
                                    const spatialWeight = Math.exp(-0.5 * (spatialDist * spatialDist) / (spatialSigma * spatialSigma));
                                    
                                    // Range weight
                                    const valueDist = Math.abs(centerValue - value);
                                    const rangeWeight = Math.exp(-0.5 * (valueDist * valueDist) / (rangeSigma * rangeSigma));
                                    
                                    const weight = spatialWeight * rangeWeight;
                                    sum += value * weight;
                                    totalWeight += weight;
                                }
                            }
                            
                            data[centerIdx] = sum / totalWeight;
                        }
                    }
                }
            }
            
            function applyLocalContrastEnhancement(data, width, height, amount) {
                // Apply local contrast enhancement using unsharp mask with larger radius
                const radius = 20;
                const tempData = new Uint8ClampedArray(data);
                applyGaussianBlur(tempData, width, height, radius);
                
                for (let i = 0; i < data.length; i += 4) {
                    for (let c = 0; c < 3; c++) {
                        const idx = i + c;
                        const original = data[idx];
                        const blurred = tempData[idx];
                        
                        // Enhance mid-tone contrast
                        const enhanced = original + (original - blurred) * amount;
                        data[idx] = Math.max(0, Math.min(255, enhanced));
                    }
                }
            }
            
            function applyGaussianBlur(data, width, height, radius) {
                // Gaussian blur implementation
                const weights = getGaussianWeights(radius);
                const tempData = new Uint8ClampedArray(data);
                
                // Horizontal pass
                for (let y = 0; y < height; y++) {
                    for (let x = radius; x < width - radius; x++) {
                        for (let c = 0; c < 3; c++) {
                            let sum = 0;
                            let totalWeight = 0;
                            
                            for (let dx = -radius; dx <= radius; dx++) {
                                const idx = (y * width + (x + dx)) * 4 + c;
                                const value = tempData[idx];
                                const weight = weights[dx + radius];
                                sum += value * weight;
                                totalWeight += weight;
                            }
                            
                            const idx = (y * width + x) * 4 + c;
                            data[idx] = sum / totalWeight;
                        }
                    }
                }
                
                // Vertical pass
                const tempData2 = new Uint8ClampedArray(data);
                for (let y = radius; y < height - radius; y++) {
                    for (let x = 0; x < width; x++) {
                        for (let c = 0; c < 3; c++) {
                            let sum = 0;
                            let totalWeight = 0;
                            
                            for (let dy = -radius; dy <= radius; dy++) {
                                const idx = ((y + dy) * width + x) * 4 + c;
                                const value = tempData2[idx];
                                const weight = weights[dy + radius];
                                sum += value * weight;
                                totalWeight += weight;
                            }
                            
                            const idx = (y * width + x) * 4 + c;
                            data[idx] = sum / totalWeight;
                        }
                    }
                }
            }
            
            function getGaussianWeights(radius) {
                const sigma = radius / 2;
                const weights = [];
                let total = 0;
                
                for (let i = -radius; i <= radius; i++) {
                    const weight = Math.exp(-0.5 * (i * i) / (sigma * sigma));
                    weights.push(weight);
                    total += weight;
                }
                
                // Normalize weights
                return weights.map(w => w / total);
            }
        `], { type: 'application/javascript' })));
        
        processingWorker.onmessage = function(e) {
            // Only process if this is the latest task
            if (e.data.taskId === currentTaskId) {
                if (e.data.type === 'processed') {
                    const imageData = new Uint8ClampedArray(e.data.imageData);
                    const imageObj = images[currentIndex];
                    imageObj.ctx.putImageData(new ImageData(imageData, imageObj.canvas.width, imageObj.canvas.height), 0, 0);
                    enhancedImage.src = imageObj.canvas.toDataURL();
                }
            }
        };
    } catch (e) {
        console.warn('Web Workers not supported, falling back to main thread processing');
    }
});

// Set initial comparison mask (50/50)
function setInitialClip() {
    comparisonSlider.style.left = "50%";
    originalImage.style.clipPath = "inset(0 50% 0 0)";
    enhancedImage.style.clipPath = "inset(0 0 0 50%)";
}

function toggleProcessingOption(mode) {
    processingMode = mode;
    document.getElementById('optionQuality').classList.toggle('active', mode === 'quality');
    document.getElementById('optionPerformance').classList.toggle('active', mode === 'performance');
    updateImage();
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const validFiles = files.filter(file =>
        file.type.match('image/jpeg|image/png|image/gif|image/webp|image/bmp')
    );

    if (validFiles.length === 0) {
        alert('Only JPG, PNG, GIF, WebP, BMP are supported');
        return;
    }

    // Check for very large images
    const largeFiles = validFiles.filter(file => file.size > 10 * 1024 * 1024); // >10MB
    if (largeFiles.length > 0) {
        if (!confirm(`Some images are very large (${largeFiles.length} files over 10MB). Processing may take a long time. Continue?`)) {
            return;
        }
    }

    images = [];
    let processed = 0;
    const total = validFiles.length;

    // Show progress bar
    progressBar.style.display = 'block';
    progress.style.width = '0%';

    validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Size limitation for very large images
                let width = img.naturalWidth;
                let height = img.naturalHeight;
                
                if (width * height > 5000000) { // >5MP
                    const ratio = Math.sqrt(5000000 / (width * height));
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }
                
                const imageObj = {
                    file,
                    settings: { 
                        brightness: 0, 
                        contrast: 100, 
                        saturation: 100, 
                        sharpness: 0,
                        noiseReduction: 0,
                        detailStrength: 0,
                        clarity: 0
                    },
                    originalImage: img,
                    originalImageData: null,
                    canvas: null,
                    ctx: null,
                    quality: 'good'
                };
                prepareImageCanvas(imageObj, width, height);
                images.push(imageObj);
                processed++;
                progress.style.width = `${(processed/total)*100}%`;
                
                if (processed === total) {
                    setTimeout(() => {
                        progressBar.style.display = 'none';
                        currentIndex = 0;
                        showImage(currentIndex);
                        mainContent.style.display = 'grid';
                        updateNavigation();
                    }, 500);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function prepareImageCanvas(imageObj, width, height) {
    const img = imageObj.originalImage;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Draw image with new dimensions
    ctx.drawImage(img, 0, 0, width, height);
    imageObj.originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    imageObj.canvas = canvas;
    imageObj.ctx = ctx;
    
    // Analyze image quality
    analyzeImageQuality(imageObj);
}

function analyzeImageQuality(imageObj) {
    const imageData = imageObj.originalImageData;
    const data = imageData.data;
    let totalLuminance = 0;
    let minLuminance = 255;
    let maxLuminance = 0;
    
    // Analyze brightness and contrast
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        totalLuminance += luminance;
        minLuminance = Math.min(minLuminance, luminance);
        maxLuminance = Math.max(maxLuminance, luminance);
    }
    
    const avgLuminance = totalLuminance / (data.length / 4);
    const contrast = maxLuminance - minLuminance;
    
    // Determine image quality
    if (contrast < 100 || avgLuminance < 50 || avgLuminance > 200) {
        imageObj.quality = 'low';
    } else if (contrast < 150 || avgLuminance < 80 || avgLuminance > 180) {
        imageObj.quality = 'medium';
    } else {
        imageObj.quality = 'good';
    }
    
    updateQualityIndicator(imageObj.quality);
}

function updateQualityIndicator(quality) {
    qualityDot.className = 'quality-dot ' + quality;
    qualityText.textContent = quality.charAt(0).toUpperCase() + quality.slice(1);
}

function showImage(index) {
    if (index < 0 || index >= images.length) return;
    currentIndex = index;
    const imageObj = images[index];

    brightnessSlider.value = imageObj.settings.brightness;
    contrastSlider.value = imageObj.settings.contrast;
    saturationSlider.value = imageObj.settings.saturation;
    sharpnessSlider.value = imageObj.settings.sharpness;
    noiseReductionSlider.value = imageObj.settings.noiseReduction;
    detailStrengthSlider.value = imageObj.settings.detailStrength;
    claritySlider.value = imageObj.settings.clarity;

    updateValueDisplay();
    originalImage.src = imageObj.originalImage.src;
    applySettingsToImage(imageObj);
    updateHistogram();
    updateQualityIndicator(imageObj.quality);

    imageCounter.textContent = `${index + 1} / ${images.length}`;
    fileName.textContent = imageObj.file.name;
    fileDimensions.textContent = `${imageObj.canvas.width} × ${imageObj.canvas.height}`;
    fileSizeInfo.textContent = formatFileSize(imageObj.file.size);
    fileType.textContent = imageObj.file.type.split('/')[1].toUpperCase();

    updateNavigation();
    setInitialClip();
}

function applySettingsToImage(imageObj) {
    // Increment task ID to cancel previous tasks
    currentTaskId++;
    const thisTaskId = currentTaskId;
    
    // If Web Worker is available, use it for processing
    if (processingWorker && processingMode === 'performance') {
        const imageData = imageObj.originalImageData;
        processingWorker.postMessage({
            type: 'process',
            imageData: {
                data: Array.from(imageData.data),
                width: imageData.width,
                height: imageData.height
            },
            settings: imageObj.settings,
            taskId: thisTaskId
        });
    } else {
        // Processing in the main thread with requestAnimationFrame to prevent blocking
        setTimeout(() => {
            if (thisTaskId !== currentTaskId) return; // Skip if outdated task
            
            const { brightness, contrast, saturation, sharpness, noiseReduction, detailStrength, clarity } = imageObj.settings;
            const ctx = imageObj.ctx;
            ctx.putImageData(imageObj.originalImageData, 0, 0); // always start from original

            let imageData = ctx.getImageData(0, 0, imageObj.canvas.width, imageObj.canvas.height);
            let data = imageData.data;

            // Apply improved noise reduction
            if (noiseReduction > 0) {
                applyAdvancedNoiseReduction(data, imageObj.canvas.width, imageObj.canvas.height, noiseReduction);
                ctx.putImageData(imageData, 0, 0);
                imageData = ctx.getImageData(0, 0, imageObj.canvas.width, imageObj.canvas.height);
                data = imageData.data;
            }

            // Apply basic adjustments
            for (let i = 0; i < data.length; i += 4) {
                let r = data[i], g = data[i+1], b = data[i+2];

                // Apply brightness
                r += brightness; g += brightness; b += brightness;
                
                // Apply contrast
                const cf = (contrast - 100) / 100;
                r = 128 + (r - 128) * (1 + cf);
                g = 128 + (g - 128) * (1 + cf);
                b = 128 + (b - 128) * (1 + cf);

                // Apply saturation
                const gray = 0.299*r + 0.587*g + 0.114*b;
                const sf = (saturation - 100) / 100;
                r = gray + (r - gray) * (1 + sf);
                g = gray + (g - gray) * (1 + sf);
                b = gray + (b - gray) * (1 + sf);

                // Clamp values
                data[i]   = Math.max(0, Math.min(255, r));
                data[i+1] = Math.max(0, Math.min(255, g));
                data[i+2] = Math.max(0, Math.min(255, b));
            }
            ctx.putImageData(imageData, 0, 0);

            // Apply sharpening if needed
            if (sharpness > 0) {
                applyAdvancedSharpening(imageObj, sharpness);
            }

            // Apply detail enhancement if needed
            if (detailStrength > 0 || clarity > 0) {
                applyDetailEnhancement(imageObj, detailStrength, clarity);
            }

            if (thisTaskId === currentTaskId) {
                enhancedImage.src = imageObj.canvas.toDataURL();
            }
        }, 0);
    }
}

function applyAdvancedNoiseReduction(data, width, height, amount) {
    // Improved noise reduction algorithm based on bilateral filter
    const radius = Math.min(3, Math.floor(amount / 3));
    if (radius <= 0) return;
    
    const tempData = new Uint8ClampedArray(data);
    const spatialSigma = radius;
    const rangeSigma = amount * 5;
    
    // Process every second pixel for better performance
    for (let y = radius; y < height - radius; y += 2) {
        for (let x = radius; x < width - radius; x += 2) {
            for (let c = 0; c < 3; c++) {
                const centerIdx = (y * width + x) * 4 + c;
                const centerValue = tempData[centerIdx];
                
                let totalWeight = 0;
                let sum = 0;
                
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const idx = ((y + dy) * width + (x + dx)) * 4 + c;
                        const value = tempData[idx];
                        
                        // Spatial weight (Gaussian distribution)
                        const spatialDist = Math.sqrt(dx*dx + dy*dy);
                        const spatialWeight = Math.exp(-0.5 * (spatialDist * spatialDist) / (spatialSigma * spatialSigma));
                        
                        // Value weight (Gaussian distribution)
                        const valueDist = Math.abs(centerValue - value);
                        const rangeWeight = Math.exp(-0.5 * (valueDist * valueDist) / (rangeSigma * rangeSigma));
                        
                        const weight = spatialWeight * rangeWeight;
                        sum += value * weight;
                        totalWeight += weight;
                    }
                }
                
                data[centerIdx] = sum / totalWeight;
                
                // Interpolate missed pixels
                if (x + 1 < width - radius) {
                    data[centerIdx + 4] = sum / totalWeight;
                }
                if (y + 1 < height - radius) {
                    data[centerIdx + width * 4] = sum / totalWeight;
                }
                if (x + 1 < width - radius && y + 1 < height - radius) {
                    data[centerIdx + width * 4 + 4] = sum / totalWeight;
                }
            }
        }
    }
}

function applyAdvancedSharpening(imageObj, amount) {
    const ctx = imageObj.ctx;
    const { width, height } = imageObj.canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Create a blurred copy using Gaussian blur
    const blurredData = new Uint8ClampedArray(data);
    applyGaussianBlur(blurredData, width, height, 1);
    
    // Apply unsharp masking
    const strength = amount / 10;
    for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
            const idx = i + c;
            const original = data[idx];
            const blurred = blurredData[idx];
            // Unsharp mask formula: original + (original - blurred) * amount
            const sharpened = original + (original - blurred) * strength;
            data[idx] = Math.max(0, Math.min(255, sharpened));
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function applyDetailEnhancement(imageObj, detailStrength, clarity) {
    const ctx = imageObj.ctx;
    const { width, height } = imageObj.canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Create a copy for processing
    const tempData = new Uint8ClampedArray(data);
    
    // Apply bilateral filter to preserve edges while smoothing
    applyBilateralFilter(tempData, width, height, 2, 20);
    
    // Extract details by subtracting smoothed version
    const strength = detailStrength / 10;
    const clarityAmount = clarity / 20;
    
    for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
            const idx = i + c;
            const original = data[idx];
            const smoothed = tempData[idx];
            
            // Calculate detail
            const detail = original - smoothed;
            
            // Enhance details with adaptive strength
            const enhancedDetail = detail * strength * (1 + clarityAmount);
            
            // Apply enhanced details back to the image
            const result = original + enhancedDetail;
            data[idx] = Math.max(0, Math.min(255, result));
        }
    }
    
    // Apply local contrast enhancement for clarity
    if (clarity > 0) {
        applyLocalContrastEnhancement(data, width, height, clarityAmount);
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function applyBilateralFilter(data, width, height, spatialSigma, rangeSigma) {
    const radius = Math.floor(spatialSigma * 1.5);
    const tempData = new Uint8ClampedArray(data);
    
    // Process every second pixel for performance
    for (let y = radius; y < height - radius; y += 2) {
        for (let x = radius; x < width - radius; x += 2) {
            for (let c = 0; c < 3; c++) {
                const centerIdx = (y * width + x) * 4 + c;
                const centerValue = tempData[centerIdx];
                
                let totalWeight = 0;
                let sum = 0;
                
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const idx = ((y + dy) * width + (x + dx)) * 4 + c;
                        const value = tempData[idx];
                        
                        // Spatial weight
                        const spatialDist = Math.sqrt(dx*dx + dy*dy);
                        const spatialWeight = Math.exp(-0.5 * (spatialDist * spatialDist) / (spatialSigma * spatialSigma));
                        
                        // Range weight
                        const valueDist = Math.abs(centerValue - value);
                        const rangeWeight = Math.exp(-0.5 * (valueDist * valueDist) / (rangeSigma * rangeSigma));
                        
                        const weight = spatialWeight * rangeWeight;
                        sum += value * weight;
                        totalWeight += weight;
                    }
                }
                
                data[centerIdx] = sum / totalWeight;
                
                // Interpolate missed pixels
                if (x + 1 < width - radius) {
                    data[centerIdx + 4] = sum / totalWeight;
                }
                if (y + 1 < height - radius) {
                    data[centerIdx + width * 4] = sum / totalWeight;
                }
                if (x + 1 < width - radius && y + 1 < height - radius) {
                    data[centerIdx + width * 4 + 4] = sum / totalWeight;
                }
            }
        }
    }
}

function applyLocalContrastEnhancement(data, width, height, amount) {
    // Apply local contrast enhancement using unsharp mask with larger radius
    const radius = 20;
    const tempData = new Uint8ClampedArray(data);
    applyGaussianBlur(tempData, width, height, radius);
    
    for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
            const idx = i + c;
            const original = data[idx];
            const blurred = tempData[idx];
            
            // Enhance mid-tone contrast
            const enhanced = original + (original - blurred) * amount;
            data[idx] = Math.max(0, Math.min(255, enhanced));
        }
    }
}

function applyGaussianBlur(data, width, height, radius) {
    // Gaussian blur
    const weights = getGaussianWeights(radius);
    const tempData = new Uint8ClampedArray(data);
    
    // Horizontal pass
    for (let y = 0; y < height; y++) {
        for (let x = radius; x < width - radius; x++) {
            for (let c = 0; c < 3; c++) {
                let sum = 0;
                let totalWeight = 0;
                
                for (let dx = -radius; dx <= radius; dx++) {
                    const idx = (y * width + (x + dx)) * 4 + c;
                    const weight = weights[dx + radius];
                    sum += tempData[idx] * weight;
                    totalWeight += weight;
                }
                
                const idx = (y * width + x) * 4 + c;
                data[idx] = sum / totalWeight;
            }
        }
    }
    
    // Vertical pass
    const tempData2 = new Uint8ClampedArray(data);
    for (let y = radius; y < height - radius; y++) {
        for (let x = 0; x < width; x++) {
            for (let c = 0; c < 3; c++) {
                let sum = 0;
                let totalWeight = 0;
                
                for (let dy = -radius; dy <= radius; dy++) {
                    const idx = ((y + dy) * width + x) * 4 + c;
                    const weight = weights[dy + radius];
                    sum += tempData2[idx] * weight;
                    totalWeight += weight;
                }
                
                const idx = (y * width + x) * 4 + c;
                data[idx] = sum / totalWeight;
            }
        }
    }
}

function getGaussianWeights(radius) {
    const sigma = radius / 2;
    const weights = [];
    let total = 0;
    
    for (let i = -radius; i <= radius; i++) {
    const weight = Math.exp(-0.5 * (i * i) / (sigma * sigma));
    weights.push(weight);
    total += weight;
    }
    
    // Normalize weights
    return weights.map(w => w / total);
}

function updateImage() {
    if (!images.length) return;
    applySettingsToImage(images[currentIndex]);
    updateSliderTrack();
    updateHistogram();
}

function updateValueDisplay() {
    brightnessValue.textContent = brightnessSlider.value;
    contrastValue.textContent = contrastSlider.value;
    saturationValue.textContent = saturationSlider.value;
    sharpnessValue.textContent = sharpnessSlider.value;
    noiseReductionValue.textContent = noiseReductionSlider.value;
    detailStrengthValue.textContent = detailStrengthSlider.value;
    clarityValue.textContent = claritySlider.value;
    updateSliderTrack();
}

function updateSliderTrack() {
    document.getElementById('brightnessTrack').style.width = `${(parseInt(brightnessSlider.value)+50)/100*100}%`;
    document.getElementById('contrastTrack').style.width = `${(parseInt(contrastSlider.value)-50)/150*100}%`;
    document.getElementById('saturationTrack').style.width = `${parseInt(saturationSlider.value)/200*100}%`;
    document.getElementById('sharpnessTrack').style.width = `${parseFloat(sharpnessSlider.value)/10*100}%`;
    document.getElementById('noiseReductionTrack').style.width = `${parseFloat(noiseReductionSlider.value)/10*100}%`;
    document.getElementById('detailStrengthTrack').style.width = `${parseFloat(detailStrengthSlider.value)/10*100}%`;
    document.getElementById('clarityTrack').style.width = `${parseFloat(claritySlider.value)/10*100}%`;
}

function startDrag() { isDragging = true; document.body.style.cursor = 'ew-resize'; }
function drag(e) {
    if (!isDragging) return;
    const rect = document.querySelector('.comparison-container').getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x/rect.width)*100));
    comparisonSlider.style.left = `${pos}%`;
    originalImage.style.clipPath = `inset(0 ${100-pos}% 0 0)`;
    enhancedImage.style.clipPath = `inset(0 0 0 ${pos}%)`;
}
function stopDrag() { isDragging = false; document.body.style.cursor = ''; }

function toggleFullscreen() {
    const container = document.querySelector('.comparison-container');
    if (!document.fullscreenElement) container.requestFullscreen();
    else document.exitFullscreen();
}

function updateNavigation() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === images.length-1;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
    else return (bytes/1048576).toFixed(1) + ' MB';
}

function downloadImage() {
    if (!images.length) return;
    const imageObj = images[currentIndex];
    const link = document.createElement('a');
    link.download = `enhanced_${imageObj.file.name}`;
    link.href = enhancedImage.src;
    link.click();
}

async function downloadAll() {
    if (!images.length) return;
    
    // Show progress bar
    progressBar.style.display = 'block';
    progress.style.width = '0%';
    
    const zip = new JSZip();
    const promises = [];
    
    images.forEach((img, index) => {
        const promise = new Promise((resolve) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = img.canvas.toDataURL('image/jpeg', 0.9);
                link.download = `enhanced_${index + 1}.jpg`;
                
                fetch(link.href)
                    .then(res => res.blob())
                    .then(blob => {
                        zip.file(link.download, blob);
                        progress.style.width = `${((index + 1) / images.length) * 100}%`;
                        resolve();
                    });
            }, index * 100); // Stagger processing to prevent UI freeze
        });
        promises.push(promise);
    });
    
    await Promise.all(promises);
    
    zip.generateAsync({ type: 'blob' })
        .then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'enhanced_images.zip';
            link.click();
            progressBar.style.display = 'none';
        });
}

function shareImage() {
    if (!images.length) return;
    if (navigator.share) {
        const imageObj = images[currentIndex];
        const blob = dataURLToBlob(enhancedImage.src);
        const file = new File([blob], `enhanced_${imageObj.file.name}`, { type: blob.type });
        
        navigator.share({
            title: 'Enhanced Image',
            files: [file]
        }).catch(error => {
            console.error('Sharing failed', error);
        });
    } else {
        alert("Sharing is not supported in your browser");
    }
}

function dataURLToBlob(dataURL) {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    
    for (let i = 0; i < raw.length; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
}

function applyPreset(presetName) {
    if (!images.length) return;
    
    const imageObj = images[currentIndex];
    let settings = { 
        brightness: 0, 
        contrast: 100, 
        saturation: 100, 
        sharpness: 0, 
        noiseReduction: 0,
        detailStrength: 0,
        clarity: 0
    };

    switch(presetName) {
        case 'auto':
            settings = analyzeAndGetOptimalSettings(imageObj);
            break;
        case 'details':
            settings = { brightness: 5, contrast: 110, saturation: 105, sharpness: 2, noiseReduction: 1, detailStrength: 7, clarity: 5 };
            break;
        case 'portrait':
            settings = { brightness: 5, contrast: 105, saturation: 90, sharpness: 1, noiseReduction: 2, detailStrength: 3, clarity: 2 };
            break;
        case 'landscape':
            settings = { brightness: 15, contrast: 120, saturation: 130, sharpness: 3, noiseReduction: 1, detailStrength: 4, clarity: 4 };
            break;
        case 'vintage':
            settings = { brightness: -10, contrast: 90, saturation: 85, sharpness: 0, noiseReduction: 3, detailStrength: 2, clarity: 1 };
            break;
        case 'bw':
            settings = { brightness: 0, contrast: 110, saturation: 0, sharpness: 1, noiseReduction: 1, detailStrength: 4, clarity: 3 };
            break;
        case 'clear':
            settings = { brightness: 5, contrast: 115, saturation: 105, sharpness: 4, noiseReduction: 2, detailStrength: 5, clarity: 4 };
            break;
        case 'hdr':
            settings = { brightness: 10, contrast: 130, saturation: 120, sharpness: 3, noiseReduction: 2, detailStrength: 6, clarity: 5 };
            break;
    }

    brightnessSlider.value = settings.brightness;
    contrastSlider.value = settings.contrast;
    saturationSlider.value = settings.saturation;
    sharpnessSlider.value = settings.sharpness;
    noiseReductionSlider.value = settings.noiseReduction;
    detailStrengthSlider.value = settings.detailStrength;
    claritySlider.value = settings.clarity;
    imageObj.settings = settings;
    updateValueDisplay();
    updateImage();
}

function analyzeAndGetOptimalSettings(imageObj) {
    const imageData = imageObj.originalImageData;
    const data = imageData.data;
    let totalLuminance = 0;
    let minLuminance = 255;
    let maxLuminance = 0;
    let rSum = 0, gSum = 0, bSum = 0;
    
    // Analyze the image
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        totalLuminance += luminance;
        minLuminance = Math.min(minLuminance, luminance);
        maxLuminance = Math.max(maxLuminance, luminance);
        rSum += r;
        gSum += g;
        bSum += b;
    }
    
    const avgLuminance = totalLuminance / (data.length / 4);
    const contrast = maxLuminance - minLuminance;
    const avgR = rSum / (data.length / 4);
    const avgG = gSum / (data.length / 4);
    const avgB = bSum / (data.length / 4);
    
    // Determine optimal settings based on analysis
    let brightness = 0;
    let contrastValue = 100;
    let saturation = 100;
    let sharpness = 0;
    let noiseReduction = 0;
    let detailStrength = 0;
    let clarity = 0;
    
    // Adjust brightness
    if (avgLuminance < 80) brightness = 10;
    else if (avgLuminance > 180) brightness = -10;
    
    // Adjust contrast
    if (contrast < 100) contrastValue = 120;
    else if (contrast > 150) contrastValue = 90;
    
    // Adjust saturation
    const colorBalance = Math.max(avgR, avgG, avgB) - Math.min(avgR, avgG, avgB);
    if (colorBalance < 30) saturation = 120;
    
    // Add some sharpness
    sharpness = 1.5;
    
    // Add noise reduction for dark images
    if (avgLuminance < 100) noiseReduction = 1;
    
    // Add detail enhancement for images with potential fine details
    if (contrast > 100) {
        detailStrength = 3;
        clarity = 2;
    }
    
    return { brightness, contrast: contrastValue, saturation, sharpness, noiseReduction, detailStrength, clarity };
}

function analyzeAndAutoEnhance() {
    if (!images.length) return;
    const imageObj = images[currentIndex];
    const settings = analyzeAndGetOptimalSettings(imageObj);
    
    brightnessSlider.value = settings.brightness;
    contrastSlider.value = settings.contrast;
    saturationSlider.value = settings.saturation;
    sharpnessSlider.value = settings.sharpness;
    noiseReductionSlider.value = settings.noiseReduction;
    detailStrengthSlider.value = settings.detailStrength;
    claritySlider.value = settings.clarity;
    imageObj.settings = settings;
    updateValueDisplay();
    updateImage();
}

function resetSettings() {
    if (!images.length) return;
    
    const imageObj = images[currentIndex];
    brightnessSlider.value = 0;
    contrastSlider.value = 100;
    saturationSlider.value = 100;
    sharpnessSlider.value = 0;
    noiseReductionSlider.value = 0;
    detailStrengthSlider.value = 0;
    claritySlider.value = 0;
    imageObj.settings = { 
        brightness: 0, 
        contrast: 100, 
        saturation: 100, 
        sharpness: 0, 
        noiseReduction: 0,
        detailStrength: 0,
        clarity: 0
    };
    updateValueDisplay();
    updateImage();
}

function resetToOriginal() {
    if (!images.length) return;
    
    const imageObj = images[currentIndex];
    
    // Reset slider values
    brightnessSlider.value = 0;
    contrastSlider.value = 100;
    saturationSlider.value = 100;
    sharpnessSlider.value = 0;
    noiseReductionSlider.value = 0;
    detailStrengthSlider.value = 0;
    claritySlider.value = 0;
    imageObj.settings = { 
        brightness: 0, 
        contrast: 100, 
        saturation: 100, 
        sharpness: 0, 
        noiseReduction: 0,
        detailStrength: 0,
        clarity: 0
    };
    updateValueDisplay();
    
    // Restore original image
    enhancedImage.src = imageObj.originalImage.src;
    
    // Update canvas with original image data
    imageObj.ctx.putImageData(imageObj.originalImageData, 0, 0);
    
    updateHistogram();
}

function updateHistogram() {
    if (!images.length) return;
    
    const histogramEl = document.getElementById('brightnessHistogram');
    histogramEl.innerHTML = '';
    
    const imageObj = images[currentIndex];
    const ctx = imageObj.ctx;
    const imageData = ctx.getImageData(0, 0, imageObj.canvas.width, imageObj.canvas.height);
    const data = imageData.data;
    
    const histogram = new Array(256).fill(0);
    
    // For performance, analyze only every 4th pixel
    for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
        histogram[brightness]++;
    }
    
    const max = Math.max(...histogram);
    
    for (let i = 0; i < 256; i++) {
        if (histogram[i] > 0) {
            const bar = document.createElement('div');
            bar.className = 'histogram-bar';
            bar.style.left = `${(i / 256) * 100}%`;
            bar.style.height = `${(histogram[i] / max) * 100}%`;
            histogramEl.appendChild(bar);
        }
    }
}

// Функции AI фильтров
function applyAIFilter(filterType) {
    if (!images.length || currentIndex === -1) {
        showToast('Please upload an image first.');
        return;
    }
    
    const imageObj = images[currentIndex];
    currentImage = enhancedImage; // Используем enhancedImage как текущее изображение
    
    // Show processing indicator
    aiProcessing.style.display = 'block';
    
    // Simulate AI processing
    setTimeout(() => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions
        canvas.width = currentImage.naturalWidth;
        canvas.height = currentImage.naturalHeight;
        
        // Draw current image on canvas
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
        
        // Apply different effects based on filter type
        switch(filterType) {
            case 'upscale':
                applyUpscaleEffect(ctx);
                break;
            case 'denoise':
                applyDenoiseEffect(ctx);
                break;
            case 'face_enhance':
                applyFaceEnhanceEffect(ctx);
                break;
            case 'background_remove':
                applyBackgroundRemoveEffect(ctx);
                break;
            case 'style':
                const styleSelect = document.getElementById('styleSelect');
                applyStyleEffect(ctx, styleSelect.value);
                break;
        }
        
        // Update enhanced image with processed result
        enhancedImage.src = canvas.toDataURL();
        
        // Update image object with processed data
        imageObj.ctx.clearRect(0, 0, imageObj.canvas.width, imageObj.canvas.height);
        imageObj.ctx.drawImage(canvas, 0, 0, imageObj.canvas.width, imageObj.canvas.height);
        
        // Hide processing indicator
        aiProcessing.style.display = 'none';
        
        showToast('AI filter applied successfully!');
    }, 2000);
}

// Вспомогательная функция для показа уведомлений
function showToast(message) {
    // Реализация toast уведомлений
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(0,0,0,0.7)';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '1000';
    document.body.appendChild(toast);
    
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

// AI filter implementations
function applyUpscaleEffect(ctx) {
    const originalWidth = ctx.canvas.width;
    const originalHeight = ctx.canvas.height;
    
    // Create a temporary canvas for the upscaled image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Set new dimensions (1.5x)
    tempCanvas.width = originalWidth * 1.5;
    tempCanvas.height = originalHeight * 1.5;
    
    // Draw image with smooth scaling
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.drawImage(ctx.canvas, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Apply sharpening
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        // Simple sharpening
        data[i] = Math.min(255, data[i] * 1.05);
        data[i + 1] = Math.min(255, data[i + 1] * 1.05);
        data[i + 2] = Math.min(255, data[i + 2] * 1.05);
    }
    
    tempCtx.putImageData(imageData, 0, 0);
    
    // Resize main canvas and draw the upscaled image
    ctx.canvas.width = tempCanvas.width;
    ctx.canvas.height = tempCanvas.height;
    ctx.drawImage(tempCanvas, 0, 0);
}

function applyDenoiseEffect(ctx) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create a copy for reading
    const originalData = new Uint8ClampedArray(data);
    
    // Apply simple noise reduction
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            for (let c = 0; c < 3; c++) {
                const idx = (y * width + x) * 4 + c;
                
                // Get surrounding pixels
                const pixels = [
                    originalData[((y-1) * width + (x-1)) * 4 + c],
                    originalData[((y-1) * width + x) * 4 + c],
                    originalData[((y-1) * width + (x+1)) * 4 + c],
                    originalData[(y * width + (x-1)) * 4 + c],
                    originalData[idx],
                    originalData[(y * width + (x+1)) * 4 + c],
                    originalData[((y+1) * width + (x-1)) * 4 + c],
                    originalData[((y+1) * width + x) * 4 + c],
                    originalData[((y+1) * width + (x+1)) * 4 + c]
                ];
                
                // Sort and get median
                pixels.sort((a, b) => a - b);
                data[idx] = pixels[4];
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function applyFaceEnhanceEffect(ctx) {
    // Increase contrast and saturation
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        // Increase saturation
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg + 1.2 * (data[i] - avg); // R
        data[i + 1] = avg + 1.1 * (data[i + 1] - avg); // G
        data[i + 2] = avg + 0.9 * (data[i + 2] - avg); // B
        
        // Increase contrast
        data[i] = Math.min(255, Math.max(0, (data[i] - 127) * 1.1 + 127));
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 127) * 1.1 + 127));
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 127) * 1.1 + 127));
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Slight sharpening
    applySharpness(ctx, 15);
}

function applyBackgroundRemoveEffect(ctx) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            
            // Make pixels more transparent the further they are from center
            if (dist > maxDist * 0.3) {
                const alpha = 1 - (dist - maxDist * 0.3) / (maxDist * 0.7);
                data[idx + 3] = Math.max(0, Math.min(255, alpha * 255));
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function applyStyleEffect(ctx, style) {
    // Save current filter values
    const currentBrightness = brightnessSlider.value;
    const currentContrast = contrastSlider.value;
    const currentSaturate = saturationSlider.value;
    
    // Reset filters
    ctx.filter = 'none';
    ctx.drawImage(currentImage, 0, 0);
    
    // Apply style
    switch(style) {
        case 'van_gogh':
            contrastSlider.value = 130;
            saturationSlider.value = 140;
            break;
        case 'picasso':
            contrastSlider.value = 150;
            brightnessSlider.value = 90;
            saturationSlider.value = 80;
            break;
        case 'monet':
            brightnessSlider.value = 110;
            contrastSlider.value = 90;
            saturationSlider.value = 120;
            break;
        case 'pixel':
            applyPixelEffect(ctx);
            break;
        case 'sketch':
            applySketchEffect(ctx);
            break;
        case 'oil_painting':
            applyOilPaintingEffect(ctx);
            break;
        case 'watercolor':
            saturationSlider.value = 140;
            contrastSlider.value = 120;
            brightnessSlider.value = 110;
            applyBlurEffect(ctx, 2);
            break;
        case 'comic':
            contrastSlider.value = 170;
            saturationSlider.value = 150;
            applyPosterizeEffect(ctx);
            break;
    }
    
    // Update slider values
    updateValueDisplay();
    
    // Apply filters
    updateImage();
    
    // Restore original values (for further adjustments)
    brightnessSlider.value = currentBrightness;
    contrastSlider.value = currentContrast;
    saturationSlider.value = currentSaturate;
}

function applyPixelEffect(ctx) {
    const size = 10; // Pixel size
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    
    // Reduce image size
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = w / size;
    tempCanvas.height = h / size;
    tempCtx.drawImage(ctx.canvas, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Scale back up with pixelation
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
}

function applySketchEffect(ctx) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        // Invert and increase contrast
        const sketchValue = 255 - Math.min(255, Math.max(0, avg * 1.5));
        
        data[i] = sketchValue;     // R
        data[i + 1] = sketchValue; // G
        data[i + 2] = sketchValue; // B
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function applyOilPaintingEffect(ctx) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const radius = 3;
    
    for (let y = radius; y < ctx.canvas.height - radius; y++) {
        for (let x = radius; x < ctx.canvas.width - radius; x++) {
            const i = (y * ctx.canvas.width + x) * 4;
            
            // Average values in area
            let r = 0, g = 0, b = 0;
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const di = ((y + dy) * ctx.canvas.width + (x + dx)) * 4;
                    r += data[di];
                    g += data[di + 1];
                    b += data[di + 2];
                }
            }
            
            const count = Math.pow(radius * 2 + 1, 2);
            data[i] = r / count;
            data[i + 1] = g / count;
            data[i + 2] = b / count;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function applyBlurEffect(ctx, amount) {
    ctx.filter = `blur(${amount}px)`;
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.filter = 'none';
}

function applyPosterizeEffect(ctx) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const levels = 4;
    
    for (let i = 0; i < data.length; i += 4) {
        // Posterize each channel
        data[i] = Math.floor(data[i] / (255 / levels)) * (255 / levels);     // R
        data[i + 1] = Math.floor(data[i + 1] / (255 / levels)) * (255 / levels); // G
        data[i + 2] = Math.floor(data[i + 2] / (255 / levels)) * (255 / levels); // B
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function applySharpness(ctx, amount) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const tempData = new Uint8ClampedArray(data);
    
    for (let i = 4; i < data.length - 4; i += 4) {
        // Simple sharpening kernel
        for (let j = 0; j < 3; j++) {
            data[i + j] = Math.min(255, Math.max(0, 
                tempData[i + j] * (1 + amount/100) - 
                tempData[i + j - 4] * (amount/400) - 
                tempData[i + j + 4] * (amount/400)
            ));
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}