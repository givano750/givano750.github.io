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
                    duration: 450,
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
                const indicator = link.querySelector('.nav-indicator');
                link.classList.remove('active');
                if (indicator) indicator.classList.add('opacity-0');

                if (link.getAttribute('href') === `#${currentSection}`) {
                    link.classList.add('active');
                    if (indicator) indicator.classList.remove('opacity-0');
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
                        formStatus.className = 'text-sm font-medium mt-2 text-emerald-500';
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
    // 6. Interactive Background & World-Space Debris Physics
    // ==========================================
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d', { alpha: true });
        let particlesArray = [];
        let debrisArray = [];
        let isDarkMode = rootElement.classList.contains('dark');
        
        const config = {
            particleCount: Math.min(window.innerWidth / 8, 100),
            maxDistance: 90,
            mouseRadius: 120,
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

        // Floating Background Web Nodes (Viewport Relative)
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.6;
                this.vy = (Math.random() - 0.5) * 0.6;
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
                        this.x -= (dx / distance) * force * 1.6;
                        this.y -= (dy / distance) * force * 1.6;
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

        // Physics Debris Shards (Page/World Space Coordinates)
        class Debris {
            constructor(pageX, pageY) {
                this.x = pageX; // Document page X position
                this.y = pageY; // Document page Y position
                this.size = Math.random() * 5 + 3;
                this.vx = (Math.random() - 0.5) * 10;
                this.vy = (Math.random() - 0.7) * 8; // Burst upward
                this.rotation = Math.random() * Math.PI * 2;
                this.vRot = (Math.random() - 0.5) * 0.25;
                this.gravity = 0.38;
                this.landed = false;
                this.landedAt = null;
                this.opacity = 0.9;

                const lightColors = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];
                const darkColors = ['#ffffff', '#e4e4e7', '#a1a1aa', '#71717a', '#3f3f46'];
                const palette = isDarkMode ? darkColors : lightColors;
                this.color = palette[Math.floor(Math.random() * palette.length)];
                this.shapeType = Math.floor(Math.random() * 2);
            }

            update(solids, scrollX, scrollY, now) {
                if (this.landed) {
                    const elapsed = now - this.landedAt;
                    // Fade out over 2 seconds after landing on a surface
                    this.opacity = Math.max(0, 1 - (elapsed / 2000));
                    return;
                }

                const prevY = this.y;

                this.vy += this.gravity;
                this.vx *= 0.98;
                this.x += this.vx;
                this.y += this.vy;
                this.rotation += this.vRot;

                // Collision detection in page coordinates
                for (let i = 0; i < solids.length; i++) {
                    const rect = solids[i];
                    const pageTop = rect.top + scrollY;
                    const pageLeft = rect.left + scrollX;
                    const pageRight = rect.right + scrollX;

                    if (prevY <= pageTop && this.y + this.size >= pageTop && 
                        this.x >= pageLeft && this.x <= pageRight) {
                        
                        this.y = pageTop - this.size;
                        this.vy = -this.vy * 0.3; // Rebound elasticity
                        this.vx *= 0.5; // Surface friction
                        this.vRot *= 0.4;

                        if (Math.abs(this.vy) < 1.2) {
                            this.vy = 0;
                            this.vx = 0;
                            this.vRot = 0;
                            this.landed = true;
                            this.landedAt = now;
                        }
                        break;
                    }
                }

                // Check Viewport Floor collision
                const floorY = window.innerHeight + scrollY;
                if (!this.landed && this.y + this.size >= floorY) {
                    this.y = floorY - this.size;
                    this.vy = -this.vy * 0.25;
                    this.vx *= 0.5;
                    this.vRot *= 0.3;

                    if (Math.abs(this.vy) < 1.0) {
                        this.vy = 0;
                        this.vx = 0;
                        this.vRot = 0;
                        this.landed = true;
                        this.landedAt = now;
                    }
                }
            }

            draw(scrollX, scrollY) {
                if (this.opacity <= 0) return;

                // Translate page coordinates to canvas viewport coordinates
                const renderX = this.x - scrollX;
                const renderY = this.y - scrollY;

                ctx.save();
                ctx.translate(renderX, renderY);
                ctx.rotate(this.rotation);
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = this.color;

                if (this.shapeType === 0) {
                    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.8);
                } else {
                    ctx.beginPath();
                    ctx.moveTo(0, -this.size);
                    ctx.lineTo(this.size, this.size);
                    ctx.lineTo(-this.size, this.size);
                    ctx.closePath();
                    ctx.fill();
                }

                ctx.restore();
            }
        }

        // Spawn Debris Explosion in Page Coordinates on Click
        window.addEventListener('click', (e) => {
            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;
            const count = Math.floor(Math.random() * 6) + 12;
            for (let i = 0; i < count; i++) {
                debrisArray.push(new Debris(e.clientX + scrollX, e.clientY + scrollY));
            }
        });

        function initParticles() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particlesArray = [];
            for (let i = 0; i < config.particleCount; i++) {
                particlesArray.push(new Particle());
            }
        }

        function animateParticles(now) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;

            // Render floating web background
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

            // Update & Render Solid Physics Debris
            if (debrisArray.length > 0) {
                const solidElements = Array.from(document.querySelectorAll(
                    '.group, button, a.tech-chip, header, h1, h2, h3, #contact-form, img'
                ));
                const solidsRects = solidElements.map(el => el.getBoundingClientRect());

                for (let i = debrisArray.length - 1; i >= 0; i--) {
                    const d = debrisArray[i];
                    d.update(solidsRects, scrollX, scrollY, now);
                    d.draw(scrollX, scrollY);

                    if (d.opacity <= 0) {
                        debrisArray.splice(i, 1);
                    }
                }
            }

            requestAnimationFrame(animateParticles);
        }

        initParticles();
        requestAnimationFrame(animateParticles);
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