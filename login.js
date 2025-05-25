


// DOM Elements
const offersContainer = document.getElementById('offers-container');
const addOfferBtn = document.getElementById('add-offer');
const editModal = document.getElementById('editModal');
const offerForm = document.getElementById('offer-form');
const saveOfferBtn = document.getElementById('save-offer');
const addImageBtn = document.getElementById('add-image');
const imagesContainer = document.getElementById('images-container');
const closeModalBtns = document.querySelectorAll('.close-modal-btn');
const modalTitle = document.getElementById('modalTitle');

// Current offer being edited
let currentOffer = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadOffers();
    setupEventListeners();
});

// Modal functions
function showModal() {
    editModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function hideModal() {
    editModal.style.display = 'none';
    document.body.style.overflow = ''; // Re-enable scrolling
}

// Load offers from Supabase
async function loadOffers() {
    offersContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>جاري تحميل العروض...</p></div>';

    const { data, error } = await supabase
        .from('travel_offers')
        .select('*')

    if (error) {
        console.error('Error loading offers:', error);
        offersContainer.innerHTML = '<div class="error-message">حدث خطأ في تحميل العروض</div>';
        return;
    }

    renderOffers(data);
}

// Fullscreen image viewer elements
const fullscreenViewer = document.createElement('div');
fullscreenViewer.className = 'fullscreen-viewer';
fullscreenViewer.innerHTML = `
    <span class="close-fullscreen">&times;</span>
    <img class="fullscreen-image">
`;
document.body.appendChild(fullscreenViewer);

// Add click handler to rendered offer images
function renderOffers(offers) {
    if (offers.length === 0) {
        offersContainer.innerHTML = '<div class="no-offers">لا توجد عروض متاحة</div>';
        return;
    }

    offersContainer.innerHTML = '';

    offers.forEach(offer => {
        const offerCard = document.createElement('div');
        offerCard.className = 'offer-card';

        // Filter out invalid image URLs from the sup_images_array
        const validImages = offer.sup_images_array ? offer.sup_images_array.filter(img =>
            img[0] && (img[0].startsWith('http') || img[0].startsWith('/'))
        ) : [];

        offerCard.innerHTML = `
            <div class="card-body">
                <h3 class="offer-title">${offer.title}</h3>
                <div class="images-preview">
                    <!-- Display title_card_image first if it exists -->
                    ${offer.title_card_image ? `
                        <img src="${offer.title_card_image}" alt="صورة العنوان" class="image-thumbnail title-card-image" 
                             data-fullsrc="${offer.title_card_image}" onerror="this.style.display='none'">
                    ` : ''}
                    
                    <!-- Display other images -->
                    ${validImages.map(img => `
                        <img src="${img[0]}" alt="${img[1] || 'صورة العرض'}" class="image-thumbnail" 
                             data-fullsrc="${img[0]}" onerror="this.style.display='none'">
                    `).join('')}
                </div>
            </div>
            <div class="card-actions">
                <button class="btn edit-btn edit-offer" data-id="${offer.id}">تعديل</button>
                <button class="btn delete-btn delete-offer" data-id="${offer.id}">حذف</button>
            </div>
        `;
        offersContainer.appendChild(offerCard);
    });

    // Add click handlers to images for fullscreen view
    document.querySelectorAll('.image-thumbnail').forEach(img => {
        img.addEventListener('click', (e) => {
            openFullscreenImage(e.target.dataset.fullsrc || e.target.src);
        });
    });

    // Add event listeners to buttons
    document.querySelectorAll('.edit-offer').forEach(btn => {
        btn.addEventListener('click', (e) => editOffer(btn.dataset.id, e));
    });

    document.querySelectorAll('.delete-offer').forEach(btn => {
        btn.addEventListener('click', () => deleteOffer(btn.dataset.id));
    });
}



// Setup event listeners
function setupEventListeners() {
    // Add new offer
    addOfferBtn.addEventListener('click', () => {
        currentOffer = null;
        modalTitle.textContent = 'إضافة عرض جديد';
        offerForm.reset();
        imagesContainer.innerHTML = '';
        showModal();
    });

    // Add image field
    addImageBtn.addEventListener('click', addImageField);

    // Save offer
    saveOfferBtn.addEventListener('click', saveOffer);

    // Close modal
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', hideModal);
    });


    // Close modal when clicking outside
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            hideModal();
        }
    });
}

