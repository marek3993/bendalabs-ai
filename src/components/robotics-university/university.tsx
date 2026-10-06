'use client';

import Atlas from './components/atlas';
import {SupportForm} from './student-support';
import LessonFeedback from './lesson-feedback';
import './university.css';
import './integration.css';

export default function RoboticsUniversity({locale='sk'}:{locale?:'sk'|'en'}) {
  return <div id="robotics-university" className="robotics-university dark"><Atlas initialLang={locale} university renderSupport={lang=><SupportForm lang={lang}/>} renderLessonFeedback={(chapterId, lang) => <LessonFeedback key={chapterId} chapterId={chapterId} lang={lang}/>} /></div>;
}
