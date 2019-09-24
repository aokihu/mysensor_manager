import { MysensorDeviceType } from "node-mysensor/src/libs/message";

/**
 * @interface
 * @description Node defined
 */
export interface MySensorNode {
  id: number; // for node id
  sketchName?: string; // Sketch name
  sketchVersion?: string; // Sketch version
  children: MySensorNodeChild[]; // for node's children
  alive: boolean; // node is alive
  life: number;
  battery: number; // Battery level
}

export interface MySensorNodeChild {
  id: number; // for child id
  type?: MysensorDeviceType; // Child type
  description?: string; // Child description
  value?: any; // child's value
  stamptime?: number; // update data timestamp
}
