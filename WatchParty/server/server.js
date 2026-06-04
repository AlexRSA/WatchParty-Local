const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" } 
});

// Memoria RAM del servidor para guardar el estado vivo de cada sala
const salasEstado = {};

io.on('connection', (socket) => {
    console.log(`🟢 Conexión establecida: ${socket.id}`);

    socket.on('unirse-sala', (sala) => {
        socket.join(sala);
        console.log(`👤 Usuario ${socket.id} entró a la sala: ${sala}`);

        // Si la sala ya tiene un estado guardado, sincronizar al recién llegado
        if (salasEstado[sala]) {
            socket.emit('sincronizar', salasEstado[sala]);
        }
    });

    socket.on('accion-video', (data) => {
        // Guardar el estado actual de la sala
        salasEstado[data.sala] = {
            accion: data.accion,
            tiempo: data.tiempo,
            estadoPrevio: data.estadoPrevio,
            timestamp: Date.now()
        };

        // Retransmitir al resto de miembros de la sala
        socket.to(data.sala).emit('sincronizar', data);
    });

    socket.on('disconnect', () => {
        console.log(`🔴 Conexión cerrada: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor WatchParty escuchando en el puerto ${PORT}`);
});