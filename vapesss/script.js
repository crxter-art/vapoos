/* =====================================================
   1) CONFIGURACIÓN DE LA TIENDA (edita aquí)
   ===================================================== */
const TIENDA = {
  nombre: "vapes",       // NOMBRE PROVISIONAL: cámbialo aquí (navbar, footer y pestaña)
  moneda: "MXN",
  envio: 25,                // costo de envío
  envioGratisDesde: 200     // envío gratis si el subtotal llega a este monto
};

// Categorías (en GB). Cada producto se asigna solo según su campo "capacidad".
const CATEGORIAS = [8, 50, 36, 100];

// Color anodizado de cada categoría, en el mismo orden que CATEGORIAS
const PALETA = ["#c9d3da", "#3ee0c5", "#8b7bff", "#ffb547"];

/* =====================================================
   2) PRODUCTOS: ÚNICO LUGAR PARA EDITARLOS
   -----------------------------------------------------
   id             número único (no repetir)
   nombre         nombre visible
   capacidad      texto, ej. "128 GB" (define la categoría)
   descripcion    texto corto de la tarjeta
   precio         número en pesos, sin símbolo
   precioAnterior (opcional) activa la etiqueta de descuento y aparece en "Ofertas"
   stock          piezas disponibles (0 = Agotado, 5 o menos = "Últimas piezas")
   imagen         ruta dentro de la carpeta imagenes/
   ===================================================== */
const productos = [
  { id: 1, nombre: "waka burst 36k hits", capacidad: "36k hits", descripcion: "rico y duradero.", precio: 450, stock: 2, imagen: "c:\\Users\\USER\\Documents\\vapesss\\imagenes\\waka burst 36k hits.png" },
  { id: 2, nombre: "Sounon donet 50k hits", capacidad: "50k hits", descripcion: "sabores muy buenos.", precio: 475, stock: 2, imagen: "c:\\Users\\USER\\Documents\\vapesss\\imagenes\\Sounon donete 50k hits.png" },
  { id: 3, nombre: "Space vapes 8k hits", capacidad: "8k hits", descripcion: "El equilibrio perfecto entre espacio y tamaño.", precio: 120, precioAnterior: 150, stock: 25, imagen: "c:\\Users\\USER\\Documents\\vapesss\\imagenes\\Space vapes 8k hits.png" }
  
];

/* =====================================================
   3) LÓGICA (no necesitas tocar de aquí hacia abajo)
   ===================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => new Intl.NumberFormat("es-MX", { style: "currency", currency: TIENDA.moneda, maximumFractionDigits: 0 }).format(n);
const hits = p => parseInt(p.capacidad);
const color = g => PALETA[Math.max(0, CATEGORIAS.indexOf(g)) % PALETA.length];
const buscar = id => productos.find(p => p.id == id);

let filtro = "todos";
let carrito = {};
try { carrito = JSON.parse(localStorage.getItem("carrito")) || {}; } catch {}

/* ---------- Textos generales ---------- */
document.title = TIENDA.nombre + " | Tienda online";
$$("[data-nombre]").forEach(e => e.textContent = TIENDA.nombre);
$("#year").textContent = new Date().getFullYear();

/* ---------- Categorías y filtros ---------- */
$("#cats").innerHTML = CATEGORIAS.map(c =>
  `<a class="cat" href="#productos" data-f="${c}" style="--c:${color(c)}"><b>${c}<small>hits</small></b><span>${productos.filter(p => hits(p) === c).length} modelos</span><i style="--w:${c / Math.max(...CATEGORIAS) * 100}%"></i></a>`
).join("");

$("#chips").innerHTML = [["todos", "Todos"], ["oferta", "Ofertas"], ...CATEGORIAS.map(c => [c, c + " hits"])]
  .map(([v, t]) => `<button data-f="${v}">${t}</button>`).join("");

function setFiltro(f) {
  filtro = f;
  $$("#chips button").forEach(b => b.classList.toggle("on", b.dataset.f == f));
  const lista = productos.filter(p => f === "todos" || (f === "oferta" ? p.precioAnterior : hits(p) === f));
  $("#grid").innerHTML = lista.length ? lista.map(tarjeta).join("") : `<p class="empty">Por ahora no hay productos en esta categoría.</p>`;
}

function tarjeta(p, i) {
  const st = p.stock > 5 ? ["ok", "Disponible"] : p.stock > 0 ? ["low", `Últimas ${p.stock} piezas`] : ["out", "Agotado"];
  const desc = p.precioAnterior ? Math.round(100 - p.precio / p.precioAnterior * 100) : 0;
  return `<article class="card" style="--i:${i};--c:${color(hits(p))}">
    <div class="card__img">
      ${desc ? `<span class="off">-${desc}%</span>` : ""}
      <div class="usb"><b>${hits(p)}</b><small>hits</small><i class="led"></i></div>
      <img src="${p.imagen}" alt="${p.nombre} ${p.capacidad}" loading="lazy" onerror="this.remove()">
    </div>
    <div class="card__b">
      <div class="meta"><span class="cap">${p.capacidad}</span><span class="st ${st[0]}">${st[1]}</span></div>
      <h3>${p.nombre}</h3>
      <p>${p.descripcion}</p>
      <div class="buy">
        <div class="price">${fmt(p.precio)}${p.precioAnterior ? `<s>${fmt(p.precioAnterior)}</s>` : ""}</div>
        <button class="btn btn--p" data-add="${p.id}" ${p.stock ? "" : "disabled"}>Agregar al carrito</button>
      </div>
    </div></article>`;
}

