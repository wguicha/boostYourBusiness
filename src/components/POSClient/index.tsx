"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { recordSale, recordSingleSale } from '@/app/pos/actions';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import styles from './POSClient.module.css';
import CartIcon from '@/components/CartIcon';
import ProductCard from '@/components/ProductCard/index';
import ComboCard from '@/components/ComboCard'; // Import the ComboCard component
import Modal from '@/components/Modal'; // Import the Modal component
import EditProductForm from '@/components/EditProductForm'; // Import the EditProductForm

// Import Product type from Prisma client, but override price to be string
import { Product as PrismaProduct } from '@prisma/client';

interface Product {
  id: string;
  name: string;
  price: number; // Price as number
  quantity: number; // Available stock
  type: 'PRINCIPAL' | 'BEBIDA' | 'ACOMPANAMIENTO'; // Explicitly define type based on Prisma
  businessId: string;
  createdAt: Date;
  updatedAt: Date;
  description: string | null;
  imageUrl: string | null;
}

interface ComboProductItem {
  product: Product;
  quantity: number; // Quantity of this product in the combo
}

interface Combo {
  id: string;
  name: string;
  price: number; // Price as number
  products: ComboProductItem[];
  type: 'combo'; // Explicitly define type
}

interface CartItem {
  id: string; // ID of the product or combo
  name: string; // Name of the product or combo
  price: number; // Original price of the product or combo
  quantity: number; // Quantity of this item in the cart
  salePrice: number; // Editable sale price for this item
  type: 'product' | 'combo'; // Type of the item
}

