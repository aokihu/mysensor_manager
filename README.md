My Sensor Manager
-----------------

# Description
MySensorManager is used for manager mysensor node through serial interface.

# Install

You can use `npm` install the package.

```bash
npm install mysensor_manager
```

# Example

You can find the test file in source.

```javascript
import MySensorManager from 'mysensor_manager';

MySensorManager.DEBUG = false; // Show the debug if true, default is false
MySensorManager.FORMAT_DEBUG = false; // Show node's information as table if true, default is false

async function main () {

  // input serial interface name and baundrate
  const manager = new MySensorManager('/dev/cu.usbserial-A800H5SE', 115200);
  
  // manager.on('internal', console.log)

  manager.on('update', (node, child, value) => {

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
```

# Usage

Initialize class

```javascript
 const manager = new MySensorManager('/dev/cu.usbserial-A800H5SE', 115200);
```

there are two params `serial interface name` and `baudrate`, normally the `baudrate` is `115200`, so you can pass `null` to the second param.

The manager will manger node's id automatic.

`mysensor_manager` has internal node's database, you can fetch all nodes data with property `nodes`, or get count of all nodes with method `nodesCount()`, at last you can get special node with `NODE'S ID` through method `getNodeById(id)`

e.g.
```javascript
const countOfAllnodes = manager.nodesCount(); // get count of all nodes
const allNodes = manager.nodes; // get all nodes array data
const oneNode = manager.getNodeById(id); // get special node with ID
```

You also send `REBOOT COMMAND` to target node(which support `REBOOT COMMAND`). Or send `DISCOVER COMMAND` when you need know which node is online.

```javascript
manager.rebootNode(ID); // Send reboot command to node with node's id
manager.sendDiscoverRequest(ID); //Send discover command to node with node's id
```

At last you can send node's child message with method `setNodeChild`, the send method is very raw, you need input `node id`, `chid id`

```javascript
manager.setNodeChild(20, 2, 2, 1);
```

# Contact

Hope you like this project, if you have some idea, you can send me [aokihu@gmail.com](mailto://aokihu@gmail.com)
