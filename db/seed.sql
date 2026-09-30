INSERT INTO products (slug, name, description, price_cents, image_url, stock) VALUES
  ('ceramic-mug', 'Ceramic Mug', 'Hand-glazed stoneware mug, 350ml. Dishwasher safe.', 1800, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800', 40),
  ('linen-tote', 'Linen Tote Bag', 'Sturdy natural linen tote with an inner pocket.', 2400, 'https://images.unsplash.com/photo-1597633125097-5a9ae3cb8a8f?w=800', 25),
  ('beeswax-candle', 'Beeswax Candle', 'Pure beeswax pillar candle, about 40 hours burn time.', 1500, 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=800', 60),
  ('notebook', 'Dot-Grid Notebook', 'A5, 160 pages of 100gsm paper, lay-flat binding.', 1200, 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800', 80),
  ('wool-throw', 'Wool Throw', 'Soft merino blend throw blanket, 130 x 170cm.', 8900, 'https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=800', 10),
  ('plant-pot', 'Terracotta Planter', 'Unglazed terracotta pot with saucer, 15cm.', 2100, 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800', 30)
ON CONFLICT (slug) DO NOTHING;
