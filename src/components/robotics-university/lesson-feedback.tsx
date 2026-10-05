'use client';

import {useEffect, useRef, useState, type FormEvent} from 'react';
import {CheckCircle2, MessageSquare, Star} from 'lucide-react';

type FeedbackState = {
  rating: number | null;
  suggestion: string;
  submissionId: string;
  sent: boolean;
};

export default function LessonFeedback({chapterId, lang}: {chapterId: string; lang: 'sk' | 'en'}) {
  const t = (sk: string, en: string) => lang === 'sk' ? sk : en;
  const storageKey = `university-feedback:${chapterId}`;
  const [draft, setDraft] = useState<FeedbackState>({rating: null, suggestion: '', submissionId: '', sent: false});
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<'invalid' | 'rate_limited' | 'unavailable' | null>(null);
  const [website, setWebsite] = useState('');
  const sendingRef = useRef(false);

  useEffect(() => {
    let next: FeedbackState = {rating: null, suggestion: '', submissionId: crypto.randomUUID(), sent: false};
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
      if (saved && typeof saved === 'object') {
        next = {
          rating: Number.isInteger(saved.rating) && saved.rating >= 1 && saved.rating <= 5 ? saved.rating : null,
          suggestion: typeof saved.suggestion === 'string' ? saved.suggestion.slice(0, 2000) : '',
          submissionId: typeof saved.submissionId === 'string' && /^[0-9a-f-]{36}$/i.test(saved.submissionId) ? saved.submissionId : next.submissionId,
          sent: saved.sent === true,
        };
      }
    } catch {}
    setDraft(next);
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (ready) {
      try { localStorage.setItem(storageKey, JSON.stringify(draft)); } catch {}
    }
  }, [draft, ready, storageKey]);

  function change(next: Partial<FeedbackState>) {
    setDraft(current => ({...current, ...next, submissionId: crypto.randomUUID()}));
    setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || sendingRef.current || draft.sent) return;
    const suggestion = draft.suggestion.trim();
    if ((!draft.rating && suggestion.length < 10) || (suggestion.length > 0 && suggestion.length < 10)) {
      setError('invalid');
      return;
    }
    sendingRef.current = true;
    setSending(true);
    setError(null);
    try {
      const response = await fetch('/api/university-feedback', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({chapterId, lang, rating: draft.rating, suggestion, submissionId: draft.submissionId, website}),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        setError(result.error === 'rate_limited' ? 'rate_limited' : result.error === 'invalid' ? 'invalid' : 'unavailable');
        return;
      }
      setDraft(current => ({...current, suggestion: '', sent: true}));
    } catch {
      setError('unavailable');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  const labels = lang === 'sk'
    ? ['Málo užitočná', 'Skôr neužitočná', 'Čiastočne užitočná', 'Užitočná', 'Veľmi užitočná']
    : ['Not useful', 'Slightly useful', 'Somewhat useful', 'Useful', 'Very useful'];

  return <section className="lesson-feedback" aria-labelledby={`feedback-heading-${chapterId}`}>
    <div className="feedback-heading">
      <MessageSquare size={23} aria-hidden="true"/>
      <div><h2 id={`feedback-heading-${chapterId}`}>{t('Pomôž nám zlepšiť túto lekciu', 'Help us improve this lesson')}</h2>
        <p>{t('Univerzitu rozvíjame aj podľa vašich postrehov. Čo ti pomohlo a čo môžeme vysvetliť lepšie?', 'Your feedback helps us improve the university. What helped you, and what could we explain better?')}</p></div>
    </div>
    {draft.sent ? <div className="feedback-success" role="status"><CheckCircle2 size={22} aria-hidden="true"/><div><strong>{t('Ďakujeme, tvoju spätnú väzbu sme prijali.', 'Thank you. We received your feedback.')}</strong><p>{t('Pomôže nám pri ďalších úpravách tejto lekcie.', 'It will help us improve this lesson.')}</p></div></div> :
      <form onSubmit={submit}>
        <fieldset disabled={sending || !ready}>
          <legend>{t('Ako užitočná bola táto lekcia?', 'How useful was this lesson?')}</legend>
          <div className="feedback-rating">
            {[1, 2, 3, 4, 5].map(value => <label key={value} className={draft.rating !== null && value <= draft.rating ? 'is-selected' : ''}>
              <input type="radio" name={`rating-${chapterId}`} value={value} checked={draft.rating === value} onChange={() => change({rating: value})}/>
              <Star size={23} aria-hidden="true"/>
              <span className="feedback-visually-hidden">{value} {t('z', 'of')} 5 — {labels[value - 1]}</span>
            </label>)}
            {draft.rating !== null && <button type="button" className="text-button" onClick={() => change({rating: null})}>{t('Zrušiť hodnotenie', 'Clear rating')}</button>}
          </div>
          <p className="feedback-scale" aria-live="polite">{draft.rating ? `${draft.rating}/5 · ${labels[draft.rating - 1]}` : t('1 = málo užitočná · 5 = veľmi užitočná', '1 = not useful · 5 = very useful')}</p>
          <label className="feedback-label" htmlFor={`suggestion-${chapterId}`}>{t('Čo bolo nejasné alebo čo by si zmenil?', 'What was unclear or what would you change?')} <span>{t('(voliteľné)', '(optional)')}</span></label>
          <textarea id={`suggestion-${chapterId}`} value={draft.suggestion} onChange={event => change({suggestion: event.target.value})} maxLength={2000} rows={3} aria-describedby={`feedback-privacy-${chapterId}`} placeholder={t('Napríklad: pomohol by mi príklad zapojenia senzora…', 'For example: a sensor wiring example would help…')}/>
          <div className="feedback-field-meta"><span>{t('Môžeš poslať aj samotný návrh, aspoň 10 znakov.', 'You can also send a suggestion without a rating, at least 10 characters.')}</span><span>{draft.suggestion.length}/2000</span></div>
          <div className="feedback-honeypot" aria-hidden="true"><label>Website<input name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)}/></label></div>
          <p className="feedback-privacy" id={`feedback-privacy-${chapterId}`}>{t('Bez mena a e-mailu. Spätnú väzbu vidí iba tím BendaLabs, nezverejňujeme ju. Neuvádzaj osobné údaje.', 'No name or email required. Only the BendaLabs team sees your feedback; it is not published. Please do not include personal information.')}</p>
          <button className="button primary" type="submit" disabled={sending || !ready || (!draft.rating && !draft.suggestion.trim())}>{sending ? t('Odosielam…', 'Sending…') : t('Odoslať spätnú väzbu', 'Send feedback')}</button>
        </fieldset>
        {error && <p className="feedback-error" role="alert">{error === 'invalid' ? t('Vyber hodnotenie alebo napíš návrh s aspoň 10 znakmi.', 'Choose a rating or write a suggestion with at least 10 characters.') : error === 'rate_limited' ? t('Odoslal si viac príspevkov za krátky čas. Skús to prosím neskôr; tvoj text zostáva zachovaný.', 'You have sent several submissions recently. Please try later; your text is still here.') : t('Spätnú väzbu sa nepodarilo uložiť. Tvoj text zostal zachovaný — skús odoslanie znova.', 'Your feedback could not be saved. Your text is still here — please try sending again.')}</p>}
      </form>}
  </section>;
}
