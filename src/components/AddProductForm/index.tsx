'use client';

import { useFormStatus } from 'react-dom';
import { addProduct } from '@/app/products/actions';
import styles from './AddProductForm.module.css';
import { useBusiness } from '@/context/BusinessContext'; // Import useBusiness hook

interface AddProductFormProps {
  onClose: () => void;
  onProductAdded: () => void; // Callback to refresh product list
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className={styles.submitButton}
    >
      {pending ? 'Agregando...' : 'Agregar Producto'}
    </button>
  );
}

export default function AddProductForm({ onClose, onProductAdded }: AddProductFormProps) {
  const { activeBusiness } = useBusiness(); // Get active business

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (!activeBusiness) {
      alert('No active business selected. Please select a business first.');
      return;
    }
    // The businessId is now added via a hidden input, so it will be in formData

    try {
      await addProduct(formData);
      onProductAdded();
      onClose();
    } catch (error) {
      console.error('Error al agregar el producto:', error);
      alert('Error al agregar el producto.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      {/* Hidden input for businessId */}
      {activeBusiness && <input type="hidden" name="businessId" value={activeBusiness.id} />}

      <h2 className={styles.formTitle}>Agregar Nuevo Producto</h2>
      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>Nombre del Producto</label>
        <input type="text" id="name" name="name" required className={styles.input} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>Descripción</label>
        <textarea id="description" name="description" className={styles.textarea}></textarea>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="image" className={styles.label}>Imagen del Producto</label>
        <input type="file" id="image" name="image" accept="image/*" className={`${styles.input} ${styles.fileInput}`} />
      </div>
      <div className={styles.flexGroup}>
        <div className={styles.flexItemHalf}>
          <label htmlFor="price" className={styles.label}>Precio</label>
          <input type="number" id="price" name="price" step="0.01" required className={styles.input} />
        </div>
        <div className={styles.flexItemHalf}>
          <label htmlFor="quantity" className={styles.label}>Cantidad</label>
          <input type="number" id="quantity" name="quantity" step="1" required className={styles.input} />
        </div>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="type" className={styles.label}>Tipo de Producto</label>
        <select id="type" name="type" required defaultValue="" className={styles.input}>
          <option value="" disabled>Seleccione un tipo</option>
          <option value="PRINCIPAL">Principal</option>
          <option value="BEBIDA">Bebida</option>
          <option value="ACOMPANAMIENTO">Acompañamiento</option>
        </select>
      </div>
      <SubmitButton />
      <button type="button" onClick={onClose} className={styles.cancelButton}>
        Cancelar
      </button>
    </form>
  );
}
