// Estado global
let activeTab = 'noticias';
let noticiasData = [];
let eventosData = [];
let usuariosData = [];
let editingItem = null;
let formData = {};
let isSaving = false;
let isUploading = false;
let formOriginElement = null;
let deletePendingId = null;
let deleteOriginElement = null;
let deleteUserPendingId = null;
let deleteUserOriginElement = null;
let vaciarAlumnosOriginElement = null;

const STORAGE_KEYS = {
    noticias: 'crearNoticias_data_noticias',
    eventos: 'crearNoticias_data_eventos'
};

const MEDIA_DB_NAME = 'crearNoticias_media_db';
const MEDIA_DB_VERSION = 1;
const MEDIA_STORE_NAME = 'media_files';

const mediaUrlCache = new Map();

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const nextType = input.type === 'password' ? 'text' : 'password';
    input.type = nextType;

    if (btn && btn.classList) {
        btn.classList.toggle('is-visible', nextType === 'text');
    }
}

window.togglePasswordVisibility = togglePasswordVisibility;

function openMediaDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(MEDIA_DB_NAME, MEDIA_DB_VERSION);
        req.onupgradeneeded = function() {
            const db = req.result;
            if (!db.objectStoreNames.contains(MEDIA_STORE_NAME)) {
                db.createObjectStore(MEDIA_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = function() {
            resolve(req.result);
        };
        req.onerror = function() {
            reject(req.error);
        };
    });
}

function addMediaRecord({ blob, type, name }) {
    return openMediaDb().then((db) => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(MEDIA_STORE_NAME, 'readwrite');
            const store = tx.objectStore(MEDIA_STORE_NAME);
            const req = store.add({ blob, type, name, created_at: Date.now() });
            req.onsuccess = function() {
                resolve(req.result);
            };
            req.onerror = function() {
                reject(req.error);
            };
        });
    });
}

function getMediaRecordById(id) {
    return openMediaDb().then((db) => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(MEDIA_STORE_NAME, 'readonly');
            const store = tx.objectStore(MEDIA_STORE_NAME);
            const req = store.get(Number(id));
            req.onsuccess = function() {
                resolve(req.result || null);
            };
            req.onerror = function() {
                reject(req.error);
            };
        });
    });
}

async function getObjectUrlForStorageId(storageId) {
    if (storageId == null) return '';
    const key = String(storageId);
    if (mediaUrlCache.has(key)) return mediaUrlCache.get(key);
    try {
        const record = await getMediaRecordById(storageId);
        if (!record || !record.blob) return '';
        const url = URL.createObjectURL(record.blob);
        mediaUrlCache.set(key, url);
        return url;
    } catch (e) {
        return '';
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    ensureSileoReady();
    setupEventListeners();
    setupUsersUi();
    updateMobileNavGrid();
    loadData();
});

function ensureSileoReady() {
    if (window.__sileo_loading) return;
    if (window.sileo && typeof window.sileo.init === 'function') {
        initSileoOnce();
        return;
    }

    window.__sileo_loading = true;

    try {
        const cssHref = 'https://cdn.jsdelivr.net/gh/hamada147/sileo-vanilla/dist/styles.css';
        const hasCss = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((l) => {
            const href = String(l.getAttribute('href') || '');
            return href.includes('sileo-vanilla') && href.endsWith('styles.css');
        });
        if (!hasCss) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssHref;
            document.head.appendChild(link);
        }
    } catch (e) {
        // noop
    }

    const src = 'https://cdn.jsdelivr.net/gh/hamada147/sileo-vanilla/dist/sileo.iife.js';
    const hasScript = Array.from(document.scripts || []).some((s) => {
        const sSrc = String(s.src || '');
        return sSrc.includes('sileo-vanilla') && sSrc.endsWith('sileo.iife.js');
    });

    if (hasScript) {
        const wait = setInterval(() => {
            if (window.sileo && typeof window.sileo.init === 'function') {
                clearInterval(wait);
                initSileoOnce();
            }
        }, 50);
        setTimeout(() => clearInterval(wait), 5000);
        return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
        initSileoOnce();
    };
    script.onerror = () => {
        window.__sileo_loading = false;
    };
    document.head.appendChild(script);
}

function initSileoOnce() {
    if (!window.sileo || typeof window.sileo.init !== 'function') return;
    if (!window.__sileo_inited) {
        window.sileo.init({ position: 'top-center' });
        window.__sileo_inited = true;
    }

    if (!window.fireToast) {
        window.fireToast = function(type, title, description) {
            const start = Date.now();
            const attempt = () => {
                const has = typeof window.notifySuccess === 'function' && typeof window.notifyInfo === 'function' && typeof window.notifyError === 'function' && typeof window.notifyWarning === 'function';
                if (has) {
                    if (type === 'success') window.notifySuccess(title, description);
                    else if (type === 'info') window.notifyInfo(title, description);
                    else if (type === 'warning') window.notifyWarning(title, description);
                    else window.notifyError(title, description);
                    return;
                }

                if (Date.now() - start > 2500) return;
                setTimeout(attempt, 120);
            };
            attempt();
        };
    }

    if (!window.notifySuccess) {
        window.notifySuccess = function(title, description) {
            try {
                window.sileo.success({
                    title: title || 'Listo',
                    description: description || '',
                    position: 'top-center'
                });
            } catch (e) {
                // noop
            }
        };
    }

    if (!window.notifyInfo) {
        window.notifyInfo = function(title, description) {
            try {
                window.sileo.info({
                    title: title || 'Info',
                    description: description || '',
                    position: 'top-center'
                });
            } catch (e) {
                // noop
            }
        };
    }

    if (!window.notifyError) {
        window.notifyError = function(title, description) {
            try {
                window.sileo.error({
                    title: title || 'Error',
                    description: description || '',
                    position: 'top-center'
                });
            } catch (e) {
                // noop
            }
        };
    }

    if (!window.notifyWarning) {
        window.notifyWarning = function(title, description) {
            try {
                if (window.sileo && typeof window.sileo.warning === 'function') {
                    window.sileo.warning({
                        title: title || 'Atención',
                        description: description || '',
                        position: 'top-center'
                    });
                } else {
                    window.sileo.info({
                        title: title || 'Atención',
                        description: description || '',
                        position: 'top-center'
                    });
                }
            } catch (e) {
                // noop
            }
        };
    }

    window.saveAccountChanges = async function() {
        ensureSileoReady();
        const token = sessionStorage.getItem('session_token');
        if (!token) {
            if (window.fireToast) {
                window.fireToast('error', 'Sesión', 'No hay sesión activa');
            }
            return;
        }

        const nombreInput = document.getElementById('nombreUsuario');
        const nombre = (nombreInput ? nombreInput.value : '').trim();
        if (!nombre) {
            if (window.fireToast) {
                window.fireToast('info', 'Revisá el nombre', 'Nombre inválido');
            }
            return;
        }

        const spinner = document.getElementById('saveSpinner');
        const saveBtn = document.querySelector('#accountModal .btn-save');

        try {
            if (spinner) spinner.style.display = 'inline-block';
            if (saveBtn) saveBtn.disabled = true;

            const response = await fetch('/Crear-Noticias/api/usuarios/update_nombre.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nombre })
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.success) {
                if (response.status === 409) {
                    if (window.fireToast) {
                        window.fireToast('warning', 'Nombre de usuario', 'Ese nombre ya está en uso. Elegí otro.');
                    }
                    return;
                }
                throw new Error(result.error || 'Error al guardar cambios');
            }

            if (result.usuario) {
                sessionStorage.setItem('user_info', JSON.stringify(result.usuario));

                const emailEl = document.getElementById('userEmail');
                if (emailEl) emailEl.textContent = (result.usuario.email) ? String(result.usuario.email) : '';
            }

            if (window.fireToast) {
                window.fireToast('success', 'Nombre de usuario', 'Tu nombre de usuario se actualizó correctamente.');
            }

            if (typeof window.closeAccountModal === 'function') {
                window.closeAccountModal();
            }
        } catch (error) {
            console.error('Error al guardar cuenta:', error);
            if (window.fireToast) {
                window.fireToast('error', 'Error', error.message || 'Error al guardar cambios');
            }
        } finally {
            if (spinner) spinner.style.display = 'none';
            if (saveBtn) saveBtn.disabled = false;
        }
    };
}

