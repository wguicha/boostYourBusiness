'use client';

import React from 'react';
import styles from './ComboCard.module.css';
import { Combo } from '@/types/shared';
import { FiShoppingCart, FiDollarSign } from 'react-icons/fi';

interface ComboCardProps {
  combo: Combo;
  availableQuantity: number;
  onAddToCart: (combo: Combo) => void;
  onDirectSale: (combo: Combo) => void;
}

export default function ComboCard({ combo, availableQuantity, onAddToCart, onDirectSale }: ComboCardProps) {
  const price = parseFloat(combo.price);
  const isOutOfStock = availableQuantity === 0;

  return (
    <div className={`${styles.comboCardContainer} ${isOutOfStock ? styles.outOfStock : ''}`}>
      {/* Price Circle (left) */}
      <div className={styles.priceText}>
        <span className={styles.priceCircle}>
          {price.toLocaleString('es-CO', { minimumFractionDigits: 0 })} €
        </span>
      </div>

      {/* Stock Indicator (top-right) */}
      <div className={styles.stockIndicator}>
        {availableQuantity === Infinity ? '∞' : availableQuantity}
      </div>

      {/* Add to Cart Button (bottom-right) */}
      <div className={styles.actionsWrapper}>
        <button
          onClick={() => onAddToCart(combo)}
          disabled={isOutOfStock}
          className={`${styles.actionButton} ${styles.addToCartButton}`}
          aria-label="Add to Cart"
        >
          <FiShoppingCart size={14} />
        </button>
      </div>

      {/* Direct Sale Button (right) */}
      <div className={styles.directSaleButtonWrapper}>
        <button
          onClick={() => onDirectSale(combo)}
          disabled={isOutOfStock}
          className={`${styles.actionButton} ${styles.directSaleButton}`}
          aria-label="Direct Sale"
        >
          <FiDollarSign size={14} />
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.comboInfo}>
        <h3 className={styles.comboName}>{combo.name}</h3>
        <div className={styles.thumbnailsContainer}>
          {combo.products.map(cp => (
            <div
              key={cp.product.id}
              className={styles.thumbnail}
              style={{ backgroundImage: `url(${cp.product.imageUrl || '/placeholder.svg'})` }}
              title={`${cp.quantity} x ${cp.product.name}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}