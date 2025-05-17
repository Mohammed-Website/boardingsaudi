



function toggleSidebar() {
    const sidebar = document.getElementById("mughader_mobile_sidebar");
    const overlay = document.getElementById("mughader_sidebar_overlay");

    if (sidebar.style.right === "0px") {
        closeSidebar();
    } else {
        sidebar.style.right = "0px"; // Show sidebar
        overlay.classList.add("active"); // Show overlay
        document.addEventListener("click", outsideClickListener); // Add event listener
        window.removeEventListener("scroll", handleScroll); // Disable scroll event
    }
}

function closeSidebar() {
    const sidebar = document.getElementById("mughader_mobile_sidebar");
    const overlay = document.getElementById("mughader_sidebar_overlay");

    sidebar.style.right = "-250px"; // Hide sidebar
    overlay.classList.remove("active"); // Hide overlay
    document.removeEventListener("click", outsideClickListener); // Remove event listener
    window.addEventListener("scroll", handleScroll); // Re-enable scroll event
}

function outsideClickListener(event) {
    const sidebar = document.getElementById("mughader_mobile_sidebar");

    // Check if the clicked target is outside the sidebar and the menu button
    if (!sidebar.contains(event.target) && !event.target.closest(".mughader_mobile_menu_icon")) {
        closeSidebar();
    }
}

// Scroll event handler
function handleScroll() {
    const currentScrollPosition = window.scrollY;
    const header = document.getElementById("mughader_header");

    if (currentScrollPosition > lastScrollPosition) {
        // Scrolling down
        header.classList.add("hidden");
    } else {
        // Scrolling up
        header.classList.remove("hidden");
    }

    lastScrollPosition = currentScrollPosition;
}

// Attach scroll event initially
let lastScrollPosition = 0;
window.addEventListener("scroll", handleScroll);










/* Code to reload the sounds to make sure there is no latency */
let clickSoundEffect = new Audio('click.ogg');
clickSoundEffect.preload = 'auto';

let successSoundEffect = new Audio('success.ogg');
successSoundEffect.preload = 'auto';

let errorSoundEffect = new Audio('error.ogg');
errorSoundEffect.preload = 'auto';

let isSoundEffectCooldown = false; // Flag to manage cooldown

function playSoundEffect(soundName) {

    if (isSoundEffectCooldown) return; // If in cooldown, do nothing

    isSoundEffectCooldown = true; // Set cooldown
    setTimeout(() => {
        isSoundEffectCooldown = false; // Reset cooldown after 150 milliseconds
    }, 150);

    // Play a sound effect only if the website is not muted
    let soundEffect;

    if (soundName === 'click') {
        soundEffect = clickSoundEffect;
    } else if (soundName === 'success') {
        soundEffect = successSoundEffect;
    } else if (soundName === 'error') {
        soundEffect = errorSoundEffect;
    }

    if (soundEffect) {
        soundEffect.currentTime = 0; // Ensure the audio plays from the start
        soundEffect.play();
    }
}













// Handle Dynamic Text Direction
document.querySelectorAll('.mughader_dynamic_direction_input_class').forEach(input => {
    input.addEventListener('input', function () {
        let firstChar = this.value.trim().charAt(0);

        if (firstChar) {
            // Check if the first character is Arabic
            if (firstChar.match(/[\u0600-\u06FF]/)) {
                this.style.direction = 'rtl';
            } else {
                this.style.direction = 'ltr';
            }
        }
    });
});




























scrollToWhoAreWe = function (elementIdName) {
    const targetDiv = document.getElementById(elementIdName);
    if (targetDiv) {
        const targetPosition = targetDiv.getBoundingClientRect().top + window.scrollY;
        const windowHeight = window.innerHeight;
        const scrollToPosition = targetPosition - (windowHeight / 2) + (targetDiv.clientHeight / 2);

        window.scrollTo({
            top: scrollToPosition,
            behavior: "smooth"
        });
    }
}


function scrollToMiddleOfElement(className) {
    const element = document.querySelector(`.${className}`);
    if (element) {
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.scrollY;
        const middlePosition = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);

        window.scrollTo({
            top: middlePosition,
            behavior: 'smooth'
        });
    }
}


















































// Initialize Bootstrap modal variables (don't initialize yet)
let imageModal;
let modalImage;
let modalImageTitle;



