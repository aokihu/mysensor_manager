/// <reference types="node" />
import EventEmitter from 'events';
/**
 * @class
 */
export default class Manager extends EventEmitter {
    private sensor;
    /**
     * @constructor
     * @param port Serial interface path name
     * @param baudrate Serial communication speed
     */
    constructor(port: string, baudrate: number);
    /**
     *
     * @param message Mysensor parsed struct data
     */
    private processPresentation;
    private genrateNodeID;
}
