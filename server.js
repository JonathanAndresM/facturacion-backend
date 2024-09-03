// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/facturacion', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB', err));

// Definir esquemas y modelos
const clienteSchema = new mongoose.Schema({
  nombre: String,
  direccion: String,
  telefono: String,
  correo: String
});

const productoSchema = new mongoose.Schema({
    nombre: String,
    descripcion: String,
    precio: Number,
    cantidad: Number
  });
  
  const facturaSchema = new mongoose.Schema({
    fecha: { type: Date, default: Date.now },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
    total: Number
  });
  
  const detalleFacturaSchema = new mongoose.Schema({
    facturaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factura' },
    productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    cantidad: Number,
    precio: Number
  });

const Cliente = mongoose.model('Cliente', clienteSchema);
const Producto = mongoose.model('Producto', productoSchema);
const Factura = mongoose.model('Factura', facturaSchema);
const DetalleFactura = mongoose.model('DetalleFactura', detalleFacturaSchema);

// Rutas API
app.get('/clientes', async (req, res) => {
  const clientes = await Cliente.find();
  res.json(clientes);
});

app.post('/clientes', async (req, res) => {
  const nuevoCliente = new Cliente(req.body);
  await nuevoCliente.save();
  res.json(nuevoCliente);
});

// Obtener todos los productos
app.get('/productos', async (req, res) => {
    try {
      const productos = await Producto.find();
      res.json(productos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Crear un nuevo producto
  app.post('/productos', async (req, res) => {
    try {
      const nuevoProducto = new Producto(req.body);
      const productoGuardado = await nuevoProducto.save();
      res.json(productoGuardado);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Actualizar un producto existente
  app.put('/productos/:id', async (req, res) => {
    try {
      const productoActualizado = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(productoActualizado);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Eliminar un producto
  app.delete('/productos/:id', async (req, res) => {
    try {
      await Producto.findByIdAndDelete(req.params.id);
      res.json({ message: 'Producto eliminado' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Rutas API para Facturación

// Crear una nueva factura
app.post('/facturas', async (req, res) => {
    try {
      const { clienteId, detalles } = req.body;
  
      // Calcular el total de la factura
      let total = 0;
      for (const detalle of detalles) {
        const producto = await Producto.findById(detalle.productoId);
        total += producto.precio * detalle.cantidad;
      }
  
      const nuevaFactura = new Factura({ clienteId, total });
      const facturaGuardada = await nuevaFactura.save();
  
      for (const detalle of detalles) {
        const nuevoDetalle = new DetalleFactura({
          facturaId: facturaGuardada._id,
          productoId: detalle.productoId,
          cantidad: detalle.cantidad,
          precio: detalle.precio
        });
        await nuevoDetalle.save();
      }
  
      res.json(facturaGuardada);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Obtener todas las facturas
  app.get('/facturas', async (req, res) => {
    try {
      const facturas = await Factura.find().populate('clienteId');
      res.json(facturas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Obtener detalles de una factura específica
  app.get('/facturas/:id', async (req, res) => {
    try {
      const factura = await Factura.findById(req.params.id)
        .populate('clienteId')
        .exec();
      const detalles = await DetalleFactura.find({ facturaId: req.params.id }).populate('productoId').exec();
      res.json({ factura, detalles });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});