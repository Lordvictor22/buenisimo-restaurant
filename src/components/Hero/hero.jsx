import { useContext, useState } from 'react';

import {
  FiGlobe,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

import {
  FaInstagram,
  FaFacebookF,
  FaTiktok
} from 'react-icons/fa';

import { LanguageContext } from '../../context/LanguageContext';
import "./hero.css";

function Hero() {
  const { language, setLanguage, t } = useContext(LanguageContext);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [activeFood, setActiveFood] = useState(0);

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

  const foodHighlights = [
    {
      image:
        'https://res.cloudinary.com/jh1tbkho/image/upload/v1789133357/FotoAREPASAJUSTADAS.jpg',
      name: t.hero.food1Name || 'Arepas',
      description:
        t.hero.food1Description ||
        'Authentic Venezuelan arepas',
      price: t.hero.featured || 'Featured',
    },
    {
      image: 'https://res.cloudinary.com/jh1tbkho/image/upload/v1789140102/Cachapa.jpg',
      name: t.hero.food2Name || 'Cachapa',
      description:
        t.hero.food2Description ||
        'Traditional Venezuelan corn pancake',
      price: t.hero.featured || 'Featured',
    },
    {
      image: 'https://res.cloudinary.com/jh1tbkho/image/upload/v1789140102/Patacon.webp',
      name: t.hero.food3Name || 'Patacón',
      description:
        t.hero.food3Description ||
        'Crispy plantain with delicious toppings',
      price: t.hero.featured || 'Featured',
    },
    {
      image: 'https://res.cloudinary.com/jh1tbkho/image/upload/v1789140102/Teque%C3%B1os.jpg',
      name: t.hero.food4Name || 'Tequeños',
      description:
        t.hero.food4Description ||
        'Crispy Venezuelan cheese sticks',
      price: t.hero.featured || 'Featured',
    },
    {
      image: 'https://res.cloudinary.com/jh1tbkho/image/upload/v1789140290/pabellon.avif',
      name: t.hero.food5Name || 'Venezuelan Favorites',
      description:
        t.hero.food5Description ||
        'Authentic flavors made with tradition',
      price: t.hero.featured || 'Featured',
    },
  ];

  const handleLanguageChange = (selectedLanguage) => {
    setLanguage(selectedLanguage.code);
    setLanguageOpen(false);
  };

  const nextFood = () => {
    setActiveFood((current) =>
      current === foodHighlights.length - 1 ? 0 : current + 1
    );
  };

  const previousFood = () => {
    setActiveFood((current) =>
      current === 0 ? foodHighlights.length - 1 : current - 1
    );
  };

  const currentFood = foodHighlights[activeFood];

  return (
    <section className="hero" id="home">

      <div className="hero-overlay"></div>

      <div className="hero-decoration"></div>

      <div className="hero-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="hero-top">

          <a href="/" className="hero-brand">
            <img
              src="/src/assets/images/LogoBuenisimo123.png"
              alt="Buenísimo Restaurant"
            />
          </a>

          <nav className="hero-nav">
            <a href="/">{t.nav.home}</a>
            <a href="/menu">{t.nav.menu}</a>
            <a href="#about">{t.nav.about}</a>
            <a href="#gallery">{t.nav.gallery}</a>
          </nav>

          <div className="hero-header-actions">

            <div className="hero-language-selector">

              <button
                type="button"
                className="hero-language-button"
                onClick={() => setLanguageOpen(!languageOpen)}
                aria-label={t.hero.selectLanguage || 'Select language'}
                aria-expanded={languageOpen}
              >
                <FiGlobe size={15} />

                <span>{language}</span>

                <FiChevronDown
                  size={13}
                  className={
                    languageOpen
                      ? 'hero-language-arrow open'
                      : 'hero-language-arrow'
                  }
                />
              </button>

              {languageOpen && (
                <div className="hero-language-dropdown">

                  {languages.map((item) => (
                    <button
                      type="button"
                      key={item.code}
                      className={
                        language === item.code
                          ? 'hero-language-option active'
                          : 'hero-language-option'
                      }
                      onClick={() => handleLanguageChange(item)}
                    >
                      <span className="hero-language-flag">
                        {item.flag}
                      </span>

                      <span>{item.name}</span>

                      <small>{item.code}</small>
                    </button>
                  ))}

                </div>
              )}

            </div>

            <a
              href="/menu"
              className="hero-header-order"
            >
              {t.nav.order}
            </a>

          </div>

        </header>


        {/* =================================================
            HERO CONTENT
        ================================================= */}

        <div className="hero-body">

          <div className="hero-copy">

            <span className="hero-eyebrow">
              {t.hero.eyebrow}
            </span>

            <h1>
              {t.hero.titleLine1}
              <br />
              <span>{t.hero.titleHighlight}</span>
              <br />
              <em>{t.hero.titleLine2}</em>
            </h1>

            <p className="hero-description">
              {t.hero.description}
            </p>

            <div className="hero-buttons">

              <a
                href="/menu"
                className="hero-button hero-button-primary"
              >
                {t.hero.orderOnline}
                <span>→</span>
              </a>

              <a
                href="/menu"
                className="hero-button hero-button-secondary"
              >
                {t.hero.viewMenu}
              </a>

            </div>

          </div>


          {/* =================================================
              FOOD CAROUSEL
          ================================================= */}

          <div className="hero-visual">

            <div className="hero-image-frame">

              <div
                className="hero-food-slider"
                style={{
                  transform: `translateX(-${activeFood * 100}%)`,
                  overflow: 'visible'
                }}
              >

                {foodHighlights.map((food, index) => (
                  <div
                    className="hero-food-slide"
                    key={index}
                  >

                    {food.image ? (
                      <div
                        className="hero-food-slide-image"
                        style={{
                          backgroundImage: `linear-gradient(145deg, rgba(28, 17, 10, 0.12), rgba(0, 0, 0, 0.42)), url("${food.image}")`
                        }}
                      />
                    ) : (
                      <div className="hero-food-empty">
                        <span>{t.hero.photo || 'PHOTO'}</span>
                        <small>{t.hero.comingSoon || 'Coming soon'}</small>
                      </div>
                    )}

                  </div>
                ))}

              </div>


              {/* ARROWS */}

              <button
                type="button"
                className="hero-food-arrow hero-food-arrow-left"
                onClick={previousFood}
                aria-label={t.hero.previousDish || 'Previous featured dish'}
              >
                <FiChevronLeft />
              </button>

              <button
                type="button"
                className="hero-food-arrow hero-food-arrow-right"
                onClick={nextFood}
                aria-label={t.hero.nextDish || 'Next featured dish'}
              >
                <FiChevronRight />
              </button>


              <div className="hero-image-accent"></div>

            </div>


            {/* =================================================
                FOOD INFORMATION
            ================================================= */}

            <div className="hero-food-info">

              <div
                key={activeFood}
                className="hero-food-text hero-food-text-animated"
              >

                <span className="hero-food-kicker">
                  {t.hero.featuredDish || 'FEATURED DISH'}
                </span>

                <div className="hero-food-title-row">
                  <h2>
                    {currentFood.name}
                  </h2>

                  <div className="hero-food-price">
                    {currentFood.price}
                  </div>
                </div>

                <p>
                  {currentFood.description}
                </p>

              </div>

            </div>


            {/* =================================================
                CAROUSEL NAVIGATION
            ================================================= */}

            <div className="hero-visual-label">

              <div className="hero-food-counter">

                <span>
                  {String(activeFood + 1).padStart(2, '0')}
                </span>

                <span className="hero-food-counter-line"></span>

                <span>
                  {String(foodHighlights.length).padStart(2, '0')}
                </span>

              </div>


              <div className="hero-food-dots">

                {foodHighlights.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={
                      index === activeFood
                        ? 'hero-food-dot active'
                        : 'hero-food-dot'
                    }
                    onClick={() => setActiveFood(index)}
                    aria-label={`Show featured dish ${index + 1}`}
                  />
                ))}

              </div>


              <span>
                {t.hero.authentic || 'AUTHENTIC · VENEZUELAN · DALLAS'}
              </span>

            </div>

          </div>

        </div>


        {/* =================================================
            INFORMATION FOOTER
        ================================================= */}

        <div className="hero-bottom">

          {/* ADDRESS */}

          <a
            href="https://www.google.com/maps/search/?api=1&query=3355+E+Trinity+Mills+Rd+Apt+211+Dallas+TX+75287"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-location"
          >
            <span className="hero-bottom-label">
              {t.hero.visitUs || 'VISIT US'}
            </span>

            <span className="hero-location-address">
              3355 E Trinity Mls Rd Apt 211
            </span>

            <span className="hero-location-city">
              Dallas, TX 75287
            </span>
          </a>


          {/* SOCIALS */}

          <div className="hero-social">

            <span className="hero-bottom-label">
              {t.hero.followUs || 'FOLLOW US'}
            </span>

            <div className="hero-social-links">

              <a
                href="https://www.instagram.com/buenisimorestaurant/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>

              <a
                href="https://www.facebook.com/p/Buen%C3%ADsimo-Restaurant-61586829882157/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <FaFacebookF />
              </a>

              <a
                href="https://www.tiktok.com/@buenisimorestaurant"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
              >
                <FaTiktok />
              </a>

            </div>

          </div>


          {/* WHATSAPP */}

          <a
            href="https://wa.me/19726322915"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-phone"
          >
            <span className="hero-bottom-label">
              {t.hero.contactUs || 'CONTACT US'}
            </span>

            <span className="hero-phone-number">
              💬 {t.hero.whatsAppUs || 'WhatsApp us'}
            </span>
          </a>

        </div>

      </div>

    </section>
  );
}

export default Hero;