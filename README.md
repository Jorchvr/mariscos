# Mariscos Frescos Los Primos — POS Demo

Punto de venta demo estático (sin base de datos) inspirado en el branding del negocio **Mariscos Frescos Los Primos** (Playa Miramar, Tampico, Tamaulipas).

**Demo en vivo:** https://jorchvr.github.io/mariscos/

## Credenciales

- `admin` / `1234`
- `cajero` / `1234`

## Características

- Diseño responsivo (móvil primero, se ve bien en tablet y desktop).
- Login estático.
- Vistas: Venta, Productos, Merma, Corte Diario, Corte Mensual, Dashboard.
- Cobro con efectivo/tarjeta/transferencia, cálculo de cambio y ticket estilo térmico.
- Datos persistidos en `localStorage`. Botón "Reiniciar demo" para regenerar.

## Estructura

```
├── index.html          Login
├── pos.html            POS principal
└── assets/
    ├── styles.css      Estilos (paleta navy/naranja/arena)
    ├── data.js         Catálogo de productos
    ├── login.js        Auth demo
    └── app.js          Lógica del POS
```

## Correr en local

Abre `index.html` directamente en el navegador, o sirve la carpeta:

```bash
python -m http.server 8765
# http://localhost:8765/
```
