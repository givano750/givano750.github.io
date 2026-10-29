document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. Sweeping Circular View Transition Wipe
    // ==========================================
    function playMatrixTransition(targetTheme, callback) {
        if (!document.startViewTransition) {
            callback();
            return;
        }
        const themeToggle = document.getElementById('theme-toggle');
        let x = window.innerWidth - 80;
        let y = 40;
        if (themeToggle) {
            const rect = themeToggle.getBoundingClientRect();
            x = rect.left + rect.width / 2;
            y = rect.top + rect.height / 2;
        }
        const maxRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );
        
        const transition = document.startViewTransition(() => {
            callback();
        });

        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${maxRadius}px at ${x}px ${y}px)`
            ];
            document.documentElement.animate(
                {
                    clipPath: clipPath,
                },
                {
                    duration: 450, // Accelerated for snappier feel
                    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                    pseudoElement: '::view-transition-new(root)',
                }
            );
        });
    }

    // ==========================================
    // 2. Theme Toggle Logic (Tailwind Dark Mode)
    // ==========================================
    const themeToggle = document.getElementById('theme-toggle');
    const rootElement = document.documentElement;
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let currentTheme = 'dark';

    if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
        currentTheme = 'light';
    }

    function applyTheme(theme) {
        const profileImg = document.getElementById('profile-img');

        if (theme === 'dark') {
            rootElement.classList.add('dark');
            if (themeToggle) themeToggle.checked = true;
            if (profileImg) profileImg.src = 'assets/me.jpg';
        } else {
            rootElement.classList.remove('dark');
            if (themeToggle) themeToggle.checked = false;
            if (profileImg) profileImg.src = 'assets/me-with-shades.jpg';
        }
        localStorage.setItem('theme', theme);
        currentTheme = theme;

        if (window.updateCanvasTheme) {
            window.updateCanvasTheme(theme);
        }
    }

    applyTheme(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            const newTheme = themeToggle.checked ? 'dark' : 'light';
            themeToggle.disabled = true;
            playMatrixTransition(newTheme, () => {
                applyTheme(newTheme);
                themeToggle.disabled = false;
            });
        });
    }

    // ==========================================
    // 3. Mobile Menu & Backdrop Toggle Logic
    // ==========================================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const menuBackdrop = document.getElementById('menu-backdrop');

    function toggleMobileMenu(open) {
        if (open) {
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
            mobileMenuBtn.classList.add('menu-active');
            if (menuBackdrop) {
                menuBackdrop.classList.remove('opacity-0', 'pointer-events-none');
                menuBackdrop.classList.add('opacity-100');
            }
        } else {
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('-translate-x-full');
            mobileMenuBtn.classList.remove('menu-active');
            if (menuBackdrop) {
                menuBackdrop.classList.remove('opacity-100');
                menuBackdrop.classList.add('opacity-0', 'pointer-events-none');
            }
        }
    }

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            const isOpen = sidebar.classList.contains('translate-x-0');
            toggleMobileMenu(!isOpen);
        });

        if (menuBackdrop) {
            menuBackdrop.addEventListener('click', () => toggleMobileMenu(false));
        }

        sidebar.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 1024) {
                    toggleMobileMenu(false);
                }
            });
        });
    }

    // ==========================================
    // 4. Scroll Spy & Fade-in Animations
    // ==========================================
    const sections = document.querySelectorAll('main section');
    const navLinks = document.querySelectorAll('.nav-link');

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

    sections.forEach(section => fadeObserver.observe(section));

    // Debounced Scroll Spy for Performance
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) return;
        scrollTimeout = setTimeout(() => {
            scrollTimeout = null;
            let currentSection = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 180;
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
        }, 50);
    }, { passive: true });

    // ==========================================
    // 5. Contact Form Logic with Cooldown
    // ==========================================
    const showFormBtn = document.getElementById('show-form-btn');
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (showFormBtn && contactForm) {
        showFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            contactForm.classList.remove('hidden');
            contactForm.classList.add('flex');
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
                    formStatus.textContent = `Please wait ${remainingMinutes} minute(s) before sending again.`;
                    formStatus.className = 'text-sm font-medium mt-2 text-red-500';
                }
                return;
            }

            const emailInput = contactForm.querySelector('input[type="email"]');
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const emailValue = emailInput ? emailInput.value.trim() : '';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(emailValue)) {
                if (formStatus) {
                    formStatus.textContent = "Please enter a valid email address.";
                    formStatus.className = 'text-sm font-medium mt-2 text-red-500';
                }
                return;
            }

            if (submitBtn) submitBtn.disabled = true;
            if (formStatus) {
                formStatus.textContent = "Sending message...";
                formStatus.className = 'text-sm font-medium mt-2 text-gray-500';
            }

            const formData = new FormData(contactForm);
            try {
                const response = await fetch(contactForm.action, {
                    method: contactForm.method,
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    localStorage.setItem('last_submission_time', Date.now());
                    if (formStatus) {
                        formStatus.textContent = "Message sent successfully!";
                        formStatus.className = 'text-sm font-medium mt-2 text-green-500';
                    }
                    contactForm.reset();
                } else {
                    throw new Error('Network response was not ok.');
                }
            } catch (error) {
                if (formStatus) {
                    formStatus.textContent = "Oops! Error sending message.";
                    formStatus.className = 'text-sm font-medium mt-2 text-red-500';
                }
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // ==========================================
    // 6. Optimized Interactive Background Canvas
    // ==========================================
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d', { alpha: true });
        let particlesArray = [];
        let isDarkMode = rootElement.classList.contains('dark');
        
        const config = {
            particleCount: Math.min(window.innerWidth / 20, 50), // Optimized density for better FPS
            maxDistance: 120,
            mouseRadius: 110,
            baseColorLight: 'rgba(0, 0, 0, ',
            baseColorDark: 'rgba(255, 255, 255, '
        };

        let mouse = { x: null, y: null };
        window.addEventListener('mousemove', (event) => {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        }, { passive: true });

        window.addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                initParticles();
            }, 150);
        });

        window.updateCanvasTheme = function(theme) {
            isDarkMode = (theme === 'dark');
        };

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 1.5 + 1;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
                if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

                if (mouse.x != null && mouse.y != null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < config.mouseRadius) {
                        const force = (config.mouseRadius - distance) / config.mouseRadius;
                        this.x -= (dx / distance) * force * 1.5;
                        this.y -= (dy / distance) * force * 1.5;
                    }
                }
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = isDarkMode ? `${config.baseColorDark}0.25)` : `${config.baseColorLight}0.2)`;
                ctx.fill();
            }
        }

        function initParticles() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particlesArray = [];
            for (let i = 0; i < config.particleCount; i++) {
                particlesArray.push(new Particle());
            }
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
                particlesArray[i].draw();

                for (let j = i; j < particlesArray.length; j++) {
                    let dx = particlesArray[i].x - particlesArray[j].x;
                    let dy = particlesArray[i].y - particlesArray[j].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < config.maxDistance) {
                        let opacity = (1 - (distance / config.maxDistance)) * 0.12;
                        ctx.beginPath();
                        ctx.strokeStyle = isDarkMode ? `${config.baseColorDark}${opacity})` : `${config.baseColorLight}${opacity})`;
                        ctx.lineWidth = 0.8;
                        ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                        ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animateParticles);
        }

        initParticles();
        animateParticles();
    }

    // ==========================================
    // 7. GitHub Calendar Initialization
    // ==========================================
    const calendarContainer = document.querySelector('.calendar');
    const calendarLoader = document.getElementById('calendar-loader');
    if (calendarContainer) {
        GitHubCalendar(".calendar", "givano750", { 
            responsive: true,
            tooltips: true,
            summary_text: ' ' 
        }).then(() => {
            if (calendarLoader) calendarLoader.style.display = 'none';
            calendarContainer.classList.remove('opacity-0');
            calendarContainer.classList.add('opacity-100');
        }).catch(err => {
            if (calendarLoader) {
                calendarLoader.innerHTML = '<span class="text-red-500 text-sm font-medium">Failed to load GitHub activity.</span>';
            }
            console.error("GitHub Calendar Error:", err);
        });
    }
});