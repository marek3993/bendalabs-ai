export const landingLimit = 0.8;
export const flightCeiling = 12;
export type FlightPhase = 'ready' | 'flying' | 'paused' | 'landed' | 'hard' | 'ceiling' | 'timeout';
export type Flight = {height:number; velocity:number; thrust:number; elapsed:number; impact:number|null; phase:FlightPhase};
export const balanceThrottle = (mass:number) => 100*Math.sqrt(mass*9.81/20);
export const createFlight = (mass:number):Flight => ({height:6,velocity:0,thrust:mass*9.81,elapsed:0,impact:null,phase:'ready'});

/** Vertical motion only. Fixed substeps and motor lag keep results independent of render rate. */
export function advanceFlight(flight:Flight, throttle:number, mass:number, seconds:number):Flight {
  if(flight.phase!=='flying'||!Number.isFinite(throttle)||!Number.isFinite(mass)||mass<=0||!Number.isFinite(seconds)||seconds<=0)return flight;
  let s={...flight};
  const duration=Math.min(seconds,.1),steps=Math.ceil(duration*120),dt=duration/steps;
  const target=20*(Math.min(100,Math.max(0,throttle))/100)**2;
  for(let i=0;i<steps;i++){
    const thrust=s.thrust+(target-s.thrust)*(1-Math.exp(-dt/.16));
    const acceleration=thrust/mass-9.81;
    const height=s.height+s.velocity*dt+.5*acceleration*dt*dt;
    const velocity=s.velocity+acceleration*dt;
    if(height<=0){
      // Locate first ground contact rather than scoring the stationary state after impact.
      let low=0,high=dt;
      for(let j=0;j<24;j++){const mid=(low+high)/2;if(s.height+s.velocity*mid+.5*acceleration*mid*mid>0)low=mid;else high=mid;}
      const impact=Math.abs(s.velocity+acceleration*high);
      return {...s,height:0,velocity:0,thrust:0,impact,elapsed:s.elapsed+high,phase:impact<=landingLimit?'landed':'hard'};
    }
    s={...s,height,velocity,thrust,elapsed:s.elapsed+dt};
    if(height>=flightCeiling)return {...s,height:flightCeiling,phase:'ceiling'};
    if(s.elapsed>=60)return {...s,phase:'timeout'};
  }
  return s;
}
