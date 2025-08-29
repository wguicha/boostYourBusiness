'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { recordSale, recordSingleSale } from '@/app/pos/actions';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import styles from './POSClient.module.css';
import CartIcon from '@/components/CartIcon';
import ProductCard from '@/components/ProductCard/index';
import Modal from '@/components/Modal'; // Import the Modal component
import EditProductForm from '@/components/EditProductForm'; // Import the EditProductForm

// Import Product type from Prisma client, but override price to be string
import { Product as PrismaProduct } from '@prisma/client';

interface Product extends Omit<PrismaProduct, 'price'> {
  price: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  salePrice: number;
}

interface POSClientProps {
  products: Product[];
  businessId: string;
}

const paymentMethodsConfig = [
  { id: 'Efectivo', name: 'Efectivo', logoPath: '/efectivoLogo.png' },
  { id: 'MB Way', name: 'MB Way', logoPath: '/mbwayLogo.png' },
  { id: 'Tarjeta de Crédito', name: 'Tarjeta de Crédito', logoPath: '/ccLogo.png' },
];

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
  const [paymentMethod, setPaymentMethod] = useState('Efectivo'); // Default to Efectivo
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const [isSingleSalePending, setIsSingleSalePending] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(false); // Default to hidden

  // State for the confirmation modal
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedProductForSale, setSelectedProductForSale] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalPaymentMethod, setModalPaymentMethod] = useState('Efectivo'); // Default to Efectivo
  const [modalSalePrice, setModalSalePrice] = useState<number | string>('');

  // State for the edit product modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { product, quantity: 1, salePrice: parseFloat(product.price) }];
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

  const incrementCartQuantity = (productId: string) => {
    setCart(prevCart => prevCart.map(item => 
      item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const decrementCartQuantity = (productId: string) => {
    setCart(prevCart => {
      const itemToUpdate = prevCart.find(item => item.product.id === productId);
      if (itemToUpdate && itemToUpdate.quantity <= 1) {
        return prevCart.filter(item => item.product.id !== productId);
      }
      return prevCart.map(item => 
        item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const updateCartItemPrice = (productId: string, newPrice: string) => {
    setCart(prevCart => prevCart.map(item => 
      item.product.id === productId ? { ...item, salePrice: parseFloat(newPrice) || 0 } : item
    ));
  };

  const incrementCartItemPrice = (productId: string) => {
    setCart(prevCart => prevCart.map(item => 
      item.product.id === productId ? { ...item, salePrice: item.salePrice + 0.5 } : item
    ));
  };

  const decrementCartItemPrice = (productId: string) => {
    setCart(prevCart => prevCart.map(item => 
      item.product.id === productId ? { ...item, salePrice: Math.max(0, item.salePrice - 0.5) } : item
    ));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);

  const handleRecordSale = async (formData: FormData) => {
    setMessage(null);
    try {
      const saleItems = cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.salePrice.toString(), // Use the editable salePrice
        quantity: item.quantity,
      }));

      await recordSale(saleItems, totalAmount, paymentMethod, businessId);
      setCart([]);
      setIsCartVisible(false); // Close cart on successful sale
      setMessage({ type: 'success', text: 'Venta registrada con éxito y stock actualizado!' });
    } catch (error: any) {
      console.error('Error al registrar la venta:', error);
      setMessage({ type: 'error', text: `Error al registrar la venta: ${error.message || 'Error desconocido'}` });
    }
  };

  const handleEditProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setProductToEdit(product);
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setProductToEdit(null);
    router.refresh(); // Refresh the product list after editing
  };

  const handleAddToCartFromCard = (product: Product) => {
    addToCart(product);
  };

  const handleDirectSaleFromCard = (product: Product) => {
    setSelectedProductForSale(product);
    setModalQuantity(1);
    setModalPaymentMethod(paymentMethod); // Use current cart payment method as default for modal
    setModalSalePrice(parseFloat(product.price)); // Set initial price for editing
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
      const salePrice = typeof modalSalePrice === 'string' ? parseFloat(modalSalePrice) : modalSalePrice;
      await recordSingleSale(selectedProductForSale.id, modalPaymentMethod, businessId, modalQuantity, salePrice);
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

  const incrementSalePrice = () => {
    setModalSalePrice(prev => (parseFloat(String(prev)) + 0.5));
  };

  const decrementSalePrice = () => {
    setModalSalePrice(prev => Math.max(0, parseFloat(String(prev)) - 0.5));
  };

  const toggleCart = () => {
    setIsCartVisible(!isCartVisible);
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div className={styles.container}>
        {/* Cart Summary - Now conditionally rendered */}
        {isCartVisible && (
          <div className={styles.cartSummary}>
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
                    <div className={styles.cartItemMainRow}>
                      <span className={styles.cartItemName}>{item.product.name}</span>
                    </div>
                    <div className={styles.cartItemSubRow}>
                      <div className={styles.priceControl}>
                        <button type="button" onClick={() => decrementCartItemPrice(item.product.id)} className={styles.quantityButton}>-</button>
                        <div className={styles.priceInputContainer}>
                          <input
                            type="number"
                            step="0.01"
                            value={item.salePrice}
                            onChange={(e) => updateCartItemPrice(item.product.id, e.target.value)}
                            className={styles.quantityInput}
                          />
                          <span className={styles.currencySymbol}>€</span>
                        </div>
                        <button type="button" onClick={() => incrementCartItemPrice(item.product.id)} className={styles.quantityButton}>+</button>
                      </div>
                      <div className={styles.quantityControl}>
                        <button type="button" onClick={() => decrementCartQuantity(item.product.id)} className={styles.quantityButton}>-</button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateCartQuantity(item.product.id, parseInt(e.target.value))}
                          className={styles.quantityInput}
                        />
                        <button type="button" onClick={() => incrementCartQuantity(item.product.id)} className={styles.quantityButton}>+</button>
                      </div>
                      <span className={styles.lineTotal}>${(item.salePrice * item.quantity).toFixed(2)}</span>
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
                <label className={styles.paymentMethodLabel}>Método de Pago</label>
                <div className={styles.paymentMethodLogos}>
                  {paymentMethodsConfig.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`${styles.paymentMethodLogoButton} ${paymentMethod === method.id ? styles.paymentMethodLogoButtonSelected : ''}`}
                    >
                      <Image
                        src={method.logoPath}
                        alt={method.name}
                        width={50}
                        height={50}
                        className={styles.paymentLogo}
                      />
                    </button>
                  ))}
                </div>
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
        )}

        {/* Product Grid */}
        <div className={styles.productGridContainer}>
          {/* Cart Toggle Button - Now sticky inside the grid container */}
          {!isCartVisible && (
            <button onClick={toggleCart} className={styles.cartToggleButton}>
              <CartIcon className={styles.cartIcon} />
              {cart.length > 0 && (
                <span className={styles.cartItemCount}>{cart.reduce((total, item) => total + item.quantity, 0)}</span>
              )}
            </button>
          )}
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
          </div>
        </div>
      </div>

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
              <label htmlFor="salePrice">Precio de Venta:</label>
              <div className={styles.quantityControl}> {/* Reusing quantityControl style for layout */}
                <button type="button" onClick={decrementSalePrice} className={styles.quantityButton}>-</button>
                <input
                  type="number"
                  id="salePrice"
                  step="0.01"
                  value={modalSalePrice}
                  onChange={(e) => setModalSalePrice(e.target.value)}
                  className={styles.quantityInput} // Reusing quantityInput style
                />
                <button type="button" onClick={incrementSalePrice} className={styles.quantityButton}>+</button>
              </div>
              <label>Método de Pago:</label>
              <div className={styles.paymentMethodLogos}>
                {paymentMethodsConfig.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setModalPaymentMethod(method.id)}
                    className={`${styles.paymentMethodLogoButton} ${modalPaymentMethod === method.id ? styles.paymentMethodLogoButtonSelected : ''}`}
                  >
                    <Image
                      src={method.logoPath}
                      alt={method.name}
                      width={50}
                      height={50}
                      className={styles.paymentLogo}
                    />
                  </button>
                ))}
              </div>
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

      {/* Edit Product Modal */}
      {isEditModalOpen && productToEdit && (
        <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Editar Producto">
          <EditProductForm product={productToEdit} onClose={handleCloseEditModal} />
        </Modal>
      )}
    </div>
  );
}