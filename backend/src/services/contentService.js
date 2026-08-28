/**
 * Service providing curated, structured content for Recipes, Fitness Tips,
 * FAQ, and Nutrition Guide.
 */

const RECIPES_DATA = [
  {
    id: 'rec-001',
    title: 'Peanut Butter Protein Oatmeal Power Bowl',
    slug: 'peanut-butter-protein-oatmeal-bowl',
    category: 'Breakfast',
    prep_time_minutes: 10,
    cook_time_minutes: 5,
    servings: 1,
    difficulty: 'Easy',
    calories: 420,
    protein_grams: 28,
    carbs_grams: 48,
    fat_grams: 14,
    fiber_grams: 8,
    image_url: 'images/peanut-fudge.jpeg',
    description: 'A creamy, high-protein morning power bowl topped with warm crushed peanut butter fudge bar chunks and chia seeds.',
    ingredients: [
      '1/2 cup rolled oats',
      '1 cup unsweetened almond milk',
      '1 scoop FitBite Vanilla Whey Isolate (or 1/2 crushed FitBite Peanut Butter Fudge Bar)',
      '1 tbsp natural peanut butter',
      '1 tbsp chia seeds',
      '1/2 banana, sliced',
      'Drizzle of raw organic honey',
    ],
    instructions: [
      'Bring almond milk to a gentle simmer in a small saucepan over medium heat.',
      'Stir in rolled oats and reduce heat to low, cooking for 4-5 minutes until thick and creamy.',
      'Remove from heat and stir in the protein powder and peanut butter until thoroughly combined.',
      'Transfer to a bowl and top with sliced banana, chia seeds, and crushed FitBite Peanut Butter Fudge bar chunks.',
      'Drizzle with honey and serve immediately.',
    ],
    tags: ['High Protein', 'Post-Workout', 'Quick Prep'],
  },
  {
    id: 'rec-002',
    title: 'Chocolate Almond Whey Smoothie Recovery Shake',
    slug: 'chocolate-almond-whey-smoothie',
    category: 'Smoothies & Shakes',
    prep_time_minutes: 5,
    cook_time_minutes: 0,
    servings: 1,
    difficulty: 'Easy',
    calories: 360,
    protein_grams: 32,
    carbs_grams: 34,
    fat_grams: 11,
    fiber_grams: 6,
    image_url: 'images/choco-almond.jpeg',
    description: 'Decadent dark cocoa smoothie enriched with roasted almond butter and pure protein isolate for rapid muscle recovery.',
    ingredients: [
      '1.5 cups chilled oat milk or water',
      '1 frozen ripe banana',
      '1 tbsp raw unsweetened cacao powder',
      '1 tbsp almond butter',
      '1 scoop chocolate protein powder',
      '1/2 FitBite Chocolate Almond Crunch Bar, crumbled',
      'Handful of ice cubes',
    ],
    instructions: [
      'Add oat milk, frozen banana, cacao powder, almond butter, and protein powder to a high-speed blender.',
      'Blend on high for 45-60 seconds until completely smooth and velvety.',
      'Pour into a tall glass, top with crumbled FitBite Chocolate Almond Crunch bar, and enjoy immediately post-workout.',
    ],
    tags: ['Muscle Recovery', 'Refuel', 'Gluten-Free'],
  },
  {
    id: 'rec-003',
    title: 'Antioxidant Berry Blast Protein Parfait',
    slug: 'antioxidant-berry-blast-parfait',
    category: 'Snacks & Desserts',
    prep_time_minutes: 8,
    cook_time_minutes: 0,
    servings: 1,
    difficulty: 'Easy',
    calories: 310,
    protein_grams: 26,
    carbs_grams: 36,
    fat_grams: 6,
    fiber_grams: 7,
    image_url: 'images/berry-blast.jpeg',
    description: 'Layered Greek yogurt parfait infused with antioxidant-rich mixed berries and crisp Berry Blast protein nuggets.',
    ingredients: [
      '1 cup non-fat plain Greek yogurt',
      '1/2 cup fresh mixed berries (blueberries, raspberries, strawberries)',
      '1/2 FitBite Berry Blast Bar, diced into bite-sized nuggets',
      '1 tbsp toasted pumpkin seeds',
      '1/2 tsp pure vanilla extract',
      '1 tsp pure maple syrup (optional)',
    ],
    instructions: [
      'In a small bowl, mix Greek yogurt with vanilla extract and maple syrup.',
      'In a clear glass jar or bowl, layer half of the Greek yogurt at the bottom.',
      'Add a layer of mixed berries and diced FitBite Berry Blast bar pieces.',
      'Repeat with the remaining yogurt and top with remaining berries, bar nuggets, and toasted pumpkin seeds.',
    ],
    tags: ['Low Fat', 'Antioxidants', 'Gut Health'],
  },
  {
    id: 'rec-004',
    title: 'Espresso Caramel Pre-Workout Energy Bites',
    slug: 'espresso-caramel-energy-bites',
    category: 'Snacks & Desserts',
    prep_time_minutes: 15,
    cook_time_minutes: 0,
    servings: 8,
    difficulty: 'Easy',
    calories: 140,
    protein_grams: 8,
    carbs_grams: 16,
    fat_grams: 5,
    fiber_grams: 3,
    image_url: 'images/caramel-coffee.jpeg',
    description: 'No-bake coffee-infused protein energy balls with real Arabica espresso and dates for sustained pre-workout energy.',
    ingredients: [
      '1 cup Medjool dates, pitted',
      '1/2 cup rolled oats',
      '1 FitBite Caramel Coffee Delight Bar, finely chopped',
      '1 tbsp ground espresso powder',
      '2 tbsp almond flour',
      '1 tbsp warm water (if needed to bind)',
    ],
    instructions: [
      'Pulse rolled oats and espresso powder in a food processor until coarsely ground.',
      'Add pitted dates and chopped FitBite Caramel Coffee bar. Process until dough begins to stick together in a ball.',
      'Roll mixture into 8 equal golf-ball-sized balls between your palms.',
      'Refrigerate for at least 30 minutes before consuming. Store in an airtight container for up to 2 weeks.',
    ],
    tags: ['Pre-Workout', 'No Bake', 'Energy Boost'],
  },
];

