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

    function isUsableOriginElement(el) {
        if (!el || !el.getBoundingClientRect) return false;
        var cs;
        try { cs = window.getComputedStyle(el); } catch (e) { cs = null; }
        if (cs && (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0')) return false;
        var r;
        try { r = el.getBoundingClientRect(); } catch (e2) { r = null; }
        if (!r) return false;
        return (r.width > 2 && r.height > 2);
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

        modal.__loginOriginEl = originEl || modal.__loginOriginEl || null;
        if (modal.__loginOriginEl && !isUsableOriginElement(modal.__loginOriginEl)) {
            modal.__loginOriginEl = null;
        }

        if (!container || !card) {
            modal.classList.add('active');
            try { modal.style.visibility = ''; } catch (e) { }
            return;
        }

        if (!hasGsapCore()) {
            modal.classList.add('active');
            try { modal.style.visibility = ''; } catch (e) { }
            return;
        }

        var gsap = window.gsap;
        var Flip = window.Flip;
        var CustomEase = window.CustomEase;

        try { gsap.registerPlugin(Flip, CustomEase); } catch (e) { }

        try { gsap.killTweensOf(modal); } catch (e) { }
        try { gsap.killTweensOf(container); } catch (e) { }
        try { gsap.killTweensOf(card); } catch (e) { }
        if (backdrop) { try { gsap.killTweensOf(backdrop); } catch (e) { } }

        try { gsap.set(container, { clearProps: 'all' }); } catch (e) { }
        try { gsap.set(card, { clearProps: 'all' }); } catch (e) { }
        if (backdrop) { try { gsap.set(backdrop, { clearProps: 'all' }); } catch (e) { } }
        try { container.removeAttribute('data-flip-id'); } catch (e) { }
        try { card.removeAttribute('data-flip-id'); } catch (e) { }

        try { gsap.set(modal, { opacity: 0 }); } catch (e) { }
        try { modal.style.visibility = 'hidden'; } catch (e) { }

        modal.classList.add('active');
        forceLayout(modal);
        forceLayout(container);

        function fallbackOpen() {
            var easeMain2 = getEaseMain();
            try { modal.style.visibility = 'visible'; } catch (e) { }
            try { gsap.set(modal, { opacity: 1 }); } catch (e) { }
            if (backdrop) {
                try { gsap.set(backdrop, { opacity: 0 }); } catch (e) { }
                try { gsap.to(backdrop, { opacity: 1, duration: 0.25, ease: 'power2.out' }); } catch (e) { }
            }
            try {
                gsap.fromTo(card,
                    { opacity: 0, filter: 'none', y: -20, scale: 0.98 },
                    {
                        opacity: 1,
                        filter: 'blur(0px)',
                        y: 0,
                        scale: 1,
                        duration: 0.35,
                        ease: easeMain2,
                        onComplete: function () { try { modal.style.visibility = ''; } catch (e) { } }
                    }
                );
            } catch (e) { }
        }

        if (!hasFlip() || !modal.__loginOriginEl) {
            fallbackOpen();
            return;
        }

        var easeMain = getEaseMain();
        var originElement = modal.__loginOriginEl;
        var flipId = 'flip-animate';
        try { originElement.setAttribute('data-flip-id', flipId); } catch (e) { }
        try { container.setAttribute('data-flip-id', flipId); } catch (e) { }
        try { card.setAttribute('data-flip-id', flipId); } catch (e) { }

        var originElementState = Flip.getState(originElement);
        var originElementProps = modal.__loginOriginProps || getOriginProps(originElement);
        modal.__loginOriginProps = originElementProps;

        var bounds = originElementState.elementStates[0].bounds;
        var modalRect;
        var modalCS;
        var padTop = 0;
        var padLeft = 0;
        try { modalRect = modal.getBoundingClientRect(); } catch (e2) { modalRect = { top: 0, left: 0 }; }
        try { modalCS = window.getComputedStyle(modal); } catch (e3) { modalCS = null; }
        if (modalCS) {
            padTop = parseFloat(modalCS.paddingTop) || 0;
            padLeft = parseFloat(modalCS.paddingLeft) || 0;
        }

        Object.assign(container.style, {
            position: 'absolute',
            borderRadius: originElementProps.borderRadius,
            background: originElementProps.background,
            boxShadow: originElementProps.boxShadow,
            width: originElement.offsetWidth + 'px',
            height: originElement.offsetHeight + 'px',
            top: (bounds.top - (modalRect.top || 0) - padTop) + 'px',
            left: (bounds.left - (modalRect.left || 0) - padLeft) + 'px',
        });

        var modalWindowContainerState = Flip.getState(originElement);

        container.removeAttribute('style');
        Object.assign(container.style, {
            background: originElementProps.background,
            borderRadius: originElementProps.borderRadius,
            boxShadow: originElementProps.boxShadow,
        });

        forceLayout(container);

        requestAnimationFrame(function () {
            try {
                var modalWindowState = Flip.getState(card);

                Object.assign(container.style, {
                    width: modalWindowState.elementStates[0].bounds.width + 'px',
                    height: modalWindowState.elementStates[0].bounds.height + 'px',
                    background: window.getComputedStyle(card).background,
                    borderRadius: window.getComputedStyle(card).borderRadius,
                });

                Object.assign(card.style, {
                    minWidth: modalWindowState.elementStates[0].bounds.width + 'px',
                    minHeight: modalWindowState.elementStates[0].bounds.height + 'px',
                });

                forceLayout(container);

                Flip.from(modalWindowContainerState, {
                    targets: container,
                    duration: 0.7,
                    scale: false,
                    absolute: false,
                    ease: easeMain,
                    onStart: function () {
                        try { modal.style.visibility = 'visible'; } catch (e) { }
                        gsap.set(modal, { opacity: 1 });

                        if (backdrop) {
                            gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
                        }

                        if (window.innerWidth < 680) {
                            var otherProps = {
                                background: originElementProps.background,
                                boxShadow: originElementProps.boxShadow,
                            };
                            gsap.from(container, {
                                duration: 0.3,
                                ease: easeMain,
                                ...otherProps
                            });
                            gsap.fromTo(container,
                                { borderRadius: originElementProps.borderRadius },
                                {
                                    borderRadius: window.getComputedStyle(card).borderRadius,
                                    duration: 0.5,
                                    ease: 'power2.inOut'
                                }
                            );
                        } else {
                            gsap.from(container, {
                                duration: 0.3,
                                ease: easeMain,
                                ...originElementProps
                            });
                        }
                    },
                });

                Flip.from(originElementState, {
                    targets: card,
                    duration: 0.7,
                    ease: easeMain,
                    scale: true,
                    absolute: false,
                    onStart: function () {
                        gsap.set(modal, { opacity: 1 });
                        gsap.from(card, {
                            opacity: 0,
                            duration: 0.7,
                            filter: 'none',
                            ease: easeMain
                        });
                    },
                    onComplete: function () {
                        try { gsap.set(container, { clearProps: 'all' }); } catch (e) { }
                        try { gsap.set(card, { clearProps: 'all' }); } catch (e) { }
                        if (backdrop) { try { gsap.set(backdrop, { clearProps: 'all' }); } catch (e) { } }
                        try { modal.style.visibility = ''; } catch (e) { }
                    }
                });
            } catch (e) {
                fallbackOpen();
            }
        });
    }

    function animateClose(originEl) {
        var modal = document.getElementById('loginModal');
        if (!modal) return;

        if (modal.__loginIsClosing) return;
        modal.__loginIsClosing = true;

        var container = modal.querySelector('.login-container');
        var backdrop = modal.querySelector('.login-backdrop');
        var card = modal.querySelector('.login-card');

        modal.__loginOriginEl = originEl || modal.__loginOriginEl || null;
        if (modal.__loginOriginEl && !isUsableOriginElement(modal.__loginOriginEl)) {
            modal.__loginOriginEl = null;
        }

        if (!container || !card || !hasGsapCore()) {
            modal.classList.remove('active');
            try { modal.style.visibility = ''; } catch (e) { }
            modal.__loginOriginEl = null;
            modal.__loginOriginProps = null;
            modal.__loginIsClosing = false;
            return;
        }

        var gsap = window.gsap;
        var Flip = window.Flip;
        var CustomEase = window.CustomEase;

        try { gsap.registerPlugin(Flip, CustomEase); } catch (e) { }

        try { gsap.killTweensOf(modal); } catch (e) { }
        try { gsap.killTweensOf(container); } catch (e) { }
        try { gsap.killTweensOf(card); } catch (e) { }
        if (backdrop) { try { gsap.killTweensOf(backdrop); } catch (e) { } }

        function finishClose() {
            modal.classList.remove('active');
            try { modal.style.visibility = ''; } catch (e) { }
            try { gsap.set(modal, { clearProps: 'all' }); } catch (e) { }
            modal.__loginOriginEl = null;
            modal.__loginOriginProps = null;
            modal.__loginIsClosing = false;
        }

        function fallbackClose() {
            if (backdrop) {
                try { gsap.to(backdrop, { opacity: 0, duration: 0.2, ease: 'power2.in' }); } catch (e) { }
            }
            try {
                gsap.to(card, {
                    opacity: 0,
                    filter: 'none',
                    scale: 0.98,
                    duration: 0.25,
                    ease: getEaseMain(),
                    onComplete: finishClose,
                });
            } catch (e) {
                finishClose();
            }
        }

        if (!hasFlip() || !modal.__loginOriginEl) {
            fallbackClose();
            return;
        }

        var easeMain = getEaseMain();
        var originElement = modal.__loginOriginEl;
        var flipState = Flip.getState(originElement);

        Flip.to(flipState, {
            targets: card,
            duration: 0.5,
            ease: easeMain,
            scale: true,
            absolute: false,
            onStart: function () {
                gsap.to(card, {
                    duration: 0.5,
                    ease: CustomEase ? CustomEase.create("easeName", ".56,.27,0,1") : 'power2.in',
                    borderRadius: '8px',
                });
                gsap.to(card, {
                    duration: 0.5,
                    ease: CustomEase ? CustomEase.create("easeName", ".37,.35,0,1") : 'power2.in',
                    filter: 'blur(8px)',
                });
                gsap.to(card, {
                    opacity: 0,
                    duration: 0.4,
                    ease: CustomEase ? CustomEase.create("easeName", ".56,.27,0,1") : 'power2.in',
                });
            },
            onComplete: function () {
                try { originElement.removeAttribute('data-flip-id'); } catch (e) { }
                try { card.removeAttribute('data-flip-id'); } catch (e) { }
                try { container.removeAttribute('data-flip-id'); } catch (e) { }
                try { gsap.set(container, { clearProps: 'all' }); } catch (e) { }
                try { gsap.set(card, { clearProps: 'all' }); } catch (e) { }
                if (backdrop) { try { gsap.set(backdrop, { clearProps: 'all' }); } catch (e) { } }
                finishClose();
            }
        });

        gsap.to(container, {
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            duration: 0,
        });

        gsap.to(modal, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
        });
    }

    window.loginModalAnim = {
        open: animateOpen,
        close: animateClose
    };
})();

