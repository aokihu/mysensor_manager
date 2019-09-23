import { MysensorDeviceType } from "node-mysensor/src/libs/message";
/**
 * @interface
 * @description Node defined
 */
export interface MySensorNode {
    id: number;
    sketchName?: string;
    sketchVersion?: string;
    children: MySensorNodeChild[];
    alive: boolean;
    life: number;
}
export interface MySensorNodeChild {
    id: number;
    type?: MysensorDeviceType;
    value?: any;
    stamptime?: number;
}