// Main function to load and display offers
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize modal elements after DOM is loaded
        modalImage = document.getElementById('modalImage');
        modalImageTitle = document.getElementById('modalImageTitle');
        const modalElement = document.getElementById('imageModal');
        
        if (modalElement) {
            imageModal = new bootstrap.Modal(modalElement);
        } else {
            console.error('Modal element not found');
        }

        // Fetch data from Supabase
        const { data: offers, error } = await supabase
            .from('travel_offers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (offers.length === 0) {
            showNoOffersMessage();
            return;
        }

        // Transform data to match your expected structure
        const transformedData = offers.map(offer => {
            const transformed = { title: offer.title };
            offer.images.forEach((image, index) => {
                transformed[`image_${index + 1}`] = image;
            });
            return transformed;
        });

        createTitleCards(transformedData);

        // Activate first card by default
        if (transformedData.length > 0) {
            document.querySelector('.title_card').click();
        }
    } catch (error) {
        console.error('Error loading offers:', error);
        showErrorMessage();
    }
});

// Function to create title cards
function createTitleCards(dataArray) {
    const section = document.getElementById("scrollable_cards_section_id");
    section.innerHTML = '';

    // Add main section title
    const mainTitle = document.createElement('h2');
    mainTitle.className = 'scrollable_section_title';
    mainTitle.textContent = 'عروضنا الخاصة';
    section.appendChild(mainTitle);

    const titlesContainer = document.createElement('div');
    titlesContainer.className = 'title_cards_container';

    dataArray.forEach((data, index) => {
        const titleCard = document.createElement('div');
        titleCard.className = 'title_card';
        titleCard.dataset.index = index;

        // Create card image (using first image from the set)
        const firstImageKey = Object.keys(data).find(key => key.startsWith('image_'));
        if (firstImageKey) {
            const [src, alt] = data[firstImageKey];
            const img = document.createElement('img');
            img.src = src;
            img.alt = alt;
            img.loading = "lazy"; // Add lazy loading
            titleCard.appendChild(img);
        }

        // Create card title
        const title = document.createElement('h3');
        title.textContent = data.title.replace(/^عروض\s*/g, '');
        titleCard.appendChild(title);

        titleCard.addEventListener('click', () => {
            // Remove active class from all cards
            document.querySelectorAll('.title_card').forEach(card => {
                card.classList.remove('active');
            });
            // Add active class to clicked card
            titleCard.classList.add('active');
            // Show images for this title
            showImagesForTitle(data);
        });

        titlesContainer.appendChild(titleCard);
    });

    section.appendChild(titlesContainer);
}

