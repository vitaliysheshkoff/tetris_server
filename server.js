const { Socket } = require('engine.io');

const http = require('http').createServer()

const io = require('socket.io')(http, {
    cors: { origin: '*' }
})

const pgp = require('pg-promise')();

const NodeRSA = require('node-rsa');

const cn = {
    host:  process.env.HOST,
    port: process.env.PORT,
    database: process.env.DB,
    user: process.env.USER,
    password: process.env.PASSWORD,
    ssl: {
        rejectUnauthorized: false,
    }
};

// connect to database 
const db = pgp(cn);

io.on('connection', (socket) => {

    socket.on("db", () => {

        console.log( process.env.HOST);
        console.log( process.env.PORT);
        console.log( process.env.DB);
        console.log( process.env.USER);
        console.log( process.env.PASSWORD);

        console.log("getting DB...")

        // get data from database: users and chats
        getData().catch(error => {
            console.log(error)
        })

    });

    async function getUsers() {
        let res = await db.query("SELECT user_db_id, user_name, user_nickname FROM users");
        return res;
    }

    async function getChats() {
        let res = await db.query("SELECT chat_db_id, chat_full_name FROM chats")
        return res
    }

    async function getData() {
        let users_list = await getUsers()
            .catch(error => {
                console.log(error)
            });
        let chats_list = await getChats()
            .catch(error => {
                console.log(error)
            });

        for (var i = 0; i < users_list.length; i++) {
            users_list[i].user_name = (users_list[i].user_name) ? users_list[i].user_name.trim() : null;
            users_list[i].user_nickname = (users_list[i].user_nickname) ? users_list[i].user_nickname.trim() : null;
        }

        for (var i = 0; i < chats_list.length; i++) {
            chats_list[i].chat_full_name = (chats_list[i].chat_full_name) ? chats_list[i].chat_full_name.trim() : null;
            chats_list[i].chat_db_id *= -1;
        }

        console.log("DB:")
        console.log("users_list size: " + users_list.length)
        console.log("chats_list size: " + chats_list.length)

        // send users list and chats list
        try {
            socket.emit('db', users_list, chats_list);
        } catch (error) {
            console.log(error);
        }

    }

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

http.listen(process.env.PORT || 8080, () => console.log('Server running on port 8080'))