'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { recordSale, recordSingleSale } from '@/app/pos/actions';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation'; // Added import for useRouter

// Import Product type from Prisma client, but override price to be string
import { Product as PrismaProduct } from '@prisma/client';

interface Product extends Omit<PrismaProduct, 'price'> {
  price: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface POSClientProps {
  products: Product[];
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
    >
      {pending ? 'Registrando...' : 'Registrar Venta'}
    </button>
  );
}

export default function POSClient({ products }: POSClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter(); // Initialize useRouter
  const [isSingleSalePending, setIsSingleSalePending] = useState(false); // New state for single sale button

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.product.id !== productId);
      }
      return prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);

  const handleRecordSale = async (formData: FormData) => {
    setMessage(null);
    try {
      const saleItems = cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      }));

      await recordSale(saleItems, totalAmount, paymentMethod);
      setCart([]); // Clear cart on successful sale
      setMessage({ type: 'success', text: 'Venta registrada con éxito y stock actualizado!' });
    } catch (error: any) {
      console.error('Error al registrar la venta:', error);
      setMessage({ type: 'error', text: `Error al registrar la venta: ${error.message || 'Error desconocido'}` });
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Product Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Productos Disponibles</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="border p-4 rounded-lg shadow"
            >
              <div className="w-full h-32 relative mb-2">
                <Image
                  src={product.imageUrl || '/placeholder.svg'}
                  alt={product.name}
                  fill={true}
                  className="rounded-md object-cover"
                />
              </div>
              <h3 className="font-bold text-md truncate">{product.name}</h3>
              <p className="text-gray-600 text-sm">${parseFloat(product.price).toFixed(2)}</p>
              <p className="text-gray-500 text-xs">Inventario: {product.quantity}</p>
              <div className="mt-2 flex flex-col space-y-2">
                <button 
                  onClick={() => addToCart(product)}
                  disabled={product.quantity === 0}
                  className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agregar al Carrito
                </button>
                <button 
                  onClick={async () => {
                    setIsSingleSalePending(true); // Set pending state
                    setMessage(null);
                    try {
                      await recordSingleSale(product.id, paymentMethod);
                      setMessage({ type: 'success', text: `Venta directa de ${product.name} registrada!` });
                    } catch (error: any) {
                      console.error('Error al registrar venta directa:', error);
                      setMessage({ type: 'error', text: `Error: ${error.message || 'Error desconocido'}` });
                    } finally {
                      setIsSingleSalePending(false); // Reset pending state
                    }
                  }}
                  disabled={product.quantity === 0 || isSingleSalePending} // Disable button
                  className="bg-green-500 hover:bg-green-700 text-white text-sm py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Registrar Venta
                </button>
                <button 
                  onClick={() => router.push(`/products/${product.id}/edit`)}
                  className="bg-gray-500 hover:bg-gray-700 text-white text-sm py-1 px-2 rounded"
                >
                  Editar Producto
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Summary */}
      <div className="w-full md:w-1/3 bg-gray-50 p-4 border-l flex flex-col">
        <h2 className="text-xl font-bold mb-4">Carrito de Compras</h2>
        {message && (
          <div className={`p-2 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}
        {cart.length === 0 ? (
          <p className="text-gray-500">El carrito está vacío.</p>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between items-center mb-2">
                <span>{item.product.name} (x{item.quantity})</span>
                <div className="flex items-center">
                  <input 
                    type="number" 
                    min="1" 
                    value={item.quantity} 
                    onChange={(e) => updateCartQuantity(item.product.id, parseInt(e.target.value))}
                    className="w-16 text-center border rounded mr-2"
                  />
                  <span>${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</span>
                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    X
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 pt-4 border-t">
          <div className="mb-4">
            <label htmlFor="paymentMethod" className="block text-gray-700 text-sm font-bold mb-2">Método de Pago</label>
            <select 
              id="paymentMethod" 
              name="paymentMethod" 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
          <div className="flex justify-between font-bold text-lg mb-4">
            <span>Total:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <form action={handleRecordSale}>
            <SubmitButton />
          </form>
        </div>
      </div>
    </div>
  );
}