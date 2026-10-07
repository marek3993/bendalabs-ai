export type MotorCommand = -1 | 0 | 1;
export type MotorCircuit = { power: boolean; ground: boolean; command: MotorCommand; forward: boolean; reverse: boolean; complete: boolean };
export type CircuitAction = { type: 'command'; value: MotorCommand } | { type: 'power' | 'ground' };
export function initialCircuit(independent: boolean): MotorCircuit {
  return { power: !independent, ground: !independent, command: 0, forward: false, reverse: false, complete: false };
}
export function motorOutput(state: MotorCircuit): MotorCommand | null {
  if (!state.power) return 0;
  if (!state.ground) return null;
  return state.command;
}
export function circuitStep(state: MotorCircuit, action: CircuitAction, independent: boolean): MotorCircuit {
  if (state.complete) return state;
  if (action.type !== 'command') {
    if (state.command !== 0) return state;
    return { ...state, [action.type]: !state[action.type], forward: false, reverse: false };
  }
  const next = { ...state, command: action.value };
  const output = motorOutput(next);
  next.forward ||= output === 1;
  next.reverse ||= output === -1;
  next.complete = state.command !== 0 && action.value === 0 && next.power && next.ground && next.forward && (!independent || next.reverse);
  return next;
}
