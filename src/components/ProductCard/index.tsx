'use client';

import { FiEdit, FiTrash2, FiShoppingCart, FiDollarSign } from 'react-icons/fi'; // Add FiTrash2
import styles from './ProductCard.module.css';

import { Product, Combo } from '@/types/shared';

interface ProductCardProps {
  product: Product;
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onDirectSale: (product: Product) => void;
  showEditAction?: boolean;
  showDeleteAction?: boolean;
  showSaleActions?: boolean;
}

export default function ProductCard({ product, onEdit, onDelete, onAddToCart, onDirectSale, showEditAction = false, showDeleteAction = false, showSaleActions = false }: ProductCardProps) {
  const isOutOfStock = product.quantity === 0;

  return (
    <div className={`${styles.productCardContainer} ${isOutOfStock ? styles.outOfStock : ''}`}>
      <div className={styles.imageWrapper}>
        <div
          className={styles.productImageFrame}
          style={{ backgroundImage: `url(${product.imageUrl || '/placeholder.svg'})` }}
        >
          {!product.imageUrl && (
            <div className={styles.noImagePlaceholder}>
              <span className={styles.noImageText}>Sin Imagen</span>
            </div>
          )}
        </div>
        <p className={styles.productPriceText}>
          <span className={styles.priceCircle}>
            {parseFloat(product.price).toLocaleString('es-CO', { minimumFractionDigits: 0 })} €
          </span>
        </p>

        {/* Control Buttons Wrapper */}
        <div className={styles.controlsWrapper}>
          {showEditAction && (
            <button
              onClick={() => onEdit(product.id)}
              className={`${styles.controlButton} ${styles.editButton}`}
              aria-label="Edit Product"
            >
              <FiEdit size={14} />
            </button>
          )}
          {showDeleteAction && (
            <button
              onClick={() => onDelete(product.id)}
              className={`${styles.controlButton} ${styles.deleteButton}`}
              aria-label="Delete Product"
            >
              <FiTrash2 size={14} />
            </button>
          )}
        </div>

        <div className={styles.stockIndicator}>
          {product.quantity}
        </div>

        {showSaleActions && (
          <div className={styles.actionsWrapper}>
            <button
              onClick={() => onAddToCart(product)}
              className={`${styles.actionButton} ${styles.addToCartButton}`}
              aria-label="Add to Cart"
              disabled={isOutOfStock}
            >
              <FiShoppingCart size={14} />
            </button>
            <button
              onClick={() => onDirectSale(product)}
              className={`${styles.actionButton} ${styles.directSaleButton}`}
              aria-label="Direct Sale"
              disabled={isOutOfStock}
            >
              <FiDollarSign size={14} />
            </button>
          </div>
        )}
      </div>

      <div className={styles.productInfo}>
        <p className={styles.productNameText}>{product.name}</p>
      </div>
    </div>
  );
}