const FITNESS_TIPS_DATA = [
  {
    id: 'tip-001',
    title: 'The Anabolic Window: Science-Backed Protein Timing',
    slug: 'protein-timing-anabolic-window',
    category: 'Nutrition Science',
    read_time_minutes: 4,
    author: 'FitBite Sports Science Team',
    published_date: '2026-08-15',
    summary: 'Discover the latest scientific consensus regarding protein distribution throughout the day and how to optimize muscle protein synthesis (MPS).',
    content: `For decades, fitness folklore claimed you had exactly 30 minutes post-workout to ingest protein before missing your muscle-building window. Modern sports nutrition literature paints a clearer, more nuanced picture.

Muscle Protein Synthesis (MPS) remains elevated for 24 to 48 hours following resistance training. Rather than panicking over an immediate 30-minute window, the primary goal is total daily protein intake (1.6 to 2.2 grams per kilogram of body weight) distributed across 4 to 5 feeding intervals every 3 to 4 hours.

Each meal should supply at least 2.5 to 3.0 grams of leucine (the key branch-chain amino acid trigger for MPS), which is naturally provided by 20 to 30 grams of high-quality whey or complete plant protein—exactly like a single FitBite bar.`,
    key_takeaways: [
      'Total daily protein intake is king (1.6–2.2g per kg body weight).',
      'Evenly distribute 20–35g of protein across 4–5 meals every 3–4 hours.',
      'Ensure 2.5g+ leucine per serving to maximize muscle protein synthesis.',
    ],
    tags: ['Muscle Growth', 'Protein Timing', 'Science'],
  },
  {
    id: 'tip-002',
    title: 'Hydration and Electrolyte Protocols for High-Intensity Athletes',
    slug: 'hydration-electrolyte-protocols',
    category: 'Performance',
    read_time_minutes: 5,
    author: 'Dr. Sarah Jenkins, Exercise Physiologist',
    published_date: '2026-08-18',
    summary: 'Why drinking plain water is not enough during heavy sweat sessions, and how sodium, potassium, and magnesium dictate muscular contraction.',
    content: `A 2% drop in body water weight impairs cognitive focus, reduces muscular endurance by up to 15%, and drastically increases perceived exertion.

During intense training, sweat removes not just water, but vital electrolytes: Sodium (osmotic fluid balance), Potassium (intracellular hydration), and Magnesium (ATP cellular energy release and muscle cramp prevention).

Ensure you consume 500ml of fluid with 300–500mg sodium 60–90 minutes before prolonged training, and rehydrate post-workout with 1.25L of fluid per kilogram of body weight lost.`,
    key_takeaways: [
      'Plain water alone can cause hyponatremia during prolonged sweat sessions.',
      'Sodium is the primary electrolyte that pulls fluid into muscle cells.',
      'Pair post-workout hydration with a nutrient-dense snack to restore glycogen and electrolytes.',
    ],
    tags: ['Hydration', 'Endurance', 'Recovery'],
  },
  {
    id: 'tip-003',
    title: 'Deep Sleep & Muscle Hypertrophy: The Growth Hormone Link',
    slug: 'deep-sleep-muscle-hypertrophy',
    category: 'Recovery',
    read_time_minutes: 4,
    author: 'FitBite Sports Science Team',
    published_date: '2026-08-20',
    summary: 'Over 70% of natural human growth hormone (HGH) pulse release occurs during Slow-Wave Sleep (Stage 3 non-REM). Here is how to maximize your sleep architecture.',
    content: `You do not grow in the gym; the gym merely provides the mechanical tension and microtrauma stimulus. Actual muscular repair and myofibrillar protein synthesis occur almost exclusively during deep stage-3 non-REM sleep.

During slow-wave sleep, blood supply to skeletal muscle increases, tissue repair enzymes activate, and growth hormone secretion peaks. Chronic sleep deprivation (<6 hours per night) spikes catabolic cortisol by up to 45% and blunts insulin sensitivity.

To optimize recovery: Maintain a consistent sleep-wake schedule, keep your bedroom temperature between 18-20°C, avoid blue light 60 minutes before bed, and ensure adequate dietary magnesium.`,
    key_takeaways: [
      'Peak HGH release happens during deep Stage 3 slow-wave sleep.',
      'Aim for 7.5 to 9 hours of uninterrupted sleep per night.',
      'Maintain a cool, dark room to stimulate natural melatonin production.',
    ],
    tags: ['Sleep', 'HGH', 'Hypertrophy'],
  },
];

