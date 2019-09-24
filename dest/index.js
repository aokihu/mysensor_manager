"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_mysensor_1 = __importDefault(require("node-mysensor"));
const message_1 = require("node-mysensor/dest/libs/message");
const events_1 = __importDefault(require("events"));
const table_1 = require("table");
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
    sendDiscoverRequest(nodeID) {
        this.sensor.send(nodeID, 255, message_1.MysensorCommand.internal, message_1.MysensorAck.NO, message_1.MysensorInterType.I_DISCOVER_REQUEST, '');
    }
    /**
     * Send 'set' command to target node's child
     * @param nodeID Target node id
     * @param childID Target node's child id
     * @param type Send data type
     * @param value New value
     */
    setNodeChild(nodeID, childID, type = 24, value) {
        this.sensor.send(nodeID, childID, message_1.MysensorCommand.set, message_1.MysensorAck.NO, type, // Now it is set '24' Custom Value for any device
        value);
    }
    /// PRIVATE FUNCTIONS
    lifeCycle() {
        this.nodes.forEach(n => {
            if (n.id === 0)
                return false; // For special gateway node, which id is 0
            if (n.life === 0) {
                n.alive = false;
                this.emit('offline', n);
                return false;
            }
            n.life -= 1;
        });
        if (Manager.FORMAT_DEBUG)
            this.formatOutput();
    }
    /**
     *
     * @param message Mysensor parsed struct data
     */
    processPresentation(message) {
        const { type, nodeID, childID, payload } = message;
        if (Manager.DEBUG)
            console.log(message);
        // Find node which id is equal nodeID
        const node = this.nodes.find((n) => n.id === nodeID);
        // If not found the node, create a new node
        if (!node) {
            const newNode = { id: nodeID, children: [], alive: true, life: Manager.MAX_LIFE, battery: 100 };
            const newChild = { id: childID, type, value: 0, description: payload };
            newNode.children.push(newChild);
            this.nodes.push(newNode);
        }
        else {
            // Find the child
            const child = node.children.find(c => c.id === childID);
            // If not found child
            if (!child) {
                const newChild = { id: childID, type, value: 0, description: payload };
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
            case message_1.MysensorInterType.I_HEARTBEAT_RESPONSE:
                this.internalHeartbeatResponse(message);
                break;
        }
    }
    interalRequestNodeID(message) {
        if (Manager.DEBUG)
            console.log("Request Node ID", message);
        const { nodeID, childID } = message;
        // Checkt nodeID is not used
        const idx = this.nodes.findIndex(n => n.id === childID);
        // Exit when any node used the same id
        if (idx > -1)
            return false;
        // Send new nodeID to target node
        this.sensor.send(nodeID, childID, message_1.MysensorCommand.internal, message_1.MysensorAck.NO, message_1.MysensorInterType.I_ID_RESPONSE, childID);
    }
    internalHeartbeatRequest(message) {
        const { nodeID, payload, ack } = message;
        const node = this.getNodeById(nodeID);
        if (node) {
            node.life = 60;
            node.alive = true;
            if (Manager.DEBUG)
                console.log("Heartbeat Request", node);
            if (ack === message_1.MysensorAck.YES) {
                this.sensor.send(nodeID, 255, message_1.MysensorCommand.internal, message_1.MysensorAck.YES, message_1.MysensorInterType.I_HEARTBEAT_RESPONSE, '');
            }
        }
    }
    internalSketchName(message) {
        // Find the node with nodID
        const { nodeID, payload } = message;
        const node = this.getNodeById(nodeID);
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
    internalHeartbeatResponse(message) {
        const { nodeID } = message;
        const node = this.getNodeById(nodeID);
        if (node) {
            node.life = 60;
            node.alive = true;
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
                child.value = this.analysisedPayload(payload);
                child.stamptime = Date.now();
                // Emit 'update' with node
                this.emit('update', node, child, child.value);
                if (Manager.DEBUG)
                    console.log("SET", child);
            }
        }
        else {
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
    analysisedPayload(data) {
        if (/^\D+$/.test(data)) {
            return data;
        }
        else {
            return Number(data);
        }
    }
    formatOutput() {
        const output = [];
        output.push(['NodeID', 'ChildID', "Alive", "Life", "Sketch Name", "Sketch Version", "Description", "TYPE", "VALUE"]);
        this.nodes.forEach((n) => {
            const { id: nodeID, children, alive, life, sketchName, sketchVersion } = n;
            children.forEach((c) => {
                const { id: childID, value, type, description } = c;
                output.push([nodeID, childID, alive, life, sketchName, sketchVersion, description, type, value]);
            });
        });
        const str = table_1.table(output);
        console.log(str);
    }
}
exports.default = Manager;
Manager.DEBUG = false;
Manager.FORMAT_DEBUG = false;
Manager.MAX_LIFE = 60;
Manager.CYCLE_LIFE = 1000; // Reduce life cycle, unit is ms
