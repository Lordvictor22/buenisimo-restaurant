import { Link } from 'react-router-dom';
import './RestaurantInfoPage.css';

const galleryItems = [
  { label: 'Restaurant interior', image: '' },
  { label: 'Our dining room', image: '' },
  { label: 'A table at Buenísimo', image: '' },
  { label: 'The Buenísimo team', image: '' },
];

export default function GalleryPage() {
  return (
    <main className="restaurant-info-page restaurant-gallery-page">
      <div className="restaurant-info-page-container">
        <div className="restaurant-page-heading">
          <div>
            <div className="restaurant-page-kicker">Inside Buenísimo</div>
            <h1>Come sit with us.</h1>
          </div>
          <p>Moments, people, and the place behind every plate.</p>
        </div>

        <div className="restaurant-page-gallery-grid">
          {galleryItems.map((item) => (
            <div
              className={`restaurant-page-gallery-slot${item.image ? ' has-image' : ''}`}
              key={item.label}
              style={item.image ? { backgroundImage: `url(${item.image})` } : undefined}
            >
              {!item.image && <span>Photo coming soon</span>}
              <strong>{item.label}</strong>
            </div>
          ))}
        </div>

        <Link to="/" className="restaurant-page-link gallery-back-link">
          Back to home <span>→</span>
        </Link>
      </div>
    </main>
  );
}