interface POSClientProps {
  products: Product[];
  combos: Combo[]; // NEW: Add combos prop
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

export default function POSClient({ products, combos, businessId }: POSClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo'); // Default to Efectivo
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const [isSingleSalePending, setIsSingleSalePending] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(false); // Default to hidden

  // State for the confirmation modal
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedItemForSale, setSelectedItemForSale] = useState<Product | Combo | null>(null); // Generalized
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalPaymentMethod, setModalPaymentMethod] = useState('Efectivo'); // Use current cart payment method as default for modal
  const [modalSalePrice, setModalSalePrice] = useState<number>(0);

  // State for the edit product modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const addToCart = (item: Product | Combo, type: 'product' | 'combo') => {
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
  };

  const removeFromCart = (itemId: string, itemType: 'product' | 'combo') => {
    setCart((prevCart) => prevCart.filter(item => !(item.id === itemId && item.type === itemType)));
  };

  const updateCartQuantity = (itemId: string, itemType: 'product' | 'combo', newQuantity: number) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => !(item.id === itemId && item.type === itemType));
      }
      return prevCart.map(item =>
        item.id === itemId && item.type === itemType ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const incrementCartQuantity = (itemId: string, itemType: 'product' | 'combo') => {
    setCart(prevCart => prevCart.map(item =>
      item.id === itemId && item.type === itemType ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const decrementCartQuantity = (itemId: string, itemType: 'product' | 'combo') => {
    setCart(prevCart => {
      const itemToUpdate = prevCart.find(item => item.id === itemId && item.type === itemType);
      if (itemToUpdate && itemToUpdate.quantity <= 1) {
        return prevCart.filter(item => !(item.id === itemId && item.type === itemType));
      }
      return prevCart.map(item =>
        item.id === itemId && item.type === itemType ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const updateCartItemPrice = (itemId: string, itemType: 'product' | 'combo', newPrice: string) => {
    setCart(prevCart => prevCart.map(item =>
      item.id === itemId && item.type === itemType ? { ...item, salePrice: parseFloat(newPrice) || 0 } : item
    ));
  };

  const incrementCartItemPrice = (itemId: string, itemType: 'product' | 'combo') => {
    setCart(prevCart => prevCart.map(item =>
      item.id === itemId && item.type === itemType ? { ...item, salePrice: item.salePrice + 0.5 } : item
    ));
  };

  const decrementCartItemPrice = (itemId: string, itemType: 'product' | 'combo') => {
    setCart(prevCart => prevCart.map(item =>
      item.id === itemId && item.type === itemType ? { ...item, salePrice: Math.max(0, item.salePrice - 0.5) } : item
    ));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);

  const handleRecordSale = async (formData: FormData) => {
    setMessage(null);
    try {
      const saleItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.salePrice.toString(), // Convert number to string for action
        quantity: item.quantity,
        type: item.type,
      }));

      await recordSale(saleItems, totalAmount, paymentMethod, businessId);
      setCart([]);
      setIsCartVisible(false); // Close cart on successful sale
      setMessage({ type: 'success', text: 'Venta registrada con éxito y stock actualizado!' });
    } catch (error: unknown) {
      console.error('Error al registrar la venta:', error);
      setMessage({ type: 'error', text: `Error al registrar la venta: ${(error as Error).message || 'Error desconocido'}` });
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
    addToCart(product, 'product');
  };

  const handleAddToCartComboFromCard = (combo: Combo) => { // New function for combos
    addToCart(combo, 'combo');
  };

  const handleDirectSaleFromCard = (item: Product | Combo, type: 'product' | 'combo') => { // Generalized
    setSelectedItemForSale(item);
    setModalQuantity(1);
    setModalPaymentMethod(paymentMethod); // Use current cart payment method as default for modal
    setModalSalePrice(parseFloat(item.price)); // Set initial price for editing
    setIsConfirmationModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsConfirmationModalOpen(false);
    setSelectedItemForSale(null); // Use selectedItemForSale
  };

  const handleConfirmSale = async () => {
    if (!selectedItemForSale) return; // Use selectedItemForSale

    setIsSingleSalePending(true);
    setMessage(null);
    try {
      await recordSingleSale(selectedItemForSale.id, modalPaymentMethod, businessId, modalQuantity, modalSalePrice.toString(), selectedItemForSale.type);
      setMessage({ type: 'success', text: `Venta directa de ${selectedItemForSale.name} registrada!` });
    } catch (error: unknown) {
      console.error('Error al registrar venta directa:', error);
      setMessage({ type: 'error', text: `Error: ${(error as Error).message || 'Error desconocido'}` });
    }
  finally {
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
                  <div key={`${item.id}-${item.type}`} className={styles.cartItem}>
                    <div className={styles.cartItemMainRow}>
                      <span className={styles.cartItemName}>{item.name} {item.type === 'combo' && '(Combo)'}</span>
                    </div>
                    <div className={styles.cartItemSubRow}>
                      <div className={styles.priceControl}>
                        <button type="button" onClick={() => decrementCartItemPrice(item.id, item.type)} className={styles.quantityButton}>-</button>
                        <div className={styles.priceInputContainer}>
                          <input
                            type="number"
                            step="0.01"
                            value={item.salePrice}
                            onChange={(e) => updateCartItemPrice(item.id, item.type, e.target.value)}
                            className={styles.quantityInput}
                          />
                          <span className={styles.currencySymbol}>€</span>
                        </div>
                        <button type="button" onClick={() => incrementCartItemPrice(item.id, item.type)} className={styles.quantityButton}>+</button>
                      </div>
                      <div className={styles.quantityControl}>
                        <button type="button" onClick={() => decrementCartQuantity(item.id, item.type)} className={styles.quantityButton}>-</button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const parsedQuantity = parseInt(e.target.value, 10); // Specify radix 10
                            console.log('Input value:', e.target.value, 'Parsed quantity:', parsedQuantity);
                            if (!isNaN(parsedQuantity)) { // Only update if it's a valid number
                              updateCartQuantity(item.id, item.type, parsedQuantity);
                            } else if (e.target.value === '') { // Allow clearing the input
                              updateCartQuantity(item.id, item.type, 0); // Or handle as desired for empty
                            }
                          }}
                          className={styles.quantityInput}
                        />
                        <button type="button" onClick={() => incrementCartQuantity(item.id, item.type)} className={styles.quantityButton}>+</button>
                      </div>
                      <span className={styles.lineTotal}>${(item.salePrice * item.quantity).toFixed(2)}</span>
                      <button
                        onClick={() => removeFromCart(item.id, item.type)}
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
          <div className={styles.productGrid}> {/* This will now be a container for sections */}
            <div className={styles.productSection}>
              <h2 className={styles.sectionTitle}>Productos</h2>
              <div className={styles.productCardGrid}> {/* Nested grid for product cards */}
                {products.map((product) => {
                  const productForCard = {
                    ...product,
                  };
                  return (
                    <ProductCard
                      key={product.id}
                      product={productForCard}
                      onEdit={handleEditProduct}
                      onAddToCart={() => handleAddToCartFromCard(product)} // Updated call
                      onDirectSale={() => handleDirectSaleFromCard(product, 'product')} // Updated call
                    />
                  );
                })}
              </div>
            </div>

            <div className={styles.comboSection}>
              <h2 className={styles.sectionTitle}>Combos</h2>
              <div className={styles.comboCardGrid}> {/* Nested grid for combo cards */}
                {combos.map((combo) => {
                  // Calculate available quantity for the combo
                  const availableComboQuantity = combo.products.reduce((minQty, cp) => {
                    const productInStock = products.find(p => p.id === cp.product.id);
                    if (!productInStock || cp.quantity === 0) return 0; // If product not found or combo needs 0 of it, cannot make combo
                    return Math.min(minQty, Math.floor(productInStock.quantity / cp.quantity));
                  }, Infinity);

                  return (
                    <ComboCard
                      key={combo.id}
                      combo={combo}
                      availableQuantity={availableComboQuantity === Infinity ? 0 : availableComboQuantity}
                      onAddToCart={() => handleAddToCartComboFromCard(combo)} // New call
                      onDirectSale={() => handleDirectSaleFromCard(combo, 'combo')} // New call
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmationModalOpen && selectedItemForSale && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.sectionTitle}>Confirmar Venta Directa</h2>
            <p>Artículo: <strong>{selectedItemForSale.name} {selectedItemForSale.type === 'combo' && '(Combo)'}</strong></p>
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