const { SerialPort, ReadlineParser } = require("serialport");
const { ChildProcess } = require("child_process");
const fetch = require("cross-fetch");
const Printer = require("./printer");
var player = require("play-sound")({
  player: "mpg123",
});

const {
  SELAMAT_DATANG,
  SILAKAN_AMBIL_TIKET,
  MOHON_TUNGGU,
} = require("../sounds");

class Gate {
  token;
  port;
  activeSound;
  vehicleIn = false;

  constructor(
    id,
    nama,
    ipAddress,
    jenis_kendaraan,
    baudrate,
    printer,
    path = process.env.SERIAL_DEVICE
  ) {
    this.id = id;
    this.nama = nama;
    this.ipAddress = ipAddress;
    this.jenis_kendaraan = jenis_kendaraan;
    this.path = path;
    this.baudrate = baudrate;
    this.printer = new Printer(
      printer.id,
      printer.nama,
      printer.ip_address,
      printer.port,
      printer.type
    );
  }

  playSound(audio) {
    if (this.activeSound instanceof ChildProcess) {
      this.activeSound.kill();
    }

    this.activeSound = player.play(
      `${__dirname}/../sounds/${audio}`,
      {},
      (err) => {
        console.log(err);
      }
    );
  }

  async reconnect() {
    try {
      if (this.port instanceof SerialPort) {
        this.port = null;
      }

      setTimeout(() => {
        try {
          this.scan();
        } catch (error) {
          console.error(`${this.nama} - ERROR - ${error.message}`);
        }
      }, 1000);
    } catch (error) {
      console.error(`${this.nama} - ERROR - ${error.message}`);
    }
  }

  scan() {
    const { nama, path, baudrate: baudRate } = this;
    this.port = new SerialPort({ path, baudRate });
    console.log(`${nama}: CONNECTING ...`);

    this.port.on("open", () => {
      console.log(`${nama}: CONNECTED`);
    });

    const parser = this.port.pipe(
      new ReadlineParser({ includeDelimiter: false, delimiter: "\r\n" })
    );

    parser.on("data", async (data) => {
      console.log(`${nama} : ${data}`);

      switch (data) {
        case "LOOP1":
          this.vehicleIn = true;
          this.playSound(SELAMAT_DATANG);
          break;

        case "STRUK":
          if (!this.vehicleIn) return;

          try {
            await this.saveDataAndOpenGate();
            this.playSound(SILAKAN_AMBIL_TIKET);
          } catch (error) {
            console.error(error.message);
          }
          break;

        case "EMRGN":
          if (!this.vehicleIn) return;
          this.playSound(MOHON_TUNGGU);
          break;

        default:
          this.vehicleIn = false;
          console.log(`${nama}: RESET`);
          break;
      }
    });

    this.port.on("error", (error) => {
      console.error(`${nama} - ERROR - ${error.message}`);
      this.reconnect();
    });
  }

  open(delay = 0.5) {
    const command = "A".repeat(delay / 0.5);
    this.port.write(Buffer.from(`${command}\n`));
  }

  async saveDataAndOpenGate() {
    const { nama, jenis_kendaraan, id } = this;
    const payload = { is_member: 0, jenis_kendaraan, gate_in_id: id };
    const res = await fetch(
      `${process.env.API_BASE}/parkingTransaction/apiStore`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    const json = await res.json();
    if (res.statusText != "OK") throw new Error(json.message);
    console.log(`${nama}: ${json.data.nomor_barcode}`);

    if (this.printer.type == "local") {
      try {
        this.printer.printTicket(json.data, this); // todo = passing setting
      } catch (error) {
        console.error(`Gagal mencetak tiket ${json.data.nomor_barcode}`);
      }
    }

    this.open(3);
  }
}

module.exports = Gate;
