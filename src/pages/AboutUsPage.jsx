import { Link } from 'react-router-dom';
import './RestaurantInfoPage.css';

export default function AboutUsPage() {
  return (
    <main className="restaurant-info-page restaurant-about-page">
      <div className="restaurant-info-page-container">
        <div className="restaurant-page-kicker">Our story</div>
        <div className="restaurant-page-grid">
          <h1>Food that feels like home.</h1>
          <div>
            <p>
              Buenísimo brings the warmth of Venezuela to Dallas with handmade
              arepas, cachapas, patacones, and the flavors that bring people
              together around the table.
            </p>
            <p>
              Everything is prepared with care, fresh ingredients, and a love
              for sharing our culture one plate at a time.
            </p>
            <Link to="/menu" className="restaurant-page-link">
              Explore the menu <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
