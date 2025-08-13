// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBkYfaXVkGgYqZRzobLVoyUT88l5FHkXYY",
    authDomain: "imageopt-pro.firebaseapp.com",
    projectId: "imageopt-pro",
    storageBucket: "imageopt-pro.appspot.com",
    messagingSenderId: "135619164867",
    appId: "1:135619164867:web:20abe6f99ab9d468eac076"
};

// Free version limits
const FREE_LIMITS = {
    DAILY: 15,         // 15 images per day
    PER_BATCH: 5,       // 5 files at once
    MAX_SIZE: 7 * 1024 * 1024, // 7 MB
    FORMATS: ['jpeg', 'png', 'webp', 'heic', 'avif', 'tiff'] 
};

// State management
const state = {
    originalFiles: [],
    optimizedFiles: [],
    currentFileIndex: 0,
    rotation: 0,
    flipHorizontal: false,
    crop: null,
    history: JSON.parse(localStorage.getItem('imageopt-history')) || [],
    editingMode: false,
    cropRatio: 'free',
    cropBox: null,
    avifSupported: true,
    heicSupported: false,
    tiffSupported: true,
    isPremium: localStorage.getItem('premiumUser') === 'true',
    user: null,
    cropMode: false,
    cropping: false,
    cropStartX: 0,
    cropStartY: 0,
    cropCurrentX: 0,
    cropCurrentY: 0,
    firebaseInitialized: false,
    db: null,
    resizing: false,
    resizeHandle: null,
    dailyCount: 0,
    lastProcessDate: null,
    batchEditMode: 'all',
    watermark: {
        enabled: false,
        type: 'text', // 'text' или 'image'
        text: 'ImageOpt Pro',
        size: 24,
        opacity: 70,
        color: '#ffffff',
        position: 'bottom-right',
        image: null, // для хранения файла изображения
        imageUrl: null, // для хранения Data URL
        scale: 20 // масштаб изображения в %
    },
    progressiveJpeg: false,
    removeMetadata: true,
    pngCompression: 'auto',
    savedProfiles: JSON.parse(localStorage.getItem('savedProfiles')) || [],
    adjustments: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sharpness: 0,
        temperature: 0
    },
    cropper: null // Для хранения экземпляра Cropper
};

// DOM Elements
const elements = {
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    filePreviews: document.getElementById('filePreviews'),
    qualityRange: document.getElementById('quality'),
    qualityValue: document.getElementById('qualityValue'),
    formatSelect: document.getElementById('format'),
    maxWidthSelect: document.getElementById('maxWidth'),
    processing: document.getElementById('processing'),
    previewSection: document.getElementById('previewSection'),
    previewContainer: document.getElementById('previewContainer'),
    stats: document.getElementById('stats'),
    downloadBtn: document.getElementById('downloadBtn'),
    resetBtn: document.getElementById('resetBtn'),
    processBtn: document.getElementById('processBtn'),
    historyToggle: document.getElementById('historyToggle'),
    historyPanel: document.getElementById('historyPanel'),
    closeHistory: document.getElementById('closeHistory'),
    historyList: document.getElementById('historyList'),
    cropBtn: document.getElementById('cropBtn'),
    rotateLeftBtn: document.getElementById('rotateLeftBtn'),
    rotateRightBtn: document.getElementById('rotateRightBtn'),
    flipHBtn: document.getElementById('flipHBtn'),
    adjustBtn: document.getElementById('adjustBtn'),
    resetEditBtn: document.getElementById('resetEditBtn'),
    previewImage: document.getElementById('previewImage'),
    editorContainer: document.getElementById('editorContainer'),
    cropControls: document.getElementById('cropControls'),
    applyCropBtn: document.getElementById('applyCropBtn'),
    cancelCropBtn: document.getElementById('cancelCropBtn'),
    cropRatios: document.querySelectorAll('.crop-ratio'),
    editNotification: document.getElementById('editNotification'),
    cropOverlay: document.getElementById('cropOverlay'),
    progressText: document.getElementById('progressText'),
    progressBar: document.getElementById('progressBar'),
    autoOptimizeCheckbox: document.getElementById('autoOptimizeCheckbox'),
    toast: document.getElementById('toast'),
    userEmail: document.getElementById('userEmail'),
    premiumStatus: document.getElementById('premiumStatus'),
    upgradeBtn: document.getElementById('upgradeBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    dailyCounter: document.getElementById('dailyCounter'),
    dailyCount: document.getElementById('dailyCount'),
    dailyLimit: document.getElementById('dailyLimit'),
    editSingleBtn: document.getElementById('editSingleBtn'),
    editAllBtn: document.getElementById('editAllBtn'),
    batchEditNotice: document.getElementById('batchEditNotice'),
    watermarkControls: document.getElementById('watermarkControls'),
    watermarkText: document.getElementById('watermarkText'),
    watermarkSize: document.getElementById('watermarkSize'),
    watermarkSizeValue: document.getElementById('watermarkSizeValue'),
    watermarkOpacity: document.getElementById('watermarkOpacity'),
    watermarkOpacityValue: document.getElementById('watermarkOpacityValue'),
    watermarkColor: document.getElementById('watermarkColor'),
    watermarkPosition: document.getElementById('watermarkPosition'),
    watermarkPreview: document.getElementById('watermarkPreview'),
    toggleAdvancedSettings: document.getElementById('toggleAdvancedSettings'),
    advancedSettings: document.getElementById('advancedSettings'),
    enableWatermark: document.getElementById('enableWatermark'),
    progressiveJpeg: document.getElementById('progressiveJpeg'),
    removeMetadata: document.getElementById('removeMetadata'),
    pngCompression: document.getElementById('pngCompression'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    touchRotateLeft: document.getElementById('touchRotateLeft'),
    touchRotateRight: document.getElementById('touchRotateRight'),
    touchFlipH: document.getElementById('touchFlipH'),
    touchCrop: document.getElementById('touchCrop'),
    touchAdjust: document.getElementById('touchAdjust'),
    brightnessRange: document.getElementById('brightnessRange'),
    contrastRange: document.getElementById('contrastRange'),
    saturationRange: document.getElementById('saturationRange'),
    sharpnessRange: document.getElementById('sharpnessRange'),
    temperatureRange: document.getElementById('temperatureRange'),
    brightnessValue: document.getElementById('brightnessValue'),
    contrastValue: document.getElementById('contrastValue'),
    saturationValue: document.getElementById('saturationValue'),
    sharpnessValue: document.getElementById('sharpnessValue'),
    temperatureValue: document.getElementById('temperatureValue'),
    applyAdjustBtn: document.getElementById('applyAdjustBtn'),
    resetAdjustBtn: document.getElementById('resetAdjustBtn'),
    adjustControls: document.getElementById('adjustControls'),
    autoAdjustBtn: document.getElementById('autoAdjustBtn'),
    touchAutoAdjust: document.getElementById('touchAutoAdjust'),
    watermarkTextSection: document.querySelector('.watermark-text-section'),
    watermarkImageSection: document.querySelector('.watermark-image-section'),
    watermarkImagePreview: document.getElementById('watermarkImagePreview'),
    watermarkImageInput: document.getElementById('watermarkImageInput'),
    watermarkImageScale: document.getElementById('watermarkImageScale')
};

// Инициализация Cropper
function initCropper() {
    state.cropper = null;
}

// Toggle crop mode
function toggleCropMode() {
    if (state.cropMode && state.cropper) {
        destroyCropper();
        elements.cropControls.style.display = 'none';
        state.cropMode = false;
        return;
    }
    
    // Активировать режим обрезки
    state.cropMode = true;
    elements.cropControls.style.display = 'grid';
    initCrop();
}

// Инициализация обрезки
function initCrop() {
    const image = elements.previewImage;
    if (!image.src) return;
    
    // Создаем клон изображения для Cropper
    const clone = image.cloneNode(true);
    clone.id = "cropper-image";
    clone.style.maxWidth = "100%";
    clone.style.maxHeight = "80vh";
    
    elements.cropOverlay.innerHTML = '';
    elements.cropOverlay.appendChild(clone);
    elements.cropOverlay.style.display = 'block'; // Отображаем overlay
    
    // Инициализация Cropper.js
    state.cropper = new Cropper(clone, {
        aspectRatio: getAspectRatio(),
        viewMode: 1,
        autoCropArea: 1,
        movable: true,
        zoomable: true,
        rotatable: false,
        scalable: false,
        toggleDragModeOnDblclick: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        guides: true,
        center: true,
        highlight: true,
        background: true,
        responsive: true,
        restore: true,
        checkCrossOrigin: false,
        checkOrientation: false,
        modal: true,
    });
}

// Получение соотношения сторон
function getAspectRatio() {
    if (state.cropRatio === 'free') return NaN;
    const [width, height] = state.cropRatio.split(':').map(Number);
    return width / height;
}

// Уничтожение Cropper
function destroyCropper() {
    if (state.cropper) {
        state.cropper.destroy();
        state.cropper = null;
    }
    elements.cropControls.style.display = 'none';
    elements.cropOverlay.innerHTML = '';
    elements.cropOverlay.style.display = 'none'; // Скрываем overlay
    state.cropMode = false;
}

// Apply crop
function applyCrop() {
    if (!state.cropper) return;
    
    // Получаем данные обрезки
    const canvas = state.cropper.getCroppedCanvas();
    if (!canvas) return;
    
    canvas.toBlob(blob => {
        const originalFile = state.originalFiles[state.currentFileIndex];
        const newFile = new File([blob], originalFile.name, {
            type: originalFile.type || 'image/jpeg'
        });
        
        // Заменяем оригинальный файл
        state.originalFiles[state.currentFileIndex] = newFile;
        
        // Обновляем превью в редакторе
        elements.previewImage.src = URL.createObjectURL(newFile);
        
        // Обновляем превью в списке файлов
        updateSingleFilePreview(state.currentFileIndex);
        
        // Закрываем режим обрезки
        destroyCropper();
        
        showEditNotification('Crop applied!');
    }, 'image/jpeg', 0.95);
}

// Обновить превью одного файла в списке
function updateSingleFilePreview(index) {
    const previews = elements.filePreviews.querySelectorAll('.file-preview');
    if (index >= previews.length) return;

    const preview = previews[index];
    const file = state.originalFiles[index];
    const reader = new FileReader();

    reader.onload = function(e) {
        const img = preview.querySelector('img');
        const fileNameDiv = preview.querySelector('.file-name');
        if (img) img.src = e.target.result;
        if (fileNameDiv) fileNameDiv.textContent = file.name;
    };

    reader.readAsDataURL(file);
}

// Cancel crop
function cancelCrop() {
    destroyCropper();
    showEditNotification('Crop canceled!');
}

// Initialize application
async function init() {
    // Initialize counter
    state.dailyCount = parseInt(localStorage.getItem('dailyCount')) || 0;
    state.lastProcessDate = localStorage.getItem('lastProcessDate');
    updateDailyCounter();
    
    // Проверяем поддержку HEIC
    state.heicSupported = typeof heic2any !== 'undefined';
    if (!state.heicSupported) {
        console.warn("HEIC conversion requires heic2any library");
    }
    
    try {
        // Initialize Firebase
        if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            state.firebaseInitialized = true;
            state.db = firebase.firestore();
            
            // Check authentication
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    state.user = user;
                    elements.userEmail.textContent = user.email;
                    checkPremiumStatus();
                } else {
                    // Guest mode
                    state.user = { email: "guest@example.com", uid: "guest" };
                    elements.userEmail.textContent = "Guest";
                    state.isPremium = false;
                    updatePremiumUI();
                }
                renderHistory();
            });
        } else {
            console.warn("Firebase not loaded");
            // Offline mode
            state.user = { email: "guest@example.com", uid: "guest" };
            elements.userEmail.textContent = "Guest";
            state.isPremium = false;
            updatePremiumUI();
            renderHistory();
        }
    } catch (e) {
        console.error("Firebase error:", e);
        // Offline mode on error
        state.user = { email: "guest@example.com", uid: "guest" };
        elements.userEmail.textContent = "Guest (offline)";
        state.isPremium = false;
        updatePremiumUI();
        renderHistory();
    }
    
    // Check AVIF support
    await checkAvifSupport();
    
    // Инициализация Cropper
    initCropper();
    
    setupEventListeners();
    initEnhancements();
}

