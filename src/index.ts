import MySensor from 'node-mysensor'
import { IMysensorMessage, MysensorCommand, MysensorInterType, MysensorAck } from 'node-mysensor/dest/libs/message'
import EventEmitter from 'events'
import { MySensorNode, MySensorNodeChild } from './type';

/**
 * @class
 */
export default class Manager extends EventEmitter {

  static DEBUG: boolean = false;
  static MAX_LIFE: number = 60;

  private sensor: MySensor;
  private nodes: MySensorNode[];

  /**
   * @constructor
   * @param port Serial interface path name
   * @param baudrate Serial communication speed
   */
  constructor(port: string, baudrate: number) {
    super();

    MySensor.DEBUG = Manager.DEBUG;

    this.nodes = [];
    this.sensor = new MySensor(port, baudrate);
    this.sensor.on('presentation', this.processPresentation.bind(this));
    this.sensor.on('internal', this.processInternal.bind(this));
    this.sensor.on('set', this.processSet.bind(this));
  }

  /// PUBLIC FUNCTIONS

  /**
   * @public
   * @function
   * @return all nodes count
   * @description Get node with node'id
   */
  public nodesCount(): number { return this.nodes.length }

  /**
   * @public
   * @function
   * @param id Target node id
   * @return MySensorNode
   */
  public getNodeById(id: number): MySensorNode | undefined {
    return this.nodes.find(n => n.id === id);
  }

  /// PRIVATE FUNCTIONS

  /**
   *
   * @param message Mysensor parsed struct data
   */
  private processPresentation(message: IMysensorMessage): void {
    const { type, nodeID, childID } = message;
    if (Manager.DEBUG) console.log(message);

    // Find node which id is equal nodeID
    const node = this.nodes.find((n) => n.id === nodeID);

    // If not found the node, create a new node
    if (!node) {
      const newNode: MySensorNode = { id: nodeID, children: [], alive: true, life: Manager.MAX_LIFE };
      const newChild: MySensorNodeChild = { id: childID, type, value: 0 };
      newNode.children.push(newChild);
      this.nodes.push(newNode);
    } else {
      // Find the child
      const child = node.children.find(c => c.id === childID);

      // If not found child
      if (!child) {
        const newChild: MySensorNodeChild = { id: childID, type, value: 0 };
        node.children.push(newChild);
      }
    }

    // DEBUG
    if (Manager.DEBUG) console.log(this.nodes);
  }

  private processInternal(message: IMysensorMessage): void {

    const { type } = message;

    switch (type) {
      // When node request NODE_ID
      case MysensorInterType.I_ID_REQUEST:
        this.interalRequestNodeID(message);
        break;
      case MysensorInterType.I_SKETCH_NAME:
        this.internalSketchName(message);
        break;
      case MysensorInterType.I_SKETCH_VERSION:
        this.internalSketchVersion(message);
        break;
    }
  }

  private interalRequestNodeID(message: IMysensorMessage): void {
    if (Manager.DEBUG) console.log("Request Node ID", message)

    const { nodeID, childID } = message;
    this.sensor.send(
      nodeID,
      childID,
      MysensorCommand.internal,
      MysensorAck.NO,
      MysensorInterType.I_ID_RESPONSE,
      childID);
  }

  private internalSketchName(message: IMysensorMessage): void {
    // Find the node with nodID
    const { nodeID, payload } = message;
    const node = this.nodes.find(n => n.id === nodeID);

    if (node) {
      node.sketchName = payload

      if (Manager.DEBUG) console.log("Sketch Name", node);
    }
  }

  private internalSketchVersion(message: IMysensorMessage): void {
    const { nodeID, payload } = message;
    const node = this.nodes.find(n => n.id === nodeID);

    if (node) {
      node.sketchVersion = payload;

      if (Manager.DEBUG) console.log("Sketch Version", node);
    }
  }

  /// EVENT SET PROCESS

  /**
   * @event update
   * @param message 
   */
  private processSet(message: IMysensorMessage): void {
    const { nodeID, childID, payload } = message;

    const node = this.nodes.find(n => n.id === nodeID);

    if (node) {
      const child = node.children.find(n => n.id === childID);

      if (child) {
        child.value = payload;
        child.stamptime = Date.now();


        // Emit 'update' with node
        this.emit('update', node, child, child.value);

        if (Manager.DEBUG) console.log("SET", child);
      }
    }
  }

}
