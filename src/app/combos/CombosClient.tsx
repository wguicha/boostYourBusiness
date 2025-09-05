"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./Combos.module.css";
import Modal from '@/components/Modal';
import { useBusiness } from '@/context/BusinessContext';

// Define types
interface Product { id: string; name: string; quantity: number; price: string; imageUrl: string | null; type: string; }
interface ComboProduct { product: Product; quantity: number; }
interface Combo { id: string; name: string; price: string; products: ComboProduct[]; }

export default function CombosClient() {
  const { activeBusiness, loading: businessLoading } = useBusiness();

  const [combos, setCombos] = useState<Combo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newComboName, setNewComboName] = useState("");
  const [newComboPrice, setNewComboPrice] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<{ id: string; quantity: number }[]>([]);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);

  const refetchData = useCallback(async () => {
    if (!activeBusiness) {
      setCombos([]);
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      const [combosRes, productsRes] = await Promise.all([
        fetch(`/api/combos?businessId=${activeBusiness.id}`),
        fetch(`/api/products?businessId=${activeBusiness.id}`),
      ]);
      if (!combosRes.ok || !productsRes.ok) throw new Error('Failed to fetch data');
      const combosData = await combosRes.json();
      const productsData = await productsRes.json();
      setCombos(combosData);
      setProducts(productsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error");
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => { refetchData(); }, [refetchData]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return alert("Please select a business.");
    if (!newComboName || !newComboPrice || selectedProducts.some(p => !p.id)) return alert("Please fill all fields.");

    try {
      const res = await fetch('/api/combos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newComboName, price: parseFloat(newComboPrice),
          products: selectedProducts, businessId: activeBusiness.id,
        }),
      });
      if (!res.ok) throw new Error('Failed to create combo');
      setIsCreateModalOpen(false);
      setNewComboName("");
      setNewComboPrice("");
      setSelectedProducts([]);
      refetchData();
    } catch (err) { alert(err instanceof Error ? err.message : "Unknown error"); }
  };

  const handleEditClick = (combo: Combo) => {
    setEditingCombo(combo);
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCombo || !activeBusiness) return alert("No combo selected or business active.");

    try {
      const res = await fetch(`/api/combos/${editingCombo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCombo.name, price: parseFloat(editingCombo.price.toString()),
          products: editingCombo.products.map(p => ({ id: p.product.id, quantity: p.quantity })), 
          businessId: activeBusiness.id,
        }),
      });
      if (!res.ok) throw new Error('Failed to update combo');
      setIsEditModalOpen(false);
      setEditingCombo(null);
      refetchData();
    } catch (err) { alert(err instanceof Error ? err.message : "Unknown error"); }
  };

  const handleDeleteClick = async (comboId: string) => {
    if (!activeBusiness) return alert("No active business.");
    if (window.confirm("Are you sure you want to delete this combo?")) {
      try {
        const res = await fetch(`/api/combos/${comboId}?businessId=${activeBusiness.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete combo');
        refetchData();
      } catch (err) { alert(err instanceof Error ? err.message : "Unknown error"); }
    }
  };

  if (businessLoading || loading) return <p>Loading...</p>;
  if (!activeBusiness) return <div className="text-center"><p>Please select a business to manage combos.</p></div>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <button onClick={() => setIsCreateModalOpen(true)} className={styles.createComboButton}>Create New Combo</button>
      
      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Combo">
        <form onSubmit={handleCreateSubmit} className={styles.form}>
          <input type="text" placeholder="Combo Name" value={newComboName} onChange={(e) => setNewComboName(e.target.value)} className={styles.input} required />
          <input type="number" placeholder="Combo Price" value={newComboPrice} onChange={(e) => setNewComboPrice(e.target.value)} className={styles.input} required min="0" step="0.01" />
          <h3 className={styles.h3}>Products in Combo</h3>
          {selectedProducts.map((p, index) => (
            <div key={index} className={styles.productSelector}>
              <select value={p.id} onChange={(e) => {
                const updated = [...selectedProducts];
                updated[index].id = e.target.value;
                setSelectedProducts(updated);
              }} className={styles.select} required>
                <option value="" disabled>Select a product</option>
                {products.map((product) => (<option key={product.id} value={product.id}>{product.name} (Stock: {product.quantity})</option>))}
              </select>
              <input type="number" placeholder="Qty" value={p.quantity} onChange={(e) => {
                const updated = [...selectedProducts];
                updated[index].quantity = parseInt(e.target.value, 10);
                setSelectedProducts(updated);
              }} className={styles.quantityInput} required min="1" />
              <button type="button" onClick={() => {
                const updated = [...selectedProducts];
                updated.splice(index, 1);
                setSelectedProducts(updated);
              }} className={styles.removeButton}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => setSelectedProducts([...selectedProducts, { id: "", quantity: 1 }])} className={styles.addButton}>Add Product</button>
          <button type="submit" className={styles.submitButton}>Create Combo</button>
          <button type="button" onClick={() => setIsCreateModalOpen(false)} className={styles.cancelButton}>Cancel</button>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editingCombo && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Combo">
          <form onSubmit={handleUpdateSubmit} className={styles.form}>
            <input type="text" placeholder="Combo Name" value={editingCombo.name} onChange={(e) => setEditingCombo({ ...editingCombo, name: e.target.value })} className={styles.input} required />
            <input type="number" placeholder="Combo Price" value={editingCombo.price} onChange={(e) => setEditingCombo({ ...editingCombo, price: e.target.value })} className={styles.input} required min="0" step="0.01" />
            <h3 className={styles.h3}>Products in Combo</h3>
            {editingCombo.products.map((p, index) => (
              <div key={index} className={styles.productSelector}>
                <select value={p.product.id} onChange={(e) => {
                  const updatedProducts = [...editingCombo.products];
                  const selectedProduct = products.find(prod => prod.id === e.target.value);
                  if (selectedProduct) {
                    updatedProducts[index] = { ...updatedProducts[index], product: selectedProduct };
                    setEditingCombo({ ...editingCombo, products: updatedProducts });
                  }
                }} className={styles.select} required>
                  <option value="" disabled>Select a product</option>
                  {products.map((product) => (<option key={product.id} value={product.id}>{product.name} (Stock: {product.quantity})</option>))}
                </select>
                <input type="number" placeholder="Qty" value={p.quantity} onChange={(e) => {
                  const updatedProducts = [...editingCombo.products];
                  updatedProducts[index] = { ...updatedProducts[index], quantity: parseInt(e.target.value, 10) };
                  setEditingCombo({ ...editingCombo, products: updatedProducts });
                }} className={styles.quantityInput} required min="1" />
                <button type="button" onClick={() => {
                  const updatedProducts = [...editingCombo.products];
                  updatedProducts.splice(index, 1);
                  setEditingCombo({ ...editingCombo, products: updatedProducts });
                }} className={styles.removeButton}>Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => setEditingCombo({ ...editingCombo, products: [...editingCombo.products, { product: { id: "", name: "", quantity: 0, price: "0", imageUrl: null, type: "" }, quantity: 1 }] })} className={styles.addButton}>Add Product</button>
            <button type="submit" className={styles.submitButton}>Update Combo</button>
            <button type="button" onClick={() => setIsEditModalOpen(false)} className={styles.cancelButton}>Cancel</button>
          </form>
        </Modal>
      )}

      {/* List of Combos */}
      <div className={styles.listSection}>
        <h2 className={styles.h2}>Existing Combos</h2>
        <ul className={styles.list}>
          {combos.map((combo) => (
            <li key={combo.id} className={styles.listItem}>
              <div className={styles.comboHeader}>
                <span className={styles.comboName}>{combo.name}</span>
                <span className={styles.comboPrice}>${combo.price}</span>
                <div>
                  <button onClick={() => handleEditClick(combo)} className={styles.editButton}>Edit</button>
                  <button onClick={() => handleDeleteClick(combo.id)} className={styles.deleteButton}>Delete</button>
                </div>
              </div>
              <ul className={styles.productList}>{combo.products.map((cp) => <li key={cp.product.id}>{cp.quantity} x {cp.product.name}</li>)}</ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