// Initialize new features
function initEnhancements() {
    // Initialize watermarks
    elements.watermarkText.value = state.watermark.text;
    elements.watermarkSize.value = state.watermark.size;
    elements.watermarkSizeValue.textContent = `${state.watermark.size}px`;
    elements.watermarkOpacity.value = state.watermark.opacity;
    elements.watermarkOpacityValue.textContent = `${state.watermark.opacity}%`;
    elements.watermarkColor.value = state.watermark.color;
    elements.watermarkPosition.value = state.watermark.position;
    
    // Инициализация элементов управления водяным знаком
    elements.watermarkTextSection = document.querySelector('.watermark-text-section');
    elements.watermarkImageSection = document.querySelector('.watermark-image-section');
    elements.watermarkImagePreview = document.getElementById('watermarkImagePreview');
    elements.watermarkImageInput = document.getElementById('watermarkImageInput');
    elements.watermarkImageScale = document.getElementById('watermarkImageScale');
    
    // Устанавливаем начальное состояние
    state.watermark.type = 'text'; // по умолчанию текст
    elements.watermarkImageSection.style.display = 'none'; // скрываем секцию изображения
    elements.watermarkImagePreview.style.display = 'none'; // скрываем предпросмотр изображения

    // Устанавливаем обработчик для кнопок переключения типа
    document.querySelectorAll('.watermark-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === state.watermark.type);
    });

    // Устанавливаем значение масштаба
    elements.watermarkImageScale.value = state.watermark.scale;
    document.getElementById('watermarkImageScaleValue').textContent = `${state.watermark.scale}%`;
    
    updateWatermarkPreview();
    
    // Initialize advanced settings
    elements.progressiveJpeg.checked = state.progressiveJpeg;
    elements.removeMetadata.checked = state.removeMetadata;
    elements.pngCompression.value = state.pngCompression;
    elements.enableWatermark.checked = state.watermark.enabled;
    
    // Initialize adjustments
    applyAdjustmentsToControls();
    
    // Event handlers for new elements
    setupEnhancementEventListeners();
}