// Setup event listeners
function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.sidebar-nav-item[data-tab="noticias"], .sidebar-nav-item[data-tab="eventos"], .sidebar-nav-item[data-tab="usuarios"], .mobile-top-item[data-tab], .mobile-bottom-item[data-tab]').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            switchTab(tab);
        });
    });

    // Add button
    document.getElementById('addBtn').addEventListener('click', openNewForm);

    // Form buttons
    document.getElementById('cancelBtn').addEventListener('click', closeForm);
    document.getElementById('saveBtn').addEventListener('click', handleSave);

    // File uploads
    document.getElementById('inputImagen').addEventListener('change', (e) => handleFileUpload(e, 'imagen'));
    document.getElementById('inputVideo').addEventListener('change', (e) => handleFileUpload(e, 'video'));

    // Días de visibilidad
    document.getElementById('inputDias').addEventListener('input', function() {
        const dias = this.value || 30;
        document.getElementById('hintDias').textContent = `Se eliminará automáticamente después de ${dias} días`;
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutAndRedirect();
        });
    }

    const logoutBtnMobile = document.getElementById('logoutBtnMobile');
    if (logoutBtnMobile) {
        logoutBtnMobile.addEventListener('click', function(e) {
            e.preventDefault();
            logoutAndRedirect();
        });
    }
}

function logoutAndRedirect() {
    sessionStorage.removeItem('session_token');
    sessionStorage.removeItem('user_info');
    sessionStorage.removeItem('token_expires');
    window.location.replace('/Crear-Noticias/index.html');
}

// Switch tab
function switchTab(tab) {
    if (tab !== 'noticias' && tab !== 'eventos' && tab !== 'usuarios') return;
    if (tab === 'usuarios' && !isDirectorUser()) return;
    activeTab = tab;

    // AGREGAR DELAY PARA QUE EL RIPPLE COMPLETE
    setTimeout(() => {
        // Update sidebar
        document.querySelectorAll('.sidebar-nav-item[data-tab="noticias"], .sidebar-nav-item[data-tab="eventos"], .sidebar-nav-item[data-tab="usuarios"]').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });

        // Update mobile top nav
        document.querySelectorAll('.mobile-top-item[data-tab]').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });

        // Update mobile bottom nav
        document.querySelectorAll('.mobile-bottom-item[data-tab]').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });
    }, 50); // 50ms de delay

    // Update content (esto puede ir fuera del setTimeout)
    const contentTitle = document.getElementById('contentTitle');
    const contentSubtitle = document.getElementById('contentSubtitle');
    const addBtnText = document.getElementById('addBtnText');
    const addBtn = document.getElementById('addBtn');

    if (tab === 'noticias') {
        contentTitle.textContent = 'Gestión de Noticias';
        contentSubtitle.textContent = 'Panel de Administración';
        addBtnText.textContent = 'Agregar Noticia';
        if (addBtn) addBtn.style.display = '';
    } else {
        if (tab === 'eventos') {
            contentTitle.textContent = 'Gestión de Eventos';
            contentSubtitle.textContent = 'Panel de Administración';
            addBtnText.textContent = 'Agregar Evento';
            if (addBtn) addBtn.style.display = '';
        } else {
            contentTitle.textContent = 'Gestión de Usuarios';
            contentSubtitle.textContent = 'Solo Director';
            if (addBtn) addBtn.style.display = 'none';
        }
    }

    closeFormImmediate();

    if (tab === 'usuarios') {
        showUsersSection();
        loadUsuarios();
        return;
    }

    hideUsersSection();
    renderItems();
}

function isDirectorUser() {
    try {
        const raw = sessionStorage.getItem('user_info');
        if (!raw) return false;
        const u = JSON.parse(raw);
        const name = (u && u.usuario ? String(u.usuario) : '').toLowerCase();
        const rol = (u && u.rol ? String(u.rol) : '').toLowerCase();
        return name === 'director' || rol === 'director';
    } catch (e) {
        return false;
    }
}

function updateMobileNavGrid() {
    const mobileBottomNav = document.querySelector('.mobile-bottom-nav');
    if (!mobileBottomNav) return;
    
    const isDirector = isDirectorUser();
    
    if (isDirector) {
        mobileBottomNav.classList.add('three-columns');
        mobileBottomNav.classList.remove('two-columns');
    } else {
        mobileBottomNav.classList.add('two-columns');
        mobileBottomNav.classList.remove('three-columns');
    }
}

function setupUsersUi() {
    const canSeeUsers = isDirectorUser();
    document.querySelectorAll('[data-tab="usuarios"]').forEach((el) => {
        el.style.display = canSeeUsers ? '' : 'none';
    });

    const usersList = document.getElementById('usersList');
    if (usersList && !usersList.hasAttribute('data-users-accordion-setup')) {
        usersList.setAttribute('data-users-accordion-setup', 'true');

        usersList.querySelectorAll('[data-accordion-toggle]').forEach((header) => {
            header.addEventListener('click', function(e) {
                const target = e.target;
                if (target && target.closest && target.closest('.users-accordion-action')) return;

                const key = this.getAttribute('data-accordion-toggle');
                if (!key) return;
                const section = usersList.querySelector(`[data-accordion-section="${key}"]`);
                if (!section) return;
                section.classList.toggle('open');
            });
        });

        usersList.addEventListener('click', function(e) {
            const btn = e.target && e.target.closest ? e.target.closest('.users-delete-btn') : null;
            if (!btn) return;
            const id = btn.getAttribute('data-user-id');
            if (!id) return;
            openDeleteUserModal(Number(id), btn);
        });

        const vaciarBtn = document.getElementById('usersVaciarAlumnosBtn');
        if (vaciarBtn) {
            vaciarBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openVaciarAlumnosModal(vaciarBtn);
            });
        }
    }

    const usersCreateForm = document.getElementById('usersCreateForm');
    if (usersCreateForm && !usersCreateForm.hasAttribute('data-submit-setup')) {
        usersCreateForm.setAttribute('data-submit-setup', 'true');
        usersCreateForm.addEventListener('submit', function(e) {
            e.preventDefault();
        });
    }

    const createBtn = document.getElementById('userCreateBtn');
    if (createBtn) {
        createBtn.addEventListener('click', handleCreateUser);
    }

    const cancelBtn = document.getElementById('userCancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', clearCreateUserForm);
    }

    if (canSeeUsers && activeTab === 'usuarios') {
        showUsersSection();
        loadUsuarios();
    } else {
        hideUsersSection();
    }
}

function showUsersSection() {
    const usersSection = document.getElementById('usersSection');
    const itemsList = document.getElementById('itemsList');
    const formContainer = document.getElementById('formContainer');
    if (usersSection) usersSection.style.display = '';
    if (itemsList) itemsList.style.display = 'none';
    if (formContainer) formContainer.classList.remove('active');
}

function hideUsersSection() {
    const usersSection = document.getElementById('usersSection');
    const itemsList = document.getElementById('itemsList');
    if (usersSection) usersSection.style.display = 'none';
    if (itemsList) itemsList.style.display = '';
}

function showUsersMessage(text, isError) {
    const el = document.getElementById('usersMessage');
    if (!el) return;
    el.textContent = text;
    el.style.display = text ? 'block' : 'none';
    el.style.color = isError ? '#b91c1c' : '';
}

function clearCreateUserForm() {
    const u = document.getElementById('userNuevoUsuario');
    const e = document.getElementById('userNuevoEmail');
    const p = document.getElementById('userNuevoPassword');
    const r = document.getElementById('userNuevoRol');
    const c = document.getElementById('userNuevoCiclo');
    if (u) u.value = '';
    if (e) e.value = '';
    if (p) p.value = '';
    if (r) r.value = 'alumno';
    if (c) c.value = '';
    showUsersMessage('', false);
}

async function loadUsuarios() {
    if (!isDirectorUser()) return;

    const token = sessionStorage.getItem('session_token');
    if (!token) {
        window.location.replace('/Crear-Noticias/index.html?login=required');
        return;
    }

    try {
        const url = `/Crear-Noticias/api/usuarios/index.php?_ts=${Date.now()}`;
        const resp = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store'
        });

        const payload = await resp.json().catch(() => ({}));
        if (!resp.ok || !payload.success) {
            throw new Error(payload.error || 'Error al cargar usuarios');
        }

        usuariosData = Array.isArray(payload.data) ? payload.data : [];
        showUsersMessage(`Usuarios cargados: ${usuariosData.length}`, false);
        renderUsuarios();
    } catch (e) {
        usuariosData = [];
        renderUsuarios();
        showUsersMessage(e.message || 'Error al cargar usuarios', true);
    }
}

