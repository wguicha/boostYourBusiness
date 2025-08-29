"use client";

import React from 'react';
import styles from './ComboCard.module.css';

interface Product {
  id: string;
  name: string;
  quantity: number; // Available stock
}

interface ComboProductItem {
  product: Product;
  quantity: number; // Quantity of this product in the combo
}

interface Combo {
  id: string;
  name: string;
  price: string; // Price as string from client
  products: ComboProductItem[];
}

interface ComboCardProps {
  combo: Combo;
  availableQuantity: number;
  onAddToCart: (combo: Combo) => void;
  onDirectSale: (combo: Combo) => void;
}

export default function ComboCard({ combo, availableQuantity, onAddToCart, onDirectSale }: ComboCardProps) {
  const price = parseFloat(combo.price);

  return (
    <div className={styles.card}>
      <h3 className={styles.name}>{combo.name}</h3>
      <p className={styles.price}>${price.toFixed(2)}</p>
      <p className={styles.availability}>Disponible: {availableQuantity === Infinity ? 'N/A' : availableQuantity}</p>
      <div className={styles.content}>
        <h4>Contenido:</h4>
        <ul>
          {combo.products.map(cp => (
            <li key={cp.product.id}>{cp.quantity} x {cp.product.name}</li>
          ))}
        </ul>
      </div>
      <div className={styles.actions}>
        <button
          onClick={() => onAddToCart(combo)}
          disabled={availableQuantity === 0}
          className={styles.addToCartButton}
        >
          Añadir al Carrito
        </button>
        <button
          onClick={() => onDirectSale(combo)}
          disabled={availableQuantity === 0}
          className={styles.directSaleButton}
        >
          Venta Directa
        </button>
      </div>
    </div>
  );
}