// Setup event handlers for enhancements
function setupEnhancementEventListeners() {
    // Batch editing
    elements.editSingleBtn.addEventListener('click', () => setBatchEditMode('single'));
    elements.editAllBtn.addEventListener('click', () => setBatchEditMode('all'));
    
    // Watermarks
    elements.enableWatermark.addEventListener('change', toggleWatermarkControls);
    
    // Переключение между текстом и изображением
    document.querySelectorAll('.watermark-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.watermark-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            state.watermark.type = this.dataset.type;
            
            if (state.watermark.type === 'text') {
                elements.watermarkTextSection.style.display = 'block';
                elements.watermarkImageSection.style.display = 'none';
                elements.watermarkPreview.style.display = 'block';
                elements.watermarkImagePreview.style.display = 'none';
            } else {
                elements.watermarkTextSection.style.display = 'none';
                elements.watermarkImageSection.style.display = 'block';
                elements.watermarkPreview.style.display = 'none';
                elements.watermarkImagePreview.style.display = 'block';
            }
            
            updateWatermarkPreview();
        });
    });
    
    elements.watermarkText.addEventListener('input', updateWatermarkPreview);
    elements.watermarkSize.addEventListener('input', updateWatermarkSize);
    elements.watermarkOpacity.addEventListener('input', updateWatermarkOpacity);
    elements.watermarkColor.addEventListener('input', updateWatermarkPreview);
    elements.watermarkPosition.addEventListener('change', updateWatermarkPreview);
    
    // Загрузка изображения для водяного знака
    elements.watermarkImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                state.watermark.image = file;
                state.watermark.imageUrl = event.target.result;
                elements.watermarkImagePreview.src = event.target.result;
                updateWatermarkPreview();
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Масштаб изображения
    elements.watermarkImageScale.addEventListener('input', function() {
        state.watermark.scale = parseInt(this.value);
        document.getElementById('watermarkImageScaleValue').textContent = `${state.watermark.scale}%`;
        updateWatermarkPreview();
    });
    
    // Advanced settings
    elements.toggleAdvancedSettings.addEventListener('click', toggleAdvancedSettings);
    elements.progressiveJpeg.addEventListener('change', function() {
        state.progressiveJpeg = this.checked;
    });
    elements.removeMetadata.addEventListener('change', function() {
        state.removeMetadata = this.checked;
    });
    elements.pngCompression.addEventListener('change', function() {
        state.pngCompression = this.value;
    });
    
    // Save profile
    elements.saveSettingsBtn.addEventListener('click', saveProfile);
    
    // Touch controls
    elements.touchRotateLeft.addEventListener('click', () => rotateImage(-90));
    elements.touchRotateRight.addEventListener('click', () => rotateImage(90));
    elements.touchFlipH.addEventListener('click', flipImageHorizontal);
    elements.touchCrop.addEventListener('click', toggleCropMode);
    elements.touchAdjust.addEventListener('click', toggleAdjustPanel);
    
    // Image adjustments
    elements.adjustBtn.addEventListener('click', toggleAdjustPanel);
    elements.brightnessRange.addEventListener('input', updateBrightnessValue);
    elements.contrastRange.addEventListener('input', updateContrastValue);
    elements.saturationRange.addEventListener('input', updateSaturationValue);
    elements.sharpnessRange.addEventListener('input', updateSharpnessValue);
    elements.temperatureRange.addEventListener('input', updateTemperatureValue);
    elements.applyAdjustBtn.addEventListener('click', applyAdjustments);
    elements.resetAdjustBtn.addEventListener('click', resetAdjustments);
    
    // Auto adjust buttons
    elements.autoAdjustBtn.addEventListener('click', autoAdjustImage);
    elements.touchAutoAdjust.addEventListener('click', autoAdjustImage);
}

// Auto adjust image
function autoAdjustImage() {
    // Оптимальные значения для автонастройки
    const autoSettings = {
        brightness: 0,    // Яркость - без изменений
        contrast: 10,     // Умеренное увеличение контраста
        saturation: 15,   // Легкое увеличение насыщенности
        sharpness: 50,    // Значение для УВЕЛИЧЕНИЯ резкости
        temperature: 0    // Без коррекции температуры
    };

    // Применяем автонастройки
    state.adjustments = {...autoSettings};
    
    // Обновляем UI
    elements.brightnessRange.value = autoSettings.brightness;
    elements.contrastRange.value = autoSettings.contrast;
    elements.saturationRange.value = autoSettings.saturation;
    elements.sharpnessRange.value = autoSettings.sharpness;
    elements.temperatureRange.value = autoSettings.temperature;
    
    elements.brightnessValue.textContent = `${autoSettings.brightness}%`;
    elements.contrastValue.textContent = `${autoSettings.contrast}%`;
    elements.saturationValue.textContent = `${autoSettings.saturation}%`;
    elements.sharpnessValue.textContent = `${autoSettings.sharpness}%`;
    elements.temperatureValue.textContent = `${autoSettings.temperature}%`;
    
    applyPreviewAdjustments();
    showEditNotification('Auto adjustments applied!');
}

// Apply adjustments to controls
function applyAdjustmentsToControls() {
    elements.brightnessRange.value = state.adjustments.brightness;
    elements.contrastRange.value = state.adjustments.contrast;
    elements.saturationRange.value = state.adjustments.saturation;
    elements.sharpnessRange.value = state.adjustments.sharpness;
    elements.temperatureRange.value = state.adjustments.temperature;
    
    updateBrightnessValue();
    updateContrastValue();
    updateSaturationValue();
    updateSharpnessValue();
    updateTemperatureValue();
}

// Update daily usage counter
function updateDailyCounter() {
    const today = new Date().toDateString();
    // Reset counter if new day
    if (state.lastProcessDate !== today) {
        state.dailyCount = 0;
        localStorage.setItem('dailyCount', 0);
        localStorage.setItem('lastProcessDate', today);
        state.lastProcessDate = today;
    }

    // Update UI
    elements.dailyCount.textContent = state.dailyCount;
    elements.dailyLimit.textContent = state.isPremium ? '∞' : FREE_LIMITS.DAILY;
    
    // Hide counter for premium users
    elements.dailyCounter.style.display = state.isPremium ? 'none' : 'flex';
}

// Check AVIF support
async function checkAvifSupport() {
    const avifImage = new Image();
    avifImage.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+EERQ==';
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    state.avifSupported = avifImage.height === 1;
    
    if (!state.avifSupported) {
        const avifOption = document.querySelector('#format option[value="avif"]');
        if (avifOption) avifOption.disabled = true;
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Upload area events
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);
    
    // File input event
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Quality slider event
    elements.qualityRange.addEventListener('input', updateQualityValue);
    
    // Process button
    elements.processBtn.addEventListener('click', processImages);
    
    // Download and reset buttons
    elements.downloadBtn.addEventListener('click', downloadOptimized);
    elements.resetBtn.addEventListener('click', reset);
    
    // History panel
    elements.historyToggle.addEventListener('click', () => elements.historyPanel.classList.add('active'));
    elements.closeHistory.addEventListener('click', () => elements.historyPanel.classList.remove('active'));
    
    // Edit controls
    elements.cropBtn.addEventListener('click', toggleCropMode);
    elements.rotateLeftBtn.addEventListener('click', () => rotateImage(-90));
    elements.rotateRightBtn.addEventListener('click', () => rotateImage(90));
    elements.flipHBtn.addEventListener('click', flipImageHorizontal);
    elements.resetEditBtn.addEventListener('click', resetEditState);
    elements.applyCropBtn.addEventListener('click', applyCrop);
    elements.cancelCropBtn.addEventListener('click', cancelCrop);
    
    // Crop ratio selection
    elements.cropRatios.forEach(ratio => {
        ratio.addEventListener('click', () => {
            elements.cropRatios.forEach(r => r.classList.remove('active'));
            ratio.classList.add('active');
            state.cropRatio = ratio.dataset.ratio;
            
            // Обновляем соотношение в Cropper
            if (state.cropper) {
                state.cropper.setAspectRatio(getAspectRatio());
            }
        });
    });
    
    // Hotkeys
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
            resetEditState();
            showToast('Changes canceled!');
        }
    });
    
    // Premium and logout
    elements.upgradeBtn.addEventListener('click', () => {
        if (!state.user || state.user.uid === "guest") {
            showToast("Please login to upgrade to Premium");
            setTimeout(() => window.location.href = 'auth.html', 2000);
        } else {
            window.location.href = 'pay.html';
        }
    });
    
    elements.logoutBtn.addEventListener('click', () => {
        if (state.firebaseInitialized && state.user && state.user.uid !== "guest") {
            firebase.auth().signOut().then(() => {
                localStorage.removeItem('premiumUser');
                localStorage.removeItem('userId');
                window.location.href = 'index.html';
            });
        } else {
            // For guest users
            localStorage.removeItem('premiumUser');
            window.location.href = 'index.html';
        }
    });
}

