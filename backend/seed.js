const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  try {
    console.log('Seeding data...');

    // Destinations
    const destinations = [
      { name: 'Accra', slug: 'accra', region: 'Greater Accra', description: 'The vibrant capital city of Ghana.', short_description: 'Capital City', image: 'https://images.unsplash.com/photo-1591129841117-3adfd313e34f?auto=format&fit=crop&q=80', featured: true },
      { name: 'Kumasi', slug: 'kumasi', region: 'Ashanti', description: 'The garden city and heart of Ashanti culture.', short_description: 'Cultural Hub', image: 'https://images.unsplash.com/photo-1620668051772-51982b137c3a?auto=format&fit=crop&q=80', featured: true },
      { name: 'Cape Coast', slug: 'cape-coast', region: 'Central', description: 'Historic coastal city known for its castles.', short_description: 'Historic Coast', image: 'https://images.unsplash.com/photo-1591129841117-3adfd313e34f?auto=format&fit=crop&q=80', featured: true },
    ];

    for (const d of destinations) {
      await pool.query(
        'INSERT INTO destinations (name, slug, region, description, short_description, image, featured) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (slug) DO NOTHING',
        [d.name, d.slug, d.region, d.description, d.short_description, d.image, d.featured]
      );
    }

    // Get Accra ID
    const accraRes = await pool.query("SELECT id FROM destinations WHERE slug = 'accra'");
    const accraId = accraRes.rows[0]?.id;

    if (accraId) {
      // Attractions
      const attractions = [
        { name: 'Kwame Nkrumah Memorial Park', description: 'Memorial park dedicated to Ghana\'s first president.', location: 'Accra', image: 'https://images.unsplash.com/photo-1591129841117-3adfd313e34f?auto=format&fit=crop&q=80', category: 'History', entry_fee: 20 },
        { name: 'Independence Square', description: 'Large public square and home to many national festivals.', location: 'Accra', image: 'https://images.unsplash.com/photo-1591129841117-3adfd313e34f?auto=format&fit=crop&q=80', category: 'Landmark', entry_fee: 0 },
      ];

      for (const a of attractions) {
        await pool.query(
          'INSERT INTO attractions (name, description, location, destination_id, image, category, entry_fee) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [a.name, a.description, a.location, accraId, a.image, a.category, a.entry_fee]
        );
      }
    }

    console.log('Seeding completed successfully!');
    await pool.end();
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seed();
