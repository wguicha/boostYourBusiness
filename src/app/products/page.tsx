'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AddProductForm from "@/components/AddProductForm";
import EditProductForm from "@/components/EditProductForm";
import ProductList from "@/components/ProductList";
import Modal from "@/components/Modal";

// Import Product type from Prisma client, but override price to be string
import { Product as PrismaProduct } from '@prisma/client';

interface Product extends Omit<PrismaProduct, 'price'> {
  price: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // This fetch will hit a new API route we need to create or adapt
      // For now, let's assume we can fetch from a direct API endpoint
      // In a real app, you'd likely have an API route like /api/products
      // For this example, we'll simulate fetching from the server component's data
      // This part needs to be properly implemented with a real API call
      // For now, we'll just use a placeholder or assume data is passed initially
      // This component was originally a Server Component, so direct data fetching was implicit.
      // Now as a Client Component, we need an explicit way to get data.
      // I will assume there is an API endpoint `/api/products` that returns the products.
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
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
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    fetchProducts(); // Refresh products after adding
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
    fetchProducts(); // Refresh products after editing
  };

  if (loading) return <div className="container mx-auto p-4">Cargando productos...</div>;
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
        <h2 className="text-xl font-semibold mb-2">Lista de Productos</h2>
        {products.length === 0 ? (
          <p className="text-gray-500">No hay productos registrados.</p>
        ) : (
          <ProductList 
            products={products} 
            onEdit={handleOpenEditModal} 
            onAddToCart={() => {}} // Dummy function as it's not used here
            onDirectSale={() => {}} // Dummy function as it's not used here
            showActions={false} 
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