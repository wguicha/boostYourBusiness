'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useBusiness } from '@/context/BusinessContext';
import { recordSale, recordSingleSale } from '@/app/pos/actions';
import styles from './POSClient.module.css';
import ProductCard from '@/components/ProductCard/index';
import ComboCard from '@/components/ComboCard';
import Modal from '@/components/Modal';
import EditProductForm from '@/components/EditProductForm';
import CartIcon from '@/components/CartIcon';
import Image from 'next/image';

import { Product, Combo } from '@/types/shared';

import { ProductType } from '@prisma/client';

// Type Definitions
interface CartItem { id: string; name: string; price: string; quantity: number; salePrice: number; type: 'product' | 'combo'; }

const paymentMethodsConfig = [
  { id: 'Efectivo', name: 'Efectivo', logoPath: '/efectivoLogo.png' },
  { id: 'MB Way', name: 'MB Way', logoPath: '/mbwayLogo.png' },
  { id: 'Tarjeta de Crédito', name: 'Tarjeta de Crédito', logoPath: '/ccLogo.png' },
];

// SubmitButton component (moved outside for clarity)
function SubmitButton() {
  // Assuming useFormStatus is imported from 'react-dom'
  // This component is typically used with <form action={...}>
  return (
    <button 
      type="submit" 
      // disabled={pending} // Uncomment if you use useFormStatus
      className={styles.submitButton}
    >
      Registrar Venta
    </button>
  );
}

