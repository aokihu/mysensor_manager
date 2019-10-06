import MySensorManager from './index';
MySensorManager.DEBUG = false;
MySensorManager.FORMAT_DEBUG = true;

async function main () {
  const manager = new MySensorManager('/dev/cu.usbserial-A800H5SE', 115200);
  // manager.on('internal', console.log)

  manager.on('update', (node, child, value) => {
    // console.log("Update", node, child, value)

    // When button is press, switch led on/off

    if(child.id === 1) {

      manager.setNodeChild(node.id, 2, 2, value);
    }

    if(child.id === 2 && node.id === 15) {
      if(value >= 27) {
        manager.setNodeChild(20, 2, 2, 1);

      }
    }

  })
}

main();
