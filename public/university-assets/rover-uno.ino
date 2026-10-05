// BendaLabs Robotics Atlas — Arduino Uno R3, TB6612FNG, HC-SR04
// 5 V logic. Motor supply: four matched AA NiMH cells through a fuse/switch.
// Test with wheels raised. Adjust the stopping threshold to measured braking distance.
const byte PWMA=5, PWMB=6, AIN1=7, AIN2=8, BIN1=9, BIN2=10;
const byte STBY=4, TRIG=12, ECHO=11;
const int SPEED=90, TURN_SPEED=75;
const unsigned long PING_MS=80, STALE_MS=160, TURN_MS=450;
float distanceCm=0;
unsigned long lastPing=0, lastValid=0, turnStarted=0;
bool valid=false, turning=false;

void stopMotors(){
  analogWrite(PWMA,0); analogWrite(PWMB,0);
  digitalWrite(STBY,LOW);
}
void motor(byte pwm,byte in1,byte in2,int speed){
  digitalWrite(in1,speed>0?HIGH:LOW);
  digitalWrite(in2,speed<0?HIGH:LOW);
  analogWrite(pwm,constrain(abs(speed),0,255));
}
void drive(int left,int right){
  motor(PWMA,AIN1,AIN2,left);motor(PWMB,BIN1,BIN2,right);
  digitalWrite(STBY,HIGH);
}
float measureDistance(){
  digitalWrite(TRIG,LOW);delayMicroseconds(2);
  digitalWrite(TRIG,HIGH);delayMicroseconds(10);digitalWrite(TRIG,LOW);
  const unsigned long us=pulseIn(ECHO,HIGH,25000UL);
  if(us==0)return -1;
  const float cm=us*.0343f/2;
  return (cm>=2 && cm<=400)?cm:-1;
}
void setup(){
  const byte outputs[]={PWMA,PWMB,AIN1,AIN2,BIN1,BIN2,STBY,TRIG};
  for(byte p:outputs){pinMode(p,OUTPUT);digitalWrite(p,LOW);}
  pinMode(ECHO,INPUT);stopMotors();Serial.begin(115200);
}
void loop(){
  unsigned long now=millis();
  if(now-lastPing>=PING_MS){
    lastPing=now;distanceCm=measureDistance();now=millis();
    valid=distanceCm>0;
    if(valid)lastValid=now;
    Serial.println(distanceCm);
  }
  if(!valid || now-lastValid>STALE_MS){
    stopMotors();turning=false;return;
  }
  if(turning){
    if(now-turnStarted<TURN_MS){drive(TURN_SPEED,-TURN_SPEED);return;}
    turning=false;stopMotors();valid=false;return;
  }
  if(distanceCm<25){
    stopMotors();turning=true;turnStarted=now;
  }else{drive(SPEED,SPEED);}
}
