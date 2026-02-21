# 🏫 Escuela Crear - Sistema de Gestión de Contenido

**Plataforma web moderna para la gestión de noticias y eventos de la Escuela Crear, con panel de administración para estudiantes.**

## 📋 Descripción

Escuela Crear es un sistema web completo que permite gestionar y mostrar noticias y eventos de una institución educativa. Incluye un panel de administración intuitivo donde los estudiantes pueden acceder, crear y gestionar contenido, además de una interfaz pública optimizada para todos los dispositivos.

## ✨ Características Principales

### 🏠 Página Principal
- **Diseño responsive** con navegación optimizada para desktop y mobile
- **Navegación inferior móvil** con acceso rápido a Noticias, Eventos y Panel
- **Animaciones fluidas** con GSAP y transiciones modernas
- **Sistema de autenticación** con modal de login elegante

### 📰 Sistema de Noticias
- **Gestión completa** de noticias (CRUD)
- **Vista en cuadrícula** responsive
- **Estados de carga** y vacíos optimizados
- **Animaciones de entrada** y transiciones suaves
- **Modal de login** integrado para acceso seguro

### 📅 Sistema de Eventos
- **Gestión de eventos** con interfaz intuitiva
- **Diseño consistente** con el módulo de noticias
- **Responsive design** adaptado a todos los dispositivos
- **Integración con sistema de autenticación**

### 👥 Panel de Estudiantes
- **Dashboard personalizado** para estudiantes
- **Gestión de usuarios** con roles y permisos
- **Modales de confirmación** con posicionamiento inteligente
- **Interfaz moderna** con componentes reutilizables
- **Sistema de notificaciones** toast integrado

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5** semántico y accesible
- **CSS3** con diseño responsive y animaciones
- **JavaScript ES6+** con prácticas modernas
- **GSAP** para animaciones avanzadas
- **Lucide Icons** para iconografía consistente

### Características Técnicas
- **Mobile-first approach** con navegación adaptativa
- **CSS Grid y Flexbox** para layouts modernos
- **Animaciones con GSAP Flip** para transiciones fluidas
- **Sistema de modales** con backdrop blur
- **Optimización de scroll** sin saltos de página
- **Diseño atómico** con componentes reutilizables

## 📱 Responsive Design

El proyecto está optimizado para:
- **Desktop** (1024px+) - Navegación completa y todas las funcionalidades
- **Tablet** (768px-1023px) - Adaptación intermedia
- **Mobile** (<768px) - Navegación inferior fija y experiencia táctil optimizada

## 🚀 Instalación y Uso

1. **Clonar el repositorio**
```bash
git clone https://github.com/FacuX23/Crear-Noticias
cd Crear-Noticias
```

2. **Configurar servidor local**
```bash
# Usando XAMPP/MAMP/WAMP
# Colocar la carpeta en htdocs/
# Acceder via http://localhost/Crear-Noticias/
```

3. **Abrir en navegador**
- Página principal: `http://localhost/Crear-Noticias/`
- Panel: `http://localhost/Crear-Noticias/Panel/`
- Noticias: `http://localhost/Crear-Noticias/Noticias/`
- Eventos: `http://localhost/Crear-Noticias/Eventos/`

## 📁 Estructura del Proyecto

```
Crear-Noticias/
├── index.html              # Página principal
├── styles.css              # Estilos principales
├── header.js               # Lógica de navegación
├── Noticias/
│   ├── index.html          # Página de noticias
│   ├── styles.css          # Estilos específicos
│   └── noticias.js         # Lógica de noticias
├── Eventos/
│   ├── index.html          # Página de eventos
│   ├── styles.css          # Estilos específicos
│   └── eventos.js          # Lógica de eventos
├── Panel/
│   ├── index.html          # Panel de administración
│   ├── styles.css          # Estilos del panel
│   └── panel.js            # Lógica del panel
└── logo.png                # Logo de la institución
```

## 🎨 Diseño y UX

- **Diseño limpio y moderno** con identidad visual consistente
- **Colores primarios**: Azul (#2563eb) y grises suaves
- **Tipografía system** para mejor rendimiento
- **Microinteracciones** sutiles en botones y enlaces
- **Estados de carga** y vacíos bien diseñados
- **Accesibilidad** con ARIA labels y semántica HTML5

## 🔧 Características Técnicas Destacadas

### Animaciones Avanzadas
- **GSAP Flip** para transiciones de modales
- **Animaciones de entrada** con easing personalizado
- **Backdrop blur** para modales
- **Scroll suave** con CSS scroll-behavior

### Optimización Mobile
- **Navegación inferior fija** con backdrop blur
- **Ocultación de header** en mobile
- **Padding compensado** para evitar solapamiento
- **Touch-friendly** con tamaños adecuados

### Sistema de Modales
- **Posicionamiento inteligente** cerca del elemento trigger
- **Backdrop con blur** y animaciones suaves
- **Prevención de scroll** sin saltos de página
- **Focus management** para accesibilidad

## 🤝 Contribución

1. Fork del proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'Agregando nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**[Facundo Brites]** - *Desarrollador Web* - [GitHub Profile](https://github.com/FacuX23)

## 🙏 Agradecimientos

- **GSAP** por las increíbles animaciones
- **Lucide Icons** por la iconografía moderna
- **La comunidad web** por inspiración y mejores prácticas

---

