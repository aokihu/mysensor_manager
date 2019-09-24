import MySensor from 'node-mysensor'
import { IMysensorMessage, MysensorCommand, MysensorInterType, MysensorAck, MysensorDeviceType } from 'node-mysensor/dest/libs/message'
import EventEmitter from 'events'
import { MySensorNode, MySensorNodeChild } from './type';
import {table} from 'table';

/**
 * @class
 */
export default class Manager extends EventEmitter {

  static DEBUG: boolean = false;
  static FORMAT_DEBUG: boolean = false;
  static MAX_LIFE: number = 60;
  static CYCLE_LIFE: number = 1000; // Reduce life cycle, unit is ms

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

    // Start nodes life cycle
    setInterval(this.lifeCycle.bind(this), Manager.CYCLE_LIFE);
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

  public sendDiscoverRequest(nodeID:number) {
    this.sensor.send(
      nodeID,
      255,
      MysensorCommand.internal,
      MysensorAck.NO,
      MysensorInterType.I_DISCOVER_REQUEST,
      '');
  }

  /**
   * Send 'set' command to target node's child
   * @param nodeID Target node id
   * @param childID Target node's child id
   * @param type Send data type
   * @param value New value
   */
  public setNodeChild(nodeID: number, childID: number, type: number = 24, value: number | string): void {
    this.sensor.send(
      nodeID,
      childID,
      MysensorCommand.set,
      MysensorAck.NO,
      type, // Now it is set '24' Custom Value for any device
      value
    )
  }

  /// PRIVATE FUNCTIONS


  private lifeCycle(){

    this.nodes.forEach(n => {

      if(n.id === 0) return false; // For special gateway node, which id is 0

      if(n.life === 0) {
        n.alive = false;
        this.emit('offline', n);
        return false;
      }

      n.life -= 1;
    })

    if(Manager.FORMAT_DEBUG) this.formatOutput();

  }

  /**
   *
   * @param message Mysensor parsed struct data
   */
  private processPresentation(message: IMysensorMessage): void {
    const { type, nodeID, childID, payload } = message;
    if (Manager.DEBUG) console.log(message);

    // Find node which id is equal nodeID
    const node = this.nodes.find((n) => n.id === nodeID);

    // If not found the node, create a new node
    if (!node) {
      const newNode: MySensorNode = { id: nodeID, children: [], alive: true, life: Manager.MAX_LIFE, battery: 100 };
      const newChild: MySensorNodeChild = { id: childID, type, value: 0, description: payload };
      newNode.children.push(newChild);
      this.nodes.push(newNode);
    } else {

      // Find the child
      const child = node.children.find(c => c.id === childID);

      // If not found child
      if (!child) {
        const newChild: MySensorNodeChild = { id: childID, type, value: 0, description: payload };
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
      case MysensorInterType.I_HEARTBEAT_RESPONSE:
        this.internalHeartbeatResponse(message);
        break;
    }
  }

  private interalRequestNodeID(message: IMysensorMessage): void | boolean {
    if (Manager.DEBUG) console.log("Request Node ID", message)

    const { nodeID, childID } = message;

    // Checkt nodeID is not used
    const idx = this.nodes.findIndex(n=> n.id === childID)

    // Exit when any node used the same id
    if(idx > -1) return false;

    // Send new nodeID to target node
    this.sensor.send(
      nodeID,
      childID,
      MysensorCommand.internal,
      MysensorAck.NO,
      MysensorInterType.I_ID_RESPONSE,
      childID);
  }

  private internalHeartbeatRequest(message: IMysensorMessage): void {
    const {nodeID, payload, ack} = message;

    const node = this.getNodeById(nodeID);

    if(node) {
      node.life = 60;
      node.alive = true;

      if(Manager.DEBUG) console.log("Heartbeat Request", node);

      if(ack === MysensorAck.YES) {
        this.sensor.send(
          nodeID,
          255,
          MysensorCommand.internal,
          MysensorAck.YES,
          MysensorInterType.I_HEARTBEAT_RESPONSE,
          '');
      }

    }
  }

  private internalSketchName(message: IMysensorMessage): void {
    // Find the node with nodID
    const { nodeID, payload } = message;
    const node = this.getNodeById(nodeID)

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

  private internalHeartbeatResponse(message: IMysensorMessage): void {
    const {nodeID} = message;

    const node = this.getNodeById(nodeID);

    if(node) {
      node.life = 60;
      node.alive = true;
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

        child.value = this.analysisedPayload(payload);
        child.stamptime = Date.now();

        // Emit 'update' with node
        this.emit('update', node, child, child.value);

        if (Manager.DEBUG) console.log("SET", child);
      }
    } else {
      //
      // Request the node sketch information
      //
      this.sendDiscoverRequest(nodeID);
    }
  }

  /**
   * @private
   * @function
   * @param data Payload data
   * @description analysis payload data then tranfrom the payload data type
   */
  private analysisedPayload(data: string) {
    if(/^\D+$/.test(data)) {
      return data;
    } else {
      return Number(data);
    }
  }

  private formatOutput() {

    const output = [];
    output.push(['NodeID','ChildID',"Alive","Life","Sketch Name", "Sketch Version","Description", "TYPE", "VALUE"]);

    this.nodes.forEach((n:MySensorNode) => {
      const {id:nodeID, children, alive, life, sketchName, sketchVersion} = n;

      children.forEach((c:MySensorNodeChild) => {
        const {id:childID, value, type, description} = c;
        output.push([nodeID, childID, alive, life, sketchName, sketchVersion, description,type, value]);
      });
    })

    const str = table(output);
    console.log(str);

  }

}