/* ---------- Carrito ---------- */
function agregar(id, btn) {
  const p = buscar(id);
  if (!p || (carrito[id] || 0) >= p.stock) return;
  carrito[id] = (carrito[id] || 0) + 1;
  renderCarrito();
  const b = $("#badge");
  b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
  if (btn) {
    btn.textContent = "Agregado"; btn.classList.add("done");
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.textContent = "Agregar al carrito"; btn.classList.remove("done"); }, 1200);
  }
}

function cambiar(id, d) {
  const p = buscar(id), n = (carrito[id] || 0) + d;
  if (n <= 0) delete carrito[id]; else if (n <= p.stock) carrito[id] = n;
  renderCarrito();
}

function quitar(id) { delete carrito[id]; renderCarrito(); }

function renderCarrito() {
  const filas = Object.entries(carrito).map(([id, n]) => ({ p: buscar(id), n })).filter(f => f.p);
  const cant = filas.reduce((s, f) => s + f.n, 0);
  const sub = filas.reduce((s, f) => s + f.p.precio * f.n, 0);
  const env = !sub || sub >= TIENDA.envioGratisDesde ? 0 : TIENDA.envio;

  $("#badge").textContent = cant;
  $("#badge").classList.toggle("show", cant > 0);
  $("#items").innerHTML = filas.length ? filas.map(({ p, n }) => `
    <div class="it">
      <div class="it__img"><img src="${p.imagen}" alt="" onerror="this.remove()"></div>
      <div><h4>${p.nombre}</h4><small>${p.capacidad} · ${fmt(p.precio)}</small>
        <div class="qty">
          <button data-q="-1" data-id="${p.id}" aria-label="Disminuir cantidad">−</button>
          <span>${n}</span>
          <button data-q="1" data-id="${p.id}" aria-label="Aumentar cantidad" ${n >= p.stock ? "disabled" : ""}>+</button>
        </div></div>
      <div class="it__r"><b>${fmt(p.precio * n)}</b>
        <button class="del" data-del="${p.id}" aria-label="Eliminar ${p.nombre}"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3"/></svg></button></div>
    </div>`).join("")
    : `<div class="vacio"><b>Tu carrito está vacío</b><span>Agrega un producto para verlo aquí.</span></div>`;

  $("#sub").textContent = fmt(sub);
  $("#env").textContent = !sub ? "—" : env ? fmt(env) : "Gratis";
  $("#tot").textContent = fmt(sub + env);
  const falta = TIENDA.envioGratisDesde - sub;
  $("#shipTxt").textContent = !sub ? `Envío gratis desde ${fmt(TIENDA.envioGratisDesde)}` : falta > 0 ? `Te faltan ${fmt(falta)} para envío gratis` : "Tienes envío gratis";
  $("#shipBar").style.width = Math.min(100, sub / TIENDA.envioGratisDesde * 100) + "%";
  $("#pagar").disabled = !sub;
  try { localStorage.setItem("carrito", JSON.stringify(carrito)); } catch {}
}

const abrir = v => {
  document.body.classList.toggle("cart-open", v);
  $("#cart").setAttribute("aria-hidden", !v);
};

/* ---------- Eventos ---------- */
document.addEventListener("click", e => {
  const t = e.target;
  const f = t.closest("[data-f]");
  if (f) setFiltro(isNaN(f.dataset.f) ? f.dataset.f : +f.dataset.f);
  const a = t.closest("[data-add]"); if (a) agregar(+a.dataset.add, a);
  const q = t.closest("[data-q]"); if (q) cambiar(+q.dataset.id, +q.dataset.q);
  const d = t.closest("[data-del]"); if (d) quitar(+d.dataset.del);
  if (t.closest(".menu a")) document.body.classList.remove("menu-open");
});
$("#btnCarrito").onclick = () => abrir(true);
$("#cerrar").onclick = $("#ov").onclick = () => abrir(false);
$("#pagar").onclick = () => alert("El pago se conectará en la siguiente fase del proyecto.");
$("#burger").onclick = () => document.body.classList.toggle("menu-open");
addEventListener("keydown", e => e.key === "Escape" && abrir(false));
addEventListener("scroll", () => $("#nav").classList.toggle("sc", scrollY > 10), { passive: true });

// El USB del hero se inclina suavemente siguiendo el cursor
const hero = $(".hero");
hero.addEventListener("pointermove", e => {
  const r = hero.getBoundingClientRect();
  hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width - .5).toFixed(3));
  hero.style.setProperty("--my", ((e.clientY - r.top) / r.height - .5).toFixed(3));
});

/* ---------- Inicio ---------- */
// Escaparate del hero: rota capacidad y color anodizado
const pick = $("#pick");
let hi = Math.min(2, CATEGORIAS.length - 1), ciclo;
function escaparate(i) {
  hi = i;
  const c = CATEGORIAS[i];
  hero.style.setProperty("--c", color(c));
  $("#big").textContent = c;
  $("#cap").textContent = c;
  $$("button", pick).forEach((b, j) => b.classList.toggle("on", j === i));
}
pick.innerHTML = CATEGORIAS.map((c, i) => `<button data-i="${i}">${c} hits</button>`).join("");
pick.onclick = e => { const b = e.target.closest("[data-i]"); if (b) { clearInterval(ciclo); escaparate(+b.dataset.i); } };
escaparate(hi);
ciclo = setInterval(() => escaparate((hi + 1) % CATEGORIAS.length), 3200);

setFiltro("todos");
renderCarrito();
