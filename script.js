document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const rootElement = document.documentElement;
    const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('.theme-icon') : null;
    const savedTheme = localStorage.getItem('theme');

    function updateThemeIcon(theme) {
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌓';
        }
    }

    if (savedTheme) {
        rootElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            rootElement.setAttribute('data-theme', 'dark');
            updateThemeIcon('dark');
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = rootElement.getAttribute('data-theme');
            let targetTheme = (currentTheme === 'light' || !currentTheme) ? 'dark' : 'light';
            rootElement.setAttribute('data-theme', targetTheme);
            localStorage.setItem('theme', targetTheme);
            updateThemeIcon(targetTheme);
        });
    }

    // 2. Active Section Navigation Highlight on Scroll
    const sections = document.querySelectorAll('main section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.scrollY >= sectionTop) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });

    // 3. Contact Form Logic with Cooldown
    const showFormBtn = document.getElementById('show-form-btn');
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (showFormBtn && contactForm) {
        showFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            contactForm.classList.remove('hidden');
            showFormBtn.style.display = 'none';
        });

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const COOLDOWN_TIME = 60 * 60 * 1000;
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