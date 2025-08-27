'use client';

import { FiEdit, FiShoppingCart, FiDollarSign } from 'react-icons/fi';
import styles from './ProductCard.module.css'; // Import CSS Module

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string | null;
  };
  onEdit: (productId: string) => void;
  onAddToCart: (product: any) => void;
  onDirectSale: (product: any) => void;
}

export default function ProductCard({ product, onEdit, onAddToCart, onDirectSale }: ProductCardProps) {
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

        {/* Edit Button */}
        <button
          onClick={() => onEdit(product.id)}
          className={styles.editButton}
        >
          <FiEdit size={14} />
        </button>

        {/* Stock Indicator */}
        <div className={styles.stockIndicator}>
          {product.stock}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtonsContainer}>
          <button
            onClick={() => onDirectSale(product)}
            className={styles.directSaleButton}
          >
            <FiDollarSign size={14} />
          </button>
          <button
            onClick={() => onAddToCart(product)}
            className={styles.addToCartButton}
          >
            <FiShoppingCart size={14} />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className={styles.productInfo}>
        <p className={styles.productNameText}>{product.name}</p>
        <p className={styles.productPriceText}>
          {product.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
        </p>
      </div>
    </div>
  );
}