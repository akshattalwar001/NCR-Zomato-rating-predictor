const API_URL = 'https://kingthor11-restaurant-rating-api.hf.space';

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = savedTheme || systemTheme;
    
    document.documentElement.setAttribute('data-theme', theme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Slider Management
function initializeSlider() {
    const slider = document.getElementById('cuisine_count');
    const valueDisplay = document.getElementById('cuisine_count_value');
    const trackFill = document.getElementById('slider-track-fill');
    
    function updateSlider() {
        const value = slider.value;
        const min = slider.min;
        const max = slider.max;
        const percentage = ((value - min) / (max - min)) * 100;
        
        // Update value display
        valueDisplay.textContent = value;
        
        // Update track fill
        trackFill.style.width = percentage + '%';
    }
    
    // Initialize slider
    updateSlider();
    
    // Handle input changes
    slider.addEventListener('input', updateSlider);
    slider.addEventListener('change', updateSlider);
}

// Form Event Listeners
function initializeFormEvents() {
    const cuisineSlider = document.getElementById('cuisine_count');
    const cuisineValue = document.getElementById('cuisine_count_value');

    cuisineSlider.addEventListener('input', function() {
        cuisineValue.textContent = this.value;
    });

    const mainCuisineSelect = document.getElementById('main_cuisine');
    mainCuisineSelect.addEventListener('change', function() {
        const northIndianCheckbox = document.getElementById('is_north_indian');
        const chineseCheckbox = document.getElementById('is_chinese');
        const fastFoodCheckbox = document.getElementById('is_fast_food');

        northIndianCheckbox.checked = this.value === 'North Indian';
        chineseCheckbox.checked = this.value === 'Chinese';
        fastFoodCheckbox.checked = this.value === 'Fast Food';
    });
}

// Details Panel Toggle
function toggleDetails() {
    const details = document.getElementById('detailsSection');
    const toggleBtn = document.getElementById('detailsToggle');
    details.classList.toggle('show');
    toggleBtn.classList.toggle('active');
}

// Error Display
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

// Star Rating Display
function updateStars(rating) {
    const starsContainer = document.querySelector('.rating-stars');
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    let starsHTML = '';

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }

    // Add half star if needed
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }

    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }

    starsContainer.innerHTML = starsHTML;
}

// Form Submission Handler
function initializePredictionForm() {
    document.getElementById('predictionForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = e.target.querySelector('.predict-button');
        const buttonText = submitBtn.querySelector('span');
        const originalText = buttonText.textContent;
        
        submitBtn.disabled = true;
        buttonText.textContent = 'Predicting...';

        const formData = {
            pricing: parseInt(document.getElementById('pricing').value),
            locality: document.getElementById('locality').value,
            main_cuisine: document.getElementById('main_cuisine').value,
            cuisine_count: parseInt(document.getElementById('cuisine_count').value),
            delivery_count: parseInt(document.getElementById('delivery_count').value),
            is_north_indian: document.getElementById('is_north_indian').checked,
            is_chinese: document.getElementById('is_chinese').checked,
            is_fast_food: document.getElementById('is_fast_food').checked
        };

        try {
            const response = await fetch(`${API_URL}/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('prediction failed. make sure api is running at http://localhost:8000');
            }

            const result = await response.json();

            const rating = result.predicted_rating.toFixed(2);
            document.getElementById('ratingDisplay').textContent = rating;
            updateStars(parseFloat(rating));

            let categoryText = '';
            if (result.predicted_rating >= 4.5) {
                categoryText = 'excellent - this restaurant is predicted to have outstanding ratings';
            } else if (result.predicted_rating >= 4.3) {
                categoryText = 'very good - customers are likely to be very satisfied';
            } else if (result.predicted_rating >= 4.1) {
                categoryText = 'good - above average restaurant with solid ratings';
            } else {
                categoryText = 'average - room for improvement in customer satisfaction';
            }
            document.getElementById('ratingCategory').textContent = categoryText;

            const summary = result.input_summary;
            document.getElementById('inputSummary').innerHTML = `
                <p>price category: ${summary.price_category} (₹${summary.pricing})</p>
                <p>location: ${summary.locality}</p>
                <p>main cuisine: ${summary.main_cuisine}</p>
                <p>cuisines offered: ${summary.cuisine_count}</p>
                <p>delivery orders: ${summary.delivery_count}</p>
                <p>high delivery volume: ${summary.high_delivery_volume ? 'yes' : 'no'}</p>
            `;

            const localityMapping = {
                ' Baani Square, Sector 50, Gurgaon': 0, 
                ' Chanakyapuri, New Delhi': 1, 
                ' Connaught Place, New Delhi': 2, 
                ' Cyber Hub, DLF Cyber City, Gurgaon': 3, 
                ' Delhi University-GTB Nagar, New Delhi': 4, 
                ' Greater Kailash 2 (GK2), New Delhi': 5, 
                ' Hauz Khas, New Delhi': 6, 
                ' Indirapuram, Ghaziabad': 7, 
                ' Janakpuri, New Delhi': 8, 
                ' Karkardooma, New Delhi': 9, 
                ' Karol Bagh, New Delhi': 10, 
                ' Khan Market, New Delhi': 11, 
                ' Malviya Nagar, New Delhi': 12, 
                ' NIT, Faridabad': 13, 
                ' Paschim Vihar, New Delhi': 14, 
                ' Pitampura, New Delhi': 15, 
                ' Punjabi Bagh, New Delhi': 16, 
                ' Raj Nagar, Ghaziabad': 17, 
                ' Rajouri Garden, New Delhi': 18, 
                ' Rohini, New Delhi': 19, 
                ' Safdarjung, New Delhi': 20, 
                ' Sector 18, Noida': 21, 
                ' Sector 29, Gurgaon': 22, 
                ' Sector 72, Noida': 23, 
                ' Vijay Nagar, New Delhi': 24, 
                'Other': 25
            };
            
            const cuisineMapping = {
                'Asian': 0, 'Bakery': 1, 'Burger': 2, 'Cafe': 3, 
                'Chinese': 4, 'Continental': 5, 'Desserts': 6, 'Fast Food': 7, 
                'Finger Food': 8, 'Italian': 9, 'Mughlai': 10, 'North Indian': 11, 
                'Other': 12, 'Pizza': 13, 'South Indian': 14, 'Street Food': 15
            };

            const localityCode = localityMapping[formData.locality];
            const cuisineCode = cuisineMapping[formData.main_cuisine];
            const priceCatCode = formData.pricing <= 750 ? 0 : formData.pricing <= 1750 ? 1 : 2;

            document.getElementById('encodedValues').innerHTML = `
                <p>locality code: ${localityCode}</p>
                <p>cuisine code: ${cuisineCode}</p>
                <p>price category code: ${priceCatCode}</p>
            `;

            document.getElementById('resultSection').classList.add('show');
            document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            showError(error.message);
        } finally {
            submitBtn.disabled = false;
            buttonText.textContent = originalText;
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeSlider();
    initializeFormEvents();
    initializePredictionForm();
});