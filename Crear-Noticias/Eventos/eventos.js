const MEDIA_DB_NAME = 'crearNoticias_media_db';
const MEDIA_DB_VERSION = 1;
const MEDIA_STORE_NAME = 'media_files';

function sanitizeRichText(inputHtml) {
  const raw = String(inputHtml || '');
  if (!raw) return '';

  const allowedTags = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'A', 'UL', 'OL', 'LI', 'SPAN']);
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${raw}</div>`, 'text/html');
  const root = doc.body && doc.body.firstElementChild ? doc.body.firstElementChild : doc.body;
  if (!root) return '';

  const cleanNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return doc.createTextNode(node.nodeValue || '');
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return doc.createTextNode('');
    }

    const tag = node.tagName;
    if (!allowedTags.has(tag)) {
      const frag = doc.createDocumentFragment();
      Array.from(node.childNodes).forEach((child) => {
        frag.appendChild(cleanNode(child));
      });
      return frag;
    }

    const el = doc.createElement(tag.toLowerCase());

    if (tag === 'A') {
      const href = String(node.getAttribute('href') || '').trim();
      const safeHref = (/^(https?:\/\/|mailto:)/i.test(href)) ? href : '';
      if (safeHref) {
        el.setAttribute('href', safeHref);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    }

    Array.from(node.childNodes).forEach((child) => {
      el.appendChild(cleanNode(child));
    });

    return el;
  };

  const out = document.createElement('div');
  Array.from(root.childNodes).forEach((n) => {
    out.appendChild(cleanNode(n));
  });
  return out.innerHTML;
}

function ensureSileoReady() {
  if (typeof window === 'undefined') return;

  if (!window.fireToast) {
    window.fireToast = function(type, title, description) {
      const start = Date.now();
      const attempt = () => {
        const has = typeof window.notifySuccess === 'function' && typeof window.notifyInfo === 'function' && typeof window.notifyError === 'function' && typeof window.notifyWarning === 'function';
        if (has) {
          if (type === 'success') return window.notifySuccess(title, description);
          if (type === 'info') return window.notifyInfo(title, description);
          if (type === 'warning') return window.notifyWarning(title, description);
          return window.notifyError(title, description);
        }
        if (Date.now() - start > 3500) return;
        setTimeout(attempt, 80);
      };
      attempt();
    };
  }

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
  if (typeof window === 'undefined') return;
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
          if (type === 'success') return window.notifySuccess(title, description);
          if (type === 'info') return window.notifyInfo(title, description);
          if (type === 'warning') return window.notifyWarning(title, description);
          return window.notifyError(title, description);
        }
        if (Date.now() - start > 3500) return;
        setTimeout(attempt, 80);
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
      } catch (e) {}
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
      } catch (e) {}
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
      } catch (e) {}
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
      } catch (e) {}
    };
  }
}

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

async function resolveMediaItems(items) {
    const resolved = await Promise.all((items || []).map(async (m) => {
        if (!m) return null;
        if (m.url) return m;
        const storageId = m.storage_id ?? m.storageId;
        if (!storageId) return null;
        try {
            const record = await getMediaRecordById(storageId);
            if (!record || !record.blob) return null;
            const inferredType = record.type && record.type.startsWith('video') ? 'video' : 'image';
            return { type: m.type || inferredType, url: URL.createObjectURL(record.blob) };
        } catch (e) {
            return null;
        }
    }));
    return resolved.filter(x => x && x.url);
}

const cardItemTemplate = document.createElement('template');
cardItemTemplate.innerHTML = `
<style>
    :host{
        display:flex;
        flex-grow:1;
        flex-basis:500px;

        height:auto;
        user-select:none;
    }

    .card {
        display:flex;
        flex-grow:1;
        flex-wrap:wrap;

        background:#ecedfa;
        border-radius:28px;
        
        inset:0;
        overflow:auto;
        transition:background 125ms;
    }
    .card:not(.open){cursor:pointer;overflow:hidden;}
    .card:not(.open):hover{
        background:white;
        box-shadow: 0px 0px 0px 1px rgba(0, 0, 0, 0.08); 
        /* box-shadow: 0px 10px 32px -16px rgba(0, 0, 0, 0.16);*/
    }
    .card:not(.open):hover img, .card:not(.open):hover video{filter: brightness(1.03);}

    .content_divisor{
        position:relative;
        display:flex;
        flex-direction:column;
        flex-grow:1;
        flex-basis:400px;        
        gap:8px;
        box-sizing:border-box;
    }
    @media only screen and (min-width: 680px){
        .content_divisor{padding:8px;}
        img, video{border-radius:20px !important;}

        .card.open.slim-card{
            inset: 10% calc(50% - 380px);;
        }
        .card.open{overflow:hidden;}
        .card.open.slim-card #card-item-text-content{overflow:auto;}
    }
    .content_divisor:last-child{
        padding:24px;
    }
    ::-webkit-scrollbar {
        display: none;
    }


    img, video{
        width:100%;
        height:100%;
        border-radius:28px;
        object-fit: cover;
        aspect-ratio: 16/10;
        transition:filter 125ms, transform .3s cubic-bezier(0,0,0.5,1);
    }

    .media-holder{position:relative; width:100%; height:100%;}
    .media-carousel{position:relative; width:100%; height:100%; overflow:hidden;}
    .media-track{display:flex; width:100%; height:100%; transition:transform 250ms cubic-bezier(0,0,0.5,1);}
    .media-slide{flex:0 0 100%; width:100%; height:100%;}
    .media-slide img, .media-slide video{border-radius:0;}
    .card:not(.open) .media-nav, .card:not(.open) .media-dots{display:none;}
    .media-nav{
        position:absolute;
        top:50%;
        transform:translateY(-50%);
        width:40px;
        height:40px;
        border-radius:999px;
        border:none;
        background:rgba(0,0,0,0.4);
        color:white;
        cursor:pointer;
        z-index:3;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:0;
    }
    .media-nav.prev{left:10px;}
    .media-nav.next{right:10px;}
    .media-dots{position:absolute; left:0; right:0; bottom:10px; display:flex; justify-content:center; gap:6px; z-index:3;}
    .media-dot{width:8px; height:8px; border-radius:999px; background:rgba(255,255,255,0.5); cursor:pointer;}
    .media-dot.active{background:rgba(255,255,255,0.95);}

    card-title{
        font-size:32px;
        font-weight:500;
        line-height:0.95;
        color:rgba(0, 0, 0, 0.8);
        font-family: "Onest", sans-serif;
    }
    event-date{
        font-size:16px;
        font-weight:600;
        color:rgba(0, 0, 0, 0.24);
    }

    card-description{
        line-height:1.5;
        font-size:16px;
        color:rgba(0, 0, 0, 0.8);
    }

    hidden-content{
        flex-direction:column;
        align-items: flex-start;
        position:absolute;
        padding-bottom:48px;
        display:none;
        opacity:0;
        animation: fadeIn 500ms cubic-bezier(.56,.27,0,1) 300ms forwards;
    }
    @media only screen and (max-width: 680px){hidden-content{padding-bottom:120px;}
    }
    .hidden-content{position:relative;}

    card-shortdescription{
        font-size:24px;
        line-height:1;
        font-weight:500;
        color:rgba(0, 0, 0, 0.6);
    }

    .card.open card-shortdescription{
        display:none;
    }

    event-credits{
        font-size:24px;
        line-height:1;
        margin:8px 0;
        font-weight:500;
        color:rgba(0, 0, 0, 0.6);
    }
    .simple_container{
        display:flex;
        flex-direction:column;
        gap:8px;
    }
    div.direction-row{
        flex-direction:row;
    }
    b-margin{margin-bottom:8px;}
    .add-gap{ gap:8px; }
    .flex-row{flex-direction:row;}

    .card.open{
        position:absolute;
        background:white;
    }
    
    .card.open.slim-card #card-item-text-content{
        overflow:unset;
    }

    event-description{
        height:100%;
        text-wrap:balance;
    }

    

    .transparent-cards{
        animation: transparentIn 1000ms;
    }
    @keyframes transparentIn {
        from{
            background:rgba(0, 0, 0, 0);
        }
        to{
            background:rgba(0, 0, 0, 0.2);
        }
    }

    @media only screen and (min-width: 680px){
        card-title{margin-top:16px;}
      .card{inset:10% 5%;}
    }
    @media only screen and (max-width: 680px){
        .card.open img, .card.open video{
            animation: imgBorderRadius 500ms cubic-bezier(.56,.27,0,1);
            border-radius: 0 0 24px 24px;
        }

        .card.open{
            animation: cardBorderRadius 500ms cubic-bezier(.56,.27,0,1);
            border-radius: 0;
        }
        @keyframes imgBorderRadius {
            from{border-radius: 28px;}
            to{border-radius: 0 0 24px 24px;}
        }
        @keyframes cardBorderRadius {
            from{border-radius: 28px;}
            to{border-radius: 0;}
        }
    }

    /* Estilo de bonton de cerrar */
    .card.open close-button{display:flex; animation: buttonIn 500ms cubic-bezier(.56,.27,0,1)}
    @keyframes buttonIn {from {transform: scale(0);} to {transform: scale(1);}}
    close-button{
        display:none;
        position:absolute;

        width: 48px;
        height: 48px;
        max-height:48px;
        box-sizing: border-box;
        border-radius:50%;
        margin-top:  env(safe-area-inset-top);
        right: 16px;
        top: 16px;
        cursor:pointer;  
        opacity:0.95;
        z-index:2;
        
    }

    close-button svg{fill:white; filter: drop-shadow(0px 0px 4px rgba(0, 0, 0, 0.39));transition:transform .3s cubic-bezier(0,0,0.5,1)}
    close-button:hover svg{transform: scale(1.1);}
    @media only screen and (min-width: 680px){
        #card-item-text-content{overflow:unset !important;padding:24px;min-height:0;max-height:unset;}
        close-button{right:unset; left:16px;}
        .card.open{overflow:auto !important;}
        .card.open.slim-card #card-item-text-content{overflow:unset !important;}
        .card.open .content_divisor{min-height:0;}
        .card.open #img-holder{gap:0;}
        .card.open close-button{
            position: sticky;
            top: 16px;
            left: 16px;
            right: unset;
            margin-top: 0;
            margin-bottom: -48px;
            z-index: 9999;
        }
    }

    @media only screen and (max-width: 680px){
        .card.open close-button{
            position: fixed;
            top: calc(16px + env(safe-area-inset-top));
            right: 16px;
            left: unset;
            margin-top: 0;
            z-index: 9999;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0px 0px 4px rgba(0, 0, 0, 0.39));
        }
    }


    /* Estilos de fadeOut animation para cualqueir element */
    .element-visible{display:flex;}
    [closing]{animation: fadeOut 300ms;}
    @keyframes fadeOut {from{opacity:1}to{opacity:0;}}
    @keyframes fadeIn {from{opacity:0}to{opacity:1;}}


    /* Estilos de botones */
    button{
        display:flex;
        align-items: center;
        justify-content:center;
        font-size: 18px;
        font-weight: 500;
        line-height: 16px;
        padding:16px 24px;
        width:100%;
        
        border-radius:18px;
        border:none;
        cursor:pointer;
        background:#eff6ff;
        color:#2563eb;
        transition:all 125ms;
    }
    button:hover{
        background:#2563eb;
        color:white;
    }

    button.icon{
        background:#f8fafc;
        padding:8px;
    }
    button.icon:hover{background:#2563eb;}
    button.icon:hover svg{fill:white;}    
    button.icon svg{fill:rgba(0, 0, 0, .8); transition:fill 125ms;}
    button.cancel-button{
        background:#fee2e2;
        color:#dc2626;
    }
    button.cancel-button:hover{
        background:#dc2626;
        color:white;
    }

    button.event-notify-button{
        font-family: "nunito", sans-serif;
        background:#2563eb;
        color:white;
        border:3px solid #94b5ff;
        box-shadow: 0px 0px 32px -10px #2563eb;
        width:70%;
        margin:0 auto;
    }
    button.event-notify-button:hover{
        background:#1d4ed8;
        border-color:#94b5ff;
        color:white;
    }

    @media only screen and (max-width: 680px){
        button.event-notify-button{
            width:100%;
            margin:0;
        }
    }

    /* Estilos de contenedor de creditos y fecha */
    .content-box{
        display:flex;
        flex-grow:1;
        background:#f8fafc;
        border-radius:16px;
        margin:8px 0;
        margin-bottom:4px;
        box-shadow: 0px 0px 0px 1px rgba(0, 0, 0, 0.05) inset;
    }
    .content-box .divisor h1{
        font-size:16px;
        font-weight:500;
        margin:0;
        color:rgba(0, 0, 0, 0.88);

    }
    .content-box .divisor{
        display:flex;
        flex-direction:column;
        flex-grow:1;
        padding:12px;
        gap:4px;
    }
    dataline{
        min-width:fit-content;
        width:fit-content;
        font-size:14px;
        font-weight:500;
        padding:4px 8px;
        border-radius:16px;
        background:#e2e8f0;
        color:rgba(0, 0, 0, 0.95);
    }
    .color-primary{
        background:#2563eb !important;
        color:white !important;

    }

    span.interaction{
        position:absolute;
        width:100%;
        height:100%;
        
    }

    .modal-overlay{
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 99999;
    }
    .modal-overlay.active{display:flex;}
    .modal-backdrop{
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        backdrop-filter: blur(4px);
    }
    .modal-container{
        position: relative;
        width: 32rem;
        max-width: 90vw;
        border-radius: 2rem;
        background: white;
        box-shadow: 0 25px 60px rgba(0,0,0,0.25);
        overflow: hidden;
        transform-origin: center;
    }
    .modal-close-btn{
        position: absolute;
        top: 1.5rem;
        right: 1.5rem;
        z-index: 10;
        width: 2.5rem !important;
        height: 2.5rem !important;
        background-color: #f3f4f6 !important;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 0.2s;
        padding: 0 !important;
        margin: 0;
    }
    .modal-close-btn:hover{background-color:#e5e7eb !important;}
    .modal-close-btn svg{color:#0f172a;}

    .modal-content{padding: 2rem; opacity: 1;}
    .modal-header{display:flex; align-items:center; gap:1rem; margin-bottom:2rem;}
    .modal-icon-wrapper{
        width: 4rem;
        height: 4rem;
        background-color: #dbeafe;
        border-radius: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .modal-icon-wrapper svg{color:#2563eb;}
    .modal-title{
        font-family: "Bricolage Grotesque", sans-serif;
        font-weight: 900;
        font-size: 1.5rem;
        color: #0f172a;
        margin: 0;
    }
    .modal-subtitle{
        font-family: 'Nunito', sans-serif;
        font-weight: 700;
        font-size: 0.875rem;
        color: #64748b;
        margin: 0.25rem 0 0 0;
    }

    .modal-form{display:flex; flex-direction:column; gap: 1.5rem;}
    .form-group{display:flex; flex-direction:column;}
    .form-label{
        font-family: 'Nunito', sans-serif;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #334155;
        margin-bottom: 0.5rem;
    }
    .form-label svg{color:#334155;}
    .form-input{
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        font-size: 1rem;
        transition: all 0.2s;
        height: 3rem;
        box-sizing: border-box;
        font-family: 'Nunito', sans-serif;
        outline: none;
    }
    .form-input:focus{
        box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
        border-color: rgba(37,99,235,0.35);
    }
    .form-hint{
        font-size: 0.75rem;
        color: #94a3b8;
        margin: 0.375rem 0 0 0;
        font-family: 'Nunito', sans-serif;
        font-weight: 700;
    }
    .modal-buttons{display:flex; gap:0.75rem; margin-top: 2rem;}
    .btn-cancel,
    .btn-save{
        font-family: 'Nunito', sans-serif;
        font-weight: 700;
        flex: 1;
        padding: 0.75rem 1.5rem !important;
        border-radius: 0.75rem;
        font-size: 0.875rem !important;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: auto !important;
    }
    .btn-cancel{background: white !important; border: 1px solid #e5e7eb !important; color: #475569 !important;}
    .btn-cancel:hover{background-color:#f9fafb !important; padding: 0.75rem 2.15rem !important;}
    .btn-save{background-color:#2563eb !important; color:white !important;}
    .btn-save:hover{background-color:#1d4ed8 !important; padding: 0.75rem 2.15rem !important}

</style>

<div class="transparent-cards" style="display:none; z-index:10; width:100%; height:100vh; inset:0; position:fixed; background:rgba(0, 0, 0, 0.2)">

</div>

<div class="card">
    <div class="content_divisor" id="img-holder">
        <close-button>
            <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="m480-432 118 117q9 10 23 10.5t25-11.007q11-10.508 11-23.747T646-364L528-480l118-118q9-9 10-23t-10-25q-11.411-11-24.5-11T598-646L480-528 363-646q-10-9-23.5-10T316-646q-12 11.411-12 24.5t12 23.5l116 118-117 117q-10 10-10.5 23.5t11.007 23.5q10.508 12 23.747 12T364-316l116-116Zm.138 373Q393-59 316-91.5t-134.5-90Q124-239 91.5-315.862t-32.5-164Q59-567 91.5-644t89.843-134.553q57.343-57.552 134.278-90.5Q392.557-902 479.779-902q87.221 0 164.339 32.87 77.119 32.87 134.596 90.29 57.478 57.42 90.382 134.46T902-480q0 87.276-32.947 164.26-32.948 76.983-90.5 134.362Q721-124 644.138-91.5t-164 32.5Z"/></svg>
        </close-button>
        <div id="media-holder" class="media-holder">
            <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop" alt="Lights" style="width:100%">
        </div>
    </div>
    <div class="content_divisor" id='card-item-text-content'>
        <div class="simple_container add-gap b-margin">
            <card-title>-</card-title>
            <div class="content-box">
                <div class="divisor">
                    <h1>Fecha del evento</h1>
                    <div class="simple_container direction-row add-gap">
                        <dataline id="data-date">00/00/0000</dataline>
                        <dataline id="data-time">-</dataline>
                    </div>
                </div>
            </div>
                <dataline id="data-address">-</dataline>
            <card-shortdescription>
            </card-shortdescription>
            
            
        </div>

        <span class="hidden-content">
            <hidden-content>
                <card-description>
                    ...
                </card-description>

               

                <div id="response-holder-sub-button" class="simple_container" style="width:100%; align-items:flex-start; margin:16px 0;">
                    
                </div>


                
            </hidden-content>
        </span>
    </div>
`;

{/* <button type="button" class="event-notify-button">Inscribirse a este evento</button>

                <div class="modal-overlay" id="inscripcionModal">
                    <div class="modal-backdrop" data-close-inscripcion="1"></div>
                    <div class="modal-container" data-modal-container="1">
                        <button type="button" class="modal-close-btn" data-close-inscripcion-btn="1" aria-label="Cerrar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <div class="modal-content">
                            <div class="modal-header">
                                <div class="modal-icon-wrapper">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-check2-icon lucide-calendar-check-2"><path d="M8 2v4"/><path d="M16 2v4"/><path d="M21 14V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/><path d="M3 10h18"/><path d="m16 20 2 2 4-4"/></svg>
                                </div>
                                <div>
                                    <h2 class="modal-title">Confirmar inscripción</h2>
                                    <p class="modal-subtitle">Completá tus datos para confirmar la inscripción al evento</p>
                                </div>
                            </div>

                            <form class="modal-form" id="inscripcionForm" autocomplete="on">
                                <div class="form-group">
                                    <label class="form-label" for="inscripcionNombre">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        Nombre
                                    </label>
                                    <input class="form-input" id="inscripcionNombre" name="nombre" type="text" required autocomplete="given-name" />
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="inscripcionApellido">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        Apellido
                                    </label>
                                    <input class="form-input" id="inscripcionApellido" name="apellido" type="text" required autocomplete="family-name" />
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="inscripcionEmail">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                                        Correo electrónico
                                    </label>
                                    <input class="form-input" id="inscripcionEmail" name="email" type="email" required autocomplete="email" />
                                    <p class="form-hint">Usaremos este correo para enviarte información del evento</p>
                                </div>

                                <div class="modal-buttons">
                                    <button type="button" class="btn-cancel" data-cancel-inscripcion="1">Cancelar</button>
                                    <button type="submit" class="btn-save">Confirmar inscripción</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div> */}

class cardItem extends HTMLElement {
    
  static get observedAttributes() {
    return ['data-title', 'data-shortdescription', 'data-description', 'data-date', 'data-time', 'data-address', 'data-flex-basis', 'data-event-id', 'data-cancel-button', 'data-hide-button'];
  }

  constructor() {
    super();
    const shadow = this.attachShadow({mode: 'open'});
    shadow.append(cardItemTemplate.content.cloneNode(true)); 
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this.updateFromAttributes();
  }

  updateFromAttributes() {
    if (!this.shadowRoot) return;

    const titleEl = this.shadowRoot.querySelector('card-title');
    if (titleEl) titleEl.textContent = this.getAttribute('data-title') || '';

    const shortEl = this.shadowRoot.querySelector('card-shortdescription');
    if (shortEl) {
      let shortText = this.getAttribute('data-shortdescription') || '';
      if (!shortText) {
        shortText = this.getAttribute('data-description') || '';
        shortText = String(shortText).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (shortText.length > 90) shortText = shortText.slice(0, 90).trimEnd() + '...';
      }
      shortEl.textContent = shortText;
    }

    const descEl = this.shadowRoot.querySelector('card-description');
    if (descEl) {
      const html = this.getAttribute('data-description') || '';
      descEl.innerHTML = sanitizeRichText(html);
    }

    const dateEl = this.shadowRoot.getElementById('data-date');
    if (dateEl) {
      const v = this.getAttribute('data-date');
      if (v) dateEl.textContent = v;
    }

    const timeEl = this.shadowRoot.getElementById('data-time');
    if (timeEl) {
      const v = this.getAttribute('data-time');
      if (v) timeEl.textContent = v;
    }

    const addrEl = this.shadowRoot.getElementById('data-address');
    if (addrEl) {
      const v = this.getAttribute('data-address');
      if (v) addrEl.textContent = v;
    }

    if (this.hasAttribute('data-flex-basis') || this.hasAttribute('data-event-id')) {
      this.shadowRoot.host.style.flexBasis = '0px';
    }

    if (this.hasAttribute('data-cancel-button') && this.hasAttribute('data-event-id')) {
      try { displayCancelButton(this.getAttribute('data-event-id')); } catch (e) {}
    }
    if (this.hasAttribute('data-hide-button')) {
      const btn = this.shadowRoot.querySelector('button');
      if (btn) btn.style.display = 'none';
    }
  }
  

  connectedCallback() {

    const shadowRoot = this.shadowRoot;
    const cardElement = this.shadowRoot.querySelector('.card');  
    const hostElement = this.shadowRoot.host;  
    const transparentCards = this.shadowRoot.querySelector(".transparent-cards");

    const closeButton = this.shadowRoot.querySelector("close-button");
    const hiddenContent = this.shadowRoot.querySelector("hidden-content");

    const notifyButton = this.shadowRoot.querySelector('.event-notify-button');
    const inscripcionModal = this.shadowRoot.getElementById('inscripcionModal');
    const inscripcionForm = this.shadowRoot.getElementById('inscripcionForm');
    const modalContainer = inscripcionModal ? inscripcionModal.querySelector('[data-modal-container="1"]') : null;
    const modalBackdrop = inscripcionModal ? inscripcionModal.querySelector('[data-close-inscripcion="1"]') : null;
    const modalCancel = inscripcionModal ? inscripcionModal.querySelector('[data-cancel-inscripcion="1"]') : null;
    const modalCloseBtn = inscripcionModal ? inscripcionModal.querySelector('[data-close-inscripcion-btn="1"]') : null;

    const __hasGsapModal = typeof window !== 'undefined' && window.gsap;

    ensureSileoReady();

    function openInscripcionModal(ev) {
        if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
        }
        if (!inscripcionModal || !modalContainer) return;

        ensureSileoReady();

        inscripcionModal.classList.add('active');
        if (__hasGsapModal) {
            window.gsap.killTweensOf(modalContainer);
            window.gsap.fromTo(modalContainer,
                { scale: 0.92, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.22, ease: 'power2.out' }
            );
        } else {
            modalContainer.style.transform = 'scale(1)';
            modalContainer.style.opacity = '1';
        }
    }

    function closeInscripcionModal(ev) {
        if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
        }
        if (!inscripcionModal || !modalContainer) return;

        const done = () => {
            inscripcionModal.classList.remove('active');
            if (inscripcionForm) {
                try { inscripcionForm.reset(); } catch (e) {}
            }
        };

        if (__hasGsapModal) {
            window.gsap.killTweensOf(modalContainer);
            window.gsap.to(modalContainer, {
                scale: 0.92,
                opacity: 0,
                duration: 0.18,
                ease: 'power2.in',
                onComplete: done,
            });
        } else {
            done();
        }
    }

    if (notifyButton) {
        notifyButton.addEventListener('click', openInscripcionModal);
    }
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeInscripcionModal);
    }
    if (modalCancel) {
        modalCancel.addEventListener('click', closeInscripcionModal);
    }
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeInscripcionModal);
    }
    if (modalContainer) {
        modalContainer.addEventListener('click', (e) => e.stopPropagation());
    }
    if (inscripcionForm) {
        inscripcionForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const nombre = (this.querySelector('[name="nombre"]')?.value || '').trim();
            const apellido = (this.querySelector('[name="apellido"]')?.value || '').trim();
            const email = (this.querySelector('[name="email"]')?.value || '').trim();

            closeInscripcionModal(e);

            setTimeout(() => {
                ensureSileoReady();
                if (!email) {
                    if (window.fireToast) {
                        window.fireToast('info', 'Revisá el correo', 'Correo electrónico inválido');
                    }
                    return;
                }

                const fullName = `${nombre} ${apellido}`.trim();
                const label = email ? ` ${email}` : '';
                if (window.fireToast) {
                    window.fireToast('success', 'Inscripción confirmada', `Recibirás una notificación a tu correo electrónico ${label} cuando se acerque la fecha del evento.`);
                }
            }, __hasGsapModal ? 200 : 0);
        });
    }

    function removeVisibility(element){
        if (element.hasAttribute("closing") && !(cardElement.classList.contains("open"))) {
            element.classList.remove("element-visible");

            element.removeAttribute("closing");
        }
    }


    const interactionClose = document.createElement('span');
    interactionClose.classList.add("interaction");
    closeButton.appendChild(interactionClose);
    interactionClose.onclick = function() {toggleCard()};


    // Cerrar al hacer click en el fondo (fuera de la card)
    transparentCards.addEventListener('click', (ev) => {
        if (!cardElement.classList.contains('open')) return;
        if (ev.target === transparentCards) {
            toggleCard();
        }
    });


    function toggleCard(){
        

        resizeHeight(hostElement)
        function resizeHeight(hostElement){
            var hostHeight = hostElement.offsetHeight;
            hostElement.style.minHeight=hostHeight+"px";
            // console.log("ajustando tamaño");
        }

        function resetSize(element){
            element.style.width = "auto";
        }
        


        let state = Flip.getState(cardElement);
        if (cardElement.classList.contains("open")) {
            // Close card
            cardElement.classList.remove("open");
            shadowRoot.appendChild(cardElement);
            transparentCards.style.display = "none";
            cardElement.addEventListener('mouseup', () => { toggleCard(); }, {once: true});

            // closing animation
            closeButton.setAttribute("closing", "");
            closeButton.addEventListener("animationend", () =>{ removeVisibility(closeButton);}, {once: true})
            hiddenContent.setAttribute("closing", "");
            hiddenContent.addEventListener("animationend", () =>{ removeVisibility(hiddenContent); }, {once: true})
            
            

        }else{
            // Open card
            cardElement.classList.remove("slim-card");
            
            console.log(cardElement.offsetWidth)
            var cardWidth = cardElement.offsetWidth;
            if(cardWidth <= 799){
                cardElement.classList.add("slim-card")
            }
            transparentCards.style.display = "flex";
            cardElement.classList.add("open");
            transparentCards.appendChild(cardElement);
            // closeButton.addEventListener('click', () => { toggleCard(); }, {once: true});

            // closing animations
            // if (cardElement.classList.contains("open")) {
                closeButton.classList.add("element-visible");
                hiddenContent.classList.add("element-visible");

                // var hiddenContentWidth = hiddenContent.offsetWidth;
                // hiddenContent.style.width = hiddenContentWidth + "px";
            // }

        }
        Flip.from(state, {
            duration: 0.3,
            scale: false,
            ease: "power1.inOut",
            absolute: true,
            zIndex: 1,
        });
    }

    this.shadowRoot.querySelector('.card').addEventListener('click', () => { toggleCard(cardElement) }, {once: true});

    const mediaHolder = this.shadowRoot.getElementById('media-holder');
    const imgEl = this.shadowRoot.querySelector('img');
    let mediaItems = [];
    if (this.hasAttribute('data-media')) {
        try {
            const parsed = JSON.parse(this.getAttribute('data-media'));
            if (Array.isArray(parsed)) mediaItems = parsed;
        } catch (e) {
            mediaItems = [];
        }
    }

    function buildCarousel(items) {
        const carousel = document.createElement('div');
        carousel.className = 'media-carousel';

        const track = document.createElement('div');
        track.className = 'media-track';
        carousel.appendChild(track);

        const hasControls = items.length >= 2;
        const prevBtn = hasControls ? document.createElement('button') : null;
        const nextBtn = hasControls ? document.createElement('button') : null;
        const dots = hasControls ? document.createElement('div') : null;

        if (hasControls) {
            prevBtn.className = 'media-nav prev';
            prevBtn.type = 'button';
            prevBtn.innerHTML = '&#10094;';

            nextBtn.className = 'media-nav next';
            nextBtn.type = 'button';
            nextBtn.innerHTML = '&#10095;';

            dots.className = 'media-dots';

            carousel.appendChild(prevBtn);
            carousel.appendChild(nextBtn);
            carousel.appendChild(dots);
        }

        const slides = [];
        const dotEls = [];
        items.forEach((m, index) => {
            const slide = document.createElement('div');
            slide.className = 'media-slide';
            let node;
            if (m && m.type === 'video' && m.url) {
                node = document.createElement('video');
                node.src = m.url;
                node.preload = 'metadata';
                node.playsInline = true;
                node.controls = true;
            } else {
                node = document.createElement('img');
                node.src = (m && m.url) ? m.url : '';
            }
            slide.appendChild(node);
            track.appendChild(slide);
            slides.push(node);

            const dot = document.createElement('div');
            dot.className = 'media-dot' + (index === 0 ? ' active' : '');
            dot.onclick = (ev) => {
                ev.stopPropagation();
                setIndex(index);
            };
            if (dots) dots.appendChild(dot);
            dotEls.push(dot);
        });

        let currentIndex = 0;
        function setIndex(idx) {
            if (!items.length) return;
            const max = items.length - 1;
            currentIndex = Math.max(0, Math.min(idx, max));
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            dotEls.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
            slides.forEach((node, i) => {
                if (node && node.tagName === 'VIDEO' && i !== currentIndex) {
                    try { node.pause(); } catch (e) {}
                }
            });
        }

        if (hasControls) {
            prevBtn.onclick = (ev) => {
                ev.stopPropagation();
                setIndex(currentIndex - 1);
            };
            nextBtn.onclick = (ev) => {
                ev.stopPropagation();
                setIndex(currentIndex + 1);
            };
        }

        carousel.addEventListener('click', (ev) => {
            if (ev.target !== carousel) return;
        });
        setIndex(0);
        return carousel;
    }

    (async () => {
        const resolved = await resolveMediaItems(mediaItems);
        if (resolved.length > 0 && mediaHolder) {
            mediaHolder.innerHTML = '';
            mediaHolder.appendChild(buildCarousel(resolved));
        } else if(this.hasAttribute('data-img') && imgEl) {
            imgEl.setAttribute("src", this.getAttribute('data-img'));
        } else if (imgEl) {
            imgEl.removeAttribute('src');
            imgEl.style.display = 'none';
        }
    })();

    this.updateFromAttributes();
  }
}

if (!customElements.get('card-item')) {
    customElements.define('card-item', cardItem);
}

// Datos de eventos
let eventosData = [];

// Función para cargar eventos desde la API
async function loadEventos() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const eventosGrid = document.getElementById('eventosGrid');

    try {
        // Verificar si hay token de sesión
        const token = sessionStorage.getItem('session_token');
        
        let eventosData = [];
        
        // Intentar cargar desde la API (público o con token)
        try {
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch('/Crear-Noticias/api/eventos/index.php', {
                headers: headers,
                cache: 'no-store'
            });
            
            if (response.ok) {
                eventosData = await response.json();
            } else if (response.status === 401 && token) {
                // Token inválido, limpiar y reintentar sin token
                sessionStorage.removeItem('session_token');
                sessionStorage.removeItem('user_info');
                sessionStorage.removeItem('token_expires');
                console.warn('Token inválido, cargando datos públicos');
                
                // Reintentar sin token
                const publicResponse = await fetch('/Crear-Noticias/api/eventos/index.php', { cache: 'no-store' });
                if (publicResponse.ok) {
                    eventosData = await publicResponse.json();
                }
            } else {
                console.error('Error cargando eventos:', response.status);
            }
        } catch (error) {
            console.error('Error de conexión cargando eventos:', error);
        }
        
        // Simulación de carga visual
        if (loadingState) {
            loadingState.style.display = '';
        }
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        if (eventosGrid) {
            eventosGrid.style.display = 'none';
        }
        
        // Esperar un momento para mostrar el loading
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (loadingState) {
            loadingState.style.display = 'none';
        }

        if (eventosData.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            if (eventosGrid) {
                eventosGrid.style.display = 'none';
            }
        } else {
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            if (eventosGrid) {
                eventosGrid.style.display = 'grid';
                renderEventos(eventosData);
            }
        }
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        if (loadingState) {
            loadingState.style.display = 'none';
        }
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        if (eventosGrid) {
            eventosGrid.style.display = 'none';
        }
    }
}

// Función para formatear fecha
function formatDate(dateString) {
    const raw = String(dateString || '').trim();
    if (!raw) return '';

    // Avoid timezone shifts for DATE values like "YYYY-MM-DD"
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

function toShortText(text, maxLen = 90) {
    const s = String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen).trimEnd() + '...';
}

// Función para renderizar eventos
function renderEventos(data = null) {
    const eventosGrid = document.getElementById('eventosGrid');
    eventosGrid.innerHTML = '';

    // Usar datos pasados o el array global
    const eventosToRender = data || eventosData;
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

    const sorted = Array.isArray(eventosToRender) ? [...eventosToRender].sort((a, b) => {
        const aMs = parseToMs(a && a.created_at) || parseToMs(a && a.created_date);
        const bMs = parseToMs(b && b.created_at) || parseToMs(b && b.created_date);
        if (bMs !== aMs) return bMs - aMs;
        return Number((b && b.id) || 0) - Number((a && a.id) || 0);
    }) : [];

    sorted.forEach(evento => {
        const card = document.createElement('card-item');
        
        // Asignar atributos al componente
        card.setAttribute('data-event-id', evento.id);
        const mediaItems = Array.isArray(evento.media_items) ? evento.media_items : [];
        if (mediaItems.length > 0) {
            card.setAttribute('data-media', JSON.stringify(mediaItems));
        }

        const imgUrl = evento.imagen || evento.imagen_url;
        if (mediaItems.length === 0 && imgUrl) {
            card.setAttribute('data-img', imgUrl);
        }
        card.setAttribute('data-title', evento.titulo);
        const fullDesc = evento.descripcion || '';
        card.setAttribute('data-description', fullDesc);
        card.setAttribute('data-shortdescription', toShortText(fullDesc));

        const dateValue = evento.fecha_evento || evento.created_date;
        if (dateValue) card.setAttribute('data-date', formatDate(dateValue));
        const timeValue = evento.hora_evento ? String(evento.hora_evento).slice(0, 5) : '14:00';
        card.setAttribute('data-time', timeValue);
        
        card.setAttribute('data-address', evento.lugar || 'Centro de Convenciones');
        
        eventosGrid.appendChild(card);
    });
}

// Configurar GSAP Flip
document.addEventListener('DOMContentLoaded', function() {
    if (typeof gsap !== 'undefined' && typeof Flip !== 'undefined') {
        try {
            gsap.registerPlugin(Flip);
            console.log('GSAP Flip plugin registrado correctamente');
        } catch (e) {
            console.warn('Error registrando Flip plugin:', e);
        }
    }
    loadEventos();
});

// Funciones auxiliares para el componente
function getEventCardData(button) {
    const eventId = button.getAttribute('data-event-id');
    const eventName = button.getAttribute('data-event-name');
    const eventDate = button.getAttribute('data-event-date');
    const eventTime = button.getAttribute('data-event-time');
    
    console.log('Datos del evento:', {
        id: eventId,
        name: eventName,
        date: eventDate,
        time: eventTime
    });
    
}

function changeWindow(windowHash) {
    console.log('Cambiar a ventana:', windowHash);
    // Aquí puedes agregar la lógica para cambiar de ventana
}