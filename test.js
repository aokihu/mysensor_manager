const MySensorManager = require("./dest/index.js").default


async function main() {
  const manager = new MySensorManager('/dev/cu.usbserial-A800H5SE', 115200);
}

main();
