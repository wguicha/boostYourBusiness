'use client';

import React, { useState, useEffect } from 'react';
import styles from './SalesReport.module.css';
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; // Import Spanish locale
import Modal from '@/components/Modal'; // Import the Modal component

// Define types matching the new API response
interface Product {
  id: string;
  name: string;
  price: string;
  quantity: number;
  type: 'product'; // Added type for consistency
}

interface ComboProductItem {
  product: Product;
  quantity: number;
}

interface Combo {
  id: string;
  name: string;
  price: string;
  products: ComboProductItem[];
  type: 'combo'; // Added type for consistency
}

interface SaleItem {
  id: string;
  quantity: number;
  priceAtSale: string;
  productId?: string;
  product?: Product;
  comboId?: string;
  combo?: Combo;
}

interface Sale {
  id: string;
  totalAmount: string;
  paymentMethod: string;
  createdAt: string; // Date string from API
  items: SaleItem[];
}

export default function SalesReportPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sales, setSales] = useState<Sale[]>([]); // Changed from report to sales
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null); // State for expanding sale details

  // State for editing a sale
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editFormPaymentMethod, setEditFormPaymentMethod] = useState('');
  const [editFormItems, setEditFormItems] = useState<SaleItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // To populate product dropdowns in edit form

  const fetchSales = async () => { // Renamed from fetchSalesReport
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      console.log('Fetching sales with params:', params.toString()); // Debug log
      const response = await fetch(`/api/sales?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API response not OK:', response.status, response.statusText, errorData); // Debug log
        throw new Error(errorData.message || 'Failed to fetch sales data');
      }
      const data = await response.json(); // Expecting an object with sales, productsReport, paymentMethodsReport
      console.log('Received sales data:', data); // Debug log
      setSales(data.sales); // Set sales from the 'sales' property of the response
    } catch (err: any) {
      console.error('Error in fetchSales:', err); // Debug log
      setError(err.message);
      setSales([]); // Clear sales on error
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data: Product[] = await response.json();
      setAllProducts(data);
    } catch (err: any) {
      console.error('Error fetching all products:', err);
    }
  };

  // Fetch sales on initial load and when dates change
  useEffect(() => {
    fetchSales();
    fetchAllProducts(); // Fetch all products once for the edit form
  }, [startDate, endDate]);

  const toggleExpand = (saleId: string) => {
    setExpandedSaleId(expandedSaleId === saleId ? null : saleId);
  };

  const handleEditClick = async (sale: Sale) => {
    setEditingSale(sale);
    setEditFormPaymentMethod(sale.paymentMethod);
    // Deep copy items to avoid direct mutation of original sale object
    setEditFormItems(sale.items.map(item => ({
      ...item,
      priceAtSale: item.priceAtSale.toString(), // Ensure string for input
      product: item.product ? { ...item.product, price: item.product.price.toString() } : undefined,
      combo: item.combo ? {
        ...item.combo,
        price: item.combo.price.toString(),
        products: item.combo.products.map(cp => ({
          ...cp,
          product: { ...cp.product, price: cp.product.price.toString() }
        }))
      } : undefined,
    })));
    setIsEditModalOpen(true);
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingSale(null);
    setEditFormPaymentMethod('');
    setEditFormItems([]);
  };

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    try {
      const response = await fetch(`/api/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: editFormPaymentMethod,
          items: editFormItems.map(item => ({
            id: item.id, // Keep existing item ID for update
            productId: item.productId,
            comboId: item.comboId,
            quantity: item.quantity,
            priceAtSale: parseFloat(item.priceAtSale),
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update sale');
      }

      fetchSales(); // Refresh sales list
      handleCancelEdit(); // Close modal
    } catch (err: any) {
      alert(`Error al actualizar la venta: ${err.message}`);
    }
  };

  const handleEditItemQuantityChange = (index: number, newQuantity: number) => {
    const updatedItems = [...editFormItems];
    updatedItems[index].quantity = newQuantity;
    // Recalculate priceAtSale if needed, or assume it's fixed for existing items
    setEditFormItems(updatedItems);
  };

  const handleEditItemPriceChange = (index: number, newPrice: string) => {
    const updatedItems = [...editFormItems];
    updatedItems[index].priceAtSale = newPrice;
    setEditFormItems(updatedItems);
  };

  const handleRemoveEditItem = (index: number) => {
    const updatedItems = [...editFormItems];
    updatedItems.splice(index, 1);
    setEditFormItems(updatedItems);
  };

  const handleAddEditItem = () => {
    setEditFormItems([...editFormItems, { id: `new-${Date.now()}`, quantity: 1, priceAtSale: '0', productId: '', product: undefined, comboId: '', combo: undefined }]);
  };

  const handleEditItemProductChange = (index: number, newProductId: string) => {
    const updatedItems = [...editFormItems];
    const selectedProduct = allProducts.find(p => p.id === newProductId);
    if (selectedProduct) {
      updatedItems[index] = {
        id: `new-${Date.now()}`, // Assign a new temp ID for new items
        productId: selectedProduct.id,
        quantity: 1,
        priceAtSale: selectedProduct.price,
        product: selectedProduct,
        comboId: undefined,
        combo: undefined,
      };
      setEditFormItems(updatedItems);
    }
  };


  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Detalle de Ventas</h1>

      <div className={styles.filterCard}>
        <h2 className={styles.filterTitle}>Filtros de Fecha</h2>
        <div className={styles.grid}>
          <div>
            <label htmlFor="startDate" className={styles.label}>Fecha de Inicio:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.input}
            />
          </div>
          <div>
            <label htmlFor="endDate" className={styles.label}>Fecha de Fin:</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.input}
            />
          </div>
        </div>
        <button
          onClick={fetchSales}
          className={styles.button}
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Actualizar Reporte'}
        </button>
      </div>

      {error && (
        <div className={styles.errorAlert} role="alert">
          <strong className={styles.errorStrong}>Error:</strong>
          <span className={styles.errorSpan}> {error}</span>
        </div>
      )}

      {loading && <p>Cargando ventas...</p>}

      {!loading && sales.length === 0 && !error && (
        <p className={styles.noData}>No hay ventas para el período seleccionado.</p>
      )}

      {!loading && sales.length > 0 && (
        <div className={styles.salesList}>
          {sales.map((sale) => (
            <div key={sale.id} className={styles.saleCard}>
              <div className={styles.saleHeader}>
                <div className={styles.saleInfo}>
                  <span className={styles.saleDate}>
                    {format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                  <span className={styles.salePaymentMethod}>{sale.paymentMethod}</span>
                </div>
                <div className={styles.saleTotal}>
                  Total: {parseFloat(sale.totalAmount).toFixed(2)}€
                </div>
                <button onClick={() => toggleExpand(sale.id)} className={styles.expandButton}>
                  {expandedSaleId === sale.id ? '▲' : '▼'}
                </button>
                <button onClick={() => handleEditClick(sale)} className={styles.editButton} title="Editar Venta">✏️</button>
              </div>

              {expandedSaleId === sale.id && (
                <div className={styles.saleDetails}>
                  <h4 className={styles.detailsTitle}>Items de la Venta:</h4>
                  <table className={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th>Producto/Combo</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale.items.map((item) => {
                        const itemName = item.product?.name || item.combo?.name || 'Desconocido';
                        const itemPrice = parseFloat(item.priceAtSale);
                        const subtotal = itemPrice * item.quantity;

                        return (
                          <tr key={item.id}>
                            <td>
                              {itemName}
                              {item.combo && (
                                <ul className={styles.comboContents}>
                                  {item.combo.products.map(cp => (
                                    <li key={cp.product.id}>- {cp.quantity} x {cp.product.name}</li>
                                  ))}
                                </ul>
                              )}
                            </td>
                            <td>{item.quantity}</td>
                            <td>{itemPrice.toFixed(2)}€</td>
                            <td>{subtotal.toFixed(2)}€</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Sale Modal */}
      <Modal isOpen={isEditModalOpen} onClose={handleCancelEdit} title="Editar Venta">
        {editingSale && (
          <form onSubmit={handleUpdateSale} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="paymentMethod">Método de Pago:</label>
              <input
                type="text"
                id="paymentMethod"
                value={editFormPaymentMethod}
                onChange={(e) => setEditFormPaymentMethod(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <h3 className={styles.detailsTitle}>Items de la Venta:</h3>
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th>Producto/Combo</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {editFormItems.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      {item.productId ? (
                        <select
                          value={item.productId}
                          onChange={(e) => handleEditItemProductChange(index, e.target.value)}
                          className={styles.input}
                        >
                          <option value="">Seleccionar Producto</option>
                          {allProducts.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span>{item.combo?.name || 'Desconocido'} (Combo)</span>
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleEditItemQuantityChange(index, parseInt(e.target.value, 10))}
                        className={styles.input}
                        min="1"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={item.priceAtSale}
                        onChange={(e) => handleEditItemPriceChange(index, e.target.value)}
                        className={styles.input}
                        min="0"
                      />
                    </td>
                    <td>
                      <button type="button" onClick={() => handleRemoveEditItem(index)} className={styles.removeButton}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" onClick={handleAddEditItem} className={styles.button}>Añadir Item</button>

            <div className={styles.modalActions}>
              <button type="button" onClick={handleCancelEdit} className={styles.cancelButton}>
                Cancelar
              </button>
              <button type="submit" className={styles.button}>
                Actualizar Venta
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
