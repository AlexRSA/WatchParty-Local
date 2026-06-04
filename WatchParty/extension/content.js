// ==========================================
// CONFIGURACIÓN: Reemplaza con tu URL pública
const SERVER_URL = "https://tu-servidor-watchparty.com"; 
// ==========================================

let socket;
let miSala = "";
let rastreadorInterval = null;
let bloqueoSincronizacion = false;
let temporizadorBloqueo = null;

// 1. Inyectar script en el contexto real de la web para evitar bloqueos
const scriptNativo = document.createElement('script');
scriptNativo.src = chrome.runtime.getURL('inject.js');
scriptNativo.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(scriptNativo);

function activarBloqueoTemporal() {
    bloqueoSincronizacion = true;
    if (temporizadorBloqueo) clearTimeout(temporizadorBloqueo);
    temporizadorBloqueo = setTimeout(() => { bloqueoSincronizacion = false; }, 1500);
}

function mostrarNotificacion(mensaje, emoji) {
    let toast = document.getElementById('wp-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'wp-toast';
        toast.style.cssText = `
            position: fixed; top: 80px; right: 30px; z-index: 999999;
            background: rgba(20, 20, 20, 0.95); color: white; padding: 14px 22px;
            border-radius: 6px; font-family: sans-serif; font-weight: bold; font-size: 15px;
            border-left: 5px solid #E50914; transition: opacity 0.3s; pointer-events: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.6);
        `;
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<span style="font-size:18px; margin-right:10px;">${emoji}</span> ${mensaje}`;
    toast.style.opacity = '1';
    
    if (window.toastTimer) clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// Auto-reconectar si hay sala guardada
chrome.storage.local.get(['salaGuardada'], (res) => {
    if (res.salaGuardada) { miSala = res.salaGuardada; iniciarConexion(); }
});

chrome.runtime.onMessage.addListener((mensaje, remitente, responder) => {
    if (mensaje.comando === "unirse") {
        miSala = mensaje.sala;
        iniciarConexion();
        responder({ status: "ok" });
    }
    if (mensaje.comando === "abandonar") {
        if (socket) { socket.disconnect(); socket = null; }
        if (rastreadorInterval) clearInterval(rastreadorInterval);
        miSala = "";
        mostrarNotificacion("Sala abandonada", "👋");
        responder({ status: "ok" });
    }
    return true; 
});

function iniciarConexion() {
    if (!socket) {
        socket = io(SERVER_URL, { transports: ['websocket'] });
        
        socket.on('connect', () => {
            socket.emit('unirse-sala', miSala);
            mostrarNotificacion(`Conectado a la sala: ${miSala}`, "🔗");
            iniciarRastreadorVideo();
        });

        socket.on('sincronizar', (data) => {
            const video = document.querySelector('video');
            if (!video) return;

            activarBloqueoTemporal();

            if (Math.abs(video.currentTime - data.tiempo) > 2 || data.accion === 'salto') {
                mostrarNotificacion("Sincronizando línea de tiempo...", "⏩");
                
                window.dispatchEvent(new CustomEvent("WatchPartyComandoRemoto", {
                    detail: { accion: "salto", tiempo: data.tiempo }
                }));

                const estadoPosterior = data.accion === 'salto' ? data.estadoPrevio : data.accion;
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("WatchPartyComandoRemoto", { detail: { accion: estadoPosterior } }));
                }, 250);
            } else {
                window.dispatchEvent(new CustomEvent("WatchPartyComandoRemoto", { detail: { accion: data.accion } }));
                if (data.accion === 'pausa') mostrarNotificacion("Pausado remotamente", "⏸️");
                if (data.accion === 'play') mostrarNotificacion("Reanudado remotamente", "▶️");
            }
        });
    } else {
        socket.emit('unirse-sala', miSala);
    }
}

function iniciarRastreadorVideo() {
    if (rastreadorInterval) clearInterval(rastreadorInterval);

    rastreadorInterval = setInterval(() => {
        const video = document.querySelector('video');
        if (!video) return;

        if (!video.dataset.wpVinculado) {
            video.dataset.wpVinculado = "true";

            video.addEventListener('pause', () => {
                if (bloqueoSincronizacion) return;
                socket.emit('accion-video', { sala: miSala, accion: 'pausa', tiempo: video.currentTime });
            });

            video.addEventListener('play', () => {
                if (bloqueoSincronizacion) return;
                socket.emit('accion-video', { sala: miSala, accion: 'play', tiempo: video.currentTime });
            });

            video.addEventListener('seeked', () => {
                if (bloqueoSincronizacion) return;
                const estadoActual = video.paused ? 'pausa' : 'play';
                socket.emit('accion-video', { sala: miSala, accion: 'salto', tiempo: video.currentTime, estadoPrevio: estadoActual });
            });
        }
    }, 1000);
}