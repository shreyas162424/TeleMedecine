// Utility: Debounce function to limit event handler frequency
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Input Validation: Login
function validateLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const usernameError = document.getElementById('username-error');
    const passwordError = document.getElementById('password-error');
    let valid = true;

    usernameError.style.display = 'none';
    passwordError.style.display = 'none';

    if (!username || username.length < 3) {
        usernameError.textContent = 'Username must be at least 3 characters.';
        usernameError.style.display = 'block';
        valid = false;
    }

    if (!password || password.length < 6) {
        passwordError.textContent = 'Password must be at least 6 characters.';
        passwordError.style.display = 'block';
        valid = false;
    }

    return valid;
}

// Input Validation: Register
function validateRegister() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const usernameError = document.getElementById('username-error');
    const passwordError = document.getElementById('password-error');
    let valid = true;

    usernameError.style.display = 'none';
    passwordError.style.display = 'none';

    if (!username || username.length < 3) {
        usernameError.textContent = 'Username must be at least 3 characters.';
        usernameError.style.display = 'block';
        valid = false;
    }

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*])[A-Za-z\d@#$%^&*]{8,}$/;
    if (!passwordPattern.test(password)) {
        passwordError.textContent = 'Password must be 8+ characters, with uppercase, lowercase, digit, and special character.';
        passwordError.style.display = 'block';
        valid = false;
    }

    return valid;
}

// Input Validation: OTP
function validateOTP() {
    const otp = document.getElementById('otp').value;
    const otpError = document.getElementById('otp-error');
    let valid = true;

    otpError.style.display = 'none';

    if (!otp || otp.length !== 6) {
        otpError.textContent = 'OTP must be 6 characters.';
        otpError.style.display = 'block';
        valid = false;
    }

    return valid;
}

// Dark Mode Toggle
function initializeDarkMode() {
    const darkModeToggle = document.querySelector('#dark-mode-toggle');
    if (!darkModeToggle) {
        console.warn('Dark mode toggle not found');
        return;
    }

    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark');
    }

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('darkMode', document.body.classList.contains('dark'));
        gsap.to('body', { backgroundColor: document.body.classList.contains('dark') ? '#111827' : '#FFFFFF', duration: 0.3 });
    });
}

// Services Carousel
function initializeServicesCarousel() {
    const servicesItems = document.querySelectorAll('.services-carousel-item');
    const servicesPrevBtn = document.querySelector('.services-carousel-nav .services-prev');
    const servicesNextBtn = document.querySelector('.services-carousel-nav .services-next');
    if (servicesItems.length && servicesPrevBtn && servicesNextBtn) {
        let currentServicesIndex = 0;
        const totalServicesItems = servicesItems.length;

        const showServicesItem = (index) => {
            servicesItems.forEach((item, i) => {
                item.classList.toggle('active', i === index);
                if (i === index) {
                    gsap.fromTo(item, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.1  , ease: 'power2.out' });
                } else {
                    item.classList.remove('active');
                }
            });

            if (window.innerWidth >= 768) {
                const transformValue = -(index * (100 / 3));
                gsap.to('.services-carousel-inner', {
                    transform: `translateX(${transformValue}%)`,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            }
        };

        servicesPrevBtn.addEventListener('click', () => {
            currentServicesIndex = (currentServicesIndex - 1 + totalServicesItems) % totalServicesItems;
            showServicesItem(currentServicesIndex);
        });

        servicesNextBtn.addEventListener('click', () => {
            currentServicesIndex = (currentServicesIndex + 1) % totalServicesItems;
            showServicesItem(currentServicesIndex);
        });

        setInterval(() => {
            currentServicesIndex = (currentServicesIndex + 1) % totalServicesItems;
            showServicesItem(currentServicesIndex);
        }, 5000);

        showServicesItem(currentServicesIndex);

        window.addEventListener('resize', () => {
            showServicesItem(currentServicesIndex);
        });
    } else {
        console.warn('Services carousel elements not found');
    }
}

// Testimonials Carousel
function initializeTestimonialsCarousel() {
    const carouselItems = document.querySelectorAll('.carousel-item');
    const prevBtn = document.querySelector('.carousel-nav .prev');
    const nextBtn = document.querySelector('.carousel-nav .next');
    if (carouselItems.length && prevBtn && nextBtn) {
        let currentIndex = 0;
        const showItem = (index) => {
            carouselItems.forEach((item, i) => {
                item.classList.toggle('active', i === index);
                item.classList.toggle('hidden', i !== index);
                if (i === index) {
                    gsap.fromTo(item, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' });
                }
            });
        };

        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + carouselItems.length) % carouselItems.length;
            showItem(currentIndex);
        });

        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % carouselItems.length;
            showItem(currentIndex);
        });

        setInterval(() => {
            currentIndex = (currentIndex + 1) % carouselItems.length;
            showItem(currentIndex);
        }, 5000);

        showItem(currentIndex);
    } else {
        console.warn('Testimonials carousel elements not found');
    }
}

