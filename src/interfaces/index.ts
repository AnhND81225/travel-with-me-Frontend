export * from './gear.interface';
export * from './outpost.interface';
export * from './expedition.interface';
export * from './custody.interface';
export * from './fleet.interface';
export * from './cart.interface';

export type UserRole = 'climber' | 'ranger';
export type ScreenId = 
  | 'catalog' 
  | 'expeditions' 
  | 'custody' 
  | 'outposts' 
  | 'fleet' 
  | 'passport';