export default function POSClient() {
  const { activeBusiness, loading: businessLoading } = useBusiness();

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State for the confirmation modal (direct sale)
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedItemForSale, setSelectedItemForSale] = useState<Product | Combo | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'product' | 'combo' | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalPaymentMethod, setModalPaymentMethod] = useState('Efectivo');
  const [modalSalePrice, setModalSalePrice] = useState<number>(0);
  const [isSingleSalePending, setIsSingleSalePending] = useState(false);

  // State for the edit product modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Fetch data based on active business
  const fetchData = useCallback(async (): Promise<void> => {
    if (!activeBusiness) {
      console.log('No active business, cannot fetch data.');
      setProducts([]);
      setCombos([]);
      setLoading(false);
      return;
    }
    console.log('Fetching data for business ID:', activeBusiness.id);
    setLoading(true);
    setError(null);
    try {
      const [productsRes, combosRes] = await Promise.all([
        fetch(`/api/products?businessId=${activeBusiness.id}`),
        fetch(`/api/combos?businessId=${activeBusiness.id}`),
      ]);
      if (!productsRes.ok || !combosRes.ok) throw new Error('Failed to fetch products or combos');
      const productsData = await productsRes.json();
      const combosData = await combosRes.json();

      // Convert date strings to Date objects for products
      const processedProducts = productsData.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }));

      // Convert date strings to Date objects for combos and their nested products
      const processedCombos = combosData.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
        products: c.products.map((cp: any) => ({
          ...cp,
          product: {
            ...cp.product,
            createdAt: new Date(cp.product.createdAt),
            updatedAt: new Date(cp.product.updatedAt),
          },
        })),
        type: 'combo',
      }));

      setProducts(processedProducts);
      setCombos(processedCombos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addToCart = useCallback((item: Product | Combo, type: 'product' | 'combo') => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id && cartItem.type === type);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id && cartItem.type === type ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      } else {
        return [...prevCart, {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          salePrice: parseFloat(item.price),
          type: type,
        }];
      }
    });
  }, []);

  const removeFromCart = useCallback((itemId: string, itemType: 'product' | 'combo') => {
    setCart((prevCart) => prevCart.filter(item => !(item.id === itemId && item.type === itemType)));
  }, []);

  const updateCartQuantity = useCallback((itemId: string, itemType: 'product' | 'combo', newQuantity: number) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => !(item.id === itemId && item.type === itemType));
      }
      return prevCart.map(item =>
        item.id === itemId && item.type === itemType ? { ...item, quantity: newQuantity } : item
      );
    });
  }, []);

  const incrementCartQuantity = useCallback((itemId: string, itemType: 'product' | 'combo') => {
    setCart(prevCart => prevCart.map(item =>
      item.id === itemId && item.type === itemType ? { ...item, quantity: item.quantity + 1 } : item
    ));
  }, []);

  const decrementCartQuantity = useCallback((itemId: string, itemType: 'product' | 'combo') => {
    setCart(prevCart => {
      const itemToUpdate = prevCart.find(item => item.id === itemId && item.type === itemType);
      if (itemToUpdate && itemToUpdate.quantity <= 1) {
        return prevCart.filter(item => !(item.id === itemId && item.type === itemType));
      }
      return prevCart.map(item =>
        item.id === itemId && item.type === itemType ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  }, []);

  const updateCartItemPrice = useCallback((itemId: string, itemType: 'product' | 'combo', newPrice: string) => {
    setCart(prevCart => prevCart.map(item =>
      item.id === itemId && item.type === itemType ? { ...item, salePrice: parseFloat(newPrice) || 0 } : item
    ));
  }, []);

  const incrementCartItemPrice = useCallback((itemId: string, itemType: 'product' | 'combo') => {
    setCart(prevCart => prevCart.map(item =>
      item.id === itemId && item.type === itemType ? { ...item, salePrice: item.salePrice + 0.5 } : item
    ));
  }, []);

  const decrementCartItemPrice = useCallback((itemId: string, itemType: 'product' | 'combo') => {
    setCart(prevCart => prevCart.map(item =>
      item.id === itemId && item.type === itemType ? { ...item, salePrice: Math.max(0, item.salePrice - 0.5) } : item
    ));
  }, []);

  const handleRecordSale = async () => {
    if (!activeBusiness) return alert('No active business selected.');
    setMessage(null);

    // Client-side stock validation
    const stockRequirements: { [productId: string]: number } = {};

    for (const item of cart) {
      if (item.type === 'product') {
        stockRequirements[item.id] = (stockRequirements[item.id] || 0) + item.quantity;
      } else if (item.type === 'combo') {
        const comboDetails = combos.find(c => c.id === item.id);
        if (comboDetails) {
          for (const comboProduct of comboDetails.products) {
            const productId = comboProduct.product.id;
            const requiredQty = comboProduct.quantity * item.quantity;
            stockRequirements[productId] = (stockRequirements[productId] || 0) + requiredQty;
          }
        }
      }
    }

    for (const productId in stockRequirements) {
      const product = products.find(p => p.id === productId);
      const required = stockRequirements[productId];
      if (!product || product.quantity < required) {
        const productName = product ? product.name : 'un producto desconocido';
        setMessage({ type: 'error', text: `Stock insuficiente para '${productName}'. Necesitas ${required} pero solo hay ${product?.quantity || 0} disponible.` });
        return; // Stop the sale
      }
    }

    try {
      const saleItems = cart.map(item => ({ ...item, price: item.salePrice.toString() }));
      const totalAmount = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
      await recordSale(saleItems, totalAmount, paymentMethod, activeBusiness.id);
      setCart([]);
      setIsCartVisible(false);
      setMessage({ type: 'success', text: 'Sale recorded successfully!' });
      fetchData(); // Refetch data to update stock
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${(error as Error).message}` });
    }
  };

  const handleEditProduct = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setProductToEdit(product);
      setIsEditModalOpen(true);
    }
  }, [products]);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setProductToEdit(null);
    fetchData(); // Refresh the product list after editing
  }, [fetchData]);

  const handleAddToCartFromCard = useCallback((product: Product) => {
    addToCart(product, 'product');
  }, [addToCart]);

  const handleAddToCartComboFromCard = useCallback((combo: Combo) => {
    addToCart(combo, 'combo');
  }, [addToCart]);

  const handleDirectSaleFromCard = useCallback((item: Product | Combo, type: 'product' | 'combo') => {
    setSelectedItemForSale(item);
    setSelectedItemType(type);
    setModalQuantity(1);
    setModalPaymentMethod(paymentMethod);
    setModalSalePrice(parseFloat(item.price));
    setIsConfirmationModalOpen(true);
  }, [paymentMethod]);

  const handleCloseModal = useCallback(() => {
    setIsConfirmationModalOpen(false);
    setSelectedItemForSale(null);
    setSelectedItemType(null);
  }, []);

  const handleConfirmSale = async () => {
    if (!selectedItemForSale || !selectedItemType) return;

    setIsSingleSalePending(true);
    setMessage(null);
    try {
      await recordSingleSale(selectedItemForSale.id, modalPaymentMethod, activeBusiness!.id, modalQuantity, modalSalePrice, selectedItemType);
      setMessage({ type: 'success', text: `Direct sale of ${selectedItemForSale.name} recorded!` });
    } catch (error) {
      console.error('Error recording direct sale:', error);
      setMessage({ type: 'error', text: `Error: ${(error as Error).message}` });
    } finally {
      setIsSingleSalePending(false);
      handleCloseModal();
      fetchData(); // Refresh data to update stock
    }
  };

  const incrementQuantity = useCallback(() => {
    setModalQuantity(prev => prev + 1);
  }, []);

  const decrementQuantity = useCallback(() => {
    setModalQuantity(prev => Math.max(1, prev - 1));
  }, []);

  const incrementSalePrice = useCallback(() => {
    setModalSalePrice(prev => (parseFloat(String(prev)) + 0.5));
  }, []);

  const decrementSalePrice = useCallback(() => {
    setModalSalePrice(prev => Math.max(0, parseFloat(String(prev)) - 0.5));
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartVisible(!isCartVisible);
  }, [isCartVisible]);

  const totalAmount = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);

  if (businessLoading || loading) return <p>Loading...</p>;
  if (!activeBusiness) return <div className={styles.container}><p>Please select a business to start a sale.</p></div>;
  if (error) return <div className={styles.container}><p>Error loading data: {error}</p></div>;

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* Cart Summary */}
      {isCartVisible && (
        <div className={styles.cartSummary}>
          <button onClick={toggleCart} className={styles.closeCartButton}>&times;</button>
          <h2 className={styles.sectionTitle}>Carrito de Compras</h2>
          {message && (
            <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
              {message.text}
            </div>
          )}
          {cart.length === 0 ? (
            <p className={styles.emptyCartMessage}>El carrito está vacío.</p>
          ) : (
            <div className={styles.cartItemsContainer}>
              {cart.map((item) => (
                <div key={`${item.id}-${item.type}`} className={styles.cartItem}>
                  <div className={styles.cartItemMainRow}>
                    <span className={styles.cartItemName}>{item.name} {item.type === 'combo' && '(Combo)'}</span>
                  </div>
                  <div className={styles.cartItemSubRow}>
                    <div className={styles.priceControl}>
                      <button type="button" onClick={() => decrementCartItemPrice(item.id, item.type)} className={styles.quantityButton}>-</button>
                      <div className={styles.priceInputContainer}>
                        <input type="number" step="0.01" value={item.salePrice} onChange={(e) => updateCartItemPrice(item.id, item.type, e.target.value)} className={styles.quantityInput} />
                        <span className={styles.currencySymbol}>€</span>
                      </div>
                      <button type="button" onClick={() => incrementCartItemPrice(item.id, item.type)} className={styles.quantityButton}>+</button>
                    </div>
                    <div className={styles.quantityControl}>
                      <button type="button" onClick={() => decrementCartQuantity(item.id, item.type)} className={styles.quantityButton}>-</button>
                      <input type="number" min="1" value={item.quantity} onChange={(e) => { const parsedQuantity = parseInt(e.target.value, 10); if (!isNaN(parsedQuantity)) { updateCartQuantity(item.id, item.type, parsedQuantity); } else if (e.target.value === '') { updateCartQuantity(item.id, item.type, 0); } }} className={styles.quantityInput} />
                      <button type="button" onClick={() => incrementCartQuantity(item.id, item.type)} className={styles.quantityButton}>+</button>
                    </div>
                    <span className={styles.lineTotal}>${(item.salePrice * item.quantity).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item.id, item.type)} className={styles.removeButton}>X</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className={styles.paymentTotalContainer}>
            <div className={styles.paymentMethodContainer}>
              <label className={styles.paymentMethodLabel}>Método de Pago</label>
              <div className={styles.paymentMethodLogos}>
                {paymentMethodsConfig.map((method) => (
                  <button key={method.id} type="button" onClick={() => setPaymentMethod(method.id)} className={`${styles.paymentMethodLogoButton} ${paymentMethod === method.id ? styles.paymentMethodLogoButtonSelected : ''}`}><Image src={method.logoPath} alt={method.name} width={50} height={50} className={styles.paymentLogo} /></button>
                ))}
              </div>
            </div>
            <div className={styles.totalAmountContainer}>
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <form action={handleRecordSale}><SubmitButton /></form>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className={styles.productGridContainer}>
        {!isCartVisible && (
          <button onClick={toggleCart} className={styles.cartToggleButton}>
            <CartIcon className={styles.cartIcon} />
            {cart.length > 0 && (
              <span className={styles.cartItemCount}>{cart.reduce((total, item) => total + item.quantity, 0)}</span>
            )}
          </button>
        )}
        <div className={styles.productGrid}>
          <div className={styles.productSection}>
            <h2 className={styles.sectionTitle}>Productos</h2>
            <div className={styles.productCardGrid}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onEdit={handleEditProduct} onDelete={() => {}} onAddToCart={handleAddToCartFromCard} onDirectSale={(product) => handleDirectSaleFromCard(product, 'product')} showEditAction={true} showDeleteAction={false} showSaleActions={true} />
              ))}
            </div>
          </div>
          <div className={styles.comboSection}>
            <h2 className={styles.sectionTitle}>Combos</h2>
            <div className={styles.comboCardGrid}>
              {combos.map((combo) => {
                const availableComboQuantity = combo.products.reduce((minQty, cp) => {
                  const productInStock = products.find(p => p.id === cp.product.id);
                  if (!productInStock || cp.quantity === 0) return 0;
                  return Math.min(minQty, Math.floor(productInStock.quantity / cp.quantity));
                }, Infinity);
                return (
                  <ComboCard key={combo.id} combo={combo} availableQuantity={availableComboQuantity === Infinity ? 0 : availableComboQuantity} onAddToCart={handleAddToCartComboFromCard} onDirectSale={(combo) => handleDirectSaleFromCard(combo, 'combo')} />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmationModalOpen && selectedItemForSale && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.sectionTitle}>Confirmar Venta Directa</h2>
            <p>Artículo: <strong>{selectedItemForSale.name} {selectedItemType === 'combo' && '(Combo)'}</strong></p>
            <div className={styles.modalForm}>
              <label htmlFor="quantity">Cantidad:</label>
              <div className={styles.quantityControl}>
                <button onClick={decrementQuantity} className={styles.quantityButton}>-</button>
                <input type="number" id="quantity" min="1" value={modalQuantity} onChange={(e) => setModalQuantity(parseInt(e.target.value))} className={styles.quantityInput} />
                <button onClick={incrementQuantity} className={styles.quantityButton}>+</button>
              </div>
              <label htmlFor="salePrice">Precio de Venta:</label>
              <div className={styles.quantityControl}>
                <button type="button" onClick={decrementSalePrice} className={styles.quantityButton}>-</button>
                <input type="number" id="salePrice" step="0.01" value={modalSalePrice} onChange={(e) => setModalSalePrice(parseFloat(e.target.value))} className={styles.quantityInput} />
                <button type="button" onClick={incrementSalePrice} className={styles.quantityButton}>+</button>
              </div>
              <label>Método de Pago:</label>
              <div className={styles.paymentMethodLogos}>
                {paymentMethodsConfig.map((method) => (
                  <button key={method.id} type="button" onClick={() => setModalPaymentMethod(method.id)} className={`${styles.paymentMethodLogoButton} ${modalPaymentMethod === method.id ? styles.paymentMethodLogoButtonSelected : ''}`}><Image src={method.logoPath} alt={method.name} width={50} height={50} className={styles.paymentLogo} /></button>
                ))}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button onClick={handleCloseModal} className={styles.cancelButton}>Cancelar</button>
              <button onClick={handleConfirmSale} className={styles.confirmButton} disabled={isSingleSalePending}>Confirmar Venta</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && productToEdit && (
        <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Editar Producto">
          <EditProductForm product={productToEdit} onClose={handleCloseEditModal} />
        </Modal>
      )}
    </div>
  );
}