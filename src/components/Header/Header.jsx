import { useState, useContext } from 'react';
import { FiGlobe, FiChevronDown } from 'react-icons/fi';
import { LanguageContext } from '../../context/LanguageContext';
import './Header.css';

function Header() {
  const [languageOpen, setLanguageOpen] = useState(false);

  // Pega o idioma global
  const { language, setLanguage, t } = useContext(LanguageContext);

  const languages = [
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'ES', name: 'Español', flag: '🇪🇸' },
    { code: 'PT', name: 'Português', flag: '🇧🇷' },
    { code: 'FR', name: 'Français', flag: '🇫🇷' },
    { code: 'IT', name: 'Italiano', flag: '🇮🇹' },
    { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'VI', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'ZH', name: '中文', flag: '🇨🇳' },
    { code: 'HI', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'TE', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'AR', name: 'العربية', flag: '🇸🇦' },
    { code: 'UR', name: 'اردو', flag: '🇵🇰' },
  ];

  const handleLanguageChange = (selectedLanguage) => {
    setLanguage(selectedLanguage.code);
    setLanguageOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">

        {/* LOGO */}
        <a href="/" className="header-logo">
          <div className="header-logo-wrapper">
            <img
              src="/src/assets/images/BuenisimoLOGO.png"
              alt="Buenisimo"
            />

            <span>RESTAURANT</span>
          </div>
        </a>

        {/* NAVIGATION */}
        <nav className="header-nav">
          <a href="/">{t.nav.home}</a>
          <a href="/menu">{t.nav.menu}</a>
          <a href="/about">{t.nav.about}</a>
          <a href="/gallery">{t.nav.gallery}</a>
          <a href="#location">{t.nav.location}</a>
        </nav>

        {/* ACTIONS */}
        <div className="header-actions">

          {/* LANGUAGE SELECTOR */}
          <div className="language-selector">

            <button
              className="language-button"
              onClick={() => setLanguageOpen(!languageOpen)}
              aria-label="Select language"
              aria-expanded={languageOpen}
            >
              <FiGlobe size={16} />

              <span>{language}</span>

              <FiChevronDown
                size={14}
                className={
                  languageOpen
                    ? 'language-arrow open'
                    : 'language-arrow'
                }
              />
            </button>

            {/* LANGUAGE DROPDOWN */}
            {languageOpen && (
              <div className="language-dropdown">

                {languages.map((item) => (
                  <button
                    key={item.code}
                    className={
                      language === item.code
                        ? 'language-option active'
                        : 'language-option'
                    }
                    onClick={() => handleLanguageChange(item)}
                  >
                    <span className="language-flag">
                      {item.flag}
                    </span>

                    <span>
                      {item.name}
                    </span>

                    <small>
                      {item.code}
                    </small>
                  </button>
                ))}

              </div>
            )}

          </div>

          {/* ORDER BUTTON */}
          <a href="/menu" className="header-order">
            {t.nav.order}
          </a>

        </div>

      </div>
    </header>
  );
}

export default Header;