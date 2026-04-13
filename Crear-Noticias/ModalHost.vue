<script setup>
import { useModalStore } from '../MODALES/modal'
import { nextTick } from 'vue'
import { Flip } from 'gsap/Flip'
import gsap from 'gsap'
import CustomEase from 'gsap/CustomEase'

gsap.registerPlugin(Flip)
const modalStore = useModalStore()

// vue transition hooks
function onBeforeEnter(el){
    gsap.set(el, { opacity: 0})
}
function onEnter(el, done){
    
    // get modal from stack
    const modalId = parseInt(el.dataset.modalId)
    const modal = modalStore.stack.find(m => m.id === modalId)

    if(!modal || !modal.flipId){
        gsap.to(el, { 
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: done
        })
        return
    }

    const originElement = modal.originElement
    const modalWindow = el.querySelector('.modal-window')
    const modalWindowContainer = el.querySelector('.modal-window-container')

    if(modal && modal.flipId){
        modalWindow.setAttribute('data-flip-id', modal.flipId)
        modalWindowContainer.setAttribute('data-flip-id', modal.flipId)
    }

    if(!modalWindow){
        done()
        return
    }

    // container initial style from origin element
    const originElementState = Flip.getState(originElement)
    const originElementProps = modal.originElementProps ?? {
        borderRadius: window.getComputedStyle(originElement).borderRadius,
        background: window.getComputedStyle(originElement).background,
        boxShadow: window.getComputedStyle(originElement).boxShadow,
    }
    Object.assign(modalWindowContainer.style, {
        position: 'absolute',
        borderRadius: originElementProps.borderRadius,
        background: originElementProps.background,
        boxShadow: originElementProps.boxShadow,
        width: `${originElement.offsetWidth}px`,
        height: `${originElement.offsetHeight}px`,
        top: originElementState.elementStates[0].bounds.top + 'px',
        bottom: originElementState.elementStates[0].bounds.bottom + 'px',
        left: originElementState.elementStates[0].bounds.left + 'px',
        right: originElementState.elementStates[0].bounds.right + 'px',
    })
    
    
    const modalWindowContainerState = Flip.getState(originElement)

    modalWindowContainer.removeAttribute('style')
    Object.assign(modalWindowContainer.style, {
        background: originElementProps.background,
        borderRadius: originElementProps.borderRadius,
        boxShadow: originElementProps.boxShadow,
    })

    nextTick(() => {

        const modalWindowState = Flip.getState(modalWindow)

        Object.assign(modalWindowContainer.style, {
            width: modalWindowState.elementStates[0].bounds.width + 'px',
            height: modalWindowState.elementStates[0].bounds.height + 'px',
            background: window.getComputedStyle(modalWindow).background,
            borderRadius: window.getComputedStyle(modalWindow).borderRadius,
        })

        Object.assign(modalWindow.style, {
            minWidth: modalWindowState.elementStates[0].bounds.width + 'px',
            minHeight: modalWindowState.elementStates[0].bounds.height + 'px',
        })
  
        if(modal.modalConfig?.absolute){

            const screenWidth = window.innerWidth
            const screenHeight = window.innerHeight

            const originTop = originElementState.elementStates[0].bounds.top
            const originBottom = originElementState.elementStates[0].bounds.bottom
            const originLeft = originElementState.elementStates[0].bounds.left
            const originRight = originElementState.elementStates[0].bounds.right

            let finalTop = null
            let finalBottom = null
            let finalLeft = null
            let finalRight = null
            let backdropClass = null

            // Posicionamiento horizontal
            if(originLeft < (screenWidth / 2)){
                // Lado izquierdo: mover 16px más a la izquierda
                finalRight = "unset"
                finalLeft = `${Math.round(originLeft - 16)}px`
                backdropClass = 'modal-justify-left'
            } else {
                // Lado derecho: mover 16px más a la derecha
                finalLeft = "unset"
                finalRight = `${Math.round((screenWidth - originRight) - 16)}px`
                backdropClass = 'modal-justify-right'
            }

            // Posicionamiento vertical
            if(originTop < (screenHeight / 2)){
                // Parte superior: mover 16px más arriba
                finalBottom = "unset"
                finalTop = `${Math.round(originTop - 16)}px`
                backdropClass = backdropClass ? `${backdropClass} modal-align-top` : 'modal-align-top'
            } else {
                // Parte inferior: mover 16px más abajo
                finalTop = "unset"
                finalBottom = `${Math.round((screenHeight - originBottom) - 16)}px`
                backdropClass = backdropClass ? `${backdropClass} modal-align-bottom` : 'modal-align-bottom'
            }

            Object.assign(modalWindowContainer.style, {
                top: finalTop,
                bottom: finalBottom,
                left: finalLeft,
                right: finalRight,
            })
            modalWindowContainer.classList.add(`modal-position-absolute`)
            
            // Preserve existing classes like 'no-backdrop'
            const existingClasses = el.className.split(' ')
            const hasNoBackdrop = existingClasses.includes('no-backdrop')
            el.className = `modal-backdrop ${backdropClass}${hasNoBackdrop ? ' no-backdrop' : ''}`
        }

        Flip.from(modalWindowContainerState,{
            targets: modalWindowContainer,
            duration: 0.7,
            scale:false,
            absolute:false,
            ease: CustomEase.create("custom", "M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1 "),
            onStart(){
                if(window.innerWidth < 680){
                    // Animar propiedades excepto borderRadius
                    const { borderRadius, ...otherProps } = originElementProps
                    gsap.from(modalWindowContainer, {
                        duration: 0.3,
                        ease: CustomEase.create("custom", "M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1 "),
                        ...otherProps
                    })
                    
                    // Animar borderRadius por separado con su propio timing y curva
                    gsap.fromTo(modalWindowContainer, 
                        { borderRadius: originElementProps.borderRadius },
                        {
                            borderRadius: window.getComputedStyle(modalWindow).borderRadius,
                            duration: 0.5, // Duración personalizada
                            ease: "power2.inOut", // Curva personalizada
                        }
                    )
                } else {
                    // En pantallas pequeñas, animar todas las propiedades juntas
                    gsap.from(modalWindowContainer, {
                        duration: 0.3,
                        ease: CustomEase.create("custom", "M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1 "),
                        ...originElementProps
                    })
                }
            },
        })
        // animate from the origin
        Flip.from(originElementState, {
            targets: modalWindow,
            duration: 0.7,
            ease: CustomEase.create("custom", "M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1 "),
            scale: true,
            absolute:false,
            onStart(){
                gsap.set(el, { opacity: 1 })
                gsap.from(modalWindow, { 
                    opacity: 0, 
                    duration: 0.7,
                    filter: 'blur(8px)',
                    ease: CustomEase.create("custom", "M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1 ")
                })
            },
            onComplete: done,
        })

        
        
        
    })
}

