import MySensor from 'node-mysensor'
import {IMysensorMessage, MysensorCommand} from 'node-mysensor/src/libs/message'
import EventEmitter from 'events'
import { MySensorNode } from './type';

/**
 * @class
 */
export default class Manager extends EventEmitter {

  private sensor:MySensor;
  private nodes:MySensorNode[];

  /**
   * @constructor
   * @param port Serial interface path name
   * @param baudrate Serial communication speed
   */
  constructor(port:string, baudrate: number){
    super();
    this.nodes = [];
    this.sensor = new MySensor(port, baudrate);
    this.sensor.on('presentation', this.processPresentation.bind(this))
  }

  /**
   *
   * @param message Mysensor parsed struct data
   */
  private processPresentation(message: IMysensorMessage) {
    console.log(message);
  }

  private genrateNodeID() {}

}
