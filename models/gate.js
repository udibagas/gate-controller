const { SerialPort, ReadlineParser } = require("serialport");
const fetch = require("cross-fetch");
const Printer = require("./printer");
const player = require("./player");

class Gate {
  static STATE_VEHICLE_IN = "LOOP1";
  static STATE_VEHICLE_OUT = "LOOP2";

  token;
  port;
  state;

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
    this.printer = new Printer(printer.id, printer.nama, printer.path);
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
    console.log(`Connecting to gate ${nama}...`);

    this.port.on("open", () => {
      console.log(`Serial ${path} (${nama}) opened`);
    });

    const parser = this.port.pipe(new ReadlineParser());

    parser.on("data", async (bufferData) => {
      const data = bufferData.toString();
      console.log(`${nama} : ${data}`);

      // if (data == this.state) return; // kalau trigger yang sama berkali2 abaikan
      // this.state = data;

      if (data == "LOOP1") {
        console.log(`${nama}: kendaraan masuk`);
        player.stopAndPlay(player.SELAMAT_DATANG);
      }

      if (data == "STRUK") {
        console.log(`${nama}: tombol struk ditekan`);
        player.stopAndPlay(player.SILAKAN_AMBIL_TIKET);

        try {
          await this.saveDataAndOpenGate();
          player.stopAndPlay(player.TERIMAKASIH);
        } catch (error) {
          console.error(error.message);
        }
      }

      if (data == "EMRGN") {
        console.log(`${nama}: tombol emergency ditekan`);
        player.stopAndPlay(player.MOHON_TUNGGU);
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
    const res = await fetch(`${process.env.API_BASE}/apiStore`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${this.token}`,
      },
    });

    const json = await res.json();
    if (res.statusText != "OK") throw new Error(json.message);
    console.log(`${nama}: ${JSON.stringify(json)}`);
    this.printer.printTicket(json, this, this.SETTING);
    this.open(3);
  }
}

module.exports = Gate;
