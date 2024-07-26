// const player = require("./models/player");
const escpos = require("escpos");
const USB = require("escpos-usb");

const device = new USB();
const printer = new escpos.Printer(device);

device.open((err) => {
  printer.text("Test");
});

// player.stopAndPlay(player.SELAMAT_DATANG);
