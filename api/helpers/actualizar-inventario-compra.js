// api/helpers/actualizar-inventario-compra.js
module.exports = {
  friendlyName: 'Actualizar inventario por compra',
  inputs: {
    articuloId: { type: 'number', required: true },
    cantidadNueva: { type: 'number', required: true },
    costoCompra: { type: 'number', required: true },
    oficinaId: { type: 'number', required: true }
  },
  fn: async function (inputs) {
    // 1. Obtener artículo y existencias actuales en TODAS las oficinas (Almacén Principal)
    const art = await Articulo.findOne({ id: inputs.articuloId }).populate('existenciasOficinas');
    const stockActualOficinas = _.sum(art.existenciasOficinas, 'cantidad');

    // 2. Calcular nuevo Costo Promedio Ponderado
    const valorActual = stockActualOficinas * art.costoPromedio;
    const valorNuevo = inputs.cantidadNueva * inputs.costoCompra;
    const nuevoStockTotal = stockActualOficinas + inputs.cantidadNueva;
    const nuevoCostoPromedio = (valorActual + valorNuevo) / nuevoStockTotal;

    // 3. Actualizar Maestro de Artículos
    await Articulo.updateOne({ id: inputs.articuloId }).set({
      costoPromedio: nuevoCostoPromedio,
      ultimoCostoReal: inputs.costoCompra
    });

    // 4. Aumentar Stock en la Oficina específica
    const stockOfi = await StockOficina.findOne({ articulo: inputs.articuloId, oficina: inputs.oficinaId });
    if (stockOfi) {
      await StockOficina.updateOne({ id: stockOfi.id }).set({ cantidad: stockOfi.cantidad + inputs.cantidadNueva });
    } else {
      await StockOficina.create({ articulo: inputs.articuloId, oficina: inputs.oficinaId, cantidad: inputs.cantidadNueva });
    }

    return { costo: nuevoCostoPromedio, stock: nuevoStockTotal };
  }
};