// Set batch edit mode
function setBatchEditMode(mode) {
    state.batchEditMode = mode;
    elements.editSingleBtn.classList.toggle('active', mode === 'single');
    elements.editAllBtn.classList.toggle('active', mode === 'all');
    elements.batchEditNotice.style.display = mode === 'all' ? 'block' : 'none';
    showToast(`Edit mode: ${mode === 'all' ? 'apply to all images' : 'apply to single image'}`);
}

// Toggle watermark controls
function toggleWatermarkControls() {
    state.watermark.enabled = elements.enableWatermark.checked;
    elements.watermarkControls.style.display = state.watermark.enabled ? 'block' : 'none';
}

// Update watermark preview
function updateWatermarkPreview() {
    state.watermark.text = elements.watermarkText.value;
    state.watermark.color = elements.watermarkColor.value;
    state.watermark.position = elements.watermarkPosition.value;
    
    if (state.watermark.type === 'text') {
        elements.watermarkPreview.textContent = state.watermark.text;
        elements.watermarkPreview.style.fontSize = `${state.watermark.size}px`;
        elements.watermarkPreview.style.color = state.watermark.color;
        elements.watermarkPreview.style.opacity = state.watermark.opacity / 100;
    } else if (state.watermark.imageUrl) {
        elements.watermarkImagePreview.src = state.watermark.imageUrl;
        elements.watermarkImagePreview.style.opacity = state.watermark.opacity / 100;
    }
    
    // Positioning
    elements.watermarkPreview.style.position = 'absolute';
    elements.watermarkPreview.style.margin = '10px';
    elements.watermarkImagePreview.style.position = 'absolute';
    elements.watermarkImagePreview.style.margin = '10px';
    
    switch(state.watermark.position) {
        case 'bottom-right':
            elements.watermarkPreview.style.bottom = '0';
            elements.watermarkPreview.style.right = '0';
            elements.watermarkImagePreview.style.bottom = '0';
            elements.watermarkImagePreview.style.right = '0';
            break;
        case 'bottom-left':
            elements.watermarkPreview.style.bottom = '0';
            elements.watermarkPreview.style.left = '0';
            elements.watermarkImagePreview.style.bottom = '0';
            elements.watermarkImagePreview.style.left = '0';
            break;
        case 'top-right':
            elements.watermarkPreview.style.top = '0';
            elements.watermarkPreview.style.right = '0';
            elements.watermarkImagePreview.style.top = '0';
            elements.watermarkImagePreview.style.right = '0';
            break;
        case 'top-left':
            elements.watermarkPreview.style.top = '0';
            elements.watermarkPreview.style.left = '0';
            elements.watermarkImagePreview.style.top = '0';
            elements.watermarkImagePreview.style.left = '0';
            break;
        case 'center':
            elements.watermarkPreview.style.top = '50%';
            elements.watermarkPreview.style.left = '50%';
            elements.watermarkPreview.style.transform = 'translate(-50%, -50%)';
            elements.watermarkImagePreview.style.top = '50%';
            elements.watermarkImagePreview.style.left = '50%';
            elements.watermarkImagePreview.style.transform = 'translate(-50%, -50%)';
            break;
    }
}

// Update watermark size
function updateWatermarkSize(e) {
    state.watermark.size = parseInt(e.target.value);
    elements.watermarkSizeValue.textContent = `${state.watermark.size}px`;
    updateWatermarkPreview();
}

// Update watermark opacity
function updateWatermarkOpacity(e) {
    state.watermark.opacity = parseInt(e.target.value);
    elements.watermarkOpacityValue.textContent = `${state.watermark.opacity}%`;
    updateWatermarkPreview();
}

// Toggle advanced settings
function toggleAdvancedSettings() {
    elements.advancedSettings.style.display = 
        elements.advancedSettings.style.display === 'block' ? 'none' : 'block';
    
    const icon = elements.toggleAdvancedSettings.querySelector('i');
    if (elements.advancedSettings.style.display === 'block') {
        elements.toggleAdvancedSettings.innerHTML = '<i class="fas fa-cog"></i> Hide Advanced Settings';
    } else {
        elements.toggleAdvancedSettings.innerHTML = '<i class="fas fa-cog"></i> Advanced Settings';
    }
}

// Save settings profile
function saveProfile() {
    const profileName = prompt("Enter profile name:");
    if (!profileName) return;
    
    const profile = {
        name: profileName,
        date: new Date().toLocaleString(),
        settings: {
            quality: elements.qualityRange.value,
            format: elements.formatSelect.value,
            maxWidth: elements.maxWidthSelect.value,
            watermark: state.watermark,
            progressiveJpeg: state.progressiveJpeg,
            removeMetadata: state.removeMetadata,
            pngCompression: state.pngCompression,
            adjustments: state.adjustments
        }
    };
    
    state.savedProfiles.push(profile);
    localStorage.setItem('savedProfiles', JSON.stringify(state.savedProfiles));
    showToast(`Profile "${profileName}" saved!`);
}

// Show toast notification
function showToast(message, duration = 3000) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    
    // Clear previous timeout if exists
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        elements.toast.classList.remove('show');
    }, duration);
}

// Check premium status
function checkPremiumStatus() {
    if (!state.firebaseInitialized || !state.user || state.user.uid === "guest") {
        state.isPremium = false;
        updatePremiumUI();
        return;
    }
    
    state.db.collection('users').doc(state.user.uid).get().then(doc => {
        if (doc.exists) {
            state.isPremium = doc.data().premium || false;
            localStorage.setItem('premiumUser', state.isPremium);
            updatePremiumUI();
        }
    }).catch(error => {
        console.error("Error getting premium status:", error);
        state.isPremium = false;
        updatePremiumUI();
    });
}

