/* ============================================================
   Datos iniciales del demo — Mariscos Frescos Los Primos
   Precios y costos aproximados (demo, no reales)
   ============================================================ */
window.LP_INITIAL_PRODUCTS = [
  // ——— Aguachiles / Ceviches (estrella del menú Instagram) ———
  { id: 'p01', name: 'Aguachile El Litro',           cat: 'Aguachiles',  emoji: '🥣', cost: 95,  price: 240, stock: 18 },
  { id: 'p02', name: 'Aguachile Medio Litro',        cat: 'Aguachiles',  emoji: '🥣', cost: 50,  price: 120, stock: 24 },
  { id: 'p03', name: 'Ceviche de Camarón Litro',     cat: 'Ceviches',    emoji: '🍤', cost: 85,  price: 220, stock: 20 },
  { id: 'p04', name: 'Ceviche de Camarón 1/2',       cat: 'Ceviches',    emoji: '🍤', cost: 45,  price: 110, stock: 26 },
  { id: 'p05', name: 'Coctel de Camarón',            cat: 'Ceviches',    emoji: '🍹', cost: 60,  price: 150, stock: 22 },

  // ——— Sashimi y platillos premium ———
  { id: 'p06', name: 'Sashimi de Atún',              cat: 'Especiales',  emoji: '🍣', cost: 85,  price: 200, stock: 12 },
  { id: 'p07', name: 'Botana Los Primos',            cat: 'Especiales',  emoji: '🍱', cost: 210, price: 480, stock: 8  },
  { id: 'p08', name: 'Pulpo a las Brasas',           cat: 'Especiales',  emoji: '🐙', cost: 130, price: 290, stock: 10 },

  // ——— Tostadas ———
  { id: 'p09', name: 'Tostada de Atún',              cat: 'Tostadas',    emoji: '🌮', cost: 25,  price: 65,  stock: 40 },
  { id: 'p10', name: 'Tostada de Camarón',           cat: 'Tostadas',    emoji: '🌮', cost: 22,  price: 60,  stock: 40 },
  { id: 'p11', name: 'Tostada Mixta',                cat: 'Tostadas',    emoji: '🌮', cost: 30,  price: 75,  stock: 30 },

  // ——— Complementos / botanas ———
  { id: 'p12', name: 'Tostitos Flamin\' Hot',        cat: 'Botanas',     emoji: '🌶️', cost: 18,  price: 35,  stock: 25 },
  { id: 'p13', name: 'Tostitos Salsa Verde',         cat: 'Botanas',     emoji: '🟢', cost: 18,  price: 35,  stock: 25 },
  { id: 'p14', name: 'Aguacate extra',               cat: 'Botanas',     emoji: '🥑', cost: 8,   price: 20,  stock: 30 },
  { id: 'p15', name: 'Pepino con chile',             cat: 'Botanas',     emoji: '🥒', cost: 10,  price: 25,  stock: 30 },

  // ——— Bebidas ———
  { id: 'p16', name: 'Corona Ultra',                 cat: 'Bebidas',     emoji: '🍺', cost: 22,  price: 45,  stock: 48 },
  { id: 'p17', name: 'Victoria',                     cat: 'Bebidas',     emoji: '🍺', cost: 18,  price: 40,  stock: 48 },
  { id: 'p18', name: 'Michelada Preparada',          cat: 'Bebidas',     emoji: '🍻', cost: 30,  price: 80,  stock: 20 },
  { id: 'p19', name: 'Refresco 600ml',               cat: 'Bebidas',     emoji: '🥤', cost: 12,  price: 30,  stock: 36 },
  { id: 'p20', name: 'Agua embotellada',             cat: 'Bebidas',     emoji: '💧', cost: 8,   price: 20,  stock: 40 },
  { id: 'p21', name: 'Agua de horchata',             cat: 'Bebidas',     emoji: '🥛', cost: 10,  price: 30,  stock: 20 },
];

window.LP_USERS = [
  { user: 'admin',  pass: '1234', name: 'Administrador', role: 'admin'  },
  { user: 'cajero', pass: '1234', name: 'Cajero',        role: 'cajero' },
];
