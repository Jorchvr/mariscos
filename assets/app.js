/* ============================================================
   Los Primos POS — lógica principal (demo, sin backend)
   Persiste en localStorage. Genera datos históricos al arrancar.
   ============================================================ */
(function () {
  'use strict';

  // ---------- guard: session ----------
  const session = (() => {
    try { return JSON.parse(localStorage.getItem('lp_session') || 'null'); }
    catch (_) { return null; }
  })();
  if (!session) { window.location.replace('index.html'); return; }

  document.getElementById('userChip').textContent = '👤 ' + (session.name || session.user);

  // ---------- storage keys ----------
  const K = {
    products: 'lp_products',
    sales:    'lp_sales',
    merma:    'lp_merma',
    seeded:   'lp_seeded_v1',
  };

  const TAX_RATE = 0.16;

  // ---------- utility ----------
  const fmt = (n) => '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt0 = (n) => '$' + Math.round(Number(n || 0)).toLocaleString('es-MX');
  const uid = () => Math.random().toString(36).slice(2, 10);
  const dateKey = (d) => new Date(d).toISOString().slice(0, 10);
  const monthKey = (d) => new Date(d).toISOString().slice(0, 7);
  const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch(_) { return fb; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // ---------- seed data ----------
  function seed() {
    if (!load(K.products, null)) save(K.products, window.LP_INITIAL_PRODUCTS);

    if (localStorage.getItem(K.seeded) === '1') return;

    const products = load(K.products, []);
    const methods = ['efectivo', 'tarjeta', 'transferencia'];
    const sales = [];
    const merma = [];

    // Generate 30 days of history
    const today = new Date(); today.setHours(0,0,0,0);
    for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
      const d = new Date(today); d.setDate(d.getDate() - dayOffset);
      // weekends busier
      const dow = d.getDay(); // 0 sun, 6 sat
      const ticketCount = (dow === 0 || dow === 6) ? (8 + Math.floor(Math.random() * 7))
                                                    : (3 + Math.floor(Math.random() * 5));
      for (let i = 0; i < ticketCount; i++) {
        const hh = 12 + Math.floor(Math.random() * 8);
        const mm = Math.floor(Math.random() * 60);
        const dt = new Date(d); dt.setHours(hh, mm, Math.floor(Math.random() * 60));
        const numItems = 1 + Math.floor(Math.random() * 4);
        const items = [];
        for (let k = 0; k < numItems; k++) {
          const p = products[Math.floor(Math.random() * products.length)];
          const q = 1 + Math.floor(Math.random() * 2);
          items.push({ id: p.id, name: p.name, price: p.price, cost: p.cost, qty: q });
        }
        const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
        const tax = +(subtotal * TAX_RATE).toFixed(2);
        const total = +(subtotal + tax).toFixed(2);
        const cost = items.reduce((s, it) => s + it.cost * it.qty, 0);
        sales.push({
          id: uid(),
          number: sales.length + 1,
          at: dt.toISOString(),
          items, subtotal, tax, total, cost,
          method: methods[Math.floor(Math.random() * methods.length)],
        });
      }
      // occasional merma
      if (Math.random() < 0.35) {
        const p = products[Math.floor(Math.random() * products.length)];
        const q = 1 + Math.floor(Math.random() * 2);
        merma.push({
          id: uid(),
          at: new Date(d).toISOString(),
          productId: p.id, name: p.name,
          qty: q, cost: p.cost * q,
          reason: ['Caducidad','Dañado','Mal manejo','Cortesía'][Math.floor(Math.random()*4)],
        });
      }
    }
    sales.sort((a, b) => new Date(a.at) - new Date(b.at));
    sales.forEach((s, i) => s.number = i + 1);
    save(K.sales, sales);
    save(K.merma, merma);
    localStorage.setItem(K.seeded, '1');
  }
  seed();

  // ---------- state ----------
  const state = {
    products: load(K.products, []),
    sales:    load(K.sales, []),
    merma:    load(K.merma, []),
    cart:     [],
    category: 'Todos',
    search:   '',
    payMethod:'efectivo',
    view:     'venta',
  };

  const persist = () => {
    save(K.products, state.products);
    save(K.sales, state.sales);
    save(K.merma, state.merma);
  };

  // ---------- nav ----------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function setView(view) {
    state.view = view;
    $$('.view').forEach(el => el.classList.toggle('hidden', el.dataset.view !== view));
    $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
    $$('.bn-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
    // Ensure mobile cart sheet closes on any view change; refresh FAB
    if (typeof closeCart === 'function') closeCart();
    renderCart();
    const titles = {
      'venta':'Punto de Venta','productos':'Productos','merma':'Merma',
      'corte-diario':'Corte Diario','corte-mensual':'Corte Mensual','dashboard':'Dashboard'
    };
    $('#topbarSection').textContent = titles[view] || '';
    closeSidebar();
    // render on demand
    if (view === 'productos')     renderProducts();
    if (view === 'merma')         renderMerma();
    if (view === 'corte-diario')  renderCorteDiario();
    if (view === 'corte-mensual') renderCorteMensual();
    if (view === 'dashboard')     renderDashboard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $$('.nav-item, .bn-item').forEach(el => el.addEventListener('click', () => setView(el.dataset.view)));

  // Sidebar
  const sidebar = $('#sidebar');
  const scrim   = $('#scrim');
  const openSidebar  = () => { sidebar.classList.add('open'); scrim.classList.add('show'); };
  const closeSidebar = () => { sidebar.classList.remove('open'); scrim.classList.remove('show'); };
  $('#openMenu').addEventListener('click', openSidebar);
  $('#closeMenu').addEventListener('click', closeSidebar);
  scrim.addEventListener('click', closeSidebar);

  // Logout
  $('#logoutBtn').addEventListener('click', () => {
    if (confirm('¿Cerrar sesión?')) {
      localStorage.removeItem('lp_session');
      window.location.replace('index.html');
    }
  });

  // Reset demo
  $('#resetDemo').addEventListener('click', () => {
    if (!confirm('Esto borra ventas, merma y regenera datos de demo. ¿Continuar?')) return;
    localStorage.removeItem(K.products);
    localStorage.removeItem(K.sales);
    localStorage.removeItem(K.merma);
    localStorage.removeItem(K.seeded);
    window.location.reload();
  });

  // ---------- toasts ----------
  function toast(msg, kind = '') {
    const host = $('#toastHost');
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; }, 1800);
    setTimeout(() => el.remove(), 2200);
  }

  /* =========================================================
     VIEW: Venta (POS)
     ========================================================= */
  function renderCategoryChips() {
    const cats = ['Todos', ...new Set(state.products.map(p => p.cat))];
    const host = $('#categoryChips');
    host.innerHTML = cats.map(c =>
      `<button class="chip ${c === state.category ? 'active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');
    host.querySelectorAll('.chip').forEach(el => el.addEventListener('click', () => {
      state.category = el.dataset.cat;
      renderCategoryChips();
      renderProductGrid();
    }));
  }

  function renderProductGrid() {
    const q = state.search.trim().toLowerCase();
    const list = state.products.filter(p => {
      const okCat = state.category === 'Todos' || p.cat === state.category;
      const okQ   = !q || p.name.toLowerCase().includes(q);
      return okCat && okQ;
    });
    const grid = $('#productGrid');
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><span>🔍</span><p>Sin resultados</p></div>`;
      return;
    }
    grid.innerHTML = list.map(p => {
      const out = p.stock <= 0;
      const low = !out && p.stock <= 5;
      const stockCls = out ? 'out' : (low ? 'low' : '');
      const stockTxt = out ? 'Agotado' : `${p.stock} disp.`;
      return `
        <button class="product-card" data-id="${p.id}" ${out ? 'disabled' : ''}>
          <span class="cat">${p.cat}</span>
          <div class="thumb">${p.emoji}</div>
          <div class="name">${p.name}</div>
          <div class="price-row">
            <span class="price">${fmt0(p.price)}</span>
            <span class="stock ${stockCls}">${stockTxt}</span>
          </div>
        </button>`;
    }).join('');
    grid.querySelectorAll('.product-card').forEach(el =>
      el.addEventListener('click', () => addToCart(el.dataset.id))
    );
  }

  $('#searchProduct').addEventListener('input', (e) => {
    state.search = e.target.value; renderProductGrid();
  });

  function addToCart(id) {
    const p = state.products.find(x => x.id === id);
    if (!p || p.stock <= 0) return;
    const line = state.cart.find(x => x.id === id);
    if (line) {
      if (line.qty >= p.stock) { toast('Sin stock suficiente', 'error'); return; }
      line.qty += 1;
    } else {
      state.cart.push({ id: p.id, name: p.name, price: p.price, cost: p.cost, qty: 1 });
    }
    renderCart();
    toast(`+ ${p.name}`);
  }

  function changeQty(id, delta) {
    const line = state.cart.find(x => x.id === id);
    if (!line) return;
    const p = state.products.find(x => x.id === id);
    line.qty += delta;
    if (line.qty <= 0) state.cart = state.cart.filter(x => x.id !== id);
    else if (line.qty > p.stock) { line.qty = p.stock; toast('Stock máximo alcanzado', 'error'); }
    renderCart();
  }

  function removeLine(id) {
    state.cart = state.cart.filter(x => x.id !== id);
    renderCart();
  }

  function cartTotals() {
    const subtotal = state.cart.reduce((s, l) => s + l.price * l.qty, 0);
    const tax = +(subtotal * TAX_RATE).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);
    const cost = state.cart.reduce((s, l) => s + l.cost * l.qty, 0);
    const count = state.cart.reduce((s, l) => s + l.qty, 0);
    return { subtotal, tax, total, cost, count };
  }

  function renderCart() {
    const host = $('#cartItems');
    if (!state.cart.length) {
      host.innerHTML = `<div class="empty-state"><span>🛒</span><p>Agrega productos para empezar</p></div>`;
    } else {
      host.innerHTML = state.cart.map(l => `
        <div class="cart-item" data-id="${l.id}">
          <div class="ci-main">
            <span class="ci-name">${l.name}</span>
            <span class="ci-price">${fmt(l.price)} c/u</span>
            <div class="qty-ctrl">
              <button class="qty-btn" data-act="dec">−</button>
              <span class="qty-val">${l.qty}</span>
              <button class="qty-btn" data-act="inc">+</button>
              <button class="rem" data-act="rem" title="Quitar">🗑</button>
            </div>
          </div>
          <div class="ci-total">${fmt(l.price * l.qty)}</div>
        </div>
      `).join('');
      host.querySelectorAll('.cart-item').forEach(row => {
        const id = row.dataset.id;
        row.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
          const act = b.dataset.act;
          if (act === 'inc') changeQty(id, +1);
          if (act === 'dec') changeQty(id, -1);
          if (act === 'rem') removeLine(id);
        }));
      });
    }
    const t = cartTotals();
    $('#cartCount').textContent = `${t.count} artículo${t.count === 1 ? '' : 's'}`;
    $('#sumSub').textContent   = fmt(t.subtotal);
    $('#sumTax').textContent   = fmt(t.tax);
    $('#sumTotal').textContent = fmt(t.total);
    $('#btnCharge').disabled   = t.total <= 0;

    // Mobile cart FAB visibility + labels
    const fab = $('#cartFab');
    if (fab) {
      $('#cfCount').textContent = t.count;
      $('#cfTotal').textContent = fmt(t.total);
      fab.classList.toggle('hidden', t.count === 0 || state.view !== 'venta');
    }
  }

  // ---------- mobile cart sheet ----------
  const posCart   = $('#posCart');
  const cartScrim = $('#cartScrim');
  const cartFab   = $('#cartFab');

  function openCart()  {
    posCart.classList.add('open');
    cartScrim.classList.add('show');
  }
  function closeCart() {
    posCart.classList.remove('open');
    cartScrim.classList.remove('show');
  }
  cartFab.addEventListener('click', openCart);
  cartScrim.addEventListener('click', closeCart);
  $('#closeCart').addEventListener('click', closeCart);

  $$('.pay-btn').forEach(btn => btn.addEventListener('click', () => {
    $$('.pay-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.payMethod = btn.dataset.method;
  }));

  $('#btnClearCart').addEventListener('click', () => {
    if (!state.cart.length) return;
    state.cart = [];
    renderCart();
    toast('Ticket vaciado');
  });

  /* =========================================================
     Cobro / Ticket
     ========================================================= */
  const chargeModal = $('#chargeModal');
  const ticketModal = $('#ticketModal');

  $('#btnCharge').addEventListener('click', () => openChargeModal());
  $('#cancelCharge').addEventListener('click', () => chargeModal.classList.add('hidden'));

  function openChargeModal() {
    const t = cartTotals();
    $('#modalTotal').textContent = fmt(t.total);
    $('#cashReceived').value = '';
    $('#cashChange').textContent = fmt(0);
    chargeModal.classList.remove('hidden');
    closeCart();
    setTimeout(() => $('#cashReceived').focus(), 50);
  }

  $('#cashReceived').addEventListener('input', updateChange);
  $$('.quick-cash button').forEach(b => b.addEventListener('click', () => {
    const t = cartTotals();
    if (b.dataset.cash === 'exact') $('#cashReceived').value = t.total.toFixed(2);
    else $('#cashReceived').value = b.dataset.cash;
    updateChange();
  }));
  function updateChange() {
    const t = cartTotals();
    const received = parseFloat($('#cashReceived').value) || 0;
    const change = Math.max(0, received - t.total);
    $('#cashChange').textContent = fmt(change);
  }

  $('#confirmCharge').addEventListener('click', () => {
    const t = cartTotals();
    if (t.total <= 0) return;
    if (state.payMethod === 'efectivo') {
      const received = parseFloat($('#cashReceived').value) || 0;
      if (received < t.total) { toast('Efectivo insuficiente', 'error'); return; }
    }
    // Decrease stock
    state.cart.forEach(l => {
      const p = state.products.find(x => x.id === l.id);
      if (p) p.stock = Math.max(0, p.stock - l.qty);
    });
    // Save sale
    const sale = {
      id: uid(),
      number: (state.sales[state.sales.length - 1]?.number || 0) + 1,
      at: new Date().toISOString(),
      items: state.cart.map(l => ({ ...l })),
      subtotal: t.subtotal, tax: t.tax, total: t.total, cost: t.cost,
      method: state.payMethod,
    };
    state.sales.push(sale);
    persist();
    chargeModal.classList.add('hidden');
    showTicket(sale);
    state.cart = [];
    renderCart();
    renderProductGrid();
    toast('Venta registrada', 'success');
  });

  function showTicket(sale) {
    $('#tkNum').textContent  = '#' + String(sale.number).padStart(4, '0');
    $('#tkDate').textContent = new Date(sale.at).toLocaleString('es-MX');
    $('#tkPay').textContent  = sale.method[0].toUpperCase() + sale.method.slice(1);
    $('#tkLines').innerHTML = sale.items.map(l => `
      <div class="tl">
        <div>${l.name}<br><small>${l.qty} × ${fmt(l.price)}</small></div>
        <strong>${fmt(l.price * l.qty)}</strong>
      </div>
    `).join('');
    $('#tkSub').textContent   = fmt(sale.subtotal);
    $('#tkTax').textContent   = fmt(sale.tax);
    $('#tkTotal').textContent = fmt(sale.total);
    ticketModal.classList.remove('hidden');
  }
  $('#closeTicket').addEventListener('click', () => ticketModal.classList.add('hidden'));
  $('#newSale').addEventListener('click',   () => ticketModal.classList.add('hidden'));

  /* =========================================================
     VIEW: Productos
     ========================================================= */
  function renderProducts() {
    const tbody = $('#productsTable tbody');
    tbody.innerHTML = state.products.map(p => {
      const margin = ((p.price - p.cost) / p.price) * 100;
      const stockCls = p.stock <= 0 ? 'bad' : p.stock <= 5 ? 'warn' : 'good';
      const stockTxt = p.stock <= 0 ? 'Agotado' : p.stock <= 5 ? 'Bajo' : 'OK';
      return `
        <tr>
          <td><strong>${p.emoji} ${p.name}</strong></td>
          <td class="hide-sm">${p.cat}</td>
          <td>${fmt0(p.cost)}</td>
          <td><strong style="color:var(--orange-600)">${fmt0(p.price)}</strong></td>
          <td class="hide-sm">${margin.toFixed(0)}%</td>
          <td><span class="pill ${stockCls}">${p.stock} · ${stockTxt}</span></td>
        </tr>`;
    }).join('');

    $('#stProd').textContent = state.products.length;
    const invValue = state.products.reduce((s, p) => s + p.cost * p.stock, 0);
    $('#stInv').textContent = fmt0(invValue);
    const avgMargin = state.products.reduce((s, p) => s + (p.price - p.cost) / p.price, 0) / state.products.length * 100;
    $('#stMarg').textContent = avgMargin.toFixed(0) + '%';
    $('#stLow').textContent = state.products.filter(p => p.stock <= 5).length;
  }

  /* =========================================================
     VIEW: Merma
     ========================================================= */
  function fillMermaSelect() {
    const sel = $('#mermaProd');
    sel.innerHTML = state.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }

  $('#mermaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const pid = $('#mermaProd').value;
    const qty = parseInt($('#mermaQty').value, 10) || 1;
    const reason = $('#mermaReason').value;
    const p = state.products.find(x => x.id === pid);
    if (!p) return;
    if (qty > p.stock) { toast('Cantidad mayor al stock', 'error'); return; }
    const entry = {
      id: uid(), at: new Date().toISOString(),
      productId: p.id, name: p.name,
      qty, cost: p.cost * qty, reason,
    };
    state.merma.push(entry);
    p.stock = Math.max(0, p.stock - qty);
    persist();
    renderMerma();
    toast('Merma registrada', 'success');
    $('#mermaQty').value = 1;
  });

  function renderMerma() {
    fillMermaSelect();
    const today = dateKey(new Date());
    const month = monthKey(new Date());
    const totalToday = state.merma.filter(m => dateKey(m.at) === today).reduce((s, m) => s + m.cost, 0);
    const totalMonth = state.merma.filter(m => monthKey(m.at) === month).reduce((s, m) => s + m.cost, 0);
    $('#mermaToday').textContent = fmt0(totalToday);
    $('#mermaMonth').textContent = fmt0(totalMonth);
    const tbody = $('#mermaTable tbody');
    const list = state.merma.slice().reverse();
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--ink-400);padding:20px">Sin merma registrada</td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(m => `
      <tr>
        <td>${new Date(m.at).toLocaleDateString('es-MX')}</td>
        <td>${m.name}</td>
        <td>${m.qty}</td>
        <td><span class="pill">${m.reason}</span></td>
        <td>${fmt0(m.cost)}</td>
      </tr>
    `).join('');
  }

  /* =========================================================
     VIEW: Corte Diario
     ========================================================= */
  function initDatePickers() {
    const today = new Date().toISOString().slice(0, 10);
    const month = new Date().toISOString().slice(0, 7);
    if (!$('#cutDate').value)  $('#cutDate').value  = today;
    if (!$('#cutMonth').value) $('#cutMonth').value = month;
  }
  $('#cutDate').addEventListener('change', renderCorteDiario);
  $('#cutMonth').addEventListener('change', renderCorteMensual);

  function renderCorteDiario() {
    initDatePickers();
    const day = $('#cutDate').value;
    const list = state.sales.filter(s => dateKey(s.at) === day);
    const total = list.reduce((s, x) => s + x.total, 0);
    const cost  = list.reduce((s, x) => s + x.cost, 0);
    $('#cdTotal').textContent  = fmt0(total);
    $('#cdTickets').textContent = list.length;
    $('#cdCost').textContent   = fmt0(cost);
    $('#cdProfit').textContent = fmt0(total - cost - list.reduce((s,x) => s + x.tax, 0));

    // by method
    const byMethod = {};
    list.forEach(s => {
      byMethod[s.method] = (byMethod[s.method] || { total: 0, count: 0 });
      byMethod[s.method].total += s.total;
      byMethod[s.method].count += 1;
    });
    const methodMap = { efectivo:'💵 Efectivo', tarjeta:'💳 Tarjeta', transferencia:'📱 Transferencia' };
    const methodHost = $('#cdByMethod');
    if (!Object.keys(byMethod).length) {
      methodHost.innerHTML = `<div class="empty-state"><span>💤</span><p>Sin ventas en la fecha</p></div>`;
    } else {
      methodHost.innerHTML = Object.entries(byMethod).map(([m, v]) => `
        <div class="method-row">
          <div class="m-left"><span>${methodMap[m] || m}</span><small>· ${v.count} ticket${v.count===1?'':'s'}</small></div>
          <span class="m-total">${fmt0(v.total)}</span>
        </div>
      `).join('');
    }

    // by product
    const prodAgg = {};
    list.forEach(s => s.items.forEach(it => {
      const rec = prodAgg[it.id] = prodAgg[it.id] || { name: it.name, qty: 0, total: 0 };
      rec.qty += it.qty;
      rec.total += it.qty * it.price;
    }));
    const prodTbody = $('#cdProducts tbody');
    const prodList = Object.values(prodAgg).sort((a, b) => b.total - a.total);
    if (!prodList.length) {
      prodTbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--ink-400);padding:20px">—</td></tr>`;
    } else {
      prodTbody.innerHTML = prodList.map(p => `
        <tr><td>${p.name}</td><td>${p.qty}</td><td>${fmt0(p.total)}</td></tr>
      `).join('');
    }

    // tickets
    const tkBody = $('#cdTicketList tbody');
    if (!list.length) {
      tkBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--ink-400);padding:20px">—</td></tr>`;
    } else {
      tkBody.innerHTML = list.slice().reverse().map(s => `
        <tr>
          <td>${new Date(s.at).toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'})}</td>
          <td>#${String(s.number).padStart(4, '0')}</td>
          <td class="hide-sm">${methodMap[s.method] || s.method}</td>
          <td>${s.items.reduce((a,b) => a + b.qty, 0)}</td>
          <td><strong>${fmt0(s.total)}</strong></td>
        </tr>
      `).join('');
    }
  }

  /* =========================================================
     VIEW: Corte Mensual
     ========================================================= */
  function renderCorteMensual() {
    initDatePickers();
    const month = $('#cutMonth').value;
    const list = state.sales.filter(s => monthKey(s.at) === month);
    const total = list.reduce((s, x) => s + x.total, 0);
    const cost  = list.reduce((s, x) => s + x.cost, 0);
    const tax   = list.reduce((s, x) => s + x.tax, 0);
    const mermaMonth = state.merma.filter(m => monthKey(m.at) === month).reduce((s, m) => s + m.cost, 0);

    $('#cmTotal').textContent  = fmt0(total);
    $('#cmTickets').textContent = list.length;
    $('#cmAvg').textContent    = fmt0(list.length ? total / list.length : 0);
    $('#cmProfit').textContent = fmt0(total - cost - tax - mermaMonth);
    $('#cmMerma').textContent  = fmt0(mermaMonth);

    // por día
    const byDay = {};
    list.forEach(s => {
      const d = dateKey(s.at);
      byDay[d] = (byDay[d] || 0) + s.total;
    });
    const days = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b));
    const best = days.slice().sort((a, b) => b[1] - a[1])[0];
    $('#cmBest').textContent = best
      ? new Date(best[0]).toLocaleDateString('es-MX', {day:'2-digit', month:'short'}) + ' · ' + fmt0(best[1])
      : '—';

    const chart = $('#cmChart');
    if (!days.length) {
      chart.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><span>📊</span><p>Sin ventas</p></div>`;
    } else {
      const max = Math.max(...days.map(([, v]) => v));
      chart.innerHTML = days.map(([d, v]) => {
        const h = Math.max(4, (v / max) * 150);
        const day = new Date(d).getDate();
        return `<div class="bar" style="height:${h}px" data-label="${day}"><span>${fmt0(v).replace('$','').slice(0,5)}</span></div>`;
      }).join('');
    }

    // top productos
    const prodAgg = {};
    list.forEach(s => s.items.forEach(it => {
      const rec = prodAgg[it.id] = prodAgg[it.id] || { name: it.name, qty: 0, total: 0 };
      rec.qty += it.qty;
      rec.total += it.qty * it.price;
    }));
    const top = Object.values(prodAgg).sort((a, b) => b.total - a.total).slice(0, 8);
    const topBody = $('#cmTop tbody');
    if (!top.length) topBody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--ink-400);padding:20px">—</td></tr>`;
    else topBody.innerHTML = top.map(p => `<tr><td>${p.name}</td><td>${p.qty}</td><td>${fmt0(p.total)}</td></tr>`).join('');

    // por método
    const byM = {};
    list.forEach(s => {
      byM[s.method] = (byM[s.method] || { total: 0, count: 0 });
      byM[s.method].total += s.total;
      byM[s.method].count += 1;
    });
    const methodMap = { efectivo:'💵 Efectivo', tarjeta:'💳 Tarjeta', transferencia:'📱 Transferencia' };
    const mHost = $('#cmByMethod');
    if (!Object.keys(byM).length) {
      mHost.innerHTML = `<div class="empty-state"><span>💤</span><p>Sin datos</p></div>`;
    } else {
      const totM = Object.values(byM).reduce((a, b) => a + b.total, 0) || 1;
      mHost.innerHTML = Object.entries(byM).sort((a,b) => b[1].total - a[1].total).map(([m, v]) => `
        <div class="method-row">
          <div class="m-left"><span>${methodMap[m] || m}</span><small>· ${v.count} · ${(v.total/totM*100).toFixed(0)}%</small></div>
          <span class="m-total">${fmt0(v.total)}</span>
        </div>`).join('');
    }
  }

  /* =========================================================
     VIEW: Dashboard
     ========================================================= */
  function renderDashboard() {
    const today = dateKey(new Date());
    const month = monthKey(new Date());
    const todaySales = state.sales.filter(s => dateKey(s.at) === today);
    const monthSales = state.sales.filter(s => monthKey(s.at) === month);
    const monthMerma = state.merma.filter(m => monthKey(m.at) === month).reduce((s, m) => s + m.cost, 0);

    const todayTotal = todaySales.reduce((s, x) => s + x.total, 0);
    const monthTotal = monthSales.reduce((s, x) => s + x.total, 0);
    const monthCost  = monthSales.reduce((s, x) => s + x.cost, 0);
    const monthTax   = monthSales.reduce((s, x) => s + x.tax, 0);

    $('#dbToday').textContent  = fmt0(todayTotal);
    $('#dbMonth').textContent  = fmt0(monthTotal);
    $('#dbProfit').textContent = fmt0(monthTotal - monthCost - monthTax - monthMerma);
    $('#dbMerma').textContent  = fmt0(monthMerma);

    // last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
      const k = dateKey(d);
      const total = state.sales.filter(s => dateKey(s.at) === k).reduce((s, x) => s + x.total, 0);
      days.push({ d, total });
    }
    const max = Math.max(...days.map(x => x.total), 1);
    $('#dbChart').innerHTML = days.map(x => {
      const h = Math.max(4, (x.total / max) * 110);
      const label = x.d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '');
      return `<div class="bar" style="height:${h}px" data-label="${label}"><span>${x.total > 0 ? fmt0(x.total).replace('$','') : ''}</span></div>`;
    }).join('');

    // top productos mes
    const prodAgg = {};
    monthSales.forEach(s => s.items.forEach(it => {
      const rec = prodAgg[it.id] = prodAgg[it.id] || { name: it.name, qty: 0, total: 0 };
      rec.qty += it.qty;
      rec.total += it.qty * it.price;
    }));
    const top = Object.values(prodAgg).sort((a, b) => b.total - a.total).slice(0, 6);
    const host = $('#dbTop');
    if (!top.length) {
      host.innerHTML = `<li style="text-align:center;color:var(--ink-400);padding:16px">Sin datos del mes</li>`;
    } else {
      host.innerHTML = top.map((p, i) => `
        <li>
          <span class="rank">${i + 1}</span>
          <span class="name">${p.name} <small style="color:var(--ink-500);font-weight:500">· ${p.qty} vend.</small></span>
          <span class="amt">${fmt0(p.total)}</span>
        </li>
      `).join('');
    }
  }

  /* =========================================================
     Init
     ========================================================= */
  renderCategoryChips();
  renderProductGrid();
  renderCart();
  initDatePickers();

})();