// Edit existing offer with title card image
async function editOffer(offerId, event) {
    const clickedButton = event.currentTarget;
    clickedButton.disabled = true;
    clickedButton.innerHTML = '<span class="spinner"></span>';

    const { data, error } = await supabase
        .from('travel_offers')
        .select('*')
        .eq('id', offerId)
        .single();

    if (error) {
        console.error('Error loading offer:', error);
        alert('حدث خطأ أثناء تحميل العرض');
        return;
    }

    currentOffer = data;
    modalTitle.textContent = 'تعديل العرض';
    document.getElementById('offer-id').value = data.id;
    document.getElementById('offer-title').value = data.title;

    // Clear and reset title card image
    const titleCardPreview = document.getElementById('title-card-preview');
    const titleCardInput = document.getElementById('title-card-image');
    const removeTitleCardBtn = document.getElementById('remove-title-card-image');

    if (data.title_card_image) {
        titleCardPreview.src = data.title_card_image;
        titleCardPreview.style.display = 'block';
        removeTitleCardBtn.style.display = 'inline-block';
    } else {
        titleCardPreview.style.display = 'none';
        removeTitleCardBtn.style.display = 'none';
    }

    imagesContainer.innerHTML = '';
    currentOffer.originalImages = [...data.sup_images_array];

    data.sup_images_array.forEach(image => {
        addImageField(image[0], image[1], true);
    });

    showModal();
    clickedButton.disabled = false;
    clickedButton.innerHTML = 'تعديل';
}

// Initialize title card image selection with improved handling
function initializeTitleCardHandlers() {
    const titleCardInput = document.getElementById('title-card-image');
    const titleCardLabel = document.querySelector('label[for="title-card-image"]');
    
    // Handle file selection change
    titleCardInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('title-card-preview');
        const removeBtn = document.getElementById('remove-title-card-image');

        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
            removeBtn.style.display = 'inline-block';
            
            preview.onload = function() {
                URL.revokeObjectURL(this.src);
            };
        }
    });
    
    // Prevent default behavior on label click to avoid double file dialog
    if (titleCardLabel) {
        titleCardLabel.addEventListener('click', function(e) {
            // Prevent the default action
            e.preventDefault();
            
            // Don't handle events that bubbled up from the input itself
            if (e.target === titleCardInput) return;
            
            // Use setTimeout to break the event chain
            setTimeout(() => {
                titleCardInput.click();
            }, 0);
        });
    }
}

// Call the initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeTitleCardHandlers);

document.getElementById('remove-title-card-image').addEventListener('click', function() {
    const preview = document.getElementById('title-card-preview');
    const input = document.getElementById('title-card-image');
    const removeBtn = document.getElementById('remove-title-card-image');

    preview.src = '';
    preview.style.display = 'none';
    input.value = '';
    removeBtn.style.display = 'none';
    
    // Mark for removal if this was an existing image
    if (currentOffer?.title_card_image) {
        if (!currentOffer.removedTitleCardImage) {
            currentOffer.removedTitleCardImage = currentOffer.title_card_image;
        }
    }
});

