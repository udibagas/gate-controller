const escpos = require("escpos");
const USB = require("escpos-usb");

class Printer {
  constructor(id, nama, path, baudRate, type) {
    this.id = id;
    this.nama = nama;
    this.path = path;
    this.baudRate = baudRate;
    this.type = type;
  }

  printTicket(data, gate) {
    const { nama, jenis_kendaraan, setting } = gate;
    const { nama_lokasi, info_tambahan_tiket } = setting;
    const { time_in, nomor_barcode } = data;

    const [tanggal, jam] = new Date(time_in)
      .toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "long",
      })
      .split(", ");

    const device = new USB();
    const printer = new escpos.Printer(device, {});

    device.open((err) => {
      printer
        .align("CT")
        .text("TIKET PARKIR")
        // .size(2, 2)
        .text(nama_lokasi)
        // .size(1, 1)
        .feed(2)
        .align("LT")
        .text(`GATE       : ${nama}/${jenis_kendaraan}`)
        .text(`TANGGAL    : ${tanggal.replaceAll(" ", "-")}`)
        .text(`JAM        : ${jam.replaceAll(".", ":")}`)
        .feed(2)
        .align("CT")
        .barcode(nomor_barcode, "CODE39", {
          height: 100,
          width: 4,
          position: "BLW",
        })
        .feed(2)
        .text(info_tambahan_tiket)
        .feed(2)
        .cut()
        .close();
    });
  }
}

module.exports = Printer;
