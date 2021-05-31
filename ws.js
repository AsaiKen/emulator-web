const { credentials } = require('@grpc/grpc-js');
const { Empty } = require('google-protobuf/google/protobuf/empty_pb.js');
const Services = require('./gen/emulator_controller_grpc_pb');
const Messages = require('./gen/emulator_controller_pb');

const client = new Services.EmulatorControllerClient('localhost:5556', credentials.createInsecure());

function sendKey(key) {
  const request = new Messages.KeyboardEvent();
  request.setKey(key);
  request.setEventtype(Messages.KeyboardEvent.KeyEventType.KEYPRESS);
  console.log('sendKey', request);
  client.sendKey(request, (error, response) => {
    if (error) {
      console.error({ error });
      return;
    }
    console.log(response);
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

module.exports = socket => {
  socket.on('mouse', ({ x, y, mouseDown, mouseButton }) => {
    const request = new Messages.MouseEvent();
    const scaledMouse = scaleCoordinates(x, y);
    request.setX(scaledMouse.x);
    request.setY(scaledMouse.y);
    request.setButtons(mouseDown ? mouseButton : 0);
    console.log('sendMouse', request);
    client.sendMouse(request, (error, response) => {
      if (error) {
        console.error({ error });
        return;
      }
      console.log(response);
    });
  });

  socket.on('keyboard', ({ eventType, key }) => {
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
      console.log(response);
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
};