// Modified addImageField function with removal tracking
function addImageField(url = '', alt = '', isExistingImage = false) {
    const div = document.createElement('div');
    div.className = 'image-field';

    const fileId = `file-input-${Date.now()}`;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = fileId;
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    const fileLabel = document.createElement('label');
    fileLabel.htmlFor = fileId;
    fileLabel.className = 'file-label';
    fileLabel.textContent = isExistingImage ? 'استبدال العرض' : 'تحميل العرض';

    // Add click handler for replacement label
    fileLabel.addEventListener('click', async (e) => {
        // Prevent the default action to avoid double-triggering
        e.preventDefault();
        
        // Don't handle events that bubbled up from the input itself
        if (e.target === fileInput) return;
        
        if (isExistingImage && url) {
            // Show confirmation dialog
            if (confirm('هل أنت متأكد من استبدال هذه الصورة؟')) {
                // Get the file input
                const fileInput = e.target.closest('.image-field').querySelector('input[type="file"]');
                
                // Clear the input to allow selecting the same file again
                fileInput.value = '';
                
                // Use setTimeout to break the event chain
                setTimeout(() => {
                    fileInput.click();
                }, 0);
            }
        } else {
            // Use setTimeout to break the event chain
            setTimeout(() => {
                fileInput.click();
            }, 0);
        }
    });

    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.className = 'desc-input';
    descInput.placeholder = 'وصف العرض';
    descInput.value = alt;
    descInput.required = true;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '×';
    removeBtn.dataset.imageUrl = url;

    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';

    // For existing images
    if (url && typeof url === 'string' && url.startsWith('http')) {
        const previewImg = document.createElement('img');
        previewImg.src = url;
        previewImg.className = 'image-preview';
        previewContainer.appendChild(previewImg);

        // Add click handler for fullscreen
        previewImg.addEventListener('click', () => {
            openFullscreenImage(url);
        });

        if (isExistingImage) {
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.className = 'original-image-url';
            hiddenInput.value = url;
            div.appendChild(hiddenInput);
        }
    }

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            previewContainer.innerHTML = '';


            // Limit the visible filename length (e.g., 15 characters)
            const maxLength = 15;
            let displayName = file.name;
            if (file.name.length > maxLength) {
                // Keep file extension
                const extensionIndex = file.name.lastIndexOf('.');
                const extension = extensionIndex !== -1 ? file.name.substring(extensionIndex) : '';

                // Truncate the main filename and add ellipsis
                const mainName = file.name.substring(0, maxLength - extension.length - 3);
                displayName = mainName + '...' + extension;
            }

            fileLabel.textContent = displayName;



            const previewImg = document.createElement('img');
            previewImg.src = URL.createObjectURL(file);
            previewImg.className = 'image-preview';
            previewContainer.appendChild(previewImg);

            // Add click handler for fullscreen for newly uploaded images
            previewImg.addEventListener('click', () => {
                // For newly uploaded files, we'll use the object URL temporarily
                // Note: This will only work until the page is refreshed
                // For permanent fullscreen viewing, you'll need to upload first
                openFullscreenImage(previewImg.src);
            });

            previewImg.onload = function () {
                URL.revokeObjectURL(this.src);
            };
        }
    });

    div.appendChild(previewContainer);
    div.appendChild(fileLabel);
    div.appendChild(fileInput);
    div.appendChild(descInput);
    div.appendChild(removeBtn);

    removeBtn.addEventListener('click', () => {
        if (url) {
            if (!currentOffer.removedImages) {
                currentOffer.removedImages = [];
            }
            currentOffer.removedImages.push(url);
        }
        div.remove();
    });

    imagesContainer.appendChild(div);
}

