'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useBusiness } from '@/context/BusinessContext';
import { deleteProduct } from '@/app/products/actions'; // Import deleteProduct action
import AddProductForm from "@/components/AddProductForm";
import EditProductForm from "@/components/EditProductForm";
import ProductList from "@/components/ProductList";
import Modal from "@/components/Modal";
import styles from './Products.module.css';
import { Product as PrismaProduct } from '@prisma/client';

interface Product extends Omit<PrismaProduct, 'price'> {
  price: string;
}

export default function ProductsPage() {
  const { activeBusiness, loading: businessLoading } = useBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!activeBusiness) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/products?businessId=${activeBusiness.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products for the selected business');
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    fetchProducts();
  };

  const handleOpenEditModal = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setProductToEdit(product);
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setProductToEdit(null);
    fetchProducts();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!activeBusiness) {
      alert('Cannot delete product without an active business.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId, activeBusiness.id);
        fetchProducts(); // Refresh the list after deletion
      } catch (err) {
        alert('Failed to delete product.');
        console.error(err);
      }
    }
  };

  if (businessLoading || loading) return <div className="container mx-auto p-4">Cargando...</div>;
  
  if (!activeBusiness) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Gestión de Productos</h1>
        <p className="text-gray-500">Por favor, selecciona un negocio o crea uno nuevo para empezar.</p>
      </div>
    );
  }
  
  if (error) return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestión de Productos</h1>
        <button
          onClick={handleOpenAddModal}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Agregar Producto
        </button>
      </div>
      
      <div className="mt-6">
        <h2 className={`text-xl font-semibold ${styles.listTitle}`}>Lista de Productos</h2>
        {products.length === 0 ? (
          <p className="text-gray-500">No hay productos registrados para este negocio.</p>
        ) : (
          <ProductList 
            products={products} 
            onEdit={handleOpenEditModal} 
            onDelete={handleDeleteProduct} // Pass the delete handler
            onAddToCart={() => {}} // Dummy function
            onDirectSale={() => {}} // Dummy function
            showEditAction={true}
            showDeleteAction={true}
            showSaleActions={false}
          />
        )}
      </div>

      {/* Add Product Modal */}
      <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal} title="Agregar Nuevo Producto">
        <AddProductForm onClose={handleCloseAddModal} onProductAdded={fetchProducts} />
      </Modal>

      {/* Edit Product Modal */}
      {productToEdit && (
        <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Editar Producto">
          <EditProductForm product={productToEdit} onClose={handleCloseEditModal} />
        </Modal>
      )}
    </div>
  );
}
