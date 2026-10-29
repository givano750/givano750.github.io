document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // Matrix Square Theme Background Transition
    // ==========================================
    let matrixTransitionActive = false;
    let matrixSquares = [];
    let matrixTargetColor = '';
    let matrixProgress = 0;

    function playMatrixTransition(targetTheme, callback) {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) {
            callback();
            return;
        }

        matrixTargetColor = targetTheme === 'dark' ? '#050505' : '#fafafa';
        const gridSize = 40;
        const cols = Math.ceil(canvas.width / gridSize);
        const rows = Math.ceil(canvas.height / gridSize);
        
        matrixSquares = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                matrixSquares.push({ x: c * gridSize, y: r * gridSize });
            }
        }
        
        // Shuffle squares randomly for the matrix dissolve effect
        matrixSquares.sort(() => Math.random() - 0.5);
        
        matrixProgress = 0;
        matrixTransitionActive = true;

        // Trigger theme switch halfway through the wipe for a seamless handoff
        const totalSteps = matrixSquares.length;
        const interval = setInterval(() => {
            matrixProgress += Math.max(1, Math.floor(totalSteps / 15));
            
            if (matrixProgress >= totalSteps / 2 && matrixTransitionActive) {
                // Apply theme halfway so the background shifts underneath the trailing squares
                callback();
            }

            if (matrixProgress >= totalSteps) {
                clearInterval(interval);
                setTimeout(() => {
                    matrixTransitionActive = false;
                }, 200);
            }
        }, 16);
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
            if (profileImg) {
                profileImg.src = 'assets/me.jpg';
            }
        } else {
            rootElement.classList.remove('dark');
            if (themeToggle) themeToggle.checked = false;
            if (profileImg) {
                profileImg.src = 'assets/me-with-shades.jpg';
            }
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
            
            // Disable toggle during animation to prevent overlapping triggers
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
            mobileMenuBtn.classList.remove('left-4');
            mobileMenuBtn.classList.add('left-[304px]');
            if (menuBackdrop) {
                menuBackdrop.classList.remove('opacity-0', 'pointer-events-none');
                menuBackdrop.classList.add('opacity-100');
            }
        } else {
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('-translate-x-full');
            mobileMenuBtn.classList.remove('menu-active');
            mobileMenuBtn.classList.remove('left-[304px]');
            mobileMenuBtn.classList.add('left-4');
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

        const navLinksList = sidebar.querySelectorAll('.nav-link');
        navLinksList.forEach(link => {
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
    }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });

    sections.forEach(section => fadeObserver.observe(section));

    window.addEventListener('scroll', () => {
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
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
    // 6. Interactive Geometric Background (Canvas)
    // ==========================================
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particlesArray = [];
        let isDarkMode = rootElement.classList.contains('dark');

        const config = {
            particleCount: Math.min(window.innerWidth / 15, 80),
            maxDistance: 130,
            mouseRadius: 130,
            baseColorLight: 'rgba(0, 0, 0, ',
            baseColorDark: 'rgba(255, 255, 255, '
        };

        let mouse = { x: null, y: null };
        window.addEventListener('mousemove', (event) => {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        });
        window.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                mouse.x = event.touches[0].clientX;
                mouse.y = event.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });
        window.addEventListener('touchend', () => { mouse.x = null; mouse.y = null; });
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        });

        window.updateCanvasTheme = function(theme) {
            isDarkMode = (theme === 'dark');
        };

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.8;
                this.vy = (Math.random() - 0.5) * 0.8;
                this.size = Math.random() * 2 + 1;
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
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (config.mouseRadius - distance) / config.mouseRadius;
                                             
                        this.x -= forceDirectionX * force * 2.5;
                        this.y -= forceDirectionY * force * 2.5;
                    }
                }
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = isDarkMode ? `${config.baseColorDark} 0.3)` : `${config.baseColorLight} 0.25)`;
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

            if (matrixTransitionActive && matrixSquares.length > 0) {
                ctx.fillStyle = matrixTargetColor;
                const gridSize = 40;
                for (let i = 0; i < Math.min(matrixProgress, matrixSquares.length); i++) {
                    const sq = matrixSquares[i];
                    ctx.fillRect(sq.x, sq.y, gridSize, gridSize);
                }
            }
                     
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
                particlesArray[i].draw();
                             
                for (let j = i; j < particlesArray.length; j++) {
                    let dx = particlesArray[i].x - particlesArray[j].x;
                    let dy = particlesArray[i].y - particlesArray[j].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                                     
                    if (distance < config.maxDistance) {
                        let opacity = 1 - (distance / config.maxDistance);
                        ctx.beginPath();
                        ctx.strokeStyle = isDarkMode ? `${config.baseColorDark} ${opacity * 0.15})` : `${config.baseColorLight} ${opacity * 0.15})`;
                        ctx.lineWidth = 1;
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