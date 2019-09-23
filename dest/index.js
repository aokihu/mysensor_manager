"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_mysensor_1 = __importDefault(require("node-mysensor"));
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
        this.sensor = new node_mysensor_1.default(port, baudrate);
        this.sensor.on('presentation', this.processPresentation.bind(this));
    }
    /**
     *
     * @param message Mysensor parsed struct data
     */
    processPresentation(message) {
        console.log(message);
    }
    genrateNodeID() { }
}
exports.default = Manager;
