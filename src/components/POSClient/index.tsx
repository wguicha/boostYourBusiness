'use client';

import React, { useState } from 'react';
import Image from 'next/image'; // Keep Image for now, might remove if ProductCard handles it
import { recordSale, recordSingleSale } from '@/app/pos/actions';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import styles from './POSClient.module.css';
import CartIcon from '@/components/CartIcon';
import ProductCard from '@/components/ProductCard/index'; // Import ProductCard

// Import Product type from Prisma client, but override price to be string
import { Product as PrismaProduct } from '@prisma/client';

interface Product extends Omit<PrismaProduct, 'price'> {
  price: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface POSClientProps {
  products: Product[];
  businessId: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className={styles.submitButton}
    >
      {pending ? 'Registrando...' : 'Registrar Venta'}
    </button>
  );
}

export default function POSClient({ products, businessId }: POSClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter(); // Initialize useRouter
  const [isSingleSalePending, setIsSingleSalePending] = useState(false); // New state for single sale button
  const [isCartVisible, setIsCartVisible] = useState(false); // State to control cart visibility

  // State for the confirmation modal
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedProductForSale, setSelectedProductForSale] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalPaymentMethod, setModalPaymentMethod] = useState('Efectivo');

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.product.id !== productId);
      }
      return prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);

  const handleRecordSale = async (formData: FormData) => {
    setMessage(null);
    try {
      const saleItems = cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      }));

      await recordSale(saleItems, totalAmount, paymentMethod, businessId);
      setCart([]); // Clear cart on successful sale
      setMessage({ type: 'success', text: 'Venta registrada con éxito y stock actualizado!' });
    } catch (error: any) {
      console.error('Error al registrar la venta:', error);
      setMessage({ type: 'error', text: `Error al registrar la venta: ${error.message || 'Error desconocido'}` });
    }
  };

  // Functions to pass to ProductCard
  const handleEditProduct = (productId: string) => {
    router.push(`/products/${productId}/edit`);
  };

  const handleAddToCartFromCard = (product: Product) => {
    addToCart(product);
  };

  const handleDirectSaleFromCard = (product: Product) => {
    setSelectedProductForSale(product);
    setModalQuantity(1);
    setModalPaymentMethod(paymentMethod);
    setIsConfirmationModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsConfirmationModalOpen(false);
    setSelectedProductForSale(null);
  };

  const handleConfirmSale = async () => {
    if (!selectedProductForSale) return;

    setIsSingleSalePending(true);
    setMessage(null);
    try {
      await recordSingleSale(selectedProductForSale.id, modalPaymentMethod, businessId, modalQuantity);
      setMessage({ type: 'success', text: `Venta directa de ${selectedProductForSale.name} registrada!` });
    } catch (error: any) {
      console.error('Error al registrar venta directa:', error);
      setMessage({ type: 'error', text: `Error: ${error.message || 'Error desconocido'}` });
    } finally {
      setIsSingleSalePending(false);
      handleCloseModal();
    }
  };

  const incrementQuantity = () => {
    setModalQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setModalQuantity(prev => Math.max(1, prev - 1));
  };

  const toggleCart = () => {
    setIsCartVisible(!isCartVisible);
  };

  return (
    <>
      <div className={styles.container}>
        {/* Product Grid */}
        <div className={styles.productGridContainer}>
          <div className={styles.productGrid}>
            {products.map((product) => {
              const productForCard = {
                ...product,
                price: parseFloat(product.price), // Convert price to number
              };
              return (
                <ProductCard
                  key={product.id}
                  product={productForCard}
                  onEdit={handleEditProduct}
                  onAddToCart={handleAddToCartFromCard}
                  onDirectSale={handleDirectSaleFromCard}
                />
              );
            })}
        </div>}
        </div>

        {/* Cart Summary */}
        <div className={`${styles.cartSummary} ${isCartVisible ? styles.cartVisible : ''}`}>
          <button onClick={toggleCart} className={styles.closeCartButton}>
            &times;
          </button>
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
                <div key={item.product.id} className={styles.cartItem}>
                  <span>{item.product.name} (x{item.quantity})</span>
                  <div className={styles.cartItemControls}>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateCartQuantity(item.product.id, parseInt(e.target.value))}
                      className={styles.quantityInput}
                    />
                    <span>${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</span>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className={styles.removeButton}
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className={styles.paymentTotalContainer}>
            <div className={styles.paymentMethodContainer}>
              <label htmlFor="paymentMethod" className={styles.paymentMethodLabel}>Método de Pago</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={styles.paymentMethodSelect}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>
            <div className={styles.totalAmountContainer}>
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <form action={handleRecordSale}>
              <SubmitButton />
            </form>
          </div>
        </div>
      </div>

      {/* Cart Toggle Button */}
      {!isCartVisible && (
        <button onClick={toggleCart} className={styles.cartToggleButton}>
          <CartIcon className={styles.cartIcon} />
          {cart.length > 0 && (
            <span className={styles.cartItemCount}>{cart.length}</span>
          )}
        </button>
      )}

      {/* Confirmation Modal */}
      {isConfirmationModalOpen && selectedProductForSale && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.sectionTitle}>Confirmar Venta Directa</h2>
            <p>Producto: <strong>{selectedProductForSale.name}</strong></p>
            <div className={styles.modalForm}>
              <label htmlFor="quantity">Cantidad:</label>
              <div className={styles.quantityControl}>
                <button onClick={decrementQuantity} className={styles.quantityButton}>-</button>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={modalQuantity}
                  onChange={(e) => setModalQuantity(parseInt(e.target.value))}
                  className={styles.quantityInput}
                />
                <button onClick={incrementQuantity} className={styles.quantityButton}>+</button>
              </div>
              <label htmlFor="paymentMethodModal">Método de Pago:</label>
              <select
                id="paymentMethodModal"
                value={modalPaymentMethod}
                onChange={(e) => setModalPaymentMethod(e.target.value)}
                className={styles.paymentMethodSelect}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>
            <div className={styles.modalActions}>
              <button onClick={handleCloseModal} className={styles.cancelButton}>
                Cancelar
              </button>
              <button onClick={handleConfirmSale} className={styles.confirmButton} disabled={isSingleSalePending}>
                {isSingleSalePending ? 'Registrando...' : 'Confirmar Venta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