const FAQ_DATA = [
  {
    category: 'Orders & Shipping',
    items: [
      {
        question: 'How fast will my FitBite order be processed and delivered?',
        answer: 'All orders placed before 2:00 PM IST are processed and dispatched on the same business day from our climate-controlled fulfillment hub. Standard metro delivery takes 24 to 48 hours, while rest of India takes 3 to 4 business days.',
      },
      {
        question: 'What is the shipping cost policy?',
        answer: 'We offer FREE express shipping on all orders above ₹500 across India. For orders below ₹500, a flat nominal delivery fee of ₹50 is applied at checkout.',
      },
      {
        question: 'Can I track my package in real-time?',
        answer: 'Yes! As soon as your order is confirmed, you receive an authentic order tracking number (e.g., FB-20260828-A101) with live status updates directly on our Track Order page.',
      },
    ],
  },
  {
    category: 'Nutrition & Quality',
    items: [
      {
        question: 'Are FitBite protein bars free from added refined sugars and artificial preservatives?',
        answer: 'Yes, 100%. FitBite bars are crafted using clean ingredients, premium grass-fed whey isolate / non-GMO pea protein, and sweetened naturally with stevia and prebiotic dietary fibers. We never use high-fructose corn syrup or artificial hydrogenated oils.',
      },
      {
        question: 'What is the shelf life and storage recommendation?',
        answer: 'FitBite protein bars have a shelf life of 9 months from the date of manufacture. Because we use real nut butters and dark cocoa without synthetic wax stabilizers, we recommend storing them in a cool, dry place below 25°C away from direct sunlight.',
      },
      {
        question: 'Are your products gluten-free and allergen-tested?',
        answer: 'Our recipes use naturally gluten-free ingredients and are tested in a certified GMP facility. Our bars contain nuts (almonds, peanuts) and milk derivatives (in whey varieties). Please check the individual product allergen badge before purchase.',
      },
    ],
  },
  {
    category: 'Payments & Security',
    items: [
      {
        question: 'Which payment methods are accepted on FitBite?',
        answer: 'We support Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), and major Credit/Debit Cards with 256-bit bank-grade encryption.',
      },
      {
        question: 'Is online payment secure on FitBite?',
        answer: 'All transactions are protected by industry-standard HTTPS encryption and backend parameterized security filters to ensure complete payment and credential isolation.',
      },
    ],
  },
  {
    category: 'Returns & Cancellations',
    items: [
      {
        question: 'Can I cancel an order after placing it?',
        answer: 'You can cancel your order directly from your Account Order History page at any time while the order status remains "Pending". Upon cancellation, any reserved product inventory is automatically restored.',
      },
      {
        question: 'What is the return policy if my package arrives damaged?',
        answer: 'If your shipment arrives damaged or tampered with, please contact our support team within 48 hours with a photo of the package, and we will dispatch a replacement immediately free of charge.',
      },
    ],
  },
];