function onLeave(el, done){

    const modalId = parseInt(el.dataset.modalId)
    const modal = modalStore.stack.find(m => m.id === modalId)
    const modalWindow = el.querySelector('.modal-window')
    const modalWindowContainer = el.querySelector('.modal-window-container')

    if (!modal || !modal.originElement || !modalWindow) {
        gsap.to(el, {
            opacity: 0,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
                modalStore.removeModal(modalId)
                done()
            }
        })
        return
    }

    const originElement = modal.originElement
    const flipState = Flip.getState(originElement)

    Flip.to(flipState, {
        targets: modalWindow,
        duration: 0.5,
        ease: CustomEase.create("custom", "M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1 "),
        scale: true,
        absolute:false,
        onStart(){
            gsap.to(modalWindow, { 
                duration: 0.5,
                ease: CustomEase.create("easeName", ".56,.27,0,1"),
                borderRadius: '400px',
            })
            gsap.to(modalWindow, {
                duration:0.5,
                ease: CustomEase.create("easeName", ".37,.35,0,1"),
                filter: 'blur(32px)',
            })
            gsap.to(modalWindow, {
                opacity: 0,
                duration: 0.5,
                ease: CustomEase.create("easeName", ".56,.27,0,1"),
            })
        },
        onComplete: () => {
            modalStore.removeModal(modalId)
            done()
        }
    })

    gsap.to(modalWindowContainer, {
        background:"transparent",
        border:"none",
        boxShadow:"none",
        duration:0
    })

    gsap.to(el, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
    })
}

