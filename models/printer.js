const { SerialPort } = require("serialport");
const escpos = require("escpos");

class Printer {
  constructor(id, nama, path, baudRate, type) {
    this.id = id;
    this.nama = nama;
    this.path = path;
    this.baudRate = baudRate;
    this.type = type;
  }

  printTicket(
    data,
    gate,
    {
      nama_lokasi = "Mitrateknik",
      info_tambahan_tiket = "Jangan meninggalkan barang bawaan Anda",
    }
  ) {
    const { nama, jenis_kendaraan } = gate;
    const { time_in, nomor_barcode } = data;

    const [tanggal, jam] = new Date(time_in)
      .toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "long",
      })
      .split(", ");

    // const device = new escpos.USB();
    const device = new escpos.Serial(this.path);
    const printer = new escpos.Printer(device, {});

    device.open((err) => {
      printer
        .align("CT")
        .text("TIKET PARKIR")
        .size(2, 2)
        .text(nama_lokasi)
        .size(1, 1)
        .align("LT")
        .feed()
        .text(`GATE       : ${nama}/${jenis_kendaraan}`)
        .text(`TANGGAL    : ${tanggal}`)
        .text(`JAM        : ${jam}`)
        .feed()
        .align("CT")
        .barcode(nomor_barcode, "CODE128", {
          height: 100,
          position: "BLW",
        })
        .feed()
        .text(info_tambahan_tiket)
        .cut()
        .close();
    });
  }

  printTicketViaSerial(
    data,
    gate,
    {
      nama_lokasi = "Mitrateknik",
      info_tambahan_tiket = "Jangan meninggalkan barang bawaan Anda",
    }
  ) {
    const { nama, jenis_kendaraan } = gate;
    const { time_in, nomor_barcode } = data;

    const [tanggal, jam] = new Date(time_in)
      .toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "long",
      })
      .split(", ");

    const command = [
      "\xa6PR3", // start print command, baudrate 9600
      "\x1b\x61\x01TIKET PARKIR\n", // align center
      `\x1b\x21\x10${nama_lokasi}\n\n`, // double height
      "\x1b\x21\x00", // normal height
      "\x1b\x61\x00", // align left
      `GATE         : ${nama}/${jenis_kendaraan}\n`,
      `TANGGAL      : ${tanggal}\n`,
      `JAM          : ${jam}\n\n`,
      "\x1b\x61\x01", // align center
      "\x1dhd", // set barcode height = 100, GS h 100
      "\x1dH\x02", // set barcode text = below, GS H 2
      "\x1dkE", // GS k 69
      nomor_barcode.length, // barcode length
      nomor_barcode, // barcode content
      `\n${info_tambahan_tiket}\n`,
      "\x1d\x56A", // full cut, add 3 lines: GS V 65
      "\xa9", // end command
    ];

    const serial = new SerialPort({
      path: this.path,
      baudRate: Number(this.baudRate),
      dataBits: 8,
      parity: "none",
      stopBits: 1,
      flowControl: false,
    });

    serial.on("open", () => {
      console.log(`Connected to printer ${this.nama}. Printing ticket...`);
      serial.write(Buffer.from(command.join("")));
    });

    serial.on("error", (err) => {
      console.error(
        `Failed to connect to printer ${this.nama}: ${err.message}`

        // Inappropriate ioctl for device setting custom baud rate of 9600
      );
    });
  }
}

module.exports = Printer;
