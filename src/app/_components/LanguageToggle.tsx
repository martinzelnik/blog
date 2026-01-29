import './LanguageToggle.css';
import { useLanguage } from '@/app/_contexts/LanguageContext';

function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-toggle" role="group" aria-label="Language">
      <button
        type="button"
        className={language === 'en' ? 'active' : ''}
        onClick={() => setLanguage('en')}
        title="English"
        aria-label="English"
      >
        🇬🇧
      </button>
      <button
        type="button"
        className={language === 'cs' ? 'active' : ''}
        onClick={() => setLanguage('cs')}
        title="Czech"
        aria-label="Čeština"
      >
        🇨🇿
      </button>
    </div>
  );
}

export default LanguageToggle;
