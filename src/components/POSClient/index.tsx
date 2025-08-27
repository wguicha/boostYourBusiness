'use client';

import React, { useState } from 'react';
import Image from 'next/image'; // Keep Image for now, might remove if ProductCard handles it
import { recordSale, recordSingleSale } from '@/app/pos/actions';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import styles from './POSClient.module.css';
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

  const handleDirectSaleFromCard = async (product: Product) => {
    setIsSingleSalePending(true); // Set pending state
    setMessage(null);
    try {
      await recordSingleSale(product.id, paymentMethod, businessId);
      setMessage({ type: 'success', text: `Venta directa de ${product.name} registrada!` });
    } catch (error: any) {
      console.error('Error al registrar venta directa:', error);
      setMessage({ type: 'error', text: `Error: ${error.message || 'Error desconocido'}` });
    } finally {
      setIsSingleSalePending(false); // Reset pending state
    }
  };

  return (
    <div className={styles.container}>
      {/* Product Grid */}
      <div className={styles.productGridContainer}>
        <h2 className={styles.sectionTitle}>Productos Disponibles</h2>
        <div className={styles.productGrid}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEditProduct}
              onAddToCart={handleAddToCartFromCard}
              onDirectSale={handleDirectSaleFromCard}
            />
          ))}
        </div>
      </div>

      {/* Cart Summary */}
      <div className={styles.cartSummary}>
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
  );
}