const NUTRITION_GUIDE_DATA = {
  macro_principles: [
    {
      title: 'Protein (4 kcal/g)',
      role: 'Muscle repair, enzyme production, immune defense, and satiety.',
      recommendation: '1.6g – 2.2g per kg of body weight for active individuals and athletes.',
      fitbite_standard: '20g to 22g of ultra-filtered, high-bioavailability protein per bar.',
    },
    {
      title: 'Complex Carbohydrates & Prebiotics (4 kcal/g)',
      role: 'Sustained muscular glycogen replenishment and healthy gut microbiome feeding.',
      recommendation: '3g – 5g per kg depending on training volume and cardiovascular intensity.',
      fitbite_standard: 'Low glycemic impact with 8g+ dietary prebiotic fiber per serving.',
    },
    {
      title: 'Healthy Dietary Fats (9 kcal/g)',
      role: 'Hormone synthesis (testosterone, growth hormone), joint lubrication, and fat-soluble vitamin uptake.',
      recommendation: '0.8g – 1.2g per kg of body weight from monounsaturated and polyunsaturated sources.',
      fitbite_standard: 'Cold-pressed almond butter, peanut butter, and pure cocoa butter.',
    },
  ],
  daily_macro_calculator_reference: {
    sedentary: { multiplier: '1.0g - 1.2g protein / kg bodyweight', focus: 'Lean tissue preservation and metabolic baseline' },
    moderately_active: { multiplier: '1.4g - 1.7g protein / kg bodyweight', focus: 'Recovery from 3-4 weekly strength/cardio sessions' },
    heavy_training_athlete: { multiplier: '1.8g - 2.4g protein / kg bodyweight', focus: 'Maximum hypertrophy, strength, and tissue remodeling' },
  },
  quality_commitments: [
    'Zero Added Refined Sugars',
    'Cold-Pressed Nut Butters',
    'Lab-Tested Clean Whey Isolate',
    'High Fiber & Low Glycemic Load',
    '100% Transparency in Nutrition Labeling',
  ],
};

const getRecipes = async () => {
  return {
    total: RECIPES_DATA.length,
    recipes: RECIPES_DATA,
  };
};

const getFitnessTips = async () => {
  return {
    total: FITNESS_TIPS_DATA.length,
    tips: FITNESS_TIPS_DATA,
  };
};

const getFAQ = async () => {
  return {
    total_categories: FAQ_DATA.length,
    faq: FAQ_DATA,
  };
};

const getNutritionGuide = async () => {
  return NUTRITION_GUIDE_DATA;
};

module.exports = {
  getRecipes,
  getFitnessTips,
  getFAQ,
  getNutritionGuide,
};