// Save offer with individual image handling and removal
async function saveOffer() {
    // Log all image sources in preview containers
    console.log('--- Current Preview Images ---');
    document.querySelectorAll('.preview-container img').forEach((img, index) => {
        console.log(`Image ${index + 1}:`, {
            src: img.src,
            alt: img.alt,
            parentDiv: img.closest('.image-field')?.querySelector('input[type="text"]')?.value || 'No description'
        });
    });
    console.log('-----------------------------');

    const title = document.getElementById('offer-title').value;
    const offerId = document.getElementById('offer-id').value;
    const titleCardInput = document.getElementById('title-card-image');
    const titleCardFile = titleCardInput.files[0];

    // Validate title
    if (!title || title.trim() === '') {
        alert('يجب إدخال عنوان العرض');
        return;
    }

    // Get all image fields
    const imageElements = document.querySelectorAll('#images-container > div');

    // Check if there are any images
    if (imageElements.length === 0) {
        alert('يجب إضافة صورة واحدة على الأقل');
        return;
    }

    // Validate each image field
    for (const div of imageElements) {
        const fileInput = div.querySelector('input[type="file"]');
        const descInput = div.querySelector('input[type="text"]');
        const originalUrlInput = div.querySelector('input.original-image-url');

        // For existing images that weren't replaced
        if (originalUrlInput && fileInput.files.length === 0) {
            if (!descInput.value || descInput.value.trim() === '') {
                alert('يجب إدخال وصف لكل صورة');
                descInput.focus();
                return;
            }
        }
        // For new or replaced images
        else {
            if (fileInput.files.length === 0) {
                alert('يجب اختيار صورة لكل حقل');
                return;
            }
            if (!descInput.value || descInput.value.trim() === '') {
                alert('يجب إدخال وصف لكل صورة');
                descInput.focus();
                return;
            }
        }
    }

    saveOfferBtn.disabled = true;
    saveOfferBtn.innerHTML = '<span class="spinner"></span> جاري الحفظ';

    try {
        const filesToDelete = new Set(); // Track files to delete
        let titleCardImageUrl = currentOffer?.title_card_image || null;
        const titleCardPreview = document.getElementById('title-card-preview');
        const titleCardFileInput = document.getElementById('title-card-image');
        
        // Check if we have a preview image (either existing or newly selected)
        if (titleCardPreview?.src && !titleCardPreview.src.includes('placeholder')) {
            // If it's a new image (blob URL), upload it
            if (titleCardPreview.src.startsWith('blob:') && titleCardFileInput?.files.length > 0) {
                try {
                    const file = titleCardFileInput.files[0];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `title-card-${Date.now()}.${fileExt}`;
                    const filePath = `boarding-saudi-travel/${fileName}`;

                    // Delete old title card image if it exists
                    if (currentOffer?.title_card_image) {
                        try {
                            const urlObj = new URL(currentOffer.title_card_image);
                            const oldFilePath = urlObj.pathname.split('/offer-images/')[1];
                            await supabase
                                .storage
                                .from('offer-images')
                                .remove([oldFilePath]);
                            console.log('Deleted old title card image');
                        } catch (e) {
                            console.error('Error deleting old title card image:', e);
                        }
                    }

                    // Upload the new image
                    const { error: uploadError } = await supabase
                        .storage
                        .from('offer-images')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: false,
                            contentType: file.type
                        });

                    if (uploadError) throw uploadError;

                    // Get the public URL
                    const { data: { publicUrl } } = supabase
                        .storage
                        .from('offer-images')
                        .getPublicUrl(filePath);

                    titleCardImageUrl = publicUrl;
                    console.log('Uploaded new title card image:', publicUrl);

                } catch (error) {
                    console.error('Error uploading title card image:', error);
                    alert(`حدث خطأ في رفع صورة العنوان: ${error.message}`);
                }
            }
            // If it's an existing image, keep using the same URL
            else if (titleCardPreview.dataset.originalSrc) {
                titleCardImageUrl = titleCardPreview.dataset.originalSrc;
            }
        }
        // If title card was removed
        else if (currentOffer?.removedTitleCardImage || !titleCardPreview?.src) {
            try {
                if (currentOffer?.title_card_image) {
                    const urlObj = new URL(currentOffer.title_card_image);
                    const filePath = urlObj.pathname.split('/offer-images/')[1];
                    filesToDelete.add(filePath);
                }
                titleCardImageUrl = null;
                console.log('Title card image removed');
            } catch (e) {
                console.error('Error removing title card image:', e);
            }
        }

        // 2. Process content images
        console.log('Starting image processing...');
        
        // Get the current images from the database
        const currentImages = currentOffer?.sup_images_array || [];
        console.log('Database images array:', {
            count: currentImages.length,
            urls: currentImages.map(img => img[0])
        });

        // Get all visible images from the form
        const visibleImages = Array.from(document.querySelectorAll('.preview-container img'))
            .map(img => ({
                src: img.src,
                alt: img.alt,
                description: img.closest('.image-field')?.querySelector('input[type="text"]')?.value || ''
            }));
            
        console.log('Visible images in form:', {
            count: visibleImages.length,
            images: visibleImages.map(img => ({
                src: img.src,
                description: img.description
            }))
        });

        // Create a map of existing images for quick lookup and track their original indices
        const existingImagesMap = new Map();
        currentImages.forEach((img, index) => {
            if (img && img[0]) {
                existingImagesMap.set(img[0], {
                    description: img[1] || '',
                    originalIndex: index,
                    isVisible: visibleImages.some(visibleImg => visibleImg.src === img[0])
                });
            }
        });

        // Create an array to store the final images and track replacements
        const finalImages = [...currentImages];
        const removedImageUrls = new Set();
        const replacedImages = new Map(); // Track URL replacements (oldUrl -> newUrl)

        // Process each image field
        const imageElements = document.querySelectorAll('.image-field');

        for (const div of imageElements) {
            const fileInput = div.querySelector('input[type="file"]');
            const descInput = div.querySelector('input[type="text"]');
            const isExisting = div.dataset.isExisting === 'true';
            const originalUrl = div.dataset.originalUrl;
            const removeBtn = div.querySelector('.remove-btn');

            // Skip if this image was removed
            if (removeBtn?.style.display === 'none') {
                // Add to removed images if it was existing
                if (isExisting && originalUrl) {
                    removedImageUrls.add(originalUrl);
                }
                continue;
            }

            try {
                // Case 1: Existing image that was replaced
                if (isExisting && fileInput.files.length > 0) {
                    console.log('Replacing image:', originalUrl);
                    
                    const file = fileInput.files[0];
                    const fileExt = file.name.split('.').pop();
                    const fileName = originalUrl.split('/').pop(); // Keep same filename
                    const filePath = `boarding-saudi-travel/${fileName}`;

                    // Delete old image first
                    try {
                        const urlObj = new URL(originalUrl);
                        const oldFilePath = urlObj.pathname.split('/offer-images/')[1];
                        await supabase
                            .storage
                            .from('offer-images')
                            .remove([oldFilePath]);
                        console.log('Old image deleted:', oldFilePath);
                        removedImageUrls.add(originalUrl);
                    } catch (e) {
                        console.error('Error deleting old image:', e);
                    }

                    const { error: uploadError } = await supabase
                        .storage
                        .from('offer-images')
                        .upload(filePath, file, {
                            upsert: true, // Overwrite existing
                            contentType: file.type
                        });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase
                        .storage
                        .from('offer-images')
                        .getPublicUrl(filePath);

                    // Track this replacement
                    replacedImages.set(originalUrl, publicUrl);
                    
                    // Find and update the image in finalImages
                    const existingImage = existingImagesMap.get(originalUrl);
                    if (existingImage !== undefined) {
                        // Update at the original index to maintain position
                        finalImages[existingImage.originalIndex] = [publicUrl, descInput.value];
                        console.log(`Replaced image at index ${existingImage.originalIndex}:`, publicUrl);
                    } else {
                        // If not found (shouldn't happen), add it to the end
                        finalImages.push([publicUrl, descInput.value]);
                        console.log('Added as new image (not found in originals):', publicUrl);
                    }
                }
                // Case 2: Existing image not replaced
                else if (isExisting) {
                    // Update the description if it changed
                    const existingIndex = finalImages.findIndex(img => img[0] === originalUrl);
                    if (existingIndex !== -1) {
                        finalImages[existingIndex][1] = descInput.value;
                    }
                }
                // Case 3: New image
                else if (!isExisting && fileInput.files.length > 0) {
                    console.log('Adding new image');
                    
                    const file = fileInput.files[0];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                    const filePath = `boarding-saudi-travel/${fileName}`;

                    const { error: uploadError } = await supabase
                        .storage
                        .from('offer-images')
                        .upload(filePath, file, {
                            upsert: true, // Overwrite existing
                            contentType: file.type
                        });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase
                        .storage
                        .from('offer-images')
                        .getPublicUrl(filePath);

                    finalImages.push([publicUrl, descInput.value]);
                    console.log('New image added:', publicUrl);
                }
            } catch (e) {
                console.error('Error processing image:', e);
                throw e;
            }
        }

        // 3. Process and upload all images
        const sup_images_array = [];
        
        // Process each visible image in the form
        for (const field of document.querySelectorAll('.image-field')) {
            const img = field.querySelector('img');
            const descInput = field.querySelector('input[type="text"]');
            const fileInput = field.querySelector('input[type="file"]');
            
            // Skip if no image or image was removed
            if (!img || !img.src || field.querySelector('.remove-btn')?.style.display === 'none') {
                continue;
            }
            
            const description = descInput?.value || '';
            const isBlobUrl = img.src.startsWith('blob:');
            
            // For existing images (not blob URLs)
            if (!isBlobUrl) {
                const imageUrl = img.dataset.originalSrc || img.src;
                if (imageUrl) {
                    sup_images_array.push([imageUrl, description]);
                }
                continue;
            }
            
            // For new images (blob URLs), we need to upload them
            if (fileInput?.files.length > 0) {
                try {
                    const file = fileInput.files[0];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                    const filePath = `boarding-saudi-travel/${fileName}`;
                    
                    // Upload the file to Supabase storage
                    const { error: uploadError } = await supabase
                        .storage
                        .from('offer-images')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: false,
                            contentType: file.type
                        });
                    
                    if (uploadError) throw uploadError;
                    
                    // Get the public URL
                    const { data: { publicUrl } } = supabase
                        .storage
                        .from('offer-images')
                        .getPublicUrl(filePath);
                    
                    console.log('Uploaded new image:', publicUrl);
                    sup_images_array.push([publicUrl, description]);
                    
                } catch (error) {
                    console.error('Error uploading image:', error);
                    alert(`حدث خطأ في رفع الصورة: ${error.message}`);
                    continue;
                }
            }
        }
        
        console.log('New sup_images_array to save:', {
            count: sup_images_array.length,
            images: sup_images_array.map(img => ({
                url: img[0],
                description: img[1]
            }))
        });

        // Delete all removed images
        if (removedImageUrls.size > 0) {
            const filesToDelete = new Set();
            for (const url of removedImageUrls) {
                try {
                    const urlObj = new URL(url);
                    const filePath = urlObj.pathname.split('/offer-images/')[1];
                    filesToDelete.add(filePath);
                } catch (e) {
                    console.error('Error parsing removed image URL:', e);
                }
            }

            if (filesToDelete.size > 0) {
                const { error: deleteError } = await supabase
                    .storage
                    .from('offer-images')
                    .remove([...filesToDelete]);

                if (deleteError) {
                    console.error('Error deleting old files:', deleteError);
                    // Continue anyway - this isn't critical enough to fail the whole operation
                } else {
                    console.log('Successfully deleted removed images');
                }
            }
        }

        // Handle title card image
        let finalTitleCardImage = null;
        const titleCardInput = document.getElementById('title-card-image');
        const titleCardPreviewElement = document.getElementById('title-card-preview');
        
        // Check if there's a new title card image to upload
        if (titleCardInput?.files.length > 0) {
            try {
                const file = titleCardInput.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `title-card-${Date.now()}.${fileExt}`;
                const filePath = `boarding-saudi-travel/${fileName}`;

                // Upload new title card image
                const { error: uploadError } = await supabase
                    .storage
                    .from('offer-images')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false,
                        contentType: file.type
                    });
                
                if (uploadError) throw uploadError;

                // Get public URL
                const { data: { publicUrl } } = supabase
                    .storage
                    .from('offer-images')
                    .getPublicUrl(filePath);
                
                // If there was a previous title card image, mark it for deletion
                if (currentOffer?.title_card_image) {
                    removedImageUrls.add(currentOffer.title_card_image);
                }
                
                finalTitleCardImage = publicUrl;
                console.log('Uploaded new title card image:', publicUrl);
                
            } catch (error) {
                console.error('Error uploading title card image:', error);
                throw new Error('حدث خطأ في رفع صورة العنوان');
            }
        } 
        // If no new image but there's an existing one, keep it
        else if (titleCardPreviewElement?.src && 
                !titleCardPreviewElement.src.includes('placeholder') && 
                !titleCardPreviewElement.src.startsWith('blob:')) {
            finalTitleCardImage = titleCardPreviewElement.src;
        } 
        // If the title card was removed
        else if (titleCardPreviewElement?.src.includes('placeholder') && currentOffer?.title_card_image) {
            // The existing title card image will be in removedImageUrls and will be deleted
            removedImageUrls.add(currentOffer.title_card_image);
            finalTitleCardImage = null;
        }
        
        // 6. Prepare offer data
        const offerData = {
            title,
            sup_images_array,
            title_card_image: finalTitleCardImage,
            updated_at: new Date().toISOString()
        };
        
        console.log('Saving offer with data:', {
            title,
            images_count: sup_images_array.length,
            has_title_card: !!titleCardImageUrl
        });

        if (offerId) {
            const { error } = await supabase
                .from('travel_offers')
                .update(offerData)
                .eq('id', offerId);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('travel_offers')
                .insert(offerData);
            if (error) throw error;
        }

        await loadOffers();
        hideModal();
    } catch (error) {
        console.error("Error saving offer:", error);
        alert(`حدث خطأ أثناء حفظ العرض: ${error.message}`);
    } finally {
        saveOfferBtn.disabled = false;
        saveOfferBtn.textContent = 'حفظ';
    }
}

