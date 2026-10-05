import RoboticsUniversity from '@/components/robotics-university/university';
import {pageMetadata} from '@/lib/bendalabs/seo';

export const metadata=pageMetadata('/roboticka-univerzita','Robotická univerzita | BendaLabs','Nauč sa robotiku v slovenčine aj angličtine. Interaktívne kapitoly, 3D modely, programovanie, senzory, batérie a praktická dielňa buildera.');

export default function Page(){return <RoboticsUniversity locale="sk"/>;}