function onBackdropClick(modalId){
    if(!modalId) return
    modalStore.close(modalId)
}

</script>
<template>
    <teleport to="body">

        <TransitionGroup
            v-on:before-enter="onBeforeEnter"
            v-on:enter="onEnter"
            v-on:leave="onLeave"
            v-bind:css="false"
            >
        
            
                <div
                    v-for="(modal, index) in modalStore.stack.filter(m => !m.closing)"
                    v-bind:key="modal.id"
                    v-bind:data-modal-id="modal.id"

                    v-bind:style="{ zIndex: 1000 + index }"
                    v-on:click="onBackdropClick(modal.id)"
                    v-bind:class="['modal-backdrop', { 'no-backdrop': modal.modalConfig?.noBackdrop }]"
                    >

                    <div class="modal-window-container">

                        <div
                            class="modal-window"
                            v-bind:class="[modal.size, { 'no-styles': modal.modalConfig?.noStyle }]"
                            v-on:click.stop
                            >
                            
                            <component 
                                v-bind:is="modal.component"
                                v-bind="modal.props"
                                v-on:close="modalStore.close(modal.id)"
                                v-on:closeAll="modalStore.closeAll()"
                            />

                        </div>

                    </div>

                </div>
        

        </TransitionGroup>

    </teleport>
</template>

<style scoped>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        box-sizing: border-box;
    }
    .modal-backdrop.no-backdrop {
        background: transparent;
        /* pointer-events: none; */
    }
    .modal-backdrop.no-backdrop .modal-window-container {
        /* pointer-events: auto; */
    }
    .modal-window-container{
        overflow:hidden;
    }
    .modal-window {
        position:absolute;
        display:flex;
        flex-direction:column;
        
        width:calc(100% - 48px);
        /* width:100%; */
        height:auto;
        max-width:600px;
        max-height: 80vh;
        
        box-sizing: border-box;

        padding:24px;
        border-radius:32px;

        overflow:hidden;
        overflow-x: hidden;

        flex-grow:1;

        background: white;
    }

    .modal-window.no-styles {
        padding: 0;
        background: transparent;
        border-radius: 0;
    }

    .modal-window.increased{
        overflow:auto;
        max-width:1200px;
        height:100%;
    }

    @media only screen and (min-width: 680px){
        .modal-window.h-auto{
            height:auto !important;
        }
        .modal-window.slim{
            max-width:400px;
            max-height:600px;
        }
        .modal-window.semi-slim{
            max-width:800px;
            max-height:800px;
        }
        .modal-window.mini{
            max-width: 240px;
        }

        .modal-window-container.modal-position-absolute{ position: sticky; }

        .modal-align-top{ align-items: flex-start; }
        .modal-align-bottom{ align-items: flex-end; }
        .modal-justify-left{ justify-content: flex-start; }
        .modal-justify-right{ justify-content: flex-end; }
    }

    @media only screen and (max-width: 680px){
        .modal-backdrop{
            padding:0;
        }
        .modal-window{
            /* width:100%; */
            /* max-width:100%; */
        }
        .modal-window.increased{
            padding-top: env(safe-area-inset-top);
            padding:24px;
            max-width: unset !important;
            max-height: unset;
            width: 100%;
            height: 100%;
            border-radius: 0;
        }
    }

    @media (prefers-color-scheme: dark) {
            .modal-window-container {
                box-shadow: 0 0 0 1px rgba(255,255,255, 0.05);
            } 
    }
    
</style>