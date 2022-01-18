const { Socket } = require('engine.io');

const http = require('http').createServer()

const io = require('socket.io')(http, {
    cors: { origin: '*' }
})

io.on('connection', (socket) => {

    socket.on('create', (room) => {

        try {
            // check if room is already exist
            if (io.sockets.adapter.rooms.get(room).size > 0) {

                console.log('room ' + '[' + room + ']' + ' is already exist!')
                socket.disconnect();
                return;
            }
            // room doesn't exist
        } catch (error) {
            socket.join(room);

            socket.emit('success creation', room);

            console.log('client create the room : ' + '[' + room + ']');
            console.log('number of members: ' + io.sockets.adapter.rooms.get(room).size);
        }

    });

    socket.on('join', (room) => {

        try {
            // check if room is full
            if (io.sockets.adapter.rooms.get(room).size === 2) {

                console.log('room ' + '[' + room + ']' + ' is full!')
                socket.disconnect();
                return;
            }
            // room doesn't exist
        } catch (error) {
            socket.disconnect();
            return;
        }
        socket.join(room);
        socket.emit('success join', room);

        console.log('client connected to the room : ' + '[' + room + ']');
        console.log('amount of members: ' + io.sockets.adapter.rooms.get(room).size)
    })

    socket.on('data', (room, data) => {
        try {
            socket.to(room).emit('data', data);
        } catch (error) {
            socket.disconnect();
        }
    });

    socket.on('stack', (room, stack) => {

        try {
            socket.to(room).emit('stack', stack);
        } catch (error) {
            socket.disconnect();
        }
    });

    socket.on('nickname', (room, nickname) => {

        try {
            socket.to(room).emit('nickname', nickname);
        } catch (error) {
            socket.disconnect();
        }
    });

})

http.listen(8080, () => console.log('Server running on port 8080'))