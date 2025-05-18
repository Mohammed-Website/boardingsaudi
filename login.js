


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

        // Filter out invalid image URLs
        const validImages = offer.images.filter(img =>
            img[0] && (img[0].startsWith('http') || img[0].startsWith('/'))
        );

        offerCard.innerHTML = `
            <div class="card-body">
                <h3 class="offer-title">${offer.title}</h3>
                <div class="images-preview">
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

// Edit existing offer with individual image replacement and removal
async function editOffer(offerId, event) {
    // Get the clicked button from the event
    const clickedButton = event.currentTarget;

    // Show spinner on the clicked button
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

    imagesContainer.innerHTML = '';

    // Store original images for cleanup
    currentOffer.originalImages = [...data.images];

    // Add image fields for each existing image
    data.images.forEach(image => {
        addImageField(image[0], image[1], true); // true = isExistingImage
    });

    showModal();

    // Restore button state
    clickedButton.disabled = false;
    clickedButton.innerHTML = 'تعديل';
}

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
            fileLabel.textContent = file.name;

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

            previewImg.onload = function() {
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

    saveOfferBtn.disabled = true;
    saveOfferBtn.innerHTML = '<span class="spinner"></span> جاري الحفظ';

    try {
        const images = [];
        const imagesToDelete = [];
        const imageElements = document.querySelectorAll('#images-container > div');

        // 1. Track manually removed images
        if (currentOffer?.removedImages?.length > 0) {
            imagesToDelete.push(...currentOffer.removedImages);
        }

        // 2. Process each remaining image field
        for (const div of imageElements) {
            const fileInput = div.querySelector('input[type="file"]');
            const descInput = div.querySelector('input[type="text"]');
            const originalUrlInput = div.querySelector('input.original-image-url');

            // If this was an existing image that was replaced
            if (originalUrlInput && fileInput.files.length > 0) {
                imagesToDelete.push(originalUrlInput.value);
            }
            // If this was an existing image that wasn't replaced
            else if (originalUrlInput && fileInput.files.length === 0) {
                images.push([originalUrlInput.value, descInput.value]);
                continue;
            }

            // Handle new image upload
            if (fileInput.files.length > 0 && descInput.value) {
                const file = fileInput.files[0];
                const description = descInput.value;

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

                images.push([publicUrl, description]);
            }
        }

        if (images.length === 0 && imageElements.length === 0) {
            alert('يجب إضافة صورة واحدة على الأقل');
            return;
        }

        // 3. Delete all images marked for removal
        if (imagesToDelete.length > 0) {
            const filesToDelete = imagesToDelete.map(url => {
                try {
                    const urlObj = new URL(url);
                    return urlObj.pathname.split('/offer-images/')[1];
                } catch (e) {
                    console.error('Invalid URL:', url);
                    return null;
                }
            }).filter(Boolean);

            if (filesToDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .storage
                    .from('offer-images')
                    .remove(filesToDelete);

                if (deleteError) console.error('Error deleting images:', deleteError);
            }
        }

        // 4. Prepare and save offer data
        const offerData = {
            title,
            images
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

        // Delete images from storage
        if (offer.images && offer.images.length > 0) {
            const filesToDelete = offer.images.map(img => {
                const url = new URL(img[0]);
                return url.pathname.split('/').pop();
            });

            const { error: deleteError } = await supabase
                .storage
                .from('offer-images')
                .remove(filesToDelete);

            if (deleteError) throw deleteError;
        }

        // Delete the offer record
        const { error } = await supabase
            .from('travel_offers')
            .delete()
            .eq('id', offerId);

        if (error) throw error;

        await loadOffers();
    } catch (error) {
        console.error('Error deleting offer:', error);
        alert('حدث خطأ أثناء حذف العرض');
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