// Table Filtering
function initializeTableFiltering() {
    const tableSearch = document.querySelector('#table-search');
    const tableFilter = document.querySelector('#table-filter');
    if (tableSearch && tableFilter) {
        const filterTable = debounce(() => {
            const searchText = tableSearch.value.toLowerCase();
            const filterStatus = tableFilter.value;
            const rows = document.querySelectorAll('table tbody tr');
            rows.forEach((row, index) => {
                const patient = row.cells[0].textContent.toLowerCase();
                const status = row.cells[2].textContent;
                const matchesSearch = patient.includes(searchText);
                const matchesFilter = filterStatus === 'all' || status === filterStatus;
                row.style.display = matchesSearch && matchesFilter ? '' : 'none';
                if (matchesSearch && matchesFilter) {
                    gsap.fromTo(row, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, delay: index * 0.05 });
                }
            });
        }, 300);
        tableSearch.addEventListener('input', filterTable);
        tableFilter.addEventListener('change', filterTable);
    } else {
        console.warn('Table search or filter elements not found');
    }
}

// Chat Functionality
function initializeChat() {
    const sendMessageBtn = document.querySelector('#send-message');
    const chatInput = document.querySelector('#chat-input');
    if (sendMessageBtn && chatInput) {
        sendMessageBtn.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message) {
                addChatMessage({ username: 'You', message });
                chatInput.value = '';
                setTimeout(() => {
                    addChatMessage({ username: 'MediCare Assistant', message: 'How can I assist you today?' });
                }, 1000);
            }
        });
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessageBtn.click();
            }
        });
    } else {
        console.warn('Chat elements not found');
    }
}

function addChatMessage({ username, message }) {
    const chatMessages = document.querySelector('#chat-messages');
    if (chatMessages) {
        const messageEl = document.createElement('div');
        messageEl.textContent = `${username}: ${message}`;
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        gsap.from(messageEl, {
            opacity: 0,
            x: 20,
            duration: 0.3,
            ease: 'power2.out'
        });
    }
}

// Password Toggle
function initializePasswordToggle() {
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.querySelector('#password');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
            gsap.fromTo(togglePassword, { scale: 1 }, { scale: 1.2, duration: 0.2, yoyo: true, repeat: 1 });
        });
    } else {
        console.warn('Password toggle or input not found');
    }
}

// Loading Spinner
function initializeSpinner() {
    const spinner = document.querySelector('#loading-spinner');
    if (spinner) {
        spinner.classList.add('hidden');
        console.log('Spinner initialized');
    } else {
        console.warn('Loading spinner not found');
    }
}

function showLoadingSpinner() {
    const spinner = document.querySelector('#loading-spinner');
    if (spinner) {
        spinner.classList.remove('hidden');
        gsap.fromTo(spinner, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        console.log('Spinner shown');
    } else {
        console.warn('Loading spinner not found');
    }
}

function hideLoadingSpinner() {
    const spinner = document.querySelector('#loading-spinner');
    if (spinner) {
        gsap.to(spinner, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                spinner.classList.add('hidden');
                console.log('Spinner hidden');
            }
        });
    }
}

// Chat Toggle
function initializeChatToggle() {
    const chatToggle = document.querySelector('#chat-toggle');
    const chatBody = document.querySelector('#chat-body');
    if (chatToggle && chatBody) {
        chatBody.classList.add('hidden');
        chatToggle.textContent = '+';
        chatToggle.addEventListener('click', () => {
            chatBody.classList.toggle('hidden');
            chatToggle.textContent = chatBody.classList.contains('hidden') ? '+' : '−';
            gsap.to(chatBody, {
                height: chatBody.classList.contains('hidden') ? 0 : 'auto',
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    } else {
        console.warn('Chat toggle or body not found');
    }
}

// Back-to-Top Button
function initializeBackToTop() {
    const backToTop = document.querySelector('#back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.classList.remove('hidden');
                gsap.to(backToTop, { opacity: 1, duration: 0.3 });
            } else {
                gsap.to(backToTop, {
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => backToTop.classList.add('hidden')
                });
            }
        });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    } else {
        console.warn('Back-to-top button not found');
    }
}

// Smooth Scrolling for Anchor Links
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Card Animations
function initializeCardAnimations() {
    gsap.utils.toArray('.card').forEach((card, index) => {
        gsap.from(card, {
            opacity: 0,
            y: 50,
            duration: 1,
            delay: index * 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            }
        });
    });
}