// Delete offer
async function deleteOffer(offerId) {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟ سيتم حذف جميع الصور المرتبطة به.')) return;

    try {
        // First get the offer to access image URLs
        const { data: offer, error: fetchError } = await supabase
            .from('travel_offers')
            .select('*')
            .eq('id', offerId)
            .single();

        if (fetchError) throw fetchError;

        // Array to collect all files to delete (content images + title card image)
        let filesToDelete = [];

        // 1. Add content images to delete list
        if (offer.images && offer.images.length > 0) {
            filesToDelete = offer.images.map(img => {
                try {
                    const url = img[0];
                    // For newer Supabase storage URLs:
                    if (url.includes('/storage/v1/object/public/offer-images/')) {
                        return url.split('/storage/v1/object/public/offer-images/')[1];
                    }
                    // For older format or direct paths:
                    return url.replace(/^.*offer-images\//, '');
                } catch (e) {
                    console.error('Error parsing image URL:', img[0], e);
                    return null;
                }
            }).filter(Boolean);
        }

        // 2. Add title card image to delete list if it exists
        if (offer.title_card_image) {
            try {
                const url = offer.title_card_image;
                // For newer Supabase storage URLs:
                if (url.includes('/storage/v1/object/public/offer-images/')) {
                    filesToDelete.push(url.split('/storage/v1/object/public/offer-images/')[1]);
                } else {
                    // For older format or direct paths:
                    filesToDelete.push(url.replace(/^.*offer-images\//, ''));
                }
            } catch (e) {
                console.error('Error parsing title card image URL:', offer.title_card_image, e);
            }
        }

        // 3. Delete all files from storage
        if (filesToDelete.length > 0) {
            console.log('Files to delete:', filesToDelete); // Debug log

            const { error: deleteError, data: deleteResult } = await supabase
                .storage
                .from('offer-images')
                .remove(filesToDelete);

            console.log('Delete result:', deleteResult); // Debug log

            if (deleteError) {
                console.error('Error deleting images:', deleteError);
                throw new Error('فشل في حذف الصور من التخزين');
            }

            if (!deleteResult || deleteResult.length === 0) {
                console.error('No files were actually deleted');
                throw new Error('لم يتم حذف أي ملفات من التخزين');
            }
        }

        // 4. Delete the offer record from database
        const { error } = await supabase
            .from('travel_offers')
            .delete()
            .eq('id', offerId);

        if (error) throw error;

        await loadOffers();
    } catch (error) {
        console.error('Error deleting offer:', error);
        alert(`حدث خطأ أثناء حذف العرض: ${error.message}`);
    }
}


























// Open fullscreen image with fade animation
function openFullscreenImage(src) {
    const img = fullscreenViewer.querySelector('.fullscreen-image');
    img.src = src;

    fullscreenViewer.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

// Close fullscreen image
function closeFullscreen() {
    fullscreenViewer.classList.remove('active');
    document.body.style.overflow = ''; // Re-enable scrolling
}

// Function to clean up unused images from storage
async function cleanupUnusedImages() {
    try {
        // 1. Get all used images from the database
        const { data: offers, error: offersError } = await supabase
            .from('travel_offers')
            .select('title_card_image, sup_images_array');

        if (offersError) throw offersError;
        
        console.log('Total offers found:', offers.length);

        // 2. Create a Set of all used image paths (just the filenames)
        const usedImagePaths = new Set();
        
        // Function to extract just the filename from URL or path
        const extractFilename = (path) => {
            if (!path) return null;
            // Handle both full URLs and file paths
            try {
                // If it's a URL, parse it
                if (path.startsWith('http')) {
                    const url = new URL(path);
                    path = url.pathname;
                }
                // Get the last part after the last slash
                const filename = path.split('/').pop() || '';
                // Remove any query parameters or hashes
                return filename.split('?')[0].split('#')[0];
            } catch (e) {
                console.error('Error parsing path:', path, e);
                return null;
            }
        };
        
        console.log('Processing database entries for used images...');
        
        // Track all used images
        offers.forEach((offer, index) => {
            console.log(`\nProcessing offer ${index + 1}:`);
            
            // Process title card image
            if (offer.title_card_image) {
                const filename = extractFilename(offer.title_card_image);
                if (filename) {
                    console.log(`  Title card: ${filename}`);
                    usedImagePaths.add(filename);
                }
            }
            
            // Process images array
            if (offer.sup_images_array?.length > 0) {
                console.log(`  Found ${offer.sup_images_array.length} images in sup_images_array`);
                
                // Handle both array of arrays and array of objects format
                offer.sup_images_array.forEach((item, i) => {
                    try {
                        let imageUrl;
                        
                        // Check if it's an array [url, ...] format
                        if (Array.isArray(item) && item.length > 0) {
                            imageUrl = item[0]; // First element is the URL
                        } 
                        // Check if it's an object with url property
                        else if (item && typeof item === 'object' && item.url) {
                            imageUrl = item.url;
                        }
                        // If it's a direct URL string
                        else if (typeof item === 'string') {
                            imageUrl = item;
                        }
                        
                        if (imageUrl) {
                            const filename = extractFilename(imageUrl);
                            if (filename) {
                                console.log(`    Image ${i + 1}: ${filename}`);
                                usedImagePaths.add(filename);
                            }
                        }
                    } catch (e) {
                        console.error(`Error processing image at index ${i}:`, e);
                    }
                });
            }
        });
        
        console.log('\nTotal unique images found in database:', usedImagePaths.size);
        console.log('Used image filenames:', Array.from(usedImagePaths));

        console.log('Used images count:', usedImagePaths.size);

        // 3. List all files in the storage bucket
        const bucketName = 'offer-images';
        const folderName = 'boarding-saudi-travel';
        
        console.log(`\n=== Starting cleanup process ===`);
        console.log(`Bucket: ${bucketName}`);
        console.log(`Folder: ${folderName}`);
        
        // Recursive function to list all files in a folder and its subfolders
        const listAllFiles = async (folder = '') => {
            const allFiles = [];
            console.log(`Listing files in: ${folder || 'root'}`);
            
            try {
                const { data: files, error } = await supabase
                    .storage
                    .from(bucketName)
                    .list(folder);

                if (error) {
                    console.error(`Error listing files in ${folder}:`, error);
                    throw error;
                }

                for (const file of files) {
                    const fullPath = folder ? `${folder}/${file.name}` : file.name;
                    
                    if (file.metadata) {
                        // It's a file
                        allFiles.push({
                            ...file,
                            fullPath: fullPath,
                            filename: file.name // Store just the filename for comparison
                        });
                        console.log(`  Found file: ${file.name}`);
                    } else {
                        // It's a directory, recursively get its files
                        console.log(`  Found directory: ${file.name}, scanning...`);
                        const subFiles = await listAllFiles(fullPath);
                        allFiles.push(...subFiles);
                    }
                }
            } catch (error) {
                console.error(`Error processing folder ${folder}:`, error);
                throw error;
            }
            
            return allFiles;
        };
        
        // Get all files
        const files = await listAllFiles(folderName);
        console.log(`\nFound ${files.length} total files in storage`);

        // 4. Find and delete unused files
        const deletedFiles = [];
        const keptFiles = [];
        const errors = [];

        console.log('\n=== Processing files ===');
        console.log(`Found ${usedImagePaths.size} unique used images in database`);
        
        for (const file of files) {
            const filename = file.name;
            const isUsed = usedImagePaths.has(filename);
            
            const fileInfo = {
                path: file.fullPath,
                filename: filename,
                size: file.metadata?.size,
                type: file.metadata?.mimetype,
                isUsed: isUsed
            };
            
            if (!isUsed) {
                console.log(`\n[DELETE] ${file.fullPath}`);
                try {
                    const { error: deleteError } = await supabase
                        .storage
                        .from(bucketName)
                        .remove([file.fullPath]);
                    
                    if (deleteError) {
                        console.error(`  Error deleting:`, deleteError);
                        errors.push({ file: file.fullPath, error: deleteError });
                    } else {
                        console.log(`  Successfully deleted`);
                        deletedFiles.push(file.fullPath);
                    }
                } catch (err) {
                    console.error(`  Error processing:`, err);
                    errors.push({ file: file.fullPath, error: err });
                }
            } else {
                console.log(`[KEEP] ${file.fullPath} (used in database)`);
                keptFiles.push(file.fullPath);
            }
        }

        // Prepare the final result
        const result = {
            totalFiles: files.length,
            usedImages: usedImagePaths.size,
            unusedFiles: files.length - usedImagePaths.size,
            deletedFiles: deletedFiles.length,
            keptFiles: keptFiles.length,
            deletedFileNames: deletedFiles,
            keptFileNames: keptFiles,
            errors: errors.length,
            errorDetails: errors,
            usedImagePaths: Array.from(usedImagePaths) // For debugging
        };
        
        console.log('\n=== Cleanup Summary ===');
        console.log(`Total files processed: ${result.totalFiles}`);
        console.log(`Used images found: ${result.usedImages}`);
        console.log(`Files kept: ${result.keptFiles}`);
        console.log(`Files deleted: ${result.deletedFiles}`);
        console.log(`Errors: ${result.errors}`);
        
        return result;

    } catch (error) {
        console.error('Error in cleanupUnusedImages:', error);
        throw error;
    }
}

// Add this function to the window object so you can call it from the browser console
window.cleanupUnusedImages = cleanupUnusedImages;
cleanupUnusedImages();
// Close when clicking X or outside image
fullscreenViewer.addEventListener('click', (e) => {
    if (e.target.classList.contains('fullscreen-viewer') ||
        e.target.classList.contains('close-fullscreen')) {
        closeFullscreen();
    }
});

// Close with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fullscreenViewer.classList.contains('active')) {
        closeFullscreen();
    }
});

// Close with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fullscreenViewer.classList.contains('active')) {
        closeFullscreen();
    }
});

// Close with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fullscreenViewer.classList.contains('active')) {
        closeFullscreen();
    }
});