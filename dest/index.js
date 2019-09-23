"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_mysensor_1 = __importDefault(require("node-mysensor"));
const message_1 = require("node-mysensor/dest/libs/message");
const events_1 = __importDefault(require("events"));
/**
 * @class
 */
class Manager extends events_1.default {
    /**
     * @constructor
     * @param port Serial interface path name
     * @param baudrate Serial communication speed
     */
    constructor(port, baudrate) {
        super();
        node_mysensor_1.default.DEBUG = Manager.DEBUG;
        this.nodes = [];
        this.sensor = new node_mysensor_1.default(port, baudrate);
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
    nodesCount() { return this.nodes.length; }
    /**
     * @public
     * @function
     * @param id Target node id
     * @return MySensorNode
     */
    getNodeById(id) {
        return this.nodes.find(n => n.id === id);
    }
    /// PRIVATE FUNCTIONS
    /**
     *
     * @param message Mysensor parsed struct data
     */
    processPresentation(message) {
        const { type, nodeID, childID } = message;
        if (Manager.DEBUG)
            console.log(message);
        // Find node which id is equal nodeID
        const node = this.nodes.find((n) => n.id === nodeID);
        // If not found the node, create a new node
        if (!node) {
            const newNode = { id: nodeID, children: [], alive: true, life: Manager.MAX_LIFE };
            const newChild = { id: childID, type, value: 0 };
            newNode.children.push(newChild);
            this.nodes.push(newNode);
        }
        else {
            // Find the child
            const child = node.children.find(c => c.id === childID);
            // If not found child
            if (!child) {
                const newChild = { id: childID, type, value: 0 };
                node.children.push(newChild);
            }
        }
        // DEBUG
        if (Manager.DEBUG)
            console.log(this.nodes);
    }
    processInternal(message) {
        const { type } = message;
        switch (type) {
            // When node request NODE_ID
            case message_1.MysensorInterType.I_ID_REQUEST:
                this.interalRequestNodeID(message);
                break;
            case message_1.MysensorInterType.I_SKETCH_NAME:
                this.internalSketchName(message);
                break;
            case message_1.MysensorInterType.I_SKETCH_VERSION:
                this.internalSketchVersion(message);
                break;
        }
    }
    interalRequestNodeID(message) {
        if (Manager.DEBUG)
            console.log("Request Node ID", message);
        const { nodeID, childID } = message;
        this.sensor.send(nodeID, childID, message_1.MysensorCommand.internal, message_1.MysensorAck.NO, message_1.MysensorInterType.I_ID_RESPONSE, childID);
    }
    internalSketchName(message) {
        // Find the node with nodID
        const { nodeID, payload } = message;
        const node = this.nodes.find(n => n.id === nodeID);
        if (node) {
            node.sketchName = payload;
            if (Manager.DEBUG)
                console.log("Sketch Name", node);
        }
    }
    internalSketchVersion(message) {
        const { nodeID, payload } = message;
        const node = this.nodes.find(n => n.id === nodeID);
        if (node) {
            node.sketchVersion = payload;
            if (Manager.DEBUG)
                console.log("Sketch Version", node);
        }
    }
    /// EVENT SET PROCESS
    /**
     * @event update
     * @param message
     */
    processSet(message) {
        const { nodeID, childID, payload } = message;
        const node = this.nodes.find(n => n.id === nodeID);
        if (node) {
            const child = node.children.find(n => n.id === childID);
            if (child) {
                child.value = payload;
                child.stamptime = Date.now();
                // Emit 'update' with node
                this.emit('update', node, child, child.value);
                if (Manager.DEBUG)
                    console.log("SET", child);
            }
        }
    }
}
Manager.DEBUG = false;
Manager.MAX_LIFE = 60;
exports.default = Manager;