// Hero Animations
function initializeHeroAnimations() {
    gsap.from('.hero h1', {
        opacity: 0,
        y: -50,
        duration: 1,
        ease: 'power3.out',
        delay: 0.5

    });
    gsap.from('.hero p', {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: 'power3.out',
        delay: 0.5
    });
    gsap.from('.hero a', {
        opacity: 0,
        scale: 0.8,
        duration: 0.5,
        ease: 'back.out(1.7)',
        delay: 0.9
    });
}

// Minimize/maximize Zapier chatbot
document.addEventListener('DOMContentLoaded', () => {
    initializeSpinner();
    initializeDarkMode();
    initializeServicesCarousel();
    initializeTestimonialsCarousel();
    initializeTableFiltering();
    initializeChat();
    initializePasswordToggle();
    initializeChatToggle();
    initializeBackToTop();
    initializeSmoothScrolling();
    initializeCardAnimations();
    initializeHeroAnimations();

    const chatContainer = document.querySelector('.chat-container');
    const toggleButton = document.querySelector('.chat-header button');
    if (toggleButton && chatContainer) {
        console.log('Minimize button initialized');
        toggleButton.addEventListener('click', () => {
            chatContainer.classList.toggle('minimized');
            toggleButton.textContent = chatContainer.classList.contains('minimized') ? '+' : '−';
            console.log('Chat container toggled:', chatContainer.classList.contains('minimized') ? 'minimized' : 'maximized');
        });
    } else {
        console.error('Chat container or toggle button not found');
    }

    // Carousel
    const carouselItems = document.querySelectorAll('.carousel-item');
    const prevButton = document.querySelector('.carousel-nav .prev');
    const nextButton = document.querySelector('.carousel-nav .next');
    let currentIndex = 0;

    function showCarouselItem(index) {
        carouselItems.forEach(item => item.classList.remove('active'));
        carouselItems[index].classList.add('active');
    }

    if (carouselItems.length > 0) {
        showCarouselItem(currentIndex);
        nextButton.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % carouselItems.length;
            showCarouselItem(currentIndex);
        });
        prevButton.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + carouselItems.length) % carouselItems.length;
            showCarouselItem(currentIndex);
        });
    } else {
        console.warn('Carousel items not found');
    }

    // Particles.js
    particlesJS('particles-js', {
        particles: {
            number: { value: 100, density: { enable: true, value_area: 800 } },
            color: { value: ['#ff6b6b', '#4ecdc4', '#ffd166', '#8a4af3'] },
            shape: { type: 'star', stroke: { width: 0, color: '#000000' } },
            opacity: { value: 0.5, random: true },
            size: { value: 5, random: true },
            line_linked: { enable: false },
            move: { enable: true, speed: 3, direction: 'none', random: true }
        },
        interactivity: {
            detect_on: 'canvas',
            events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' } },
            modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
        },
        retina_detect: true
    });

    // Form Validation Listeners with Async Submission Handling
    const loginForm = document.querySelector('form[action="/login"]');
    const registerForm = document.querySelector('form[action="/register"]');
    const otpForm = document.querySelector('form[action*="verify"]');

    async function handleFormSubmission(e, validateFn) {
        e.preventDefault();
        if (!validateFn()) return;

        showLoadingSpinner();
        try {
            // Simulate async submission (replace with real fetch to backend)
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('Form submitted successfully');
            // Handle successful submission (e.g., redirect, show message)
        } catch (error) {
            console.error('Form submission failed:', error);
            // Handle error (e.g., show error message)
        } finally {
            hideLoadingSpinner();
        }
    }

    if (loginForm) {
        loginForm.addEventListener('input', debounce(() => validateLogin(), 300));
        loginForm.addEventListener('submit', e => handleFormSubmission(e, validateLogin));
    }

    if (registerForm) {
        registerForm.addEventListener('input', debounce(() => validateRegister(), 300));
        registerForm.addEventListener('submit', e => handleFormSubmission(e, validateRegister));
    }

    if (otpForm) {
        otpForm.addEventListener('input', debounce(() => validateOTP(), 300));
        otpForm.addEventListener('submit', e => handleFormSubmission(e, validateOTP));
    }
});