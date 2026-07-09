import './config/env.js'; // must come first — everything below reads process.env
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import MenuItem from './models/MenuItem.js';
import Admin from './models/Admin.js';

// Photos live in client/public/dishes and are served from the same origin.
// The folder must not be named after a page route (/menu), or express.static
// would 301-redirect that route to the directory listing instead of the SPA.
const img = (slug) => `/dishes/${slug}.jpg`;

const MENU = [
  // Entrées
  { name: "Soupe à l'Oignon Gratinée", description: 'Onions caramelised for three hours in beef stock, capped with a toasted crouton and bubbling Gruyère.', price: 9.5, category: 'Entrées', image: img('soupe-a-l-oignon'), isPopular: true, prepTimeMins: 15, allergens: ['Gluten', 'Dairy', 'Sulphites'] },
  { name: 'Escargots de Bourgogne', description: 'Six snails baked in their shells under garlic-parsley butter. Bread comes with them, and you will want it.', price: 13.0, category: 'Entrées', image: img('escargots'), prepTimeMins: 18, allergens: ['Molluscs', 'Dairy', 'Gluten'] },
  { name: 'Salade Niçoise', description: 'Seared tuna, green beans, new potatoes, olives, soft egg and anchovy, dressed simply.', price: 14.5, category: 'Entrées', image: img('salade-nicoise'), prepTimeMins: 12, allergens: ['Fish', 'Eggs', 'Mustard'] },
  { name: 'Quiche Lorraine', description: 'Smoked lardons and crème fraîche in an all-butter shortcrust. Served warm, never hot.', price: 10.5, category: 'Entrées', image: img('quiche-lorraine'), prepTimeMins: 14, allergens: ['Gluten', 'Dairy', 'Eggs'] },

  // Plats
  { name: 'Coq au Vin', description: 'Rooster braised overnight in Burgundy with lardons, pearl onions and button mushrooms.', price: 24.0, category: 'Plats', image: img('coq-au-vin'), isPopular: true, prepTimeMins: 30, allergens: ['Sulphites', 'Dairy'] },
  { name: 'Bœuf Bourguignon', description: 'Beef shin and carrots, six hours in red wine until a spoon is the only cutlery you need.', price: 26.0, category: 'Plats', image: img('boeuf-bourguignon'), isPopular: true, prepTimeMins: 32, allergens: ['Sulphites', 'Celery'] },
  { name: 'Confit de Canard', description: 'Duck leg cured in salt and cooked slowly in its own fat. Crisp skin, sarladaise potatoes.', price: 27.5, category: 'Plats', image: img('confit-de-canard'), prepTimeMins: 28, allergens: [] },
  { name: 'Ratatouille Niçoise', description: 'Aubergine, courgette, peppers and tomato, each cooked apart then brought together with thyme.', price: 18.0, category: 'Plats', image: img('ratatouille'), isVeg: true, prepTimeMins: 25, allergens: [] },
  { name: 'Bouillabaisse Marseillaise', description: 'Rockfish broth with saffron and fennel, a generous catch of the day, and rouille on the side.', price: 32.0, category: 'Plats', image: img('bouillabaisse'), prepTimeMins: 35, allergens: ['Fish', 'Shellfish', 'Molluscs', 'Eggs', 'Gluten'] },
  { name: 'Steak Frites', description: 'Aged entrecôte, maître d\'hôtel butter, and frites cooked twice in beef dripping.', price: 25.0, category: 'Plats', image: img('steak-frites'), prepTimeMins: 20, allergens: ['Dairy'] },

  // Fromages
  { name: 'Plateau de Fromages', description: 'Five cheeses across the regions, with walnuts, quince paste and a rye cracker.', price: 16.0, category: 'Fromages', image: img('plateau-de-fromages'), isVeg: true, prepTimeMins: 8, allergens: ['Dairy', 'Nuts', 'Gluten'] },
  { name: 'Camembert Rôti au Miel', description: 'A whole Camembert baked until molten, drizzled with chestnut honey and rosemary.', price: 14.0, category: 'Fromages', image: img('camembert-roti'), isVeg: true, isPopular: true, prepTimeMins: 16, allergens: ['Dairy'] },
  { name: 'Soufflé au Fromage', description: 'Comté soufflé, twenty minutes from oven to table. It waits for nobody.', price: 15.0, category: 'Fromages', image: img('souffle-au-fromage'), isVeg: true, prepTimeMins: 22, allergens: ['Dairy', 'Eggs', 'Gluten'] },

  // Boulangerie
  { name: 'Croissant au Beurre', description: 'Laminated over three days with Charentes butter. Shatters properly.', price: 2.2, category: 'Boulangerie', image: img('croissant'), isVeg: true, isPopular: true, prepTimeMins: 5, allergens: ['Gluten', 'Dairy', 'Eggs'] },
  { name: 'Baguette Tradition', description: 'Long fermentation, no additives, blistered crust. Baked every four hours.', price: 1.8, category: 'Boulangerie', image: img('baguette'), isVeg: true, prepTimeMins: 5, allergens: ['Gluten'] },
  { name: 'Pain au Chocolat', description: 'The same laminated dough, wrapped around two batons of dark Valrhona.', price: 2.6, category: 'Boulangerie', image: img('pain-au-chocolat'), isVeg: true, prepTimeMins: 5, allergens: ['Gluten', 'Dairy', 'Eggs', 'Soy'] },

  // Desserts
  { name: 'Crème Brûlée', description: 'Vanilla custard under a sugar crust cracked to order.', price: 8.0, category: 'Desserts', image: img('creme-brulee'), isVeg: true, isPopular: true, prepTimeMins: 10, allergens: ['Dairy', 'Eggs'] },
  { name: 'Tarte Tatin', description: 'Apples caramelised under pastry, turned out upside down, served with crème fraîche.', price: 8.5, category: 'Desserts', image: img('tarte-tatin'), isVeg: true, prepTimeMins: 12, allergens: ['Gluten', 'Dairy'] },
  { name: 'Éclair au Chocolat', description: 'Choux filled with chocolate crème pâtissière under a mirror glaze.', price: 6.5, category: 'Desserts', image: img('eclair-au-chocolat'), isVeg: true, prepTimeMins: 8, allergens: ['Gluten', 'Dairy', 'Eggs', 'Soy'] },
  { name: 'Macarons', description: 'Six shells: pistachio, raspberry, salted caramel, coffee, vanilla, cassis.', price: 12.0, category: 'Desserts', image: img('macarons'), isVeg: true, prepTimeMins: 6, allergens: ['Eggs', 'Nuts', 'Dairy'] },
  { name: 'Mousse au Chocolat', description: 'Seventy percent Guanaja, whipped with nothing but egg and a little sugar.', price: 7.5, category: 'Desserts', image: img('mousse-au-chocolat'), isVeg: true, prepTimeMins: 8, allergens: ['Eggs', 'Dairy', 'Soy'] },

  // Boissons
  { name: 'Café au Lait', description: 'Slow-roasted arabica, steamed milk, served in a bowl as it should be.', price: 3.4, category: 'Boissons', image: img('cafe-au-lait'), isVeg: true, prepTimeMins: 4, allergens: ['Dairy'] },
  { name: 'Chocolat Chaud', description: 'Melted dark chocolate and hot milk. Thick enough to coat the spoon.', price: 4.5, category: 'Boissons', image: img('chocolat-chaud'), isVeg: true, prepTimeMins: 6, allergens: ['Dairy', 'Soy'] },
  { name: 'Citron Pressé', description: 'Fresh lemon juice, a carafe of water and sugar syrup. You mix it to taste.', price: 3.8, category: 'Boissons', image: img('citron-presse'), isVeg: true, prepTimeMins: 4, allergens: [] },
];

async function seed() {
  await connectDB();

  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('  Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first.');
    process.exit(1);
  }

  // Replace the menu wholesale — this script is for setting up a fresh database.
  await MenuItem.deleteMany({});
  const items = await MenuItem.insertMany(MENU);
  console.log(`  Inserted ${items.length} menu items.`);

  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existing = await Admin.findOne({ email });

  if (existing) {
    console.log(`  Admin ${email} already exists — leaving it untouched.`);
  } else {
    // Created via .save() (not insertMany) so the pre-save hook hashes the password.
    await new Admin({ name: ADMIN_NAME || 'Restaurant Manager', email, password: ADMIN_PASSWORD }).save();
    console.log(`  Created admin ${email}`);
  }

  // Orders are deliberately left alone. Re-seeding the menu shouldn't erase sales history.
  console.log('\n  Done. Sign in at http://localhost:5173/admin/login\n');
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('  Seed failed:', err.message);
  await mongoose.connection.close();
  process.exit(1);
});
