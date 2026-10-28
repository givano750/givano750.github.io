document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const rootElement = document.documentElement;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        rootElement.setAttribute('data-theme', savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            rootElement.setAttribute('data-theme', 'dark');
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = rootElement.getAttribute('data-theme');
            let targetTheme = (currentTheme === 'light' || !currentTheme) ? 'dark' : 'light';
            rootElement.setAttribute('data-theme', targetTheme);
            localStorage.setItem('theme', targetTheme);
        });
    }

    // 2. Contact Form Logic
    const showFormBtn = document.getElementById('show-form-btn');
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (showFormBtn && contactForm) {
        // Show form on click
        showFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            contactForm.classList.remove('hidden');
            showFormBtn.style.display = 'none';
        });

        // Form Submit Handler
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Rate Limiting Check (1 Hour Cooldown)
            const COOLDOWN_TIME = 60 * 60 * 1000; // 1 hour in milliseconds
            const lastSendTime = localStorage.getItem('last_submission_time');
            const now = Date.now();

            if (lastSendTime && (now - lastSendTime < COOLDOWN_TIME)) {
                const remainingMinutes = Math.ceil((COOLDOWN_TIME - (now - lastSendTime)) / (1000 * 60));
                if (formStatus) {
                    formStatus.textContent = `You can only send one message per hour. Please wait ${remainingMinutes} more minute(s).`;
                    formStatus.className = 'status-error';
                }
                return;
            }

            const emailInput = contactForm.querySelector('input[type="email"]');
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const emailValue = emailInput ? emailInput.value.trim() : '';

            // Standard client-side regex format check
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(emailValue)) {
                if (formStatus) {
                    formStatus.textContent = "Please enter a valid email address.";
                    formStatus.className = 'status-error';
                }
                return;
            }

            if (submitBtn) submitBtn.disabled = true;
            if (formStatus) {
                formStatus.textContent = "Sending message...";
                formStatus.className = '';
            }

            const formData = new FormData(contactForm);

            try {
                const response = await fetch(contactForm.action, {
                    method: contactForm.method,
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // Record successful submission timestamp
                    localStorage.setItem('last_submission_time', Date.now());

                    if (formStatus) {
                        formStatus.textContent = "Thanks! Your message has been sent successfully.";
                        formStatus.className = 'status-success';
                    }
                    contactForm.reset();
                } else {
                    if (formStatus) {
                        formStatus.textContent = "Oops! There was a problem sending your message.";
                        formStatus.className = 'status-error';
                    }
                }
            } catch (error) {
                if (formStatus) {
                    formStatus.textContent = "Oops! There was a network error sending your message.";
                    formStatus.className = 'status-error';
                }
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
});