function renderUsuarios() {
    const directoresList = document.getElementById('usersDirectoresList');
    const profesoresList = document.getElementById('usersProfesoresList');
    const alumnosList = document.getElementById('usersAlumnosList');
    if (!profesoresList || !alumnosList) return;

    const normalized = Array.isArray(usuariosData) ? usuariosData.slice() : [];
    normalized.sort((a, b) => String(a?.usuario || '').localeCompare(String(b?.usuario || ''), 'es'));

    const roleOf = (u) => String(u?.rol || '').trim().toLowerCase();

    const directores = normalized.filter((u) => roleOf(u) === 'director');
    const profesores = normalized.filter((u) => roleOf(u) === 'profesor');
    const alumnos = normalized.filter((u) => roleOf(u) === 'alumno');
    const sinRol = normalized.filter((u) => {
        const r = roleOf(u);
        return r !== 'director' && r !== 'profesor' && r !== 'alumno';
    });

    const msgEl = document.getElementById('usersMessage');
    if (msgEl && msgEl.style.display === 'block' && !msgEl.style.color) {
    }

    const rowHtml = (u, idx) => {
        const activo = (u.activo === true || u.activo === 1 || u.activo === '1') ? 'Sí' : 'No';
        const title = `${idx + 1}. ${u.usuario}`;
        return `
            <div class="users-row" data-id="${u.id}">
                <div class="users-row-info">
                    <h3 class="users-row-title">${title}</h3>
                    <p class="users-row-meta">Rol: ${u.rol} • Activo: ${activo} • Ciclo: ${u.ciclo_lectivo}</p>
                </div>
                <div class="users-row-actions">
                    <button type="button" class="users-delete-btn" data-user-id="${u.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 16h10l1-16"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        <span>Eliminar</span>
                    </button>
                </div>
            </div>
        `;
    };

    if (directoresList) {
        directoresList.innerHTML = directores.length
            ? directores.map(rowHtml).join('')
            : `
                <div class="users-row">
                    <div class="users-row-info">
                        <h3 class="users-row-title">No hay directores</h3>
                    </div>
                </div>
            `;
    }

    profesoresList.innerHTML = profesores.length
        ? profesores.map(rowHtml).join('')
        : `
            <div class="users-row">
                <div class="users-row-info">
                    <h3 class="users-row-title">No hay profesores</h3>
                </div>
            </div>
        `;

    alumnosList.innerHTML = alumnos.length
        ? alumnos.map(rowHtml).join('')
        : `
            <div class="users-row">
                <div class="users-row-info">
                    <h3 class="users-row-title">No hay alumnos</h3>
                </div>
            </div>
        `;
}

async function handleDeleteUser(userId) {
    if (!isDirectorUser()) return;
    if (!userId || Number.isNaN(userId)) return;

    const token = sessionStorage.getItem('session_token');
    if (!token) {
        window.location.replace('/Crear-Noticias/index.html?login=required');
        return;
    }

    try {
        showUsersMessage('Eliminando usuario...', false);
        const resp = await fetch('/Crear-Noticias/api/usuarios/delete.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id: userId })
        });
        const payload = await resp.json().catch(() => ({}));
        if (!resp.ok || !payload.success) {
            throw new Error(payload.error || 'Error al eliminar usuario');
        }

        usuariosData = usuariosData.filter((u) => Number(u.id) !== Number(userId));
        renderUsuarios();
        showUsersMessage('Usuario eliminado', false);

        if (window.fireToast) {
            window.fireToast('success', 'Usuario eliminado', 'El usuario se eliminó correctamente.');
        }
    } catch (e) {
        showUsersMessage(e.message || 'Error al eliminar usuario', true);

        if (window.fireToast) {
            window.fireToast('error', 'Error', e.message || 'Error al eliminar usuario');
        }
    }
}

async function handleVaciarAlumnos() {
    if (!isDirectorUser()) return;
    openVaciarAlumnosModal(document.getElementById('usersVaciarAlumnosBtn'));
}

