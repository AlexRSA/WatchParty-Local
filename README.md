# WatchParty-Local
Una extensión ligera de navegador basada en Vanilla JS, Socket.io y Node.js para sincronizar la reproducción de Netflix en tiempo real.

Características Principales:

Main World Injection: Interactúa directamente con la API Cadmium de Netflix para evitar caídas y bloqueos de DRM (Error D7353).

Prevención de Bucles: Sistema inteligente de bloqueo de sincronización temporal para evitar el efecto rebote por latencia de red.

Late-Join Sync: El servidor Node.js almacena el estado de reproducción en memoria; si un usuario entra tarde a la sala, se sincroniza automáticamente al segundo exacto de los demás.

Despliegue:

Levanta el archivo server.js en tu propio entorno (Docker, PM2, Heroku, etc.).

Cambia la variable SERVER_URL en content.js por tu dominio público.

Carga la extensión en Chrome/Edge activando el "Modo Desarrollador".
