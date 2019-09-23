const MySensorManager = require("./dest/index.js").default
MySensorManager.DEBUG = false;

async function main () {
  const manager = new MySensorManager('/dev/cu.usbserial-A800H5SE', 115200);
  manager.on('internal', console.log)

  manager.on('update', (node, child, value) => {
    console.log("Update", node, child, value)
  })
}

main();