async function performVaciarAlumnos() {
    if (!isDirectorUser()) return;

    const token = sessionStorage.getItem('session_token');
    if (!token) {
        window.location.replace('/Crear-Noticias/index.html?login=required');
        return;
    }

    try {
        showUsersMessage('Vaciando alumnos...', false);
        const resp = await fetch('/Crear-Noticias/api/usuarios/delete_alumnos.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const payload = await resp.json().catch(() => ({}));
        if (!resp.ok || !payload.success) {
            throw new Error(payload.error || 'Error al vaciar alumnos');
        }

        usuariosData = usuariosData.filter((u) => String(u?.rol || '').toLowerCase() !== 'alumno');
        renderUsuarios();
        showUsersMessage('Lista de alumnos vaciada', false);

        if (window.fireToast) {
            window.fireToast('success', 'Lista vaciada', 'Se eliminaron todos los alumnos.');
        }
    } catch (e) {
        showUsersMessage(e.message || 'Error al vaciar alumnos', true);

        if (window.fireToast) {
            window.fireToast('error', 'Error', e.message || 'Error al vaciar alumnos');
        }
    }
}

function closeDeleteUserModal(done) {
    const modal = document.getElementById('deleteUserModal');
    if (!modal) {
        if (typeof done === 'function') done();
        return;
    }

    const container = modal.querySelector('.modal-container');
    const backdrop = modal.querySelector('.modal-backdrop');
    const originEl = deleteUserOriginElement;

    const finish = () => {
        modal.classList.remove('active');
        deleteUserPendingId = null;
        deleteUserOriginElement = null;
        if (typeof done === 'function') done();
    };

    if (!container || !window.gsap || !originEl || !window.Flip || !window.CustomEase) {
        finish();
        return;
    }

    const gsap = window.gsap;
    const Flip = window.Flip;
    const CustomEase = window.CustomEase;
    gsap.registerPlugin(Flip, CustomEase);

    const easeMain = CustomEase.create("custom", "M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1 ");

    let completed = false;
    const safetyTimeout = setTimeout(() => {
        if (completed) return;
        completed = true;
        finish();
    }, 900);

    const state = Flip.getState(container);
    Flip.fit(container, originEl, { scale: true, absolute: true });

    Flip.from(state, {
        targets: container,
        duration: 0.5,
        ease: easeMain,
        scale: true,
        absolute: false,
        onStart() {
            gsap.to(container, { opacity: 0, duration: 0.5, ease: easeMain });
            if (backdrop) gsap.to(backdrop, { opacity: 0, duration: 0.3, ease: 'power2.in' });
        },
        onComplete() {
            if (completed) return;
            completed = true;
            clearTimeout(safetyTimeout);
            if (backdrop) gsap.set(backdrop, { clearProps: 'all', opacity: 0 });
            gsap.set(container, { clearProps: 'all' });
            finish();
        }
    });
}

function openDeleteUserModal(userId, originEl) {
    deleteUserPendingId = userId;
    deleteUserOriginElement = originEl || null;

    const modal = document.getElementById('deleteUserModal');
    if (!modal) return;

    const container = modal.querySelector('.modal-container');
    const backdrop = modal.querySelector('.modal-backdrop');
    const confirmBtn = document.getElementById('deleteUserConfirmBtn');

    if (confirmBtn) {
        confirmBtn.onclick = () => {
            const id = deleteUserPendingId;
            closeDeleteUserModal(() => {
                if (id != null && id !== '') handleDeleteUser(Number(id));
            });
        };
    }

    modal.classList.add('active');

    if (container && window.gsap) {
        try { window.gsap.killTweensOf(container); } catch (e) {}
        window.gsap.set(container, { clearProps: 'all' });
    }
    if (backdrop && window.gsap) {
        try { window.gsap.killTweensOf(backdrop); } catch (e) {}
        window.gsap.set(backdrop, { clearProps: 'all', opacity: 0 });
    }

    if (container && originEl) {
        positionDeleteModalNearOrigin(container, originEl);
    }

    if (backdrop && window.gsap) {
        window.gsap.to(backdrop, { opacity: 1, duration: 0.25 });
    }

    if (!container || !originEl || !window.gsap || !window.Flip || !window.CustomEase) return;

    const gsap = window.gsap;
    const Flip = window.Flip;
    const CustomEase = window.CustomEase;
    gsap.registerPlugin(Flip, CustomEase);

    const easeMain = CustomEase.create("custom", "M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1 ");

    Flip.fit(container, originEl, { scale: true, absolute: true });
    const state = Flip.getState(container);
    gsap.set(container, { clearProps: 'all' });

    positionDeleteModalNearOrigin(container, originEl);

    Flip.from(state, {
        targets: container,
        duration: 0.7,
        ease: easeMain,
        scale: true,
        absolute: false,
        onStart() {
            positionDeleteModalNearOrigin(container, originEl);
            gsap.from(container, { opacity: 0, duration: 0.5, ease: easeMain });
        }
    });
}

function closeVaciarAlumnosModal(done) {
    const modal = document.getElementById('vaciarAlumnosModal');
    if (!modal) {
        if (typeof done === 'function') done();
        return;
    }

    const container = modal.querySelector('.modal-container');
    const backdrop = modal.querySelector('.modal-backdrop');
    const originEl = vaciarAlumnosOriginElement;

    const finish = () => {
        modal.classList.remove('active');
        vaciarAlumnosOriginElement = null;
        if (typeof done === 'function') done();
    };

    if (!container || !window.gsap || !originEl || !window.Flip || !window.CustomEase) {
        finish();
        return;
    }

    const gsap = window.gsap;
    const Flip = window.Flip;
    const CustomEase = window.CustomEase;
    gsap.registerPlugin(Flip, CustomEase);

    const easeMain = CustomEase.create("custom", "M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1 ");

    const state = Flip.getState(container);
    Flip.fit(container, originEl, { scale: true, absolute: true });

    Flip.from(state, {
        targets: container,
        duration: 0.5,
        ease: easeMain,
        scale: true,
        absolute: false,
        onStart() {
            gsap.to(container, { opacity: 0, duration: 0.5, ease: easeMain });
            if (backdrop) gsap.to(backdrop, { opacity: 0, duration: 0.3, ease: 'power2.in' });
        },
        onComplete() {
            gsap.set(container, { clearProps: 'all' });
            if (backdrop) gsap.set(backdrop, { clearProps: 'all', opacity: 0 });
            finish();
        }
    });
}

function openVaciarAlumnosModal(originEl) {
    vaciarAlumnosOriginElement = originEl || null;

    const modal = document.getElementById('vaciarAlumnosModal');
    if (!modal) return;

    const container = modal.querySelector('.modal-container');
    const backdrop = modal.querySelector('.modal-backdrop');
    const confirmBtn = document.getElementById('vaciarAlumnosConfirmBtn');

    if (confirmBtn) {
        confirmBtn.onclick = () => {
            closeVaciarAlumnosModal(() => {
                performVaciarAlumnos();
            });
        };
    }

    modal.classList.add('active');

    if (container && originEl) {
        positionDeleteModalNearOrigin(container, originEl);
    }

    if (backdrop && window.gsap) {
        window.gsap.set(backdrop, { clearProps: 'all', opacity: 0 });
        window.gsap.to(backdrop, { opacity: 1, duration: 0.25 });
    }

    if (!container || !originEl || !window.gsap || !window.Flip || !window.CustomEase) return;

    const gsap = window.gsap;
    const Flip = window.Flip;
    const CustomEase = window.CustomEase;
    gsap.registerPlugin(Flip, CustomEase);

    const easeMain = CustomEase.create("custom", "M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1 ");

    Flip.fit(container, originEl, { scale: true, absolute: true });
    const state = Flip.getState(container);
    gsap.set(container, { clearProps: 'all' });

    positionDeleteModalNearOrigin(container, originEl);

    Flip.from(state, {
        targets: container,
        duration: 0.7,
        ease: easeMain,
        scale: true,
        absolute: false,
        onStart() {
            gsap.from(container, { opacity: 0, duration: 0.5, ease: easeMain });
        }
    });
}

window.openDeleteUserModal = openDeleteUserModal;
window.closeDeleteUserModal = closeDeleteUserModal;
window.openVaciarAlumnosModal = openVaciarAlumnosModal;
window.closeVaciarAlumnosModal = closeVaciarAlumnosModal;

async function handleCreateUser() {
    if (!isDirectorUser()) return;

    const token = sessionStorage.getItem('session_token');
    if (!token) {
        window.location.replace('/Crear-Noticias/index.html?login=required');
        return;
    }

    const usuario = (document.getElementById('userNuevoUsuario')?.value || '').trim();
    const email = (document.getElementById('userNuevoEmail')?.value || '').trim();
    const password = (document.getElementById('userNuevoPassword')?.value || '');
    const rol = String(document.getElementById('userNuevoRol')?.value || 'alumno').trim().toLowerCase() || 'alumno';
    const cicloRaw = (document.getElementById('userNuevoCiclo')?.value || '').trim();

    if (!usuario || !email || !password) {
        showUsersMessage('Completá usuario, correo y contraseña', true);
        return;
    }

    const ciclo_lectivo = cicloRaw ? Number(cicloRaw) : undefined;

    try {
        showUsersMessage('Creando usuario...', false);

        const resp = await fetch('/Crear-Noticias/api/usuarios/create.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                usuario,
                email,
                password,
                rol,
                ciclo_lectivo
            })
        });

        const payload = await resp.json();
        if (!resp.ok) {
            throw new Error(payload.error || 'Error al crear usuario');
        }

        showUsersMessage('Usuario creado correctamente', false);
        if (window.notifySuccess) {
            window.notifySuccess('Usuario creado', 'El usuario se creó correctamente.');
        }
        clearCreateUserForm();
        loadUsuarios();
    } catch (e) {
        showUsersMessage(e.message || 'Error al crear usuario', true);
    }
}

// Cargar datos desde la API
async function loadData() {
    const token = sessionStorage.getItem('session_token');
    if (!token) {
        window.location.replace('/Crear-Noticias/index.html?login=required');
        return;
    }

    try {
        // Cargar noticias
        const noticiasResponse = await fetch('/Crear-Noticias/api/noticias/index.php', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store'
        });

        // Cargar eventos
        const eventosResponse = await fetch('/Crear-Noticias/api/eventos/index.php', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store'
        });

        if (noticiasResponse.ok) {
            noticiasData = await noticiasResponse.json();
        } else if (noticiasResponse.status === 401) {
            logoutAndRedirect();
            return;
        } else {
            console.error('Error cargando noticias:', noticiasResponse.status);
            noticiasData = [];
        }

        if (eventosResponse.ok) {
            eventosData = await eventosResponse.json();
        } else if (eventosResponse.status === 401) {
            logoutAndRedirect();
            return;
        } else {
            console.error('Error cargando eventos:', eventosResponse.status);
            eventosData = [];
        }

        renderItems();
    } catch (error) {
        console.error('Error cargando datos:', error);
        noticiasData = [];
        eventosData = [];
        renderItems();
    }
}

