-- Prices are in kobo: 1850000 = ₦18,500.
INSERT INTO products (slug, name, description, category, price_kobo, image_url, stock) VALUES
  ('ankara-fabric', 'Ankara Print Fabric (6 yards)', 'Vibrant 100% cotton wax print, enough for a full outfit. Colourfast and soft.', 'Fashion', 1850000, 'https://images.unsplash.com/photo-1552710307-537199cd41c0?w=800', 30),
  ('ankara-shirt', 'Ankara Print Shirt', 'Relaxed-fit short-sleeve shirt in bold Ankara print. Available in M, L and XL.', 'Fashion', 2800000, 'https://images.unsplash.com/photo-1771771425082-49c05a9ecf48?w=800', 20),
  ('adire-fabric', 'Adire Indigo Fabric (2 yards)', 'Hand-dyed Adire from Abeokuta, made with traditional indigo tie-dye techniques.', 'Fashion', 1500000, 'https://images.unsplash.com/photo-1761808070278-dd73772be230?w=800', 25),
  ('gele-head-wrap', 'Gele Head Wrap', 'Statement head wrap in wax print. Easy to tie for owambe and everyday style.', 'Fashion', 1200000, 'https://images.unsplash.com/photo-1784123476756-a8fc424d1d2c?w=800', 35),
  ('beaded-necklace', 'Handmade Beaded Necklace', 'Colourful glass-bead necklace, hand-strung by artisans in Lagos.', 'Accessories', 950000, 'https://images.unsplash.com/photo-1601387603639-387c75bdcb0d?w=800', 40),
  ('leather-sandals', 'Handmade Leather Sandals', 'Genuine leather sandals crafted in Aba. Durable soles, comfortable all day.', 'Accessories', 2400000, 'https://images.unsplash.com/photo-1585120824848-8a5cd41493d2?w=800', 18),
  ('raffia-tote', 'Woven Raffia Tote', 'Roomy hand-woven raffia bag for the market, the beach or everyday errands.', 'Accessories', 1650000, 'https://images.unsplash.com/photo-1524679813234-66a389fe1a42?w=800', 22),
  ('shea-butter', 'Raw Shea Butter (500g)', 'Unrefined shea butter from northern Nigeria. Deeply moisturising for skin and hair.', 'Beauty', 650000, 'https://images.unsplash.com/photo-1573812461383-e5f8b759d12e?w=800', 60),
  ('handmade-soap', 'Natural Handmade Soap (set of 4)', 'Cold-process soaps made with shea, palm kernel oil and essential oils.', 'Beauty', 500000, 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=800', 50),
  ('coconut-oil', 'Virgin Coconut Oil (100ml)', 'Cold-pressed coconut oil for skin, hair and cooking.', 'Beauty', 450000, 'https://images.unsplash.com/photo-1704895234367-35115a1a3cc7?w=800', 45),
  ('zobo-mix', 'Zobo Drink Mix (250g)', 'Dried hibiscus with ginger and cloves. Just add water, boil, chill and enjoy.', 'Food', 350000, 'https://images.unsplash.com/photo-1765118527329-6ed7fa0d10ac?w=800', 70),
  ('throw-pillows', 'Patterned Throw Pillows (set of 3)', 'Three cushions with removable covers to brighten up any sofa.', 'Home', 2100000, 'https://images.unsplash.com/photo-1538577880403-f9998e75dd06?w=800', 15),
  ('wall-baskets', 'Woven Wall Basket Set', 'Set of hand-woven decorative baskets for a warm, textured wall display.', 'Home', 3500000, 'https://images.unsplash.com/photo-1590751518505-1fc2d227ef9b?w=800', 10),
  ('wooden-bowl', 'Hand-carved Wooden Bowl', 'Carved from a single piece of hardwood. Perfect for fruit, snacks or decor.', 'Home', 1100000, 'https://images.unsplash.com/photo-1628281328519-485715de3bd1?w=800', 20),
  ('canvas-art', 'Hand-painted Canvas Art', 'Original oil painting by a Lagos artist, celebrating dance and culture. 60 x 75cm.', 'Home', 6500000, 'https://images.unsplash.com/photo-1742648592366-b8b0c847fa00?w=800', 5)
ON CONFLICT (slug) DO NOTHING;
