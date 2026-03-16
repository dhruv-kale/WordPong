const express = require('express');
const fetch = require('node-fetch');
const app = express();

var http = require('http').createServer(app);

var io = require('socket.io')(http, {'pingTimeout': 7000, 'pingInterval': 3000});

app.get('/', (req, res) => {
  res.sendFile('index.html', {root: 'public'});
});

io.on('connection', (socket) => {
  console.log("New Connection")
  socket.on('getID', () => {
    socket.emit("playerIdReturn", socket.id)
  })
  socket.on("termsAndDefs", (res) => {
    socket.to(res[0]).emit("langGameTermsAndDefs", [res[1], res[2]] )
  })
  socket.on('conPal', (play2ID) => {
    if (io.sockets.sockets.has(play2ID)){
      socket.to(play2ID).emit("inviterID", socket.id)
      socket.emit("connectStatus", ["Connected!", true, play2ID])
    } else {
      socket.emit("connectStatus", ["Could not connect!", false])
    }
  });
  socket.on("startingQuestion", ([player, question]) => {
    socket.to(player).emit("storeStartQ", question)
  })
  socket.on("gameStartSend", (msg) => {
    socket.to(msg[0]).emit("gameStartRecieve", msg.slice(1));
  })

  socket.on("updateTime", (time)=>{
    socket.to(time[0]).emit("updateOppTime", [time[1], time[2]])
  })

  socket.on("myCarPos", (res) => {
    socket.to(res[0]).emit("oppCarPos", res[1])
  })

  socket.on("raceGameWin", (res) => {
    socket.to(res).emit("gameLost")
  })
  
  socket.on("answer", (ans) => {
    if (ans[3] === 0 || ans[3] === 3) {
      // check similarity if not send back error
      fetch("http://swoogle.umbc.edu/SimService/GetSimilarity?operation=api&phrase1="+ ans[1] + "&phrase2=" + ans[2] + "&corpus=gigawords")
        .then((resp) => resp.text()).then(
          (body) => {
            console.log(parseFloat(body))
            if (parseFloat(body) > 0.1){
              
              socket.to(ans[0]).emit("oppAnswer", ans[1]);
              socket.emit("validAns", [parseFloat(body), ans[1]])
            } else{
              socket.emit("wrongAns")
            }
          }
        ).catch((err) => fetch("http://swoogle.umbc.edu/SimService/GetSimilarity?operation=api&phrase1="+ ans[1] + "&phrase2=" + ans[2] + "&corpus=gigawords")
        .then((resp) => resp.text()).then(
          (body) => {
            console.log(parseFloat(body))
            if (parseFloat(body) > 0.1){
              
              socket.to(ans[0]).emit("oppAnswer", ans[1]);
              socket.emit("validAns", [parseFloat(body), ans[1]])
            } else{
              socket.emit("wrongAns")
            }
          }
        ).catch(console.log(err))); 
    } else if (ans[3] == 1){
      socket.to(ans[0]).emit("oppAnswer", ans[1]);
    } else if (ans[3] == 2){
      socket.to(ans[0]).emit("oppAnswer", ans[1]);
    }
  })
  socket.on('disconnect', () => {
    console.log('User Disconnected');
  });
});
http.listen(3000, () => {
  console.log('Server started on port 3000');
});