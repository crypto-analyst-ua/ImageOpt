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
        text: 'ImageOpt Pro',
        size: 24,
        opacity: 70,
        color: '#ffffff',
        position: 'bottom-right'
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
    pdfToggle: document.getElementById('pdfToggle'),
    pdfModal: document.getElementById('pdfModal'),
    pdfCancelBtn: document.getElementById('pdfCancelBtn'),
    pdfCreateBtn: document.getElementById('pdfCreateBtn'),
    pdfText: document.getElementById('pdfText'),
    pdfImagesContainer: document.getElementById('pdfImagesContainer'),
    imageWidthPercent: document.getElementById('imageWidthPercent')
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
    
    // Создаем новое изображение с результатом обрезки
    const croppedImage = new Image();
    croppedImage.src = canvas.toDataURL();
    
    // Обновляем превью
    elements.previewImage.src = croppedImage.src;
    
    // Закрываем режим обрезки
    destroyCropper();
    
    showEditNotification('Crop applied!');
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
    updateWatermarkPreview();
    
    // Initialize advanced settings
    elements.progressiveJpeg.checked = state.progressiveJpeg;
    elements.removeMetadata.checked = state.removeMetadata;
    elements.pngCompression.value = state.pngCompression;
    elements.enableWatermark.checked = state.watermark.enabled;
    
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
    elements.watermarkText.addEventListener('input', updateWatermarkPreview);
    elements.watermarkSize.addEventListener('input', updateWatermarkSize);
    elements.watermarkOpacity.addEventListener('input', updateWatermarkOpacity);
    elements.watermarkColor.addEventListener('input', updateWatermarkPreview);
    elements.watermarkPosition.addEventListener('change', updateWatermarkPreview);
    
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
    
    // PDF functionality
    elements.pdfToggle.addEventListener('click', () => {
        elements.pdfModal.classList.add('active');
        renderPdfImageList();
    });
    
    elements.pdfCancelBtn.addEventListener('click', () => {
        elements.pdfModal.classList.remove('active');
    });
    
    elements.pdfModal.addEventListener('click', (e) => {
        if (e.target === elements.pdfModal) {
            elements.pdfModal.classList.remove('active');
        }
    });
    
    elements.pdfCreateBtn.addEventListener('click', createPDF);
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
    
    elements.watermarkPreview.textContent = state.watermark.text;
    elements.watermarkPreview.style.fontSize = `${state.watermark.size}px`;
    elements.watermarkPreview.style.color = state.watermark.color;
    elements.watermarkPreview.style.opacity = state.watermark.opacity / 100;
    
    // Positioning
    elements.watermarkPreview.style.position = 'absolute';
    elements.watermarkPreview.style.margin = '10px';
    
    switch(state.watermark.position) {
        case 'bottom-right':
            elements.watermarkPreview.style.bottom = '0';
            elements.watermarkPreview.style.right = '0';
            break;
        case 'bottom-left':
            elements.watermarkPreview.style.bottom = '0';
            elements.watermarkPreview.style.left = '0';
            break;
        case 'top-right':
            elements.watermarkPreview.style.top = '0';
            elements.watermarkPreview.style.right = '0';
            break;
        case 'top-left':
            elements.watermarkPreview.style.top = '0';
            elements.watermarkPreview.style.left = '0';
            break;
        case 'center':
            elements.watermarkPreview.style.top = '50%';
            elements.watermarkPreview.style.left = '50%';
            elements.watermarkPreview.style.transform = 'translate(-50%, -50%)';
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
            pngCompression: state.pngCompression
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
    let filter = `
        brightness(${100 + state.adjustments.brightness}%)
        contrast(${100 + state.adjustments.contrast}%)
        saturate(${100 + state.adjustments.saturation}%)
        blur(${Math.max(0, 0.5 - state.adjustments.sharpness/200)}px)
    `;
    
    // Apply temperature (warm/cool)
    if (state.adjustments.temperature !== 0) {
        const tempValue = state.adjustments.temperature / 100;
        filter += ` sepia(${Math.abs(tempValue)*30}%) hue-rotate(${-tempValue*30}deg)`;
    }
    
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
        const file = state.originalFiles[i];
        try {
            const optimizedFile = await optimizeImage(
                file, 
                quality, 
                format, 
                maxWidth, 
                i === state.currentFileIndex,
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
            showToast(`Error processing ${file.name}: ${error.message || error}`, 5000);
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
            
            // APPLY CROP - только если есть данные обрезки
            if (applyEdits && state.cropper && index === state.currentFileIndex) {
                const croppedCanvas = state.cropper.getCroppedCanvas();
                width = croppedCanvas.width;
                height = croppedCanvas.height;
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(croppedCanvas, 0, 0);
            } else {
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
            }

            // Apply rotation if needed
            if (applyEdits && state.rotation !== 0) {
                // Swap dimensions for 90/270 degree rotations
                if (state.rotation === 90 || state.rotation === 270) {
                    [width, height] = [height, width];
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Rotate and draw
                ctx.translate(width / 2, height / 2);
                ctx.rotate(state.rotation * Math.PI / 180);
                ctx.translate(-img.width / 2, -img.height / 2);
                
                // Flip if needed
                if (applyEdits && state.flipHorizontal) {
                    ctx.scale(-1, 1);
                    ctx.translate(-img.width, 0);
                }
                
                ctx.drawImage(img, 0, 0);
                
                // Reset transformations
                ctx.setTransform(1, 0, 0, 1, 0, 0);
            } else {
                // Apply flip only
                if (applyEdits && state.flipHorizontal) {
                    canvas.width = width;
                    canvas.height = height;
                    ctx.translate(width, 0);
                    ctx.scale(-1, 1);
                    ctx.drawImage(img, 0, 0, width, height);
                } else {
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                }
            }
            
            // Resize if needed
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
            
            // Apply adjustments if any
            if (applyEdits && (
                state.adjustments.brightness !== 0 || 
                state.adjustments.contrast !== 0 || 
                state.adjustments.saturation !== 0 ||
                state.adjustments.sharpness !== 0 ||
                state.adjustments.temperature !== 0
            )) {
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
            maxWidth: elements.maxWidthSelect.value
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
    
    // Close history panel
    elements.historyPanel.classList.remove('active');
    
    // Show notification
    showToast(`Settings from ${item.date} applied!`);
}

// Render image list for PDF modal
function renderPdfImageList() {
    const container = elements.pdfImagesContainer;
    container.innerHTML = '';
    
    if (state.optimizedFiles.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--gray);">No optimized images available. Optimize images first.</p>';
        return;
    }
    
    state.optimizedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'pdf-image-item';
        
        const img = document.createElement('img');
        img.className = 'pdf-image-preview';
        img.src = URL.createObjectURL(file);
        
        const info = document.createElement('div');
        info.className = 'pdf-image-info';
        
        const name = document.createElement('div');
        name.className = 'pdf-image-name';
        name.textContent = file.name;
        
        const size = document.createElement('div');
        size.className = 'pdf-image-size';
        size.textContent = formatFileSize(file.size);
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.index = index;
        checkbox.style.marginLeft = '10px';
        
        info.appendChild(name);
        info.appendChild(size);
        
        item.appendChild(img);
        item.appendChild(info);
        item.appendChild(checkbox);
        container.appendChild(item);
    });
}

// Create PDF with image support
async function createPDF() {
    const text = elements.pdfText.value.trim();
    const imageWidthPercent = parseInt(elements.imageWidthPercent.value) || 80;
    const selectedImageIndexes = [];
    
    // Collect selected images
    document.querySelectorAll('#pdfImagesContainer input[type="checkbox"]:checked').forEach(checkbox => {
        selectedImageIndexes.push(parseInt(checkbox.dataset.index));
    });

    if (!text && selectedImageIndexes.length === 0) {
        showToast('Please enter text or select images.');
        return;
    }

    // Check if library is loaded
    if (typeof jspdf !== 'undefined') {
        const doc = new jspdf.jsPDF();
        
        // Document settings
        const fontSize = 12;
        const lineHeight = fontSize * 1.2;
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const maxWidth = pageWidth - margin * 2;
        const imageWidth = (pageWidth - margin * 2) * (imageWidthPercent / 100);
        
        let y = margin;
        
        // Add text
        if (text) {
            const lines = doc.splitTextToSize(text, maxWidth);
            
            for (let i = 0; i < lines.length; i++) {
                if (y > doc.internal.pageSize.getHeight() - margin) {
                    doc.addPage();
                    y = margin;
                }
                
                doc.text(lines[i], margin, y);
                y += lineHeight;
            }
        }
        
        // Add images
        if (selectedImageIndexes.length > 0) {
            // Add spacing after text
            if (text) {
                y += 15;
            }
            
            for (let i = 0; i < selectedImageIndexes.length; i++) {
                const index = selectedImageIndexes[i];
                const file = state.optimizedFiles[index];
                
                // Convert File to data URL
                const dataUrl = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
                
                // Get image dimensions
                const img = new Image();
                img.src = dataUrl;
                await new Promise(resolve => { img.onload = resolve; });
                
                const imgHeight = (img.height * imageWidth) / img.width;
                
                // Check if image fits on current page
                if (y + imgHeight > doc.internal.pageSize.getHeight() - margin) {
                    doc.addPage();
                    y = margin;
                }
                
                // Determine format for jsPDF
                let format = 'JPEG'; // default
                if (file.type === 'image/png') {
                    format = 'PNG';
                }
                
                // Add image (center horizontally)
                doc.addImage(
                    dataUrl,
                    format,
                    margin + (maxWidth - imageWidth) / 2,
                    y,
                    imageWidth,
                    imgHeight
                );
                
                // Add caption under image
                y += imgHeight + 5;
                if (y < doc.internal.pageSize.getHeight() - margin - 10) {
                    doc.setFontSize(10);
                    doc.text(file.name, margin, y);
                    doc.setFontSize(fontSize);
                    y += 10;
                }
                
                // Add spacing after image
                y += 10;
            }
        }
        
        // Save PDF
        doc.save("imageopt-document.pdf");
        elements.pdfModal.classList.remove('active');
        showToast('PDF created successfully!');
    } else {
        showToast('Error: PDF library not loaded. Please refresh page.');
    }
}

// Initialize app when DOM is loaded
if (document.readyState !== 'loading') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}