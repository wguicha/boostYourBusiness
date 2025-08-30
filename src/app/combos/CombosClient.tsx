"use client";

import { useState, useEffect } from "react";
import styles from "./Combos.module.css";
import Modal from '@/components/Modal'; // Import the Modal component

// Define types for our data to ensure type safety
interface Product {
  id: string;
  name: string;
  quantity: number; // Available stock
}

interface ComboProduct {
  product: Product;
  quantity: number; // Quantity in combo
}

interface Combo {
  id: string;
  name: string;
  price: number;
  products: ComboProduct[];
}

export default function CombosClient() {
  // State for listing existing data
  const [combos, setCombos] = useState<Combo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // State for the creation form
  const [newComboName, setNewComboName] = useState("");
  const [newComboPrice, setNewComboPrice] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<{ id: string; quantity: number }[]>([]);

  // State for editing a combo
  const [editingComboId, setEditingComboId] = useState<string | null>(null);
  const [editFormName, setEditFormName] = useState("");
  const [editFormPrice, setEditFormPrice] = useState("");
  const [editFormProducts, setEditFormProducts] = useState<{ id: string; quantity: number }[]>([]);

  // State for modal visibility
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to refetch data
  const refetchData = async () => {
    try {
      setLoading(true);
      const [combosRes, productsRes] = await Promise.all([
        fetch("/api/combos"),
        fetch("/api/products"),
      ]);

      if (!combosRes.ok || !productsRes.ok) {
        const combosError = !combosRes.ok ? `Combos API: ${combosRes.status} ${combosRes.statusText}` : '';
        const productsError = !productsRes.ok ? `Products API: ${productsRes.status} ${productsRes.statusText}` : '';
        const errorMessage = [combosError, productsError].filter(Boolean).join(', ');
        console.error("API fetch error:", errorMessage);
        throw new Error(`Failed to fetch data: ${errorMessage}`);
      }

      const combosData = await combosRes.json();
      const productsData = await productsRes.json();

      setCombos(combosData);
      setProducts(productsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data (combos and products)
  useEffect(() => {
    refetchData();
  }, []);

  const handleAddProductToCombo = () => {
    // Add a new empty product selection to the list
    setSelectedProducts([...selectedProducts, { id: "", quantity: 1 }]);
  };

  const handleRemoveProductFromCombo = (index: number) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts.splice(index, 1);
    setSelectedProducts(updatedProducts);
  };

  const handleProductSelectionChange = (index: number, productId: string) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[index].id = productId;
    setSelectedProducts(updatedProducts);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[index].quantity = quantity;
    setSelectedProducts(updatedProducts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComboName || !newComboPrice || selectedProducts.length === 0 || selectedProducts.some(p => !p.id)) {
        alert("Please fill all fields and select products for the combo.");
        return;
    }

    try {
        const res = await fetch('/api/combos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newComboName,
                price: parseFloat(newComboPrice),
                products: selectedProducts,
            }),
        });

        if (!res.ok) {
            throw new Error('Failed to create combo');
        }

        setNewComboName("");
        setNewComboPrice("");
        setSelectedProducts([]);
        setIsCreateModalOpen(false); // Close modal on success
        refetchData();

    } catch (err) {
        alert(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const handleEditClick = (combo: Combo) => {
    setEditingComboId(combo.id);
    setEditFormName(combo.name);
    setEditFormPrice(combo.price.toString()); // Convert number to string
    setEditFormProducts(combo.products.map(cp => ({ id: cp.product.id, quantity: cp.quantity })));
    setIsEditModalOpen(true); // Open edit modal
  };

  const handleCancelEdit = () => {
    setEditingComboId(null);
    setEditFormName("");
    setEditFormPrice("");
    setEditFormProducts([]);
    setIsEditModalOpen(false); // Close edit modal
  };

  const handleUpdateCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComboId || !editFormName || !editFormPrice || editFormProducts.length === 0 || editFormProducts.some(p => !p.id)) {
      alert("Please fill all fields and select products for the combo.");
      return;
    }

    try {
      const res = await fetch(`/api/combos/${editingComboId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormName,
          price: parseFloat(editFormPrice),
          products: editFormProducts,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update combo');
      }

      handleCancelEdit(); // Close edit form and modal
      refetchData();

    } catch (err) {
      alert(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.container}>
      {/* Button to open Create Combo Modal */}
      <button onClick={() => setIsCreateModalOpen(true)} className={styles.createComboButton}>
        Create New Combo
      </button>

      {/* Create Combo Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Combo">
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Combo Name"
            value={newComboName}
            onChange={(e) => setNewComboName(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="number"
            placeholder="Combo Price"
            value={newComboPrice}
            onChange={(e) => setNewComboPrice(e.target.value)}
            className={styles.input}
            required
            min="0"
            step="0.01"
          />

          <h3 className={styles.h3}>Products in Combo</h3>
          {selectedProducts.map((p, index) => (
            <div key={index} className={styles.productSelector}>
              <select
                value={p.id}
                onChange={(e) => handleProductSelectionChange(index, e.target.value)}
                className={styles.select}
                required
              >
                <option value="" disabled>Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Stock: {product.quantity})
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Qty"
                value={p.quantity}
                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10))}
                className={styles.quantityInput}
                required
                min="1"
              />
              <button type="button" onClick={() => handleRemoveProductFromCombo(index)} className={styles.removeButton}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddProductToCombo} className={styles.addButton}>
            Add Product
          </button>

          <button type="submit" className={styles.submitButton}>Create Combo</button>
          <button type="button" onClick={() => setIsCreateModalOpen(false)} className={styles.cancelButton}>Cancel</button>
        </form>
      </Modal>

      {/* List of Existing Combos */}
      <div className={styles.listSection}>
        <h2 className={styles.h2}>Existing Combos</h2>
        <ul className={styles.list}>
          {combos.map((combo) => (
            <li key={combo.id} className={styles.listItem}>
              <div className={styles.comboHeader}>
                <span className={styles.comboName}>{combo.name}</span>
                <span className={styles.comboPrice}>${combo.price}</span>
                <button onClick={() => handleEditClick(combo)} className={styles.editButton}>Edit</button>
              </div>
              <ul className={styles.productList}>
                {combo.products.map((cp) => (
                  <li key={cp.product.id}>
                    {cp.quantity} x {cp.product.name}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      {/* Edit Combo Modal */}
      <Modal isOpen={isEditModalOpen} onClose={handleCancelEdit} title="Edit Combo">
        <form onSubmit={handleUpdateCombo} className={styles.form}>
          <input
            type="text"
            placeholder="Combo Name"
            value={editFormName}
            onChange={(e) => setEditFormName(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="number"
            placeholder="Combo Price"
            value={editFormPrice}
            onChange={(e) => setEditFormPrice(e.target.value)}
            className={styles.input}
            required
            min="0"
            step="0.01"
          />

          <h3 className={styles.h3}>Products in Combo</h3>
          {editFormProducts.map((p, index) => (
            <div key={index} className={styles.productSelector}>
              <select
                value={p.id}
                onChange={(e) => {
                  const updated = [...editFormProducts];
                  updated[index].id = e.target.value;
                  setEditFormProducts(updated);
                }}
                className={styles.select}
                required
              >
                <option value="" disabled>Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Stock: {product.quantity})
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Qty"
                value={p.quantity}
                onChange={(e) => {
                  const updated = [...editFormProducts];
                  updated[index].quantity = parseInt(e.target.value, 10);
                  setEditFormProducts(updated);
                }}
                className={styles.quantityInput}
                required
                min="1"
              />
              <button type="button" onClick={() => {
                const updated = [...editFormProducts];
                updated.splice(index, 1);
                setEditFormProducts(updated);
              }} className={styles.removeButton}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setEditFormProducts([...editFormProducts, { id: "", quantity: 1 }])} className={styles.addButton}>
            Add Product
          </button>

          <button type="submit" className={styles.submitButton}>Update Combo</button>
          <button type="button" onClick={handleCancelEdit} className={styles.cancelButton}>Cancel</button>
        </form>
      </Modal>
    </div>
  );
}
