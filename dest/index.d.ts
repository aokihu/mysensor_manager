/// <reference types="node" />
import EventEmitter from 'events';
import { MySensorNode } from './type';
/**
 * @class
 */
export default class Manager extends EventEmitter {
    static DEBUG: boolean;
    static MAX_LIFE: number;
    private sensor;
    private nodes;
    /**
     * @constructor
     * @param port Serial interface path name
     * @param baudrate Serial communication speed
     */
    constructor(port: string, baudrate: number);
    /**
     * @public
     * @function
     * @return all nodes count
     * @description Get node with node'id
     */
    nodesCount(): number;
    /**
     * @public
     * @function
     * @param id Target node id
     * @return MySensorNode
     */
    getNodeById(id: number): MySensorNode | undefined;
    /**
     *
     * @param message Mysensor parsed struct data
     */
    private processPresentation;
    private processInternal;
    private interalRequestNodeID;
    private internalSketchName;
    private internalSketchVersion;
    /**
     * @event update
     * @param message
     */
    private processSet;
}
