// Toggle mobile menu y login modal
document.addEventListener('DOMContentLoaded', function() {

    window.__loginModalManagedByHeader = true;

    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileNav = document.getElementById('mobileNav');
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const loginCancel = document.getElementById('loginCancel');
    const loginError = document.getElementById('loginError');
    const loginSubmit = document.getElementById('loginSubmit');
    const loginButtonText = document.getElementById('loginButtonText');
    const loginSpinner = document.getElementById('loginSpinner');

    let lastLoginOriginEl = null;

    // Mobile menu functionality
    if (mobileMenuButton && mobileNav) {
        mobileMenuButton.addEventListener('click', function() {
            mobileNav.classList.toggle('active');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideMenu = mobileNav.contains(event.target);
            const isClickOnButton = mobileMenuButton.contains(event.target);

            if (!isClickInsideMenu && !isClickOnButton && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
            }
        });

        // Close mobile menu when window is resized to desktop size
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 768) {
                mobileNav.classList.remove('active');
            }
        });
    }

    // Login modal functionality
    function showLoginModal(originEl) {
        if (loginModal) {
            document.body.style.overflow = '';

            lastLoginOriginEl = originEl || lastLoginOriginEl || null;

            if (window.loginModalAnim && typeof window.loginModalAnim.open === 'function') {
                window.loginModalAnim.open(lastLoginOriginEl);
            } else {
                loginModal.classList.add('active');
            }
            
            // Reset form
            if (loginForm) {
                loginForm.reset();
                loginError.style.display = 'none';
                loginSubmit.disabled = false;
                loginButtonText.style.display = 'inline';
                loginSpinner.style.display = 'none';
            }
            
            // Focus on email input
            setTimeout(() => {
                const emailInput = document.getElementById('loginEmail');
                if (emailInput) {
                    emailInput.focus();
                }
            }, 100);
        }
    }

    function hideLoginModal() {
        if (loginModal) {
            if (window.loginModalAnim && typeof window.loginModalAnim.close === 'function') {
                window.loginModalAnim.close();
            } else {
                loginModal.classList.remove('active');
            }
            document.body.style.overflow = '';
        }
    }

    const PANEL_URL = '/Crear-Noticias/Panel/index.html';
    const HOME_URL = '/Crear-Noticias/index.html';

    function hasSessionToken() {
        return !!sessionStorage.getItem('session_token');
    }

    function setPanelButtonLabel(button, label) {
        if (!button) return;

        const labeled = button.querySelector('[data-panel-label]');
        if (labeled) {
            labeled.textContent = label;
            return;
        }

        const textNodes = Array.from(button.childNodes).filter(n => n && n.nodeType === Node.TEXT_NODE);
        if (textNodes.length > 0) {
            const last = textNodes[textNodes.length - 1];
            last.textContent = ` ${label}`;
            return;
        }

        button.appendChild(document.createTextNode(` ${label}`));
    }

    function updatePanelButtonsUI() {
        const label = hasSessionToken() ? 'Ir a panel de estudiante' : 'Iniciar sesión';
        const panelButtons = document.querySelectorAll('a.nav-button[href*="/Panel/"], a.mobile-top-item[href*="/Panel/"]');
        panelButtons.forEach((button) => setPanelButtonLabel(button, label));
    }

    // Handle clicks on "Ir a panel de estudiante" buttons
    function setupPanelButtons() {
        const panelButtons = document.querySelectorAll('a.nav-button[href*="/Panel/"], a.mobile-top-item[href*="/Panel/"]');

        panelButtons.forEach(button => {
            if (button.hasAttribute('data-login-setup')) return;
            button.setAttribute('data-login-setup', 'true');

            button.addEventListener('click', function(e) {
                e.preventDefault();

                if (hasSessionToken()) {
                    window.location.href = PANEL_URL;
                    return;
                }

                showLoginModal(button);
            });
        });
    }

    // Setup panel buttons initially
    setupPanelButtons();
    updatePanelButtonsUI();

    // Setup panel buttons when DOM changes (for dynamic content)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                setupPanelButtons();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                showLoginError('Por favor, completá todos los campos');
                return;
            }

            const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            if (!isValidEmail) {
                showLoginError('Ingresá un correo válido');
                return;
            }
            
            // Show loading state
            loginSubmit.disabled = true;
            loginButtonText.style.display = 'none';
            loginSpinner.style.display = 'inline';
            loginError.style.display = 'none';
            
            try {
                const response = await fetch('/Crear-Noticias/api/auth/login.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // Save token and user info
                    sessionStorage.setItem('session_token', data.token);
                    sessionStorage.setItem('user_info', JSON.stringify(data.usuario));
                    sessionStorage.setItem('token_expires', data.expira_en);
                    
                    // Redirect to Panel
                    window.location.href = PANEL_URL;
                } else {
                    showLoginError(data.error || 'Error al iniciar sesión');
                }
            } catch (error) {
                console.error('Login error:', error);
                showLoginError('Error de conexión. Intentá de nuevo.');
            } finally {
                // Reset loading state
                loginSubmit.disabled = false;
                loginButtonText.style.display = 'inline';
                loginSpinner.style.display = 'none';
            }
        });
    }

    // Handle cancel button
    if (loginCancel) {
        loginCancel.addEventListener('click', function() {
            hideLoginModal();
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && loginModal && loginModal.classList.contains('active')) {
            hideLoginModal();
        }
    });

    function showLoginError(message) {
        if (loginError) {
            loginError.textContent = message;
            loginError.style.display = 'block';
            
            // Scroll to error if needed
            loginError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // Check if user is already logged in and tries to access panel directly
    function checkAuthForPanel() {
        const token = sessionStorage.getItem('session_token');
        const isPanelPage = window.location.pathname.includes('/Panel/') || 
                           window.location.pathname.includes('Panel.html');
        
        if (isPanelPage && !token) {
            // Redirect to home with login modal
            window.location.replace(`${HOME_URL}?login=required`);
            return;
        }
        
        // Check if token is still valid
        if (token && isPanelPage) {
            fetch('/Crear-Noticias/api/auth/check.php', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    // Token invalid, clear and redirect
                    sessionStorage.removeItem('session_token');
                    sessionStorage.removeItem('user_info');
                    sessionStorage.removeItem('token_expires');
                    window.location.replace(`${HOME_URL}?login=required`);
                }
            })
            .catch(error => {
                console.error('Auth check error:', error);
                // On error, also redirect to login
                sessionStorage.removeItem('session_token');
                sessionStorage.removeItem('user_info');
                sessionStorage.removeItem('token_expires');
                window.location.replace(`${HOME_URL}?login=required`);
            });
        }
    }

    // Show login modal if URL has login=required
    if (window.location.search.includes('login=required')) {
        // Remove the parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        showLoginModal();
    }

    // Check auth for panel pages
    checkAuthForPanel();

    window.addEventListener('pageshow', function() {
        checkAuthForPanel();
        updatePanelButtonsUI();
    });
});