// Function to show images for a selected title
function showImagesForTitle(data) {
    let imagesContainer = document.getElementById('scrollable_cards_container_id');

    // Check if animation is in progress
    const animatingRow = imagesContainer?.querySelector('.scrollable_cards_row[data-animating]');
    if (animatingRow) return;

    let existingScrollableRow = imagesContainer?.querySelector('.scrollable_cards_row');

    // Create container if it doesn't exist
    if (!imagesContainer) {
        imagesContainer = document.createElement('div');
        imagesContainer.id = 'scrollable_cards_container_id';
        imagesContainer.style.opacity = '0';
        imagesContainer.style.transition = 'opacity 0.3s ease';

        // Add section title
        const sectionTitle = document.createElement('h2');
        sectionTitle.className = 'scrollable_section_title';
        sectionTitle.textContent = data.title;
        imagesContainer.appendChild(sectionTitle);

        document.getElementById("scrollable_cards_section_id").appendChild(imagesContainer);
    } else {
        // Update existing title
        const sectionTitle = imagesContainer.querySelector('.scrollable_section_title');
        if (sectionTitle) {
            sectionTitle.textContent = data.title;
        }
    }

    // Create new row (initially hidden)
    const newScrollableRow = document.createElement('div');
    newScrollableRow.className = 'scrollable_cards_row';
    newScrollableRow.style.opacity = '0';
    newScrollableRow.setAttribute('data-animating', 'in');

    // Add images to the row
    Object.keys(data).forEach((key) => {
        if (key.startsWith('image_')) {
            const [src, alt] = data[key];

            const card = document.createElement('div');
            card.className = 'scrollable_card';

            const img = document.createElement('img');
            img.src = src;
            img.alt = alt;
            img.loading = "lazy";
            img.addEventListener('click', () => showFullScreenImage(src, alt));

            const caption = document.createElement('p');
            caption.className = 'mt-2';
            caption.textContent = alt;

            card.appendChild(img);
            card.appendChild(caption);
            newScrollableRow.appendChild(card);
        }
    });

    // Animation handling
    if (existingScrollableRow) {
        existingScrollableRow.setAttribute('data-animating', 'out');
        existingScrollableRow.style.opacity = '0';

        setTimeout(() => {
            existingScrollableRow.remove();
            imagesContainer.appendChild(newScrollableRow);

            setTimeout(() => {
                newScrollableRow.style.opacity = '1';
                newScrollableRow.removeAttribute('data-animating');
            }, 10);
        }, 200);
    } else {
        imagesContainer.appendChild(newScrollableRow);
        setTimeout(() => {
            newScrollableRow.style.opacity = '1';
            imagesContainer.style.opacity = '1';
            newScrollableRow.removeAttribute('data-animating');
        }, 10);
    }

    // Smooth scroll to container
    imagesContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show image in fullscreen modal
function showFullScreenImage(src, alt) {
    if (!modalImage || !modalImageTitle || !imageModal) {
        console.error('Modal elements not initialized');
        return;
    }
    
    modalImage.src = src;
    modalImage.alt = alt;
    modalImageTitle.textContent = alt;
    
    // Check if modal is initialized properly
    if (imageModal && typeof imageModal.show === 'function') {
        imageModal.show();
    } else {
        console.error('Bootstrap modal not initialized properly');
        // Fallback - at least show the image
        window.open(src, '_blank');
    }
}

// Error handling functions
function showNoOffersMessage() {
    const section = document.getElementById("scrollable_cards_section_id");
    section.innerHTML = `
        <div class="alert alert-info text-center">
            لا توجد عروض متاحة حالياً
        </div>
    `;
}

function showErrorMessage() {
    const section = document.getElementById("scrollable_cards_section_id");
    section.innerHTML = `
        <div class="alert alert-danger text-center">
            حدث خطأ في تحميل العروض. يرجى المحاولة مرة أخرى لاحقاً
        </div>
    `;
}






function openFullScreenImage(src, text) {

    // Disable document scrolling
    document.body.style.overflow = 'hidden';


    /* Create the sull screen container div */
    const fullScreenDiv = document.createElement('div');
    fullScreenDiv.className = 'full_screen_container';

    // Add animation class for fade-in effect
    setTimeout(() => fullScreenDiv.classList.add('visible'), 10);

    const exitButton = document.createElement('button');
    exitButton.innerText = 'عودة';
    exitButton.className = 'exit_button';
    exitButton.addEventListener('click', closeFullScreenImage);
    fullScreenDiv.appendChild(exitButton);

    const title = document.createElement('h2');
    title.innerText = text;
    title.className = 'full_screen_title';
    fullScreenDiv.appendChild(title);

    // Full-screen image
    const fullScreenImage = document.createElement('img');
    fullScreenImage.src = src;
    fullScreenImage.className = 'full_screen_image';
    fullScreenDiv.appendChild(fullScreenImage);

    // WhatsApp button
    const whatsappButton = document.createElement('a');
    whatsappButton.className = 'whatsapp_button';
    whatsappButton.innerText = 'إرسال هذا العرض';
    whatsappButton.href = `https://wa.me/+966506411444?text=💎%20طلب%20حجز%20عرض%20جديد%20💎%0A%0Aسلام%20عليكم،%20حاب%20أسأل%20عن%20عرض%0A*${encodeURIComponent(text)}*%0Aوحاب%20أعرف%20تفاصيل%20أكثر%20عن%20عروضكم%20المشابهة.%0A%0A🔗%20رابط%20صورة%20العرض:%0Ahttps://mohammed-website.github.io/boardingsauditravel/${encodeURIComponent(src)}%0A%0Aبإنتظار%20ردكم%20وشكرًا%20لكم`;
    fullScreenDiv.appendChild(whatsappButton);

    // Close on background click
    fullScreenDiv.addEventListener('click', (e) => {
        if (e.target === fullScreenDiv) closeFullScreenImage();
    });

    document.body.appendChild(fullScreenDiv);

    // Smooth close function
    function closeFullScreenImage() {
        const fullScreenDiv = document.querySelector('.full_screen_container');
        if (!fullScreenDiv) return;


        fullScreenDiv.style.opacity = '0';


        setTimeout(() => {
            fullScreenDiv.remove();
            document.body.style.overflow = '';
        }, 500);
    }
}

































document.getElementById("indoforall_comment_form").addEventListener("submit", async function (event) {
    event.preventDefault();
    console.log('Hi')
    const button = document.querySelector("#indoforall_comment_form button[type='submit']");

    // Disable button to prevent multiple submissions
    button.disabled = true;
    button.style.background = "gray";
    button.innerText = "جاري النشر";

    // Get input values
    let reviewer_name = document.getElementById("indoforall_comment_username").value.trim();
    let comment = document.getElementById("indoforall_comment_text").value.trim();
    let stars = parseInt(document.getElementById("indoforall_comment_stars").value);
    let review_date = new Date().toISOString().split("T")[0]; // format: YYYY-MM-DD

    try {
        // Get the current highest ID
        let { data: existingReviews, error: selectError } = await supabase
            .from("customers_comments")
            .select("id")
            .order("id", { ascending: false })
            .limit(1);

        if (selectError) throw selectError;

        let nextId = existingReviews.length ? existingReviews[0].id + 1 : 1;

        // Insert new review manually with the next ID
        const { error: insertError } = await supabase.from("customers_comments").insert([{
            id: nextId,
            review_date,
            reviewer_name,
            comment,
            stars
        }]);

        if (insertError) throw insertError;

        document.getElementById("indoforall_comment_form").reset();
        await fetchReviews(); // Refresh UI
        showSuccessNotification();

    } catch (error) {
        console.error("Error submitting comment:", error.message);
    } finally {
        // Re-enable button
        button.disabled = false;
        button.style.background = "linear-gradient(to top, rgb(106, 75, 31), rgb(194, 156, 102))";
        button.innerText = "إرسال";
    }
});

// Function to Fetch and Display Reviews
async function fetchReviews() {
    try {
        const { data, error } = await supabase
            .from('customers_comments')
            .select('*')
            .order('review_date', { ascending: false });

        if (error) throw error;

        let indoforall_clint_rate_area = document.getElementById("indoforall_clint_rate_area");
        indoforall_clint_rate_area.innerHTML = ""; // Clear old reviews

        data.forEach(item => {
            const { review_date, reviewer_name, comment, stars } = item;

            if (!comment.trim()) return;

            let clintRateDiv = document.createElement("div");
            clintRateDiv.classList.add("indoforall_rate_div");

            clintRateDiv.innerHTML = `
                <div class="indoforall_clint_rate_date_div">
                    <h3>${review_date}</h3>
                </div>
                <div class="indoforall_clint_rate_info_div">
                    <img src="مكتب-سياحي/مكتب-سياحي.webp" alt="وقت الصعود للسفر والسياحة - مكتب سياحي" title="وقت الصعود للسفر والسياحة - مكتب سياحي">
                    <h4>${reviewer_name}</h4>
                </div>
                <div class="indoforall_clint_rate_comment_div">
                    <h5>${comment}</h5>
                </div>
                <div class="indoforall_clint_rate_star_div">
                    ${"★".repeat(stars)}${"☆".repeat(5 - stars)}
                </div>
            `;

            indoforall_clint_rate_area.appendChild(clintRateDiv);
        });

    } catch (error) {
        console.error("Error fetching reviews:", error.message);
    }
}

// Function to Show Floating Success Notification
function showSuccessNotification() {
    let notification = document.getElementById("indoforall_success_notification");
    notification.style.display = "block";

    setTimeout(() => {
        notification.style.opacity = "1";
        notification.style.transform = "translateX(-50%) translateY(0px)";
    }, 10);

    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateX(-50%) translateY(10px)";
        setTimeout(() => {
            notification.style.display = "none";
        }, 400);
    }, 3000);
}

