import { MysensorDeviceType } from "node-mysensor/src/libs/message";

/**
 * @interface
 * @description Node defined
 */
export interface MySensorNode {
  id: number; // for node id
  children: MySensorNodeChild[]; // for node's children
}

export interface MySensorNodeChild {
  id: number; // for child id
  type: MysensorDeviceType // Child type
}
