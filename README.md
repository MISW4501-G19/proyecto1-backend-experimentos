# Microservicios Backend

Backend con microservicios en Node.js (Inventarios, Órdenes, Gateway)

## Arquitectura

- **Gateway** (Puerto 4000): API Gateway con proxy reverso
- **Inventarios** (Puerto 4001): Gestión de productos, bodegas e inventario
- **Órdenes** (Puerto 4002): Gestión de órdenes de compra

## Tecnologías

- Node.js 20
- Express.js
- Sequelize ORM
- SQLite/PostgreSQL
- Docker & Docker Compose

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo híbrido (servicios AWS)
npm run dev:hybrid

# Ejecutar en modo staging
npm run staging

# Detener servicios
npm run stop

# Ver logs
npm run logs
```

## Endpoints

### Gateway (Puerto 4000)
- `GET/POST /inventarios/*` → Inventarios service
- `GET/POST /ordenes/*` → Órdenes service

### Inventarios (Puerto 4001)
- `POST /productos` - Crear producto
- `GET /productos` - Listar productos
- `GET /productos/:id` - Obtener producto por ID
- `POST /bodegas` - Crear bodega
- `GET /bodegas` - Listar bodegas
- `POST /inventarios` - Crear inventario
- `GET /inventarios` - Listar inventarios
- `GET /inventarios/producto/:productoId` - Inventarios por producto
- `PATCH /inventarios/:id` - Actualizar cantidad
- `DELETE /inventarios/:id` - Eliminar inventario

### Órdenes (Puerto 4002)
- `POST /ordenes` - Crear orden (requiere productoId y cantidadTotal)
- `GET /ordenes` - Listar órdenes

## Notas

- Los servicios usan SQLite para desarrollo
- `sequelize.sync({ force: true })` recrea las tablas en cada inicio
- Los inventarios se consumen por fecha de vencimiento (FIFO)
- Las órdenes implementan patrón Saga para consistencia