// Render items
function renderItems() {
    if (activeTab === 'usuarios') return;
    const itemsList = document.getElementById('itemsList');
    const currentItems = activeTab === 'noticias' ? noticiasData : eventosData;
    const visibleItems = currentItems.filter(item => {
        if (!item) return false;
        if (activeTab === 'noticias') {
            const flag = (item.activa ?? item.activo);
            return flag === true || flag === 1 || flag === '1';
        }
        return item.activo === true || item.activo === 1 || item.activo === '1';
    });

    const parseToMs = (value) => {
        const raw = String(value || '').trim();
        if (!raw) return 0;
        const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) {
            const y = Number(m[1]);
            const mo = Number(m[2]) - 1;
            const d = Number(m[3]);
            return new Date(y, mo, d).getTime();
        }
        const isoLike = raw.includes(' ') && !raw.includes('T') ? raw.replace(' ', 'T') : raw;
        const dt = new Date(isoLike);
        return Number.isNaN(dt.getTime()) ? 0 : dt.getTime();
    };

    visibleItems.sort((a, b) => {
        const aMs = parseToMs(a.created_at) || parseToMs(a.created_date);
        const bMs = parseToMs(b.created_at) || parseToMs(b.created_date);
        if (bMs !== aMs) return bMs - aMs;
        return Number(b.id || 0) - Number(a.id || 0);
    });

    if (visibleItems.length === 0) {
        itemsList.innerHTML = `
            <div class="empty-state">
                <p class="empty-state-text">No hay ${activeTab} publicados</p>
            </div>
        `;
        return;
    }

    itemsList.innerHTML = visibleItems.map(item => {
        const mediaItems = Array.isArray(item.media_items) ? item.media_items : [];
        const firstImageUrl = mediaItems.find(m => m && m.type === 'image' && m.url);
        const firstVideoUrl = mediaItems.find(m => m && m.type === 'video' && m.url);
        const firstImage = firstImageUrl || mediaItems.find(m => m && m.type === 'image' && m.storage_id);
        const firstVideo = firstVideoUrl || mediaItems.find(m => m && m.type === 'video' && m.storage_id);

        const imageStorageId = firstImage && firstImage.storage_id ? firstImage.storage_id : '';
        const imageDirectUrl = firstImage && firstImage.url ? firstImage.url : (item.imagen_url || '');
        const hasVideo = !!firstVideo || !!item.video_url;

        return `
        <div class="item-card" data-id="${item.id}">
            <div class="item-content">
                ${imageStorageId ? 
                    `<img data-storage-id="${imageStorageId}" alt="" class="item-thumbnail">` :
                    imageDirectUrl ?
                    `<img src="${imageDirectUrl}" alt="" class="item-thumbnail">` :
                    hasVideo ?
                    `<div class="item-video-placeholder">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="23 7 16 12 23 17 23 7"></polygon>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                        </svg>
                    </div>` : ''
                }
                <div class="item-info">
                    <h3 class="item-title">${item.titulo}</h3>
                    <p class="item-meta">
                        ${activeTab === 'eventos' ? `${formatDate(item.fecha_evento)}${item.hora_evento ? ` • ${String(item.hora_evento).slice(0, 5)}` : ''}` : `${formatDate(item.created_date)}`} • 
                        Expira: ${formatDate(item.fecha_expiracion)}
                    </p>
                </div>
            </div>
            <div class="item-actions">
                <button class="item-action-btn edit" onclick="openEditForm(${item.id}, this)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pen-icon lucide-pen"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
                </button>
                <button class="item-action-btn delete" onclick="openDeleteModal(${item.id}, this)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        </div>
        `;
    }).join('');

    hydrateItemThumbnails(itemsList);
}

async function hydrateItemThumbnails(container) {
    if (!container) return;
    const imgs = Array.from(container.querySelectorAll('img[data-storage-id]'));
    for (const img of imgs) {
        const storageId = img.getAttribute('data-storage-id');
        if (!storageId) continue;
        const url = await getObjectUrlForStorageId(storageId);
        if (url) img.src = url;
    }
}

// Format date
function formatDate(dateString) {
    const raw = String(dateString || '').trim();
    if (!raw) return '';

    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    let date;
    if (m) {
        const y = Number(m[1]);
        const mo = Number(m[2]) - 1;
        const d = Number(m[3]);
        date = new Date(y, mo, d);
    } else {
        const isoLike = raw.includes(' ') && !raw.includes('T') ? raw.replace(' ', 'T') : raw;
        date = new Date(isoLike);
    }

    if (Number.isNaN(date.getTime())) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    let formatted = date.toLocaleDateString('es-ES', options);
    formatted = formatted.replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    return formatted;
}

// Open new form
function openNewForm() {
    closeFormImmediate();
    editingItem = null;
    formOriginElement = document.getElementById('addBtn');
    
    if (activeTab === 'noticias') {
        formData = {
            titulo: '',
            contenido: '',
            tipo_media: 'ninguno',
            media_items: [],
            imagen_url: '',
            video_url: '',
            dias_visibilidad: 30,
            activa: true
        };
    } else {
        formData = {
            titulo: '',
            descripcion: '',
            fecha_evento: '',
            hora_evento: '',
            lugar: '',
            tipo_media: 'ninguno',
            media_items: [],
            imagen_url: '',
            video_url: '',
            dias_visibilidad: 30,
            activo: true
        };
    }
    
    updateFormUI();
    showForm(formOriginElement);
}

// Open edit form
function openEditForm(itemId, originEl) {
    const currentItems = activeTab === 'noticias' ? noticiasData : eventosData;
    const itemIdNum = Number(itemId);
    const item = currentItems.find(i => Number(i && i.id) === itemIdNum);
    
    if (!item) return;
    
    closeFormImmediate();
    editingItem = item;
    formData = { ...item };
    if (!Array.isArray(formData.media_items)) {
        formData.media_items = [];
        if (formData.imagen_url) formData.media_items.push({ type: 'image', url: formData.imagen_url });
        if (formData.video_url) formData.media_items.push({ type: 'video', url: formData.video_url });
    }
    formOriginElement = originEl || null;
    
    updateFormUI();
    showForm(originEl);
}

// Update form UI
function updateFormUI() {
    const formTitle = document.getElementById('formTitle');
    const labelContenido = document.getElementById('labelContenido');
    const inputTitulo = document.getElementById('inputTitulo');
    const inputContenido = document.getElementById('inputContenido');
    const inputDias = document.getElementById('inputDias');

    const eventoFields = document.getElementById('eventoFields');
    const saveBtnText = document.getElementById('saveBtnText');
    const mediaPreview = document.getElementById('mediaPreview');
    const imageUploadBox = document.getElementById('imageUploadBox');
    const videoUploadBox = document.getElementById('videoUploadBox');

    // Title
    if (editingItem) {
        formTitle.textContent = `Editar ${activeTab === 'noticias' ? 'Noticia' : 'Evento'}`;
        saveBtnText.textContent = 'Guardar cambios';
    } else {
        formTitle.textContent = `Nueva ${activeTab === 'noticias' ? 'Noticia' : 'Evento'}`;
        saveBtnText.textContent = 'Publicar';
    }

    // Fields
    inputTitulo.value = formData.titulo || '';
    inputDias.value = formData.dias_visibilidad || 30;

    if (activeTab === 'noticias') {
        labelContenido.textContent = 'Contenido';
        inputContenido.value = formData.contenido || '';
        eventoFields.style.display = 'none';
    } else {
        labelContenido.textContent = 'Descripción';
        inputContenido.value = formData.descripcion || '';
        eventoFields.style.display = 'grid';

        document.getElementById('inputFecha').value = formData.fecha_evento || '';
        document.getElementById('inputHora').value = formData.hora_evento || '';
        document.getElementById('inputLugar').value = formData.lugar || '';
    }

    // Media preview
    imageUploadBox.classList.remove('active');
    videoUploadBox.classList.remove('active');
    mediaPreview.style.display = 'none';
    mediaPreview.innerHTML = '';

    const mediaItems = Array.isArray(formData.media_items) ? formData.media_items : [];
    const firstImage = mediaItems.find(m => m && m.type === 'image' && (m.url || m.storage_id));
    const firstVideo = mediaItems.find(m => m && m.type === 'video' && (m.url || m.storage_id));

    imageUploadBox.classList.toggle('active', !!firstImage);
    videoUploadBox.classList.toggle('active', !!firstVideo);

    (async () => {
        const resolved = await Promise.all(mediaItems.map(async (m, index) => {
            if (!m) return null;
            const storageId = m.storage_id ?? m.storageId;
            const resolvedUrl = m.url || (storageId ? await getObjectUrlForStorageId(storageId) : '');
            if (!resolvedUrl) return null;
            return { ...m, __index: index, __resolvedUrl: resolvedUrl };
        }));

        const showItems = resolved.filter(x => x && x.__resolvedUrl);
        if (showItems.length === 0) {
            mediaPreview.style.display = 'none';
            mediaPreview.innerHTML = '';
            return;
        }

        mediaPreview.style.display = 'block';
        mediaPreview.innerHTML = '';

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fit, 140px)';
        grid.style.gap = '12px';
        grid.style.justifyContent = 'start';

        showItems.forEach((m) => {
            const cell = document.createElement('div');
            cell.style.position = 'relative';

            let node;
            if (m.type === 'video') {
                node = document.createElement('video');
                node.src = m.__resolvedUrl;
                node.controls = true;
                node.playsInline = true;
            } else {
                node = document.createElement('img');
                node.src = m.__resolvedUrl;
                node.alt = 'Preview';
            }
            node.style.height = '8rem';
            node.style.borderRadius = '0.5rem';
            node.style.objectFit = 'cover';
            node.style.maxWidth = '100%';
            node.style.display = 'block';

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.textContent = '×';
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '8px';
            removeBtn.style.right = '8px';
            removeBtn.style.width = '32px';
            removeBtn.style.height = '32px';
            removeBtn.style.borderRadius = '999px';
            removeBtn.style.border = 'none';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.background = 'rgba(0,0,0,0.6)';
            removeBtn.style.color = 'white';
            removeBtn.style.fontSize = '20px';
            removeBtn.style.lineHeight = '32px';
            removeBtn.style.padding = '0';
            removeBtn.onclick = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                removeMediaItemAtIndex(m.__index);
            };

            cell.appendChild(node);
            cell.appendChild(removeBtn);
            grid.appendChild(cell);
        });

        mediaPreview.appendChild(grid);
    })();
}

