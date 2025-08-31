'use client';

import { FiEdit, FiShoppingCart, FiDollarSign } from 'react-icons/fi';
import styles from './ProductCard.module.css'; // Import CSS Module

interface ProductForCard {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

interface ProductCardProps {
  product: ProductForCard;
  onEdit: (productId: string) => void;
  onAddToCart: (product: ProductForCard) => void;
  onDirectSale: (product: ProductForCard) => void;
  showActions?: boolean;
}

export default function ProductCard({ product, onEdit, onAddToCart, onDirectSale, showActions = true }: ProductCardProps) {
  return (
    <div className={styles.productCardContainer}>
      <div className={styles.imageWrapper}>
        {/* Image Container */}
        <div
          className={styles.productImageFrame}
          style={{ backgroundImage: `url(${product.imageUrl || '/placeholder.svg'})` }} // Use background-image
        >
          {/* No Image component or img tag here */}
          {!product.imageUrl && ( // Display "Sin Imagen" if no image
            <div className={styles.noImagePlaceholder}>
              <span className={styles.noImageText}>Sin Imagen</span>
            </div>
          )}
        </div>
        <p className={styles.productPriceText}> {/* Replaced text-gray-600 */}
          <span className={styles.priceCircle}>
            {product.price.toLocaleString('es-CO', { minimumFractionDigits: 0 })} €
          </span>
        </p>

        {/* Edit Button */}
        <button
          onClick={() => onEdit(product.id)}
          className={styles.editButton}
        >
          <FiEdit size={14} />
        </button>

        {/* Stock Indicator */}
        <div className={styles.stockIndicator}>
          {product.quantity}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <>
            <button
              onClick={() => onAddToCart(product)}
              className={styles.addToCartButton}
            >
              <FiShoppingCart size={14} />
            </button>
            <button
              onClick={() => onDirectSale(product)}
              className={styles.directSaleButton}
            >
              <FiDollarSign size={14} />
            </button>
          </>
        )}
      </div>

      {/* Product Info */}
      {/* Product Info */}
      <div className={styles.productInfo}>
        <p className={styles.productNameText}>{product.name}</p>
      </div>
    </div>
  );
}