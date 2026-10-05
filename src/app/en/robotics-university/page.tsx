import RoboticsUniversity from '@/components/robotics-university/university';
import {pageMetadata} from '@/lib/bendalabs/seo';

export const metadata=pageMetadata('/en/robotics-university','Robotics University | BendaLabs','Learn robotics in English and Slovak. Interactive lessons, 3D models, programming, sensors, batteries and practical robot-building guides.');

export default function Page(){return <RoboticsUniversity locale="en"/>;}