// Update premium UI
function updatePremiumUI() {
    elements.premiumStatus.textContent = state.isPremium ? 'Premium' : 'Basic';
    if (state.isPremium) {
        elements.premiumStatus.style.background = 'linear-gradient(135deg, #ffd700, #ff9800)';
        elements.premiumStatus.style.color = '#333';
        elements.upgradeBtn.style.display = 'none';
        
        // Enable AVIF for premium users
        const avifOption = document.querySelector('#format option[value="avif"]');
        if (avifOption) avifOption.disabled = false;
        
        // Enable HEIC for premium users if supported
        const heicOption = document.querySelector('#format option[value="heic"]');
        if (heicOption) {
            heicOption.disabled = !state.heicSupported;
        }
    } else {
        elements.premiumStatus.style.background = '#a5b1c2';
        elements.upgradeBtn.style.display = 'block';
        
        // Разрешить все форматы в бесплатной версии
        const avifOption = document.querySelector('#format option[value="avif"]');
        if (avifOption) avifOption.disabled = false;
        
        const heicOption = document.querySelector('#format option[value="heic"]');
        if (heicOption) heicOption.disabled = false;
        
        const tiffOption = document.querySelector('#format option[value="tiff"]');
        if (tiffOption) tiffOption.disabled = false;
    }
    
    updateDailyCounter();
}

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/') || 
        file.type === 'image/heic' || 
        file.name.toLowerCase().endsWith('.heic') ||
        file.type === 'image/tiff' ||
        file.name.toLowerCase().match(/\.tiff?$/i) ||
        file.type === 'image/avif' ||
        file.name.toLowerCase().endsWith('.avif')
    );
    if (files.length > 0) {
        addFiles(files);
        if (elements.autoOptimizeCheckbox.checked) {
            processImages();
        }
    }
}

// File selection handler
async function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        await addFiles(files);
        if (elements.autoOptimizeCheckbox.checked) {
            processImages();
        }
    }
}

// Add files to the state and preview
async function addFiles(files) {
    // Free user limitations
    if (!state.isPremium) {
        // Max files per batch
        if (files.length > FREE_LIMITS.PER_BATCH) {
            showToast(`Free version: max ${FREE_LIMITS.PER_BATCH} files at once`);
            files = files.slice(0, FREE_LIMITS.PER_BATCH);
        }
        
        // Max file size
        files = files.filter(file => file.size <= FREE_LIMITS.MAX_SIZE);
    }
    
    // Filter and convert HEIC/TIFF files
    const imageFiles = [];
    for (let file of files) {
        // Convert HEIC to JPEG
        if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
            try {
                if (!state.heicSupported) {
                    showToast("HEIC conversion requires heic2any library", 3000);
                    continue;
                }
                
                const conversionResult = await heic2any({
                    blob: file,
                    toType: 'image/jpeg',
                    quality: 0.8
                });
                
                const newFile = new File(
                    [conversionResult],
                    file.name.replace(/\.heic$/i, '.jpg'),
                    { type: 'image/jpeg' }
                );
                imageFiles.push(newFile);
            } catch (error) {
                console.error("HEIC conversion error:", error);
                showToast(`Error converting ${file.name}: ${error.message}`);
            }
        } 
        // Convert TIFF to PNG
        else if (file.type === 'image/tiff' || file.name.toLowerCase().match(/\.tiff?$/i)) {
            try {
                // Create image from TIFF
                const img = await createImageBitmap(file);
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Convert to PNG
                const blob = await new Promise(resolve => 
                    canvas.toBlob(resolve, 'image/png')
                );
                
                const newFile = new File(
                    [blob],
                    file.name.replace(/\.tiff?$/i, '.png'),
                    { type: 'image/png' }
                );
                imageFiles.push(newFile);
            } catch (error) {
                console.error("TIFF conversion error:", error);
                showToast(`Error converting ${file.name}: ${error.message}`);
                // Добавляем оригинальный файл как есть
                imageFiles.push(file);
            }
        }
        // Handle AVIF files
        else if (file.type === 'image/avif' || file.name.toLowerCase().endsWith('.avif')) {
            imageFiles.push(file);
        }
        else if (file.type.startsWith('image/')) {
            imageFiles.push(file);
        }
    }
    
    // Add to state
    state.originalFiles = [...state.originalFiles, ...imageFiles];
    
    // Render previews
    renderFilePreviews();
    
    // Reset edit state
    resetEditState();
    
    // Show editor if files added
    if (state.originalFiles.length > 0) {
        showEditor();
    }
}

// Show editor with preview
function showEditor() {
    elements.editorContainer.style.display = 'flex';
    updatePreviewImage();
}

