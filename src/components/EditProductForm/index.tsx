'use client';

import { useFormStatus } from 'react-dom';
import { updateProduct } from '@/app/products/actions';
import { useRouter } from 'next/navigation';
import styles from './EditProductForm.module.css';

// Import Product type from Prisma client, but override price to be string
import { Product as PrismaProduct } from '@prisma/client';

interface Product extends Omit<PrismaProduct, 'price'> {
  price: string;
}

interface EditProductFormProps {
  product: Product;
  onClose: () => void; // Add onClose prop
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className={styles.submitButton}
    >
      {pending ? 'Actualizando...' : 'Actualizar Producto'}
    </button>
  );
}

export default function EditProductForm({ product, onClose }: EditProductFormProps) {
  const router = useRouter(); // Keep router for potential future use or if component is used elsewhere

  const handleUpdate = async (formData: FormData) => {
    try {
      await updateProduct(product.id, formData);
      onClose(); // Close modal on successful update
    } catch (error) {
      console.error('Error al actualizar el producto:', error);
      alert('Error al actualizar el producto.');
    }
  };

  return (
    <form action={handleUpdate} className={styles.formContainer}>
      <h2 className={styles.formTitle}>Editar Producto</h2>
      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>Nombre del Producto</label>
        <input type="text" id="name" name="name" defaultValue={product.name} required className={styles.input} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>Descripción</label>
        <textarea id="description" name="description" defaultValue={product.description || ''} className={styles.textarea}></textarea>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="image" className={styles.label}>Imagen del Producto (dejar vacío para mantener la actual)</label>
        <input type="file" id="image" name="image" accept="image/*" className={`${styles.input} ${styles.fileInput}`} />
      </div>
      <div className={styles.flexGroup}>
        <div className={styles.flexItemHalf}>
          <label htmlFor="price" className={styles.label}>Precio</label>
          <input type="number" id="price" name="price" step="0.01" defaultValue={parseFloat(product.price).toFixed(2)} required className={styles.input} />
        </div>
        <div className={styles.flexItemHalf}>
          <label htmlFor="quantity" className={styles.label}>Cantidad</label>
          <input type="number" id="quantity" name="quantity" step="1" defaultValue={product.quantity} required className={styles.input} />
        </div>
      </div>
      <SubmitButton />
      <button type="button" onClick={onClose} className={styles.cancelButton}>
        Cancelar
      </button>
    </form>
  );
}

