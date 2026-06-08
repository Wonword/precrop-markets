-- ============================================================
-- Seed the marketplace listings into public.contracts
--
-- Why: the marketplace pages render from src/lib/mockContracts.ts, but
-- public.purchases.contract_id has a NOT NULL FK to public.contracts(id)
-- (on delete restrict). With contracts empty, every real purchase failed
-- with a foreign-key violation. Seeding the canonical listings keeps the
-- on-chain/off-chain data model consistent and lets buyers transact.
--
-- Idempotent: ON CONFLICT (id) DO NOTHING — safe to re-run.
-- ============================================================

insert into public.contracts
  (id, token_id, crop_name, crop_category, description, grading_standard,
   quality_standards, quantity_units, unit_type, unit_size_lbs,
   price_per_unit_usdc, total_value_usdc, harvest_date, delivery_date,
   delivery_method, delivery_location, dockage, status,
   placeholder_gradient, contract_address, image_url, minted_at)
values
  ('pcm-001', 1, 'Heritage Red Fife Wheat', 'grain',
   'Organically grown Red Fife wheat — a 19th-century Canadian landrace variety prized by artisan bakers for its complex, nutty flavour and superior gluten structure.',
   'USDA Organic Certified',
   '{"moisture":"<14%","totalDefects":"<2%","specialMetrics":"Organically grown, no pesticides"}'::jsonb,
   500, 'kg', null, 1.85, 925, '2026-07-15', '2026-08-01',
   'Buyer Provided', 'Pick-up at Seller''s Location', null, 'available',
   'from-amber-700 to-yellow-600', '0x1a2b3c4d5e6f', '/crops/red-fife-wheat.jpg', '2026-03-01'),

  ('pcm-002', 2, 'Purple Barley', 'grain',
   'Vibrant purple hull-less barley grown without pesticides. High in anthocyanins and beta-glucan. Sought after by specialty breweries and health food distributors.',
   'Oregon Tilth Certified Organic',
   '{"moisture":"<14%","totalDefects":"<2%","specialMetrics":"Grown without pesticides, high in anthocyanins"}'::jsonb,
   300, 'kg', null, 2.4, 720, '2026-08-10', '2026-08-25',
   'Buyer Provided', 'Pick-up at Seller''s Location', null, 'sold',
   'from-purple-800 to-violet-600', '0x2b3c4d5e6f7a', '/crops/purple-barley.jpg', '2026-02-20'),

  ('pcm-003', 3, 'Heirloom San Marzano Tomatoes', 'vegetable',
   'Authentic San Marzano-style tomatoes grown from Italian heirloom seed stock. Low acidity, meaty flesh, and exceptional sauce quality. Pre-contracted for restaurant use.',
   'California Certified Organic Farmers (CCOF)',
   '{"moisture":"<90%","totalDefects":"<3%","specialMetrics":"Italian heirloom seed stock, low acidity"}'::jsonb,
   200, 'kg', null, 4.2, 840, '2026-09-05', '2026-09-12',
   'Seller Delivered', 'Buyer''s Warehouse', null, 'available',
   'from-red-700 to-orange-500', null, '/crops/san-marzano-tomatoes.jpg', '2026-03-05'),

  ('pcm-004', 4, 'Emmer Farro', 'grain',
   'Ancient emmer farro — one of the first domesticated crops. Rich, nutty flavour with a pleasantly chewy texture. Popular with fine dining restaurants and specialty grain distributors.',
   'Certified Naturally Grown',
   '{"moisture":"<14%","totalDefects":"<2%","foreignMaterial":"<0.5%"}'::jsonb,
   400, 'kg', null, 3.1, 1240, '2026-07-28', '2026-08-10',
   'Buyer Provided', 'Pick-up at Seller''s Location', null, 'redeemable',
   'from-yellow-800 to-amber-500', null, '/crops/emmer-farro.jpg', '2026-01-15'),

  ('pcm-005', 5, 'Black Garlic', 'specialty',
   'Hand-harvested black garlic, slow-fermented over 40 days. Balsamic-sweet umami depth. Highly prized by Michelin-starred chefs and high-end specialty food distributors.',
   'GAP Certified',
   '{"specialMetrics":"Hand-harvested, slow-fermented over 40 days"}'::jsonb,
   80, 'kg', null, 22.0, 1760, '2026-06-20', '2026-07-15',
   'Seller Delivered', 'Buyer''s Warehouse', null, 'available',
   'from-gray-800 to-stone-600', null, '/crops/black-garlic.jpg', '2026-03-08'),

  ('pcm-006', 6, 'Artisan Blue Popcorn', 'grain',
   'Heirloom blue popcorn grown from Cherokee heritage seed. Vivid blue kernels, tender hull-less pop. Prized by specialty snack brands and farm-to-table restaurants.',
   'Non-GMO Project Verified',
   '{"moisture":"<14%","totalDefects":"<2%","specialMetrics":"Cherokee heritage seed, hull-less"}'::jsonb,
   350, 'kg', null, 2.8, 980, '2026-10-01', '2026-10-20',
   'Buyer Provided', 'Pick-up at Seller''s Location', null, 'available',
   'from-blue-800 to-indigo-600', null, '/crops/blue-popcorn.jpg', '2026-03-10'),

  ('pcm-007', 7, 'Persian Saffron', 'herb',
   'Hand-harvested saffron threads from crocus sativus. ISO 3632 Grade 1. Laboratory tested for crocin, picrocrocin, and safranal levels. For specialty importers and luxury food brands.',
   'ISO 3632 Grade 1',
   '{"specialMetrics":"Laboratory tested for crocin, picrocrocin, and safranal levels"}'::jsonb,
   2, 'kg', null, 3200, 6400, '2026-11-01', '2026-11-20',
   'Seller Delivered', 'Buyer''s Warehouse', null, 'redeemed',
   'from-orange-600 to-red-500', null, '/crops/persian-saffron.jpg', '2025-11-01'),

  ('pcm-008', 8, 'Spelt Berries', 'grain',
   'Ancient European spelt — higher protein and fibre than modern wheat. Nuttier, more digestible. Ideal for artisan bakers, pasta makers, and specialty health food retailers.',
   'Pennsylvania Certified Organic',
   '{"moisture":"<14%","totalDefects":"<2%","foreignMaterial":"<0.5%","specialMetrics":"Ancient European variety, higher protein than modern wheat"}'::jsonb,
   600, 'kg', null, 1.65, 990, '2026-08-05', '2026-08-18',
   'Buyer Provided', 'Pick-up at Seller''s Location', null, 'available',
   'from-lime-700 to-green-600', null, '/crops/spelt-berries.jpg', '2026-03-12'),

  ('pcm-009', 9, 'Grain Chickpeas US No. 1', 'legume',
   'Chickpeas grown to US No. 1 grade standards using intercropping, zero pesticides, and soil conservation practices on the Hi-Line plains of northern Montana. Special separating and cleaning process ensures exceptional purity.',
   'US No. 1',
   '{"moisture":"<14%","totalDefects":"<2%","totalDamaged":"<2%","foreignMaterial":"<0.5%","contrasting":"<1%","testWeight":">55 lbs.","specialMetrics":"Crop grown with intercropping, no pesticides, and soil conservation practices. Special separating and cleaning process."}'::jsonb,
   10, 'Tote Bag', 2000, 100, 1000, null, '2026-09-01',
   'Buyer Provided', 'Pick-up at Seller''s Location', 'Allowed by percentage above any quality standard', 'available',
   'from-yellow-600 to-amber-400', null, '/crops/Chickpeas.png', '2026-03-20'),

  ('pcm-010', 10, 'Grain Flax US No. 1', 'grain',
   'Premium flax grown to US No. 1 grade on the high plains of northern Montana. Cultivated with intercropping and zero pesticides. Sought after by natural food processors and health product manufacturers.',
   'US No. 1',
   '{"moisture":"<14%","totalDefects":"<2%","totalDamaged":"<10%","foreignMaterial":"<0.5%","contrasting":"<1%","testWeight":">49 lbs.","specialMetrics":"Crop grown with intercropping, no pesticides, and soil conservation practices. Special separating and cleaning process."}'::jsonb,
   10, 'Tote Bag', 2000, 800, 8000, null, '2026-09-01',
   'Buyer Provided', 'Pick-up at Seller''s Location', 'Allowed by percentage above any quality standard', 'available',
   'from-blue-600 to-cyan-400', null, '/crops/flax seeds.png', '2026-03-20'),

  ('pcm-011', 11, 'Grain Hulless Oats US No. 1', 'grain',
   'Hull-less oats grown to US No. 1 grade standards in Chester, Montana. Intercropped with no pesticides for superior grain quality. Ready-to-process with no hulling required — ideal for oat processors and specialty food producers.',
   'US No. 1',
   '{"moisture":"<14%","totalDefects":"<3%","totalDamaged":"<3%","foreignMaterial":"<0.5%","contrasting":"<1%","testWeight":">36 lbs.","specialMetrics":"Crop grown with intercropping, no pesticides, and soil conservation practices. Special separating and cleaning process."}'::jsonb,
   10, 'Tote Bag', 2000, 240, 2400, null, '2026-09-01',
   'Buyer Provided', 'Pick-up at Seller''s Location', 'Allowed by percentage above any quality standard', 'available',
   'from-green-600 to-teal-400', null, '/crops/Hulless Oats.jpg', '2026-03-20')

on conflict (id) do nothing;