// Render file previews
function renderFilePreviews() {
    elements.filePreviews.innerHTML = '';
    
    state.originalFiles.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'file-preview';
            preview.dataset.index = index;
            
            preview.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <div class="file-name">${file.name}</div>
                <div class="remove-file" data-index="${index}">×</div>
            `;
            
            elements.filePreviews.appendChild(preview);
            
            // Add event to set current file index
            preview.addEventListener('click', (e) => {
                if (!e.target.classList.contains('remove-file')) {
                    state.currentFileIndex = index;
                    highlightSelectedPreview();
                    updatePreviewImage();
                    resetEditState();
                }
            });
            
            // Add event to remove file
            const removeBtn = preview.querySelector('.remove-file');
            removeBtn.addEventListener('click', () => removeFile(index));
        };
        
        reader.readAsDataURL(file);
    });
    
    // Highlight first file by default
    if (state.originalFiles.length > 0) {
        state.currentFileIndex = 0;
        highlightSelectedPreview();
    }
}

// Update preview image in editor
function updatePreviewImage() {
    if (state.originalFiles.length === 0) return;
    
    const file = state.originalFiles[state.currentFileIndex];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        elements.previewImage.src = e.target.result;
        
        // Reset edit state for new image
        state.rotation = 0;
        state.flipHorizontal = false;
        state.crop = null;
        
        // Apply current transformations
        applyImageTransformations();
        
        // Reset crop
        elements.cropOverlay.innerHTML = '';
        
        // Reset adjustments
        resetAdjustments();
    };
    
    reader.readAsDataURL(file);
}

// Apply current transformations to preview image
function applyImageTransformations() {
    let transform = '';
    
    // Apply rotation
    if (state.rotation !== 0) {
        transform += `rotate(${state.rotation}deg) `;
    }
    
    // Apply flip
    if (state.flipHorizontal) {
        transform += `scaleX(-1) `;
    }
    
    elements.previewImage.style.transform = transform;
}

// Highlight selected preview
function highlightSelectedPreview() {
    document.querySelectorAll('.file-preview').forEach((preview, index) => {
        if (index === state.currentFileIndex) {
            preview.style.border = '3px solid var(--accent)';
            preview.style.transform = 'scale(1.05)';
        } else {
            preview.style.border = 'none';
            preview.style.transform = 'scale(1)';
        }
    });
}

// Remove file from state
function removeFile(index) {
    state.originalFiles.splice(index, 1);
    renderFilePreviews();
    
    // Reset preview section if no files left
    if (state.originalFiles.length === 0) {
        reset();
        elements.editorContainer.style.display = 'none';
    } else {
        // Update current index if needed
        if (state.currentFileIndex >= state.originalFiles.length) {
            state.currentFileIndex = state.originalFiles.length - 1;
        }
        highlightSelectedPreview();
        updatePreviewImage();
    }
}

// Update quality value display
function updateQualityValue() {
    elements.qualityValue.textContent = elements.qualityRange.value + '%';
}

// Reset edit state
function resetEditState() {
    state.rotation = 0;
    state.flipHorizontal = false;
    state.crop = null;
    applyImageTransformations();
    elements.cropControls.style.display = 'none';
    elements.cropOverlay.innerHTML = '';
    elements.cropOverlay.style.display = 'none';
    elements.editNotification.style.display = 'none';
    state.cropMode = false;
    
    // Reset crop ratios
    elements.cropRatios.forEach(ratio => ratio.classList.remove('active'));
    document.querySelector('.crop-ratio[data-ratio="free"]').classList.add('active');
    state.cropRatio = 'free';
    
    // Сбрасываем обрезку
    destroyCropper();
    
    // Reset adjustments
    resetAdjustments();
    
    showEditNotification('Changes reset!');
}

// Rotate image
function rotateImage(degrees) {
    state.rotation += degrees;
    // Normalize rotation to 0-360 range
    state.rotation = (state.rotation % 360 + 360) % 360;
    applyImageTransformations();
    showEditNotification('Image rotated!');
}

// Flip image horizontally
function flipImageHorizontal() {
    state.flipHorizontal = !state.flipHorizontal;
    applyImageTransformations();
    showEditNotification('Image flipped!');
}

// Show edit notification
function showEditNotification(message) {
    elements.editNotification.textContent = message || 'Changes applied!';
    elements.editNotification.style.display = 'block';
    setTimeout(() => {
        elements.editNotification.style.display = 'none';
    }, 3000);
}

// Toggle adjust panel
function toggleAdjustPanel() {
    elements.adjustControls.style.display = 
        elements.adjustControls.style.display === 'grid' ? 'none' : 'grid';
}

// Update brightness value
function updateBrightnessValue() {
    state.adjustments.brightness = parseInt(elements.brightnessRange.value);
    elements.brightnessValue.textContent = `${state.adjustments.brightness}%`;
    applyPreviewAdjustments();
}

// Update contrast value
function updateContrastValue() {
    state.adjustments.contrast = parseInt(elements.contrastRange.value);
    elements.contrastValue.textContent = `${state.adjustments.contrast}%`;
    applyPreviewAdjustments();
}

// Update saturation value
function updateSaturationValue() {
    state.adjustments.saturation = parseInt(elements.saturationRange.value);
    elements.saturationValue.textContent = `${state.adjustments.saturation}%`;
    applyPreviewAdjustments();
}

// Update sharpness value
function updateSharpnessValue() {
    state.adjustments.sharpness = parseInt(elements.sharpnessRange.value);
    elements.sharpnessValue.textContent = `${state.adjustments.sharpness}%`;
    applyPreviewAdjustments();
}

// Update temperature value
function updateTemperatureValue() {
    state.adjustments.temperature = parseInt(elements.temperatureRange.value);
    elements.temperatureValue.textContent = `${state.adjustments.temperature}%`;
    applyPreviewAdjustments();
}

// Apply adjustments to preview
function applyPreviewAdjustments() {
    // Инвертируем значение резкости: больше sharpness = меньше размытия
    const sharpnessValue = (100 - state.adjustments.sharpness) / 100;
    
    let filter = `
        brightness(${100 + state.adjustments.brightness}%)
        contrast(${100 + state.adjustments.contrast}%)
        saturate(${100 + state.adjustments.saturation}%)
        blur(${Math.max(0, sharpnessValue * 0.5)}px)
    `;
    
    elements.previewImage.style.filter = filter;
}

// Apply adjustments
function applyAdjustments() {
    elements.adjustControls.style.display = 'none';
    showEditNotification('Adjustments applied!');
}

// Reset adjustments
function resetAdjustments() {
    state.adjustments = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sharpness: 0,
        temperature: 0
    };
    
    elements.brightnessRange.value = 0;
    elements.contrastRange.value = 0;
    elements.saturationRange.value = 0;
    elements.sharpnessRange.value = 0;
    elements.temperatureRange.value = 0;
    
    elements.brightnessValue.textContent = '0%';
    elements.contrastValue.textContent = '0%';
    elements.saturationValue.textContent = '0%';
    elements.sharpnessValue.textContent = '0%';
    elements.temperatureValue.textContent = '0%';
    
    elements.previewImage.style.filter = 'none';
    showEditNotification('Adjustments reset!');
}

// Process images
async function processImages() {
    if (state.originalFiles.length === 0) {
        showToast("Please upload images first!");
        return;
    }

    // Free user limitations
    if (!state.isPremium) {
        const today = new Date().toDateString();
        // Reset daily counter if new day
        if (state.lastProcessDate !== today) {
            state.dailyCount = 0;
            state.lastProcessDate = today;
        }

        // Check daily limit
        if (state.dailyCount >= FREE_LIMITS.DAILY) {
            showToast(`Daily limit reached (${FREE_LIMITS.DAILY} images). Try tomorrow or upgrade to Premium.`);
            
            // Show upgrade button
            const upgradeBtn = document.createElement('button');
            upgradeBtn.textContent = 'Upgrade to Premium';
            upgradeBtn.className = 'btn-premium';
            upgradeBtn.style.marginTop = '15px';
            upgradeBtn.style.padding = '10px 20px';
            upgradeBtn.style.fontSize = '1rem';
            
            upgradeBtn.onclick = () => {
                if (!state.user || state.user.uid === "guest") {
                    window.location.href = 'auth.html';
                } else {
                    window.location.href = 'pay.html';
                }
            };
            
            showToast(`Daily limit reached!`, 5000);
            elements.processing.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <p style="margin-bottom: 20px; font-size: 1.2rem;">
                        Daily limit reached (${FREE_LIMITS.DAILY} images)
                    </p>
                    <p style="margin-bottom: 20px;">
                        Upgrade to Premium for unlimited processing
                    </p>
                </div>
            `;
            elements.processing.appendChild(upgradeBtn);
            elements.processing.style.display = 'block';
            return;
        }

        // Check batch size
        if (state.originalFiles.length > FREE_LIMITS.PER_BATCH) {
            showToast(`Free version: max ${FREE_LIMITS.PER_BATCH} files at once`);
            return;
        }

        // Check file size
        const oversizedFiles = state.originalFiles.filter(file => file.size > FREE_LIMITS.MAX_SIZE);
        if (oversizedFiles.length > 0) {
            showToast(`Free version: max file size ${formatFileSize(FREE_LIMITS.MAX_SIZE)}`);
            return;
        }
    }

    elements.processing.style.display = 'block';
    elements.previewSection.style.display = 'none';
    state.optimizedFiles = [];

    const quality = parseInt(elements.qualityRange.value) / 100;
    const format = elements.formatSelect.value;
    const maxWidth = elements.maxWidthSelect.value ? parseInt(elements.maxWidthSelect.value) : null;

    // Process files sequentially
    for (let i = 0; i < state.originalFiles.length; i++) {
        const applyEdits = state.batchEditMode === 'all' || 
                          (state.batchEditMode === 'single' && i === state.currentFileIndex);

        try {
            const optimizedFile = await optimizeImage(
                state.originalFiles[i], 
                quality, 
                format, 
                maxWidth, 
                applyEdits,
                i
            );
            state.optimizedFiles[i] = optimizedFile;
            
            // Update progress
            const progress = Math.round(((i + 1) / state.originalFiles.length) * 100);
            elements.progressText.textContent = `${progress}%`;
            elements.progressBar.style.width = `${progress}%`;
            
            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error('Error processing file:', error);
            showToast(`Error processing ${state.originalFiles[i].name}: ${error.message || error}`, 5000);
        }
    }

    // Update daily counter for free users
    if (!state.isPremium) {
        state.dailyCount += state.originalFiles.length;
        localStorage.setItem('dailyCount', state.dailyCount);
        localStorage.setItem('lastProcessDate', new Date().toDateString());
        updateDailyCounter();
    }

    displayResults();
    saveToHistory();
    elements.processing.style.display = 'none';
    elements.previewSection.style.display = 'block';
    showToast('Optimization completed!');
}

