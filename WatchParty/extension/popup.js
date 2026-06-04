const salaInput = document.getElementById('salaInput');
const conectarBtn = document.getElementById('conectarBtn');
const abandonarBtn = document.getElementById('abandonarBtn');
const txtStatus = document.getElementById('txtStatus');
const ledStatus = document.getElementById('ledStatus');

chrome.storage.local.get(['salaGuardada'], (resultado) => {
    if (resultado.salaGuardada) mostrarUIConectado(resultado.salaGuardada);
});

conectarBtn.addEventListener('click', () => {
    const sala = salaInput.value.trim();
    if (!sala) { actualizarEstado("Introduce un nombre válido", "error"); return; }

    actualizarEstado("Estableciendo enlace...", "");

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs || tabs.length === 0) return;
        chrome.tabs.sendMessage(tabs[0].id, { comando: "unirse", sala: sala }, (respuesta) => {
            if (chrome.runtime.lastError) {
                actualizarEstado("Recarga la pestaña de Netflix (F5)", "error");
                return;
            }
            if (respuesta && respuesta.status === "ok") {
                chrome.storage.local.set({ salaGuardada: sala }, () => mostrarUIConectado(sala));
            }
        });
    });
});

abandonarBtn.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs || tabs.length === 0) return;
        chrome.tabs.sendMessage(tabs[0].id, { comando: "abandonar" }, () => {
            chrome.storage.local.remove('salaGuardada', () => mostrarUIDesconectado());
        });
    });
});

function mostrarUIConectado(sala) {
    salaInput.value = sala;
    salaInput.disabled = true;
    conectarBtn.style.display = "none";
    abandonarBtn.style.display = "block";
    actualizarEstado(`En línea - Sala: ${sala}`, "online");
}

function mostrarUIDesconectado() {
    salaInput.value = "";
    salaInput.disabled = false;
    conectarBtn.style.display = "block";
    abandonarBtn.style.display = "none";
    actualizarEstado("Inactivo", "");
}

function actualizarEstado(texto, tipo) {
    txtStatus.innerText = texto;
    ledStatus.className = "led " + tipo;
    if(tipo === "error") txtStatus.style.color = "#E50914";
    else if(tipo === "online") txtStatus.style.color = "#46d369";
    else txtStatus.style.color = "#777";
}