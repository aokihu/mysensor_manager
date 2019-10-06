/// <reference types="node" />
import EventEmitter from 'events';
import { MySensorNode } from './type';
/**
 * @class
 */
export default class Manager extends EventEmitter {
    static DEBUG: boolean;
    static FORMAT_DEBUG: boolean;
    static MAX_LIFE: number;
    static CYCLE_LIFE: number;
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
     * @public
     * @function
     * @param nodeID Target node's id
     * @description Send discover signal to target node,
     *              the target node should send presentation to gateway
     */
    sendDiscoverRequest(nodeID: number): void;
    /**
     * Send 'set' command to target node's child
     * @param nodeID Target node id
     * @param childID Target node's child id
     * @param type Send data type
     * @param value New value
     */
    setNodeChild(nodeID: number, childID: number, type: number | undefined, value: number | string): void;
    /**
     * @public
     * @function
     * @param nodeID Target node's id
     * @description Send reboot command to target node
     */
    rebootNode(nodeID: number): void;
    private lifeCycle;
    /**
     *
     * @param message Mysensor parsed struct data
     */
    private processPresentation;
    private processInternal;
    private interalRequestNodeID;
    private internalHeartbeatRequest;
    private internalSketchName;
    private internalSketchVersion;
    private internalHeartbeatResponse;
    /**
     * @event update
     * @param message
     */
    private processSet;
    /**
     * @private
     * @function
     * @param data Payload data
     * @description analysis payload data then tranfrom the payload data type
     */
    private analysisedPayload;
    private formatOutput;
}
