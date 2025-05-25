


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
        .order('created_at', { ascending: false });

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

        // Filter out invalid image URLs from the images array
        const validImages = offer.images ? offer.images.filter(img =>
            img && Array.isArray(img) && img[0] && (img[0].startsWith('http') || img[0].startsWith('/'))
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
    currentOffer.originalImages = [...data.images];

    data.images.forEach(image => {
        addImageField(image[0], image[1], true);
    });

    showModal();
    clickedButton.disabled = false;
    clickedButton.innerHTML = 'تعديل';
}

// Add event listeners for title card image
document.getElementById('title-card-image').addEventListener('change', function(e) {
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
        const images = [];
        const filesToDelete = new Set(); // Track files to delete
        let titleCardImageUrl = currentOffer?.title_card_image || null;

        // 1. Handle title card image
        if (titleCardFile) {
            // If there was an existing title card image, mark it for deletion
            if (currentOffer?.title_card_image) {
                try {
                    const urlObj = new URL(currentOffer.title_card_image);
                    const oldFilePath = urlObj.pathname.split('/offer-images/')[1];
                    filesToDelete.add(oldFilePath);
                } catch (e) {
                    console.error('Error parsing title card URL:', e);
                }
            }

            // Upload new title card image with consistent naming
            const fileExt = titleCardFile.name.split('.').pop();
            const fileName = `title-card-${offerId || 'new'}.${fileExt}`;
            const filePath = `boarding-saudi-travel/title-cards/${fileName}`;

            // Upload with overwrite option
            const { error: uploadError } = await supabase
                .storage
                .from('offer-images')
                .upload(filePath, titleCardFile, {
                    upsert: true, // This will overwrite if file exists
                    contentType: titleCardFile.type
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('offer-images')
                .getPublicUrl(filePath);

            titleCardImageUrl = publicUrl;
        }
        // If title card was removed
        else if (currentOffer?.removedTitleCardImage) {
            try {
                const urlObj = new URL(currentOffer.title_card_image);
                const filePath = urlObj.pathname.split('/offer-images/')[1];
                filesToDelete.add(filePath);
                titleCardImageUrl = null;
            } catch (e) {
                console.error('Error parsing title card URL:', e);
            }
        }

        // 2. Process content images
        for (const div of imageElements) {
            const fileInput = div.querySelector('input[type="file"]');
            const descInput = div.querySelector('input[type="text"]');
            const originalUrlInput = div.querySelector('input.original-image-url');

            // Case 1: Existing image that was replaced
            if (originalUrlInput && fileInput.files.length > 0) {
                const oldUrl = originalUrlInput.value;
                try {
                    const urlObj = new URL(oldUrl);
                    const oldFilePath = urlObj.pathname.split('/offer-images/')[1];
                    filesToDelete.add(oldFilePath);
                } catch (e) {
                    console.error('Error parsing image URL:', e);
                }

                // Upload new image with same name (overwrite)
                const file = fileInput.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = oldUrl.split('/').pop(); // Keep same filename
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

                images.push([publicUrl, descInput.value]);
            }
            // Case 2: Existing image not replaced
            else if (originalUrlInput) {
                images.push([originalUrlInput.value, descInput.value]);
            }
            // Case 3: New image
            else if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const filePath = `boarding-saudi-travel/${fileName}`;

                const { error: uploadError } = await supabase
                    .storage
                    .from('offer-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase
                    .storage
                    .from('offer-images')
                    .getPublicUrl(filePath);

                images.push([publicUrl, descInput.value]);
            }
        }

        // 3. Handle explicitly removed images
        if (currentOffer?.removedImages) {
            for (const url of currentOffer.removedImages) {
                try {
                    const urlObj = new URL(url);
                    const filePath = urlObj.pathname.split('/offer-images/')[1];
                    filesToDelete.add(filePath);
                } catch (e) {
                    console.error('Error parsing removed image URL:', e);
                }
            }
        }

        // 4. Delete all marked files
        if (filesToDelete.size > 0) {
            const { error: deleteError } = await supabase
                .storage
                .from('offer-images')
                .remove([...filesToDelete]);

            if (deleteError) {
                console.error('Error deleting old files:', deleteError);
                // Continue anyway - this isn't critical enough to fail the whole operation
            }
        }

        // 5. Save offer data
        const offerData = {
            title,
            images,
            title_card_image: titleCardImageUrl,
        };

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