// Optimize image
function optimizeImage(file, quality, format, maxWidth, applyEdits, index) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = async () => {
            let { width, height } = img;
            
            // Step 1: Draw the image on canvas (without any transformations)
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Step 2: Apply edits if needed
            if (applyEdits) {
                // Apply rotation and flip
                if (state.rotation !== 0 || state.flipHorizontal) {
                    // Clear the canvas and redraw with transformations
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // For rotation, adjust canvas size if needed
                    if (state.rotation === 90 || state.rotation === 270) {
                        [width, height] = [height, width];
                    }
                    
                    tempCanvas.width = width;
                    tempCanvas.height = height;
                    
                    // Apply transformations
                    tempCtx.translate(width / 2, height / 2);
                    tempCtx.rotate(state.rotation * Math.PI / 180);
                    if (state.flipHorizontal) {
                        tempCtx.scale(-1, 1);
                    }
                    tempCtx.translate(-img.width / 2, -img.height / 2);
                    tempCtx.drawImage(img, 0, 0);
                    
                    // Copy back to the main canvas
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(tempCanvas, 0, 0);
                }

                // Apply adjustments (brightness, contrast, etc.)
                if (state.adjustments.brightness !== 0 || 
                    state.adjustments.contrast !== 0 || 
                    state.adjustments.saturation !== 0 ||
                    state.adjustments.sharpness !== 0 ||
                    state.adjustments.temperature !== 0) {
                    
                    // Create temporary canvas for applying filters
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    tempCanvas.width = canvas.width;
                    tempCanvas.height = canvas.height;
                    
                    // Apply filters
                    tempCtx.filter = `
                        brightness(${100 + state.adjustments.brightness}%)
                        contrast(${100 + state.adjustments.contrast}%)
                        saturate(${100 + state.adjustments.saturation}%)
                        blur(${Math.max(0, 0.5 - state.adjustments.sharpness/200)}px)
                    `;
                    
                    // Apply temperature
                    if (state.adjustments.temperature !== 0) {
                        const tempValue = state.adjustments.temperature / 100;
                        tempCtx.filter += ` sepia(${Math.abs(tempValue)*30}%) hue-rotate(${-tempValue*30}deg)`;
                    }
                    
                    tempCtx.drawImage(canvas, 0, 0);
                    
                    // Copy back
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(tempCanvas, 0, 0);
                }

                // Apply watermark if enabled
                if (state.watermark.enabled) {
                    applyWatermark(ctx, canvas);
                }
            }

            // Step 3: Resize if needed
            if (maxWidth && canvas.width > maxWidth) {
                const newHeight = (canvas.height * maxWidth) / canvas.width;
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                
                tempCanvas.width = maxWidth;
                tempCanvas.height = newHeight;
                tempCtx.drawImage(canvas, 0, 0, maxWidth, newHeight);
                
                canvas.width = maxWidth;
                canvas.height = newHeight;
                ctx.drawImage(tempCanvas, 0, 0);
            }

            // Step 4: Format conversion
            // For HEIC format
            if (format === 'heic') {
                try {
                    if (!state.heicSupported) {
                        throw new Error("HEIC conversion not supported");
                    }
                    
                    // Get JPEG blob first
                    const jpegBlob = await new Promise(resolve => 
                        canvas.toBlob(resolve, 'image/jpeg', quality)
                    );
                    
                    // Convert JPEG to HEIC
                    const heicBlob = await heic2any({
                        blob: jpegBlob,
                        toType: 'image/heic',
                        quality: quality
                    });
                    
                    const optimizedFile = new File(
                        [heicBlob],
                        file.name.replace(/\.[^/.]+$/, '.heic'),
                        { type: 'image/heic' }
                    );
                    resolve(optimizedFile);
                } catch (error) {
                    reject(error);
                }
            } 
            // For AVIF format
            else if (format === 'avif') {
                try {
                    // Try to create AVIF blob
                    const blob = await new Promise(resolve => 
                        canvas.toBlob(resolve, 'image/avif', quality)
                    );
                    
                    if (!blob) {
                        throw new Error("Failed to create AVIF image");
                    }
                    
                    const optimizedFile = new File(
                        [blob],
                        file.name.replace(/\.[^/.]+$/, '.avif'),
                        { type: 'image/avif' }
                    );
                    resolve(optimizedFile);
                } catch (error) {
                    reject(error);
                }
            }
            // For TIFF format
            else if (format === 'tiff') {
                try {
                    if (typeof Tiff === 'undefined') {
                        throw new Error("TIFF conversion requires libtiff.js");
                    }
                    const tiffBlob = await convertToTiff(canvas);
                    const optimizedFile = new File(
                        [tiffBlob],
                        file.name.replace(/\.[^/.]+$/, '.tiff'),
                        { type: 'image/tiff' }
                    );
                    resolve(optimizedFile);
                } catch (error) {
                    reject(error);
                }
            }
            // For other formats
            else {
                try {
                    // For progressive JPEG
                    const jpegOptions = {};
                    if (format === 'jpeg' && state.progressiveJpeg) {
                        jpegOptions.progressive = true;
                    }
                    
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error("Failed to create image"));
                            return;
                        }
                        const optimizedFile = new File([blob], 
                            file.name.replace(/\.[^/.]+$/, `.${format === 'jpeg' ? 'jpg' : format}`), 
                            { type: `image/${format}` }
                        );
                        resolve(optimizedFile);
                    }, `image/${format}`, quality, jpegOptions);
                } catch (e) {
                    reject(e);
                }
            }
        };

        img.onerror = () => {
            reject(new Error("Error loading image"));
        };

        img.src = URL.createObjectURL(file);
    });
}

// Convert canvas to TIFF using libtiff.js
async function convertToTiff(canvas) {
    if (typeof Tiff === 'undefined') {
        throw new Error("TIFF library not loaded");
    }
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const tiff = new Tiff({
        width: canvas.width,
        height: canvas.height
    });
    tiff.setRGBAImage(imageData.data);
    return new Blob([tiff.toArrayBuffer()], { type: 'image/tiff' });
}

