const { credentials } = require('@grpc/grpc-js');
const { Empty } = require('google-protobuf/google/protobuf/empty_pb.js');
const Services = require('./gen/emulator_controller_grpc_pb');
const Messages = require('./gen/emulator_controller_pb');
const RtcServices = require('./gen/rtc_service_grpc_pb');
const RtcMessages = require('./gen/rtc_service_pb');

module.exports = socket => {
  const channelCredentials = credentials.createInsecure();
  const client = new Services.EmulatorControllerClient('localhost:5556', channelCredentials);
  const rtcClient = new RtcServices.RtcClient('localhost:5556', channelCredentials);

  let guid = null;
  let rtcConnected = false;
  let stream = null;

  function sendKey(key) {
    if (!rtcConnected) {
      return;
    }
    const request = new Messages.KeyboardEvent();
    request.setKey(key);
    request.setEventtype(Messages.KeyboardEvent.KeyEventType.KEYPRESS);
    console.log('sendKey', request);
    client.sendKey(request, (error, response) => {
      if (error) {
        console.error({ error });
        return;
      }
      // console.log(response);
    });
  }

  function scaleCoordinates(x, y) {
    const deviceWidth = 320;
    const deviceHeight = 640;
    const clientWidth = 320;
    const clientHeight = 640;
    const scaleX = deviceWidth / clientWidth;
    const scaleY = deviceHeight / clientHeight;
    return { x: Math.round(x * scaleX), y: Math.round(y * scaleY), scaleX, scaleY };
  }

  function streamingJsepMessage() {
    if (!rtcConnected) {
      return;
    }

    stream = rtcClient.receiveJsepMessages(guid, {});
    stream.on('data', async response => {
      const message = response.getMessage();
      socket.emit('signal', message);
    });
    // // error時は再接続
    // stream.on('error', e => {
    //   console.log('Jsep message stream error:', e);
    //   if (rtcConnected) {
    //     console.log('Attempting to reconnect to jsep message stream.');
    //     streamingJsepMessage();
    //   }
    // });
    // // end時は再接続
    // stream.on('end', e => {
    //   if (rtcConnected) {
    //     console.log('Stream end while still connected.. Reconnecting');
    //     streamingJsepMessage();
    //   }
    // });
  }

  function disconnect() {
    if (stream) {
      stream.cancel();
      stream = null;
    }
  }

  function startRtc() {
    const request = new Empty();
    rtcClient.requestRtcStream(request, {}, (err, response) => {
      if (err) {
        console.error('Failed to configure rtc stream: ' + JSON.stringify(err));
        disconnect();
        return;
      }
      // console.log('guid', response);
      guid = response;
      rtcConnected = true;
      streamingJsepMessage();
    });
  }

  socket.on('mouse', ({ x, y, mouseDown, mouseButton }) => {
    if (!rtcConnected) {
      return;
    }
    const request = new Messages.MouseEvent();
    const scaledMouse = scaleCoordinates(x, y);
    request.setX(scaledMouse.x);
    request.setY(scaledMouse.y);
    request.setButtons(mouseDown ? mouseButton : 0);
    // console.log('sendMouse', request);
    client.sendMouse(request, (error, response) => {
      if (error) {
        console.error({ error });
        return;
      }
      // console.log(response);
    });
  });

  socket.on('keyboard', ({ eventType, key }) => {
    if (!rtcConnected) {
      return;
    }
    const request = new Messages.KeyboardEvent();
    let eventTypeValue;
    if (eventType === 'KEYDOWN') {
      eventTypeValue = Messages.KeyboardEvent.KeyEventType.KEYDOWN;
    } else if (eventType === 'KEYUP') {
      eventTypeValue = Messages.KeyboardEvent.KeyEventType.KEYUP;
    } else {
      eventTypeValue = Messages.KeyboardEvent.KeyEventType.KEYPRESS;
    }
    request.setEventtype(eventTypeValue);
    request.setKey(key);
    console.log('sendKey', request);
    client.sendKey(request, (error, response) => {
      if (error) {
        console.error({ error });
        return;
      }
      // console.log(response);
    });
  });

  socket.on('back', () => {
    sendKey('GoBack');
  });
  socket.on('home', () => {
    sendKey('GoHome');
  });
  socket.on('overview', () => {
    sendKey('AppSwitch');
  });

  socket.on('jsep', message => {
    if (!rtcConnected) {
      return;
    }
    const request = new RtcMessages.JsepMsg();
    request.setId(guid);
    request.setMessage(JSON.stringify(message));
    rtcClient.sendJsepMessage(request, (error, response) => {
      if (error) {
        console.error({ error });
        return;
      }
      // console.log(response);
    });
  });

  startRtc();
};