// Show form
function showForm(originEl) {
    const formModal = document.getElementById('formContainer');
    formModal.classList.add('active');

    if (!originEl || !window.gsap || !window.Flip || !window.CustomEase) return;

    const gsap = window.gsap;
    const Flip = window.Flip;
    const CustomEase = window.CustomEase;
    gsap.registerPlugin(Flip, CustomEase);

    const easeMain = CustomEase.create("custom", "M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1 ");

    const modalContainer = formModal.querySelector('.modal-container');
    const backdrop = formModal.querySelector('.modal-backdrop');
    if (!modalContainer) return;

    try { gsap.killTweensOf(modalContainer); } catch (e) {}
    if (backdrop) {
        try { gsap.killTweensOf(backdrop); } catch (e) {}
    }
    gsap.set(modalContainer, { clearProps: 'all', opacity: 0 });
    if (backdrop) gsap.set(backdrop, { clearProps: 'all', opacity: 0 });

    const originProps = {
        borderRadius: window.getComputedStyle(originEl).borderRadius,
        background: window.getComputedStyle(originEl).background,
        boxShadow: window.getComputedStyle(originEl).boxShadow,
    };

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
        const rect = originEl.getBoundingClientRect();

        gsap.set(modalContainer, {
            position: 'fixed',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            transform: 'none',
            borderRadius: originProps.borderRadius,
            background: originProps.background,
            boxShadow: originProps.boxShadow,
            overflow: 'hidden',
        });

        const tl = gsap.timeline();
        if (backdrop) tl.to(backdrop, { opacity: 1, duration: 0.3 }, 0);

        tl.from(modalContainer, {
            opacity: 0,
            duration: 0.7,
            // filter: 'blur(8px)',
            ease: easeMain,
        }, 0);

        tl.to(modalContainer, {
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            borderRadius: 0,
            duration: 0.7,
            ease: easeMain,
            onComplete() {
                gsap.set(modalContainer, { clearProps: 'all'});
            }
        }, 0);

        return;
    }

    Flip.fit(modalContainer, originEl, {
        scale: true,
        absolute: true
    });

    const state = Flip.getState(modalContainer);
    gsap.set(modalContainer, { clearProps: 'all' });

    Flip.from(state, {
        targets: modalContainer,
        duration: 0.7,
        ease: easeMain,
        scale: true,
        absolute: false,
        onStart() {
            if (backdrop) gsap.to(backdrop, { opacity: 1, duration: 0.3 });
            gsap.from(modalContainer, {
                opacity: 0,
                duration: 0.7,
                // filter: 'blur(8px)',
                ease: easeMain,
            });
        },
        onComplete() {
            gsap.set(modalContainer, { clearProps: 'all', });
        }
    });
}

// Close form
function closeForm(arg) {
    if (typeof arg === 'function') {
        closeFormAnimated(arg);
        return;
    }

    if (arg && arg.preventDefault) {
        arg.preventDefault();
    }

    closeFormAnimated(null);
}

function closeFormImmediate() {
    const formModal = document.getElementById('formContainer');
    if (formModal) formModal.classList.remove('active');

    if (formModal && window.gsap) {
        const container = formModal.querySelector('.modal-container');
        const backdrop = formModal.querySelector('.modal-backdrop');
        if (container) window.gsap.set(container, { clearProps: 'all' });
        if (backdrop) window.gsap.set(backdrop, { clearProps: 'all', opacity: 0  });
    }

    editingItem = null;
    formData = {};
    formOriginElement = null;
}

function closeFormAnimated(done) {
    const formModal = document.getElementById('formContainer');
    const originEl = formOriginElement;

    if (!formModal || !formModal.classList.contains('active')) {
        if (typeof done === 'function') done();
        return;
    }

    if (!originEl || !window.gsap || !window.Flip || !window.CustomEase) {
        closeFormImmediate();
        if (typeof done === 'function') done();
        return;
    }

    const gsap = window.gsap;
    const Flip = window.Flip;
    const CustomEase = window.CustomEase;
    gsap.registerPlugin(Flip, CustomEase);

    const easeMain = CustomEase.create("custom", "M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1 ");
    const closeEase1 = CustomEase.create("easeName", ".56,.27,0,1");
    const closeEase2 = CustomEase.create("easeName", ".37,.35,0,1");

    const modalContainer = formModal.querySelector('.modal-container');
    const backdrop = formModal.querySelector('.modal-backdrop');
    if (!modalContainer) {
        closeFormImmediate();
        if (typeof done === 'function') done();
        return;
    }

    try { gsap.killTweensOf(modalContainer); } catch (e) {}
    if (backdrop) {
        try { gsap.killTweensOf(backdrop); } catch (e) {}
    }

    let completed = false;
    const safetyTimeout = setTimeout(() => {
        if (completed) return;
        completed = true;

        closeFormImmediate();
        if (typeof done === 'function') done();
    }, 900);

    const originProps = {
        borderRadius: window.getComputedStyle(originEl).borderRadius,
        background: window.getComputedStyle(originEl).background,
        boxShadow: window.getComputedStyle(originEl).boxShadow,
    };

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
        const originRect = originEl.getBoundingClientRect();
        const currentRect = modalContainer.getBoundingClientRect();

        gsap.set(modalContainer, {
            position: 'fixed',
            top: currentRect.top,
            left: currentRect.left,
            width: currentRect.width,
            height: currentRect.height,
            transform: 'none',
            overflow: 'hidden',
        });

        if (backdrop) {
            gsap.set(backdrop, { opacity: 1 });
            gsap.to(backdrop, {
                opacity: 0,
                duration: 0.3,
                ease: 'power2.in',
            });
        }

        gsap.to(modalContainer, {
            duration: 0.5,
            ease: closeEase1,
            borderRadius: '400px',
        });
        gsap.to(modalContainer, {
            duration: 0.5,
            ease: closeEase2,
            filter: 'blur(32px)',
            scale: 0.985,
        });
        gsap.to(modalContainer, {
            opacity: 0,
            duration: 0.5,
            ease: closeEase1,
        });

        gsap.to(modalContainer, {
            top: originRect.top,
            left: originRect.left,
            width: originRect.width,
            height: originRect.height,
            duration: 0.5,
            ease: easeMain,
            onComplete() {
                if (completed) return;
                completed = true;
                clearTimeout(safetyTimeout);
                formModal.classList.remove('active');
                gsap.set(modalContainer, { clearProps: 'all' });
                if (backdrop) gsap.set(backdrop, { clearProps: 'all', opacity: 0 });
                editingItem = null;
                formData = {};
                formOriginElement = null;
                if (typeof done === 'function') done();
            }
        });

        return;
    }

    const state = Flip.getState(modalContainer);

    Flip.fit(modalContainer, originEl, {
        scale: true,
        absolute: true
    });

    try {
        Flip.from(state, {
            targets: modalContainer,
            duration: 0.5,
            ease: easeMain,
            scale: true,
            absolute: false,
            onStart() {

                gsap.to(modalContainer, {
                    duration: 0.5,
                    ease: closeEase1,
                    borderRadius: '400px',
                });
                gsap.to(modalContainer, {
                    duration: 0.5,
                    ease: closeEase2,
                    filter: 'blur(32px)',
                });
                gsap.to(modalContainer, {
                    opacity: 0,
                    duration: 0.5,
                    ease: closeEase1,
                });

                if (backdrop) {
                    gsap.to(backdrop, {
                        opacity: 0,
                        duration: 0.3,
                        ease: 'power2.in',
                    });
                }
            },
            onComplete() {
                if (completed) return;
                completed = true;
                clearTimeout(safetyTimeout);
                formModal.classList.remove('active');
                gsap.set(modalContainer, { clearProps: 'all' });
                if (backdrop) gsap.set(backdrop, { clearProps: 'all', opacity: 0 });
                editingItem = null;
                formData = {};
                formOriginElement = null;
                if (typeof done === 'function') done();
            }
        });
    } catch (e) {
        if (completed) return;
        completed = true;
        clearTimeout(safetyTimeout);
        closeFormImmediate();
        if (typeof done === 'function') done();
    }
}