// Fetch Reviews on Page Load
document.addEventListener('DOMContentLoaded', fetchReviews);


















/* Function to trach the first inserted letter in the inputs with the class name of "mughader_dynamic_direction_input_class" to set their direction value */
document.querySelectorAll('.mughader_dynamic_direction_input_class').forEach(input => {
    input.addEventListener('input', function () {
        let firstChar = this.value.trim().charAt(0);

        if (firstChar) {
            // Check if the first character is Arabic
            if (firstChar.match(/[\u0600-\u06FF]/)) {
                this.style.direction = 'rtl';
            } else {
                this.style.direction = 'ltr';
            }
        }
    });
});



/* Insert new click data in the google sheet */
function insertNewClick(columnName) {
    const scriptURL = "https://script.google.com/macros/s/AKfycbyU-p7z3tHF0I1K0GCmjcRG3CaG0NPkGyMPTvhlGPISxwIYrt6ueD7O2iHSza9SPOP3/exec";

    // Trim the column name before passing it
    fetch(`${scriptURL}?columnName=${encodeURIComponent(columnName.trim())}`)
        .then(response => response.text())
        .then(data => console.log("Response:", data))
        .catch(error => console.error("Error:", error));
}

/* Open WhatsApp */
openWhatsAppNumber = function () {

    insertNewClick('alseef.com');

    const whatsappNumber = "+966506411444";
    const message = encodeURIComponent('سلام عليكم ورحمة الله وبركاته'); // Optional pre-filled message
    const url = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(url, "_blank"); // Opens in a new tab
}



