// Función para obtener una instancia limpia del reproductor interno de Netflix (Cadmium)
function getNetflixPlayer() {
    try {
        const videoPlayer = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;
        const sessionId = videoPlayer.getAllPlayerSessionIds()[0];
        return videoPlayer.getVideoPlayerBySessionId(sessionId);
    } catch (e) {
        console.error("WatchParty (Inject): No se pudo acceder a la API de Cadmium de Netflix.");
        return null;
    }
}

// Escuchar comandos remotos enviados por la extensión y ejecutarlos nativamente
window.addEventListener("WatchPartyComandoRemoto", (event) => {
    const player = getNetflixPlayer();
    if (!player) return;

    const data = event.detail;

    if (data.accion === "pausa") {
        if (!player.isPaused()) player.pause();
    } else if (data.accion === "play") {
        if (player.isPaused()) player.play();
    } else if (data.accion === "salto") {
        // La API nativa de Netflix requiere el tiempo en milisegundos
        player.seek(data.tiempo * 1000);
    }
});