// Apply watermark
function applyWatermark(ctx, canvas) {
    ctx.save();
    ctx.globalAlpha = state.watermark.opacity / 100;
    
    if (state.watermark.type === 'text') {
        ctx.font = `bold ${state.watermark.size}px Arial`;
        ctx.fillStyle = state.watermark.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = state.watermark.text;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = state.watermark.size;
        
        let x, y;
        
        switch(state.watermark.position) {
            case 'bottom-right':
                x = canvas.width - textWidth / 2 - 20;
                y = canvas.height - textHeight / 2 - 20;
                break;
            case 'bottom-left':
                x = textWidth / 2 + 20;
                y = canvas.height - textHeight / 2 - 20;
                break;
            case 'top-right':
                x = canvas.width - textWidth / 2 - 20;
                y = textHeight / 2 + 20;
                break;
            case 'top-left':
                x = textWidth / 2 + 20;
                y = textHeight / 2 + 20;
                break;
            case 'center':
                x = canvas.width / 2;
                y = canvas.height / 2;
                break;
        }
        
        // Add shadow for better readability
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillText(text, x, y);
    } else if (state.watermark.imageUrl) {
        const img = new Image();
        img.src = state.watermark.imageUrl;
        
        // Рассчитываем размеры с учетом масштаба
        const scale = state.watermark.scale / 100;
        const width = canvas.width * scale;
        const height = (img.height / img.width) * width;
        
        let x, y;
        
        switch(state.watermark.position) {
            case 'bottom-right':
                x = canvas.width - width - 20;
                y = canvas.height - height - 20;
                break;
            case 'bottom-left':
                x = 20;
                y = canvas.height - height - 20;
                break;
            case 'top-right':
                x = canvas.width - width - 20;
                y = 20;
                break;
            case 'top-left':
                x = 20;
                y = 20;
                break;
            case 'center':
                x = (canvas.width - width) / 2;
                y = (canvas.height - height) / 2;
                break;
        }
        
        ctx.drawImage(img, x, y, width, height);
    }
    
    ctx.restore();
}

// Display results
function displayResults() {
    elements.previewContainer.innerHTML = '';
    elements.stats.innerHTML = '';

    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;

    state.originalFiles.forEach((originalFile, index) => {
        const optimizedFile = state.optimizedFiles[index];
        if (!optimizedFile) return;
        
        totalOriginalSize += originalFile.size;
        totalOptimizedSize += optimizedFile.size;

        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        const originalUrl = URL.createObjectURL(originalFile);
        const optimizedUrl = URL.createObjectURL(optimizedFile);

        previewItem.innerHTML = `
            <h3><i class="fas fa-file-image"></i> Original</h3>
            <img src="${originalUrl}" alt="Original">
            <div class="file-info">
                <div><strong>${originalFile.name}</strong></div>
                <div>Size: ${formatFileSize(originalFile.size)}</div>
            </div>
        `;

        const optimizedItem = document.createElement('div');
        optimizedItem.className = 'preview-item';
        optimizedItem.innerHTML = `
            <h3><i class="fas fa-bolt"></i> Optimized</h3>
            <img src="${optimizedUrl}" alt="Optimized">
            <div class="file-info">
                <div><strong>${optimizedFile.name}</strong></div>
                <div>Size: ${formatFileSize(optimizedFile.size)}</div>
                <div>Savings: ${Math.round((1 - optimizedFile.size / originalFile.size) * 100)}%</div>
            </div>
        `;

        elements.previewContainer.appendChild(previewItem);
        elements.previewContainer.appendChild(optimizedItem);
    });

    // Display stats
    if (state.originalFiles.length > 0) {
        const compressionRatio = Math.round((1 - totalOptimizedSize / totalOriginalSize) * 100);
        const savings = formatFileSize(totalOriginalSize - totalOptimizedSize);
        
        elements.stats.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${state.originalFiles.length}</div>
                <div class="stat-label">Files</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatFileSize(totalOriginalSize)}</div>
                <div class="stat-label">Original Size</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatFileSize(totalOptimizedSize)}</div>
                <div class="stat-label">Optimized Size</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${compressionRatio}%</div>
                <div class="stat-label">Savings</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${savings}</div>
                <div class="stat-label">Saved</div>
            </div>
        `;
    }

    elements.downloadBtn.disabled = false;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Download optimized images
async function downloadOptimized() {
    if (state.optimizedFiles.length === 0) {
        showToast("Optimize images first!");
        return;
    }

    if (state.optimizedFiles.length === 1) {
        // Single file download
        const url = URL.createObjectURL(state.optimizedFiles[0]);
        const a = document.createElement('a');
        a.href = url;
        a.download = state.optimizedFiles[0].name;
        a.click();
        URL.revokeObjectURL(url);
    } else {
        // Multiple files - create zip
        try {
            const zip = new JSZip();
            const folder = zip.folder("optimized_images");
            
            state.optimizedFiles.forEach(file => {
                folder.file(file.name, file);
            });
            
            const content = await zip.generateAsync({type:"blob"});
            saveAs(content, "optimized_images.zip");
        } catch (error) {
            alert('For multiple files, please right-click each image and select "Save image as..."');
        }
    }
}

// Reset application
function reset() {
    state.originalFiles = [];
    state.optimizedFiles = [];
    elements.fileInput.value = '';
    elements.filePreviews.innerHTML = '';
    elements.previewSection.style.display = 'none';
    elements.processing.style.display = 'none';
    elements.downloadBtn.disabled = true;
    elements.editorContainer.style.display = 'none';
    resetEditState();
    elements.progressBar.style.width = '0%';
    elements.progressText.textContent = '0%';
}

// Save to history
function saveToHistory() {
    if (state.originalFiles.length === 0) return;
    
    const historyItem = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        fileCount: state.originalFiles.length,
        originalSize: state.originalFiles.reduce((sum, file) => sum + file.size, 0),
        optimizedSize: state.optimizedFiles.reduce((sum, file) => sum + file.size, 0),
        settings: {
            quality: elements.qualityRange.value,
            format: elements.formatSelect.value,
            maxWidth: elements.maxWidthSelect.value,
            adjustments: state.adjustments
        }
    };
    
    // Add to beginning of history
    state.history.unshift(historyItem);
    
    // Keep only last 10 items
    if (state.history.length > 10) {
        state.history.pop();
    }
    
    // Save to localStorage
    localStorage.setItem('imageopt-history', JSON.stringify(state.history));
    
    // Save to Firebase
    if (state.firebaseInitialized && state.user && state.user.uid !== "guest") {
        state.db.collection("optimizations").add({
            userId: state.user.uid,
            ...historyItem,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .catch(error => console.error("Save error:", error));
    }
    
    // Update UI
    renderHistory();
}

// Render history
function renderHistory() {
    elements.historyList.innerHTML = '';
    
    if (state.history.length === 0) {
        elements.historyList.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--gray);">History is empty</p>';
        return;
    }
    
    state.history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.id = item.id;
        
        const savings = Math.round((1 - item.optimizedSize / item.originalSize) * 100);
        
        historyItem.innerHTML = `
            <h4>Processing <span>${item.date}</span></h4>
            <div class="history-stats">
                <div>Files: ${item.fileCount}</div>
                <div>Savings: ${savings}%</div>
            </div>
        `;
        
        historyItem.addEventListener('click', () => loadFromHistory(item.id));
        elements.historyList.appendChild(historyItem);
    });
}

// Load from history
function loadFromHistory(id) {
    const item = state.history.find(item => item.id == id);
    if (!item) return;
    
    // Apply settings
    elements.qualityRange.value = item.settings.quality;
    updateQualityValue();
    elements.formatSelect.value = item.settings.format;
    elements.maxWidthSelect.value = item.settings.maxWidth;
    
    // Apply adjustments if available
    if (item.settings.adjustments) {
        state.adjustments = {...item.settings.adjustments};
        applyAdjustmentsToControls();
    }
    
    // Close history panel
    elements.historyPanel.classList.remove('active');
    
    // Show notification
    showToast(`Settings from ${item.date} applied!`);
}

// Initialize app when DOM is loaded
if (document.readyState !== 'loading') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}