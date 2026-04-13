import { defineStore } from 'pinia'
import { markRaw } from 'vue'

let _modalId = 0

export const useModalStore = defineStore('modal', {
  
    state: () => ({
      stack: []
    }),

    getters: {
        hasModals: (state) => state.stack.length > 0,
        topModal: (state) => state.stack[state.stack.length - 1] || null
    },

    actions: {

        open(component, props = {}, size = '', originElement = null, originElementProps = null) {

            const id = ++_modalId

            // const flipId = originElement ? `flip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : null
            const flipId = originElement ? `flip-animate` : null
            if(originElement) originElement.setAttribute('data-flip-id', flipId)

            // Separar props del modal de props del componente
            const { absolute, noBackdrop, noStyle, ...componentProps } = props
            const modalConfig = { absolute, noBackdrop, noStyle }

            this.stack.push({
                id,
                component: markRaw(component),
                props: componentProps,
                modalConfig,
                size,
                originElement,
                flipId,
                originElementProps,
            })

            return id
        },

        close(id) {
            const index = this.stack.findIndex(m => m.id === id)
            if(index !== -1) {
                // Marcar como cerrando en lugar de eliminar
                this.stack[index].closing = true
            }
        },

        removeModal(id) {
            const index = this.stack.findIndex(m => m.id === id)
            if(index !== -1) {
                const modal = this.stack[index]
                if(modal.originElement && modal.flipId) {
                    modal.originElement.removeAttribute('data-flip-id')
                }
                this.stack.splice(index, 1)
            }
        },

        closeTop() {
            if (this.stack.length > 0) {

                const modal = this.topModal
                if (modal.originElement && modal.flipId) {
                    modal.originElement.removeAttribute('data-flip-id')
                }
                this.stack.pop()

            }
        },

        closeAll() {
            this.stack.forEach(modal => {
                if (modal.originElement && modal.flipId) {
                    modal.originElement.removeAttribute('data-flip-id')
                }
            })
            this.stack = []
        }
    }
  
})