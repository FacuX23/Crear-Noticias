(function () {
    function hasGsapCore() {
        return typeof window.gsap !== 'undefined';
    }

    function hasFlip() {
        return hasGsapCore() && typeof window.Flip !== 'undefined' && typeof window.CustomEase !== 'undefined';
    }

    function getEaseMain() {
        if (typeof window.CustomEase !== 'undefined') {
            return window.CustomEase.create("custom", "M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1 ");
        }
        return 'power2.out';
    }

    function forceLayout(el) {
        if (!el) return;
        void el.offsetWidth;
        void el.offsetHeight;
        void el.getBoundingClientRect();
    }

    function getOriginProps(originEl) {
        if (!originEl) return null;
        var cs = window.getComputedStyle(originEl);
        return {
            borderRadius: cs.borderRadius,
            background: cs.background,
            boxShadow: cs.boxShadow,
        };
    }

    function animateOpen(originEl) {
        var modal = document.getElementById('loginModal');
        if (!modal) return;

        var container = modal.querySelector('.login-container');
        var backdrop = modal.querySelector('.login-backdrop');
        var card = modal.querySelector('.login-card');

        if (!container) {
            modal.classList.add('active');
            try { modal.style.visibility = ''; } catch (e) {}
            return;
        }

        modal.classList.add('active');
        try { modal.style.visibility = 'hidden'; } catch (e) {}

        // Asegurar layout antes de medir/animar
        forceLayout(modal);
        forceLayout(container);

        modal.__loginOriginEl = originEl || modal.__loginOriginEl || null;

        var gsap = window.gsap;
        var Flip = window.Flip;
        var CustomEase = window.CustomEase;

        if (hasFlip() && container && modal.__loginOriginEl) {
            try { gsap.registerPlugin(Flip, CustomEase); } catch (e) {}

            try { gsap.killTweensOf(container); } catch (e) {}
            if (card) {
                try { gsap.killTweensOf(card); } catch (e) {}
            }
            if (backdrop) {
                try { gsap.killTweensOf(backdrop); } catch (e) {}
            }

            var easeMain = getEaseMain();
            var target = card || container;

            if (!target) {
                modal.classList.remove('active');
                try { modal.style.visibility = ''; } catch (e) {}
                modal.__loginOriginEl = null;
                modal.__loginIsClosing = false;
                return;
            }

            var originProps = getOriginProps(modal.__loginOriginEl);

            // Evitar flash del estado final mientras se prepara Flip
            gsap.set(target, { clearProps: 'all', opacity: 1, visibility: 'hidden' });
            gsap.set(container, { clearProps: 'all' });
            if (backdrop) gsap.set(backdrop, { clearProps: 'all', opacity: 0 });

            try {
                // Copiado del patrón de accountModal (Panel): fit -> state -> clearProps -> Flip.from
                Flip.fit(container, modal.__loginOriginEl, {
                    scale: true,
                    absolute: true
                });
                var state = Flip.getState(container);
                gsap.set(container, { clearProps: 'all' });

                Flip.from(state, {
                    targets: container,
                    duration: 0.7,
                    ease: easeMain,
                    scale: true,
                    absolute: false,
                    onStart: function () {
                        try { modal.style.visibility = 'visible'; } catch (e) {}
                        gsap.set(target, { visibility: 'visible' });
                        if (backdrop) {
                            gsap.from(backdrop, {
                                opacity: 1,
                                duration: 0.3,
                                ease: 'power2.in'
                            });
                        }
                        gsap.from(target, {
                            opacity: 0,
                            duration: 0.7,
                            filter: 'none',
                            ease: easeMain
                        });
                        if (originProps) {
                            gsap.from(target, {
                                duration: 0.3,
                                ease: easeMain,
                                borderRadius: originProps.borderRadius,
                                background: originProps.background,
                                boxShadow: originProps.boxShadow,
                            });
                        }
                        if (backdrop) {
                            gsap.to(backdrop, { opacity: 1, duration: 0.3, ease: 'power2.out' });
                        }
                    },
                    onComplete: function () {
                        // Dejar el modal limpio para próximas aperturas
                        try { gsap.set(container, { clearProps: 'all' }); } catch (e) {}
                        if (backdrop) {
                            try { gsap.set(backdrop, { clearProps: 'all' }); } catch (e) {}
                        }
                        if (card) {
                            try { gsap.set(card, { clearProps: 'all' }); } catch (e) {}
                        }
                        try { modal.style.visibility = ''; } catch (e) {}
                    }
                });
            } catch (e) {
                try { modal.style.visibility = 'visible'; } catch (e2) {}
                if (hasGsapCore()) {
                    var easeFallback = getEaseMain();
                    var t = card || container;
                    try { window.gsap.set(t, { opacity: 0, scale: 0.96, filter: 'none' }); } catch (e3) {}
                    try { window.gsap.to(t, { opacity: 1, scale: 1, filter: 'none', duration: 0.35, ease: easeFallback }); } catch (e4) {}
                }
            }

            return;
        }

        // Fallback GSAP (sin Flip)
        if (hasGsapCore() && container) {
            var easeMain2 = getEaseMain();
            var target2 = card || container;
            try { gsap.killTweensOf(target2); } catch (e) {}
            if (backdrop) {
                try { gsap.killTweensOf(backdrop); } catch (e) {}
                gsap.set(backdrop, { opacity: 0 });
                gsap.to(backdrop, { opacity: 1, duration: 0.25, ease: 'power2.out' });
            }
            try { modal.style.visibility = 'visible'; } catch (e) {}
            gsap.set(target2, { opacity: 0, y: -20, scale: 0.98, filter: 'none' });
            gsap.to(target2, { opacity: 1, y: 0, scale: 1, filter: 'none', duration: 0.35, ease: easeMain2 });
        }
    }

    function animateClose(originEl) {
        var modal = document.getElementById('loginModal');
        if (!modal) return;

        if (modal.__loginIsClosing) return;
        modal.__loginIsClosing = true;

        var container = modal.querySelector('.login-container');
        var backdrop = modal.querySelector('.login-backdrop');
        var card = modal.querySelector('.login-card');

        if (!container) {
            modal.classList.remove('active');
            try { modal.style.visibility = ''; } catch (e) {}
            modal.__loginOriginEl = null;
            modal.__loginIsClosing = false;
            return;
        }

        modal.__loginOriginEl = originEl || modal.__loginOriginEl || null;

        var gsap = window.gsap;
        var Flip = window.Flip;
        var CustomEase = window.CustomEase;

        if (hasFlip() && container && modal.__loginOriginEl) {
            try { gsap.registerPlugin(Flip, CustomEase); } catch (e) {}

            try { gsap.killTweensOf(container); } catch (e) {}
            if (card) {
                try { gsap.killTweensOf(card); } catch (e) {}
            }
            if (backdrop) {
                try { gsap.killTweensOf(backdrop); } catch (e) {}
            }

            var easeMain = getEaseMain();
            var target = card || container;

            // Asegurar visible por si quedó oculto por la preparación
            try { gsap.set(target, { visibility: 'visible' }); } catch (e) {}

            try {
                var state = Flip.getState(container);
                Flip.fit(container, modal.__loginOriginEl, { scale: true, absolute: true });

                Flip.from(state, {
                    targets: container,
                    duration: 0.5,
                    ease: easeMain,
                    scale: true,
                    absolute: false,
                    onStart: function () {
                        if (backdrop) gsap.to(backdrop, { opacity: 0, duration: 0.25, ease: 'power2.in' });
                        gsap.to(target, { opacity: 0, duration: 0.5, ease: easeMain });
                    },
                    onComplete: function () {
                        modal.classList.remove('active');
                        try { gsap.set(container, { clearProps: 'all' }); } catch (e) {}
                        if (backdrop) {
                            try { gsap.set(backdrop, { clearProps: 'all' }); } catch (e) {}
                        }
                        if (card) {
                            try { gsap.set(card, { clearProps: 'all' }); } catch (e) {}
                        }
                        try { modal.style.visibility = ''; } catch (e) {}
                        modal.__loginOriginEl = null;
                        modal.__loginIsClosing = false;
                    }
                });
            } catch (e) {
                if (backdrop) {
                    try { gsap.to(backdrop, { opacity: 0, duration: 0.2, ease: 'power2.in' }); } catch (e2) {}
                }
                try {
                    gsap.to(target, {
                        opacity: 0,
                        scale: 0.96,
                        filter: 'none',
                        duration: 0.25,
                        ease: easeMain,
                        onComplete: function () {
                            modal.classList.remove('active');
                            try { modal.style.visibility = ''; } catch (e3) {}
                            modal.__loginOriginEl = null;
                            modal.__loginIsClosing = false;
                        }
                    });
                } catch (e4) {
                    modal.classList.remove('active');
                    try { modal.style.visibility = ''; } catch (e5) {}
                    modal.__loginOriginEl = null;
                    modal.__loginIsClosing = false;
                }
            }

            return;
        }

        if (hasGsapCore() && container) {
            var easeMain2 = getEaseMain();
            var target2 = card || container;
            if (backdrop) {
                try { gsap.killTweensOf(backdrop); } catch (e) {}
                gsap.to(backdrop, { opacity: 0, duration: 0.2, ease: 'power2.in' });
            }
            gsap.to(target2, {
                opacity: 0,
                y: -20,
                scale: 0.98,
                filter: 'none',
                duration: 0.25,
                ease: easeMain2,
                onComplete: function () {
                    modal.classList.remove('active');
                    try { modal.style.visibility = ''; } catch (e) {}
                    modal.__loginOriginEl = null;
                    modal.__loginIsClosing = false;
                }
            });
            return;
        }

        modal.classList.remove('active');
        try { modal.style.visibility = ''; } catch (e) {}
        modal.__loginOriginEl = null;
        modal.__loginIsClosing = false;
    }

    window.loginModalAnim = {
        open: animateOpen,
        close: animateClose
    };
})();
