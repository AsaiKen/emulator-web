const http = require('http');
const createError = require('http-errors');
const express = require('express');
const path = require('path');

const env = process.env.ENV || 'development';
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5550;

// Exceptionが発生するとプロセスごと落ちるので対処
process.on('uncaughtException', function(err) {
  console.error(err);
});

// キャッシュが効いてしまうので無効化
app.disable('etag');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// httpサーバにwsハンドラを追加
const { Server } = require('socket.io');
const io = new Server(server);
io.on('connection', require('./ws.js'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = env === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.error(req.path);
  console.error(err);
  res.json({ status: 'NG', error: '例外が発生しました' });
});

server.listen(port, () => {
  console.log(`> Ready on http://localhost:${port}`);
});


module.exports = app;