function syncFormDataFromInputs() {
    const inputTitulo = document.getElementById('inputTitulo');
    const inputContenido = document.getElementById('inputContenido');
    const inputDias = document.getElementById('inputDias');

    if (inputTitulo) formData.titulo = inputTitulo.value;

    if (inputDias) {
        const v = parseInt(inputDias.value);
        if (Number.isFinite(v) && v > 0) formData.dias_visibilidad = v;
    }

    if (activeTab === 'noticias') {
        if (inputContenido) formData.contenido = inputContenido.value;
    } else {
        if (inputContenido) formData.descripcion = inputContenido.value;
        const inputFecha = document.getElementById('inputFecha');
        const inputHora = document.getElementById('inputHora');
        const inputLugar = document.getElementById('inputLugar');
        if (inputFecha) formData.fecha_evento = inputFecha.value;
        if (inputHora) formData.hora_evento = inputHora.value;
        if (inputLugar) formData.lugar = inputLugar.value;
    }
}

function removeMediaItemAtIndex(index) {
    syncFormDataFromInputs();
    if (!Array.isArray(formData.media_items)) formData.media_items = [];
    const idx = Number(index);
    if (!Number.isFinite(idx) || idx < 0 || idx >= formData.media_items.length) return;

    const item = formData.media_items[idx];
    if (item && typeof item.url === 'string' && item.url.startsWith('blob:')) {
        try { URL.revokeObjectURL(item.url); } catch (e) {}
    }

    formData.media_items.splice(idx, 1);

    const firstImage = formData.media_items.find(m => m && m.type === 'image');
    const firstVideo = formData.media_items.find(m => m && m.type === 'video');
    formData.imagen_url = firstImage ? (firstImage.url || '') : '';
    formData.video_url = firstVideo ? (firstVideo.url || '') : '';
    formData.tipo_media = formData.media_items.length === 0 ? 'ninguno' : (firstImage && firstVideo ? 'mixed' : (firstImage ? 'imagen' : 'video'));

    updateFormUI();
}

async function handleFileUpload(e, type) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    syncFormDataFromInputs();

    const uploadingIndicator = document.getElementById('uploadingIndicator');
    isUploading = true;
    uploadingIndicator.style.display = 'flex';

    try {
        const token = sessionStorage.getItem('session_token');
        if (!token) {
            throw new Error('No hay sesión activa');
        }

        if (!Array.isArray(formData.media_items)) formData.media_items = [];
        const normalizedType = type === 'imagen' ? 'image' : 'video';

        for (const file of files) {
            const form = new FormData();
            form.append('file', file);

            const uploadRes = await fetch('/Crear-Noticias/api/media/upload.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: form,
            });

            const uploadJson = await uploadRes.json().catch(() => ({}));
            if (!uploadRes.ok || !uploadJson.success || !uploadJson.url) {
                throw new Error(uploadJson.error || 'Error al subir el archivo');
            }

            formData.media_items.push({ type: uploadJson.type || normalizedType, url: uploadJson.url });
        }

        const firstImage = formData.media_items.find(m => m && m.type === 'image');
        const firstVideo = formData.media_items.find(m => m && m.type === 'video');
        formData.imagen_url = firstImage ? (firstImage.url || '') : '';
        formData.video_url = firstVideo ? (firstVideo.url || '') : '';
        formData.tipo_media = formData.media_items.length === 0 ? 'ninguno' : (firstImage && firstVideo ? 'mixed' : (firstImage ? 'imagen' : 'video'));

        syncFormDataFromInputs();
        updateFormUI();
    } catch (error) {
        console.error('Error al subir archivo:', error);
        ensureSileoReady();
        if (window.fireToast) {
            window.fireToast('error', 'Error', error.message || 'Error al subir el archivo');
        }
    } finally {
        isUploading = false;
        uploadingIndicator.style.display = 'none';
        try {
            if (e && e.target) e.target.value = '';
        } catch (err) {
            // noop
        }
    }
}

async function handleSave() {
    if (isSaving || isUploading) return;

    const saveBtn = document.getElementById('saveBtn');
    const saveBtnText = document.getElementById('saveBtnText');

    formData.titulo = document.getElementById('inputTitulo').value;
    formData.dias_visibilidad = parseInt(document.getElementById('inputDias').value) || 30;

    if (activeTab === 'noticias') {
        formData.contenido = document.getElementById('inputContenido').value;
    } else {
        formData.descripcion = document.getElementById('inputContenido').value;
        formData.fecha_evento = document.getElementById('inputFecha').value;
        formData.hora_evento = document.getElementById('inputHora').value;
        formData.lugar = document.getElementById('inputLugar').value;
    }

    if (!formData.titulo) {
        ensureSileoReady();
        if (window.fireToast) {
            window.fireToast('info', 'Falta un dato', 'El título es obligatorio');
        }
        return;
    }

    if (activeTab === 'noticias' && !formData.contenido) {
        ensureSileoReady();
        if (window.fireToast) {
            window.fireToast('info', 'Falta un dato', 'El contenido es obligatorio');
        }
        return;
    }

    if (activeTab === 'eventos' && !formData.descripcion) {
        ensureSileoReady();
        if (window.fireToast) {
            window.fireToast('info', 'Falta un dato', 'La descripción es obligatoria');
        }
        return;
    }

    if (activeTab === 'eventos' && !formData.fecha_evento) {
        ensureSileoReady();
        if (window.fireToast) {
            window.fireToast('info', 'Falta un dato', 'La fecha, hora y lugar del evento son obligatorios');
        }
        return;
    }

    isSaving = true;
    saveBtn.disabled = true;
    saveBtnText.innerHTML = `
        <svg class="spinner-small" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
        </svg>
        Guardando...
    `;

    try {
        const token = sessionStorage.getItem('session_token');
        if (!token) {
            throw new Error('No hay sesión activa');
        }

        const persistMediaItems = [];
        const sourceMediaItems = Array.isArray(formData.media_items) ? formData.media_items : [];

        for (const m of sourceMediaItems) {
            if (!m || !m.type) continue;

            if (typeof m.url === 'string' && (m.url.startsWith('/') || /^https?:\/\//i.test(m.url))) {
                persistMediaItems.push({ type: m.type, url: m.url });
                continue;
            }

            const storageId = m.storage_id ?? m.storageId;
            if (!storageId) continue;

            try {
                const record = await getMediaRecordById(storageId);
                if (!record || !record.blob) continue;

                const form = new FormData();
                form.append('file', record.blob, record.name || `media_${storageId}`);

                const uploadRes = await fetch('/Crear-Noticias/api/media/upload.php', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: form,
                });

                const uploadJson = await uploadRes.json().catch(() => ({}));
                if (!uploadRes.ok || !uploadJson.success || !uploadJson.url) {
                    throw new Error(uploadJson.error || 'Error al subir el archivo');
                }

                persistMediaItems.push({ type: uploadJson.type || m.type, url: uploadJson.url });
            } catch (e) {
                // noop
            }
        }

        const apiData = {
            titulo: formData.titulo,
            media_items: persistMediaItems,
            dias_visibilidad: formData.dias_visibilidad
        };

        if (activeTab === 'noticias') {
            apiData.contenido = formData.contenido;
        } else {
            apiData.descripcion = formData.descripcion;
            apiData.fecha_evento = formData.fecha_evento;
            apiData.hora_evento = formData.hora_evento;
            apiData.lugar = formData.lugar;
        }

        let response;
        if (editingItem) {
            response = await fetch(`/Crear-Noticias/api/${activeTab}/update.php?id=${editingItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(apiData)
            });
        } else {
            response = await fetch(`/Crear-Noticias/api/${activeTab}/create.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(apiData)
            });
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Error al guardar');
        }

        if (result.success) {
            if (window.fireToast) {
                const isNoticias = activeTab === 'noticias';
                const entidad = isNoticias ? 'Noticia' : 'Evento';
                const accion = editingItem
                    ? (isNoticias ? 'actualizada' : 'actualizado')
                    : (isNoticias ? 'Creada' : 'Creado');
                window.fireToast('success', `${entidad} ${accion}`, 'Los cambios se guardaron correctamente.');
            }
            closeForm(() => {
                loadData();
            });
        } else {
            throw new Error(result.error || 'Error al guardar');
        }
    } catch (error) {
        console.error('Error al guardar:', error);
        ensureSileoReady();
        if (window.fireToast) {
            window.fireToast('error', 'Error', error.message || 'Error al guardar. Por favor, intenta de nuevo.');
        }
    } finally {
        isSaving = false;
        saveBtn.disabled = false;
        saveBtnText.textContent = editingItem ? 'Guardar cambios' : 'Publicar';
    }
}

async function handleDelete(itemId) {
    ensureSileoReady();
    try {
        const token = sessionStorage.getItem('session_token');
        if (!token) {
            throw new Error('No hay sesión activa');
        }

        const response = await fetch(`/Crear-Noticias/api/${activeTab}/delete.php?id=${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Error al eliminar');
        }

        if (result.success) {
            if (window.fireToast) {
                const tipo = activeTab === 'noticias' ? 'Noticia' : 'Evento';
                window.fireToast('error', `${tipo} eliminada`, `${tipo} eliminado correctamente.`);
            }
            loadData();
        } else {
            throw new Error(result.error || 'Error al eliminar');
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
        if (window.fireToast) {
            window.fireToast('error', 'Error', error.message || 'Error al eliminar');
        }
    }
}

function positionDeleteModalNearOrigin(container, originEl) {
    if (!container || !originEl) return;
    const rect = originEl.getBoundingClientRect();

    container.style.position = 'fixed';
    container.style.transform = 'none';

    const margin = 12;
    const containerRect = container.getBoundingClientRect();

    let left = rect.right + margin;
    let top = rect.top;

    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;

    if (left + containerRect.width + margin > vw) {
        left = rect.left - containerRect.width - margin;
    }

    if (left < margin) left = margin;

    if (top + containerRect.height + margin > vh) {
        top = vh - containerRect.height - margin;
    }

    if (top < margin) top = margin;

    container.style.left = `${left}px`;
    container.style.top = `${top}px`;
}

function closeDeleteModal(done) {
    const modal = document.getElementById('deleteModal');
    if (!modal) {
        if (typeof done === 'function') done();
        return;
    }

    const container = modal.querySelector('.modal-container');
    const backdrop = modal.querySelector('.modal-backdrop');
    const originEl = deleteOriginElement;

    const finish = () => {
        modal.classList.remove('active');
        deletePendingId = null;
        deleteOriginElement = null;
        if (typeof done === 'function') done();
    };

    if (!container || !window.gsap) {
        finish();
        return;
    }

    const gsap = window.gsap;

    try { gsap.killTweensOf(container); } catch (e) {}
    if (backdrop) {
        try { gsap.killTweensOf(backdrop); } catch (e) {}
    }

    if (!originEl || !window.Flip || !window.CustomEase) {
        gsap.to(container, {
            opacity: 0,
            duration: 0.2,
            onComplete: finish
        });
        if (backdrop) {
            gsap.to(backdrop, { opacity: 0, duration: 0.2 });
        }
        return;
    }

    const Flip = window.Flip;
    const CustomEase = window.CustomEase;
    gsap.registerPlugin(Flip, CustomEase);

    const easeMain = CustomEase.create("custom", "M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1 ");
    const closeEase1 = CustomEase.create("easeName", ".56,.27,0,1");
    const closeEase2 = CustomEase.create("easeName", ".37,.35,0,1");

    let completed = false;
    const safetyTimeout = setTimeout(() => {
        if (completed) return;
        completed = true;
        gsap.set(container, { clearProps: 'all' });
        if (backdrop) gsap.set(backdrop, { clearProps: 'all', opacity: 0 });
        finish();
    }, 900);

    const state = Flip.getState(container);

    Flip.fit(container, originEl, {
        scale: true,
        absolute: true
    });

    try {
        Flip.from(state, {
            targets: container,
            duration: 0.5,
            ease: easeMain,
            scale: true,
            absolute: false,
            onStart() {
                gsap.to(container, {
                    duration: 0.5,
                    ease: closeEase1,
                    borderRadius: '400px',
                });
                gsap.to(container, {
                    duration: 0.5,
                    ease: closeEase2,
                    filter: 'blur(32px)',
                });
                gsap.to(container, {
                    opacity: 0,
                    duration: 0.5,
                    ease: closeEase1,
                });

                if (backdrop) {
                    gsap.to(backdrop, {
                        opacity: 0,
                        duration: 0.3,
                        ease: 'power2.in',
                    });
                }
            },
            onComplete() {
                if (completed) return;
                completed = true;
                clearTimeout(safetyTimeout);
                gsap.set(container, { clearProps: 'all' });
                if (backdrop) gsap.set(backdrop, { clearProps: 'all', opacity: 0 });
                finish();
            }
        });
    } catch (e) {
        if (completed) return;
        completed = true;
        clearTimeout(safetyTimeout);
        gsap.set(container, { clearProps: 'all' });
        if (backdrop) gsap.set(backdrop, { clearProps: 'all', opacity: 0 });
        finish();
    }
}

function openDeleteModal(itemId, originEl) {
    deletePendingId = itemId;
    deleteOriginElement = originEl || null;

    const modal = document.getElementById('deleteModal');
    if (!modal) return;

    const container = modal.querySelector('.modal-container');
    const backdrop = modal.querySelector('.modal-backdrop');

    const tipo = activeTab === 'noticias' ? 'Noticia' : 'Evento';
    const articulo = activeTab === 'noticias' ? 'esta' : 'este';
    const tipoEl1 = document.getElementById('deleteModalTipo');
    const tipoEl2 = document.getElementById('deleteModalTipo2');
    const articuloEl = document.getElementById('deleteModalArticulo');
    if (tipoEl1) tipoEl1.textContent = tipo;
    if (tipoEl2) tipoEl2.textContent = tipo;
    if (articuloEl) articuloEl.textContent = articulo;

    const confirmBtn = document.getElementById('deleteConfirmBtn');
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            const id = deletePendingId;

            closeDeleteModal(() => {
                if (id != null && id !== '') handleDelete(Number(id));
            });
        };
    }

    modal.classList.add('active');

    if (container && window.gsap) {
        try { window.gsap.killTweensOf(container); } catch (e) {}
        window.gsap.set(container, { clearProps: 'all' });
    }
    if (backdrop && window.gsap) {
        try { window.gsap.killTweensOf(backdrop); } catch (e) {}
        window.gsap.set(backdrop, { clearProps: 'all', opacity: 0 });
    }

    if (container && originEl) {
        positionDeleteModalNearOrigin(container, originEl);
    }

    if (!container || !originEl || !window.gsap || !window.Flip || !window.CustomEase) return;

    const gsap = window.gsap;
    const Flip = window.Flip;
    const CustomEase = window.CustomEase;
    gsap.registerPlugin(Flip, CustomEase);

    const easeMain = CustomEase.create("custom", "M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1 ");

    if (backdrop) gsap.set(backdrop, { opacity: 0 });

    const originProps = {
        borderRadius: window.getComputedStyle(originEl).borderRadius,
        background: window.getComputedStyle(originEl).background,
        boxShadow: window.getComputedStyle(originEl).boxShadow,
    };

    Flip.fit(container, originEl, {
        scale: true,
        absolute: true
    });

    const state = Flip.getState(container);
    gsap.set(container, { clearProps: 'all' });

    positionDeleteModalNearOrigin(container, originEl);

    Flip.from(state, {
        targets: container,
        duration: 0.7,
        ease: easeMain,
        scale: true,
        absolute: false,
        onStart() {
            if (backdrop) gsap.to(backdrop, { opacity: 1, duration: 0.3 });
            gsap.from(container, {
                opacity: 0,
                duration: 0.7,
                filter: 'blur(8px)',
                ease: easeMain,
            });
            gsap.from(container, {
                duration: 0.3,
                ease: easeMain,
                ...originProps,
            });
        }
    });
}

window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.positionDeleteModalNearOrigin = positionDeleteModalNearOrigin;