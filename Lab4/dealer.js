// https://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender/10099325#10099325

let app = require('http').createServer(); // create HTTP server
let io = require('socket.io')(app, {path: '/socket.io'}); // bind Socket to HTTP server
app.listen(3000); // listen on port 3000

/*
let cards = [ // S = Spades, H = Hearts, C = Clubs, D = Diamonds
    'SA', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'SJ', 'SQ', 'SK',
    'HA', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10', 'HJ', 'HQ', 'HK',
    'CA', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'CJ', 'CQ', 'CK',
    'DA', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'DJ', 'DQ', 'DK'
];
*/

let temp = [ // Sp = Spades, H = Hearts, C = Clubs, D = Diamonds
    ['S', 'A'] , ['S', '2'] , ['S', '3'] , ['S', '4'] , ['S', '5'] , ['S', '6'] ,
    ['S', '7'] , ['S', '8'] , ['S', '9'] , ['S', '10'] , ['S', 'J'] , ['S', 'Q'] , ['S', 'K'] ,
    ['H', 'A'] , ['H', '2'] , ['H', '3'] , ['H', '4'] , ['H', '5'] , ['H', '6'] ,
    ['H', '7'] , ['H', '8'] , ['H', '9'] , ['H', '10'] , ['H', 'J'] , ['H', 'Q'] , ['H', 'K'] ,
    ['C', 'A'] , ['C', '2'] , ['C', '3'] , ['C', '4'] , ['C', '5'] , ['C', '6'] ,
    ['C', '7'] , ['C', '8'] , ['C', '9'] , ['C', '10'] , ['C', 'J'] , ['C', 'Q'] , ['C', 'K'] ,
    ['D', 'A'] , ['D', '2'] , ['D', '3'] , ['D', '4'] , ['D', '5'] , ['D', '6'] ,
    ['D', '7'] , ['D', '8'] , ['D', '9'] , ['D', '10'] , ['D', 'J'] , ['D', 'Q'] , ['D', 'K']
];

let cards2 = [];

let player1 = null;
let player2 = null;
let started = false;
let started_users = 0;

console.log('Listening for connections on port 3000');

var clients = [];
var all_users = [];

var myCards = [];
var mySum = 0;

io.on('connection', function(socket) {
    all_users.push(socket.id);

    if( clients.length != 2 && !started){
        clients.push(socket.id);

        for( var i = 0; i < clients.length; i++){
            console.log(clients[i]);
        }
        console.log('----------');

        var a = clients.indexOf(socket.id);
        io.sockets.connected[socket.id].emit('id', {id: socket.id});
    }
    else{
        io.sockets.connected[socket.id].emit('id', {id: 'null'});        
    }
    
    socket.on('start', function(data) {
        if( data.start == 'true' ){
            started = true;
            started_users++;
        }

        if( started ){
            if( started_users == clients.length ){
                console.log('game started! Have fun!');
                
                // Game
                cards2 = temp;
                shuffle(cards2); // randomize array
                
                send = []; // temp client cards to send

                clients_sums = [];
                clients_sums[0] = 0;
                clients_sums[1] = 0;

                var winner = "";
                var losers = [];

                // initialize clients cards
                for( let i = 0; i < clients.length; i++ ){
                    let c_card1 = { 
                        card: cards2[0],
                        id: clients[i]
                    };
                    let c_card2 = {
                        card: cards2[1],
                        id: clients[i]
                    };

                    // add card values to sum
                    clients_sums[i] += translateCard(c_card1.card[0][1], clients_sums[i]);
                    clients_sums[i] += translateCard(c_card2.card[0][1], clients_sums[i]);     

                    send.push(c_card1);
                    send.push(c_card2);
                    
                    cards2.splice(0, 2);
                    
                    console.log(c_card1);
                    console.log(c_card2);
                    console.log(clients[i]);

                    if( clients_sums[i] == 21 ){ // if client wins
                        winner = clients[i];
                    }
                    if( clients_sums[i] > 21 ){ // if client busts
                        losers.push(clients[i]);
                    }
                }

                 // initialize dealer cards
                 let d_card1 = cards2[0];
                 let d_card2 = cards2[1];
                 myCards.push(d_card1);
                 myCards.push(d_card2);
                 cards2.splice(0, 2);
                 mySum += translateCard(d_card1[1], mySum);
                 mySum += translateCard(d_card2[1], mySum);
                 console.log(d_card1);
                 console.log(d_card2);
                 console.log(mySum);

                if( mySum == 21 ){ // if dealer wins
                    winner = 'dealer';
                }
                else if( mySum > 21 ){ // if dealer busts
                    loser.push('dealer');
                }

                for( let i = 0; i < clients.length; i++ ){
                    io.sockets.connected[clients[i]].emit('cards', {dealer: myCards, clients: send, winner: winner, losers: losers });
                }

            }
            else{
                console.log('Waiting for other component...');
            }
        }
    });

    socket.on('disconnect', function(){
        var a = all_users.indexOf(socket.id);
        all_users.splice(a, 1);
        var b = clients.indexOf(socket.id);
        if( b != -1 ){
            clients.splice(b, 1);
        }
        mySum = 0;
        cards2 = temp;
        myCards = [];
    });

    if( clients.length == 0 ){
        started = false;
        started_users = 0;
    }

});

function shuffle(array) {
    for( var i = array.length - 1; i >= 1; i-- ) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function translateCard(num, mySum){
    if( parseInt(num) >= 1 && parseInt(num) <= 10 ){
        return parseInt(num);
    }
    else if( num == 'K' || num == 'Q' || num == 'J' ){
        return 10;
    }
    else{ // if card is A
        if( mySum < 11 ){
            return 11;
        }
        else{
            return 1;
        }
    }
}