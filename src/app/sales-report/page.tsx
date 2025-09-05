'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './SalesReport.module.css';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Modal from '@/components/Modal';
import { useBusiness } from '@/context/BusinessContext';

// Type definitions
interface Product { id: string; name: string; price: string; quantity: number; type: 'product'; }
interface Combo { id: string; name: string; price: string; products: { product: Product; quantity: number; }[]; type: 'combo'; }
interface SaleItem { id: string; quantity: number; priceAtSale: string; productId?: string; product?: Product; comboId?: string; combo?: Combo; }
interface Sale { id: string; totalAmount: string; paymentMethod: string; createdAt: string; items: SaleItem[]; }

export default function SalesReportPage() {
  const { activeBusiness, loading: businessLoading } = useBusiness();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    if (!activeBusiness) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ businessId: activeBusiness.id });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const response = await fetch(`/api/sales?${params.toString()}`);
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch sales');
      const data = await response.json();
      setSales(data.sales);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, startDate, endDate]);

  useEffect(() => { if (activeBusiness) fetchSales(); }, [activeBusiness, fetchSales]);

  const handleDeleteSale = async (saleId: string) => {
    if (!activeBusiness) return alert('No active business selected.');
    if (window.confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
      try {
        const res = await fetch(`/api/sales/${saleId}?businessId=${activeBusiness.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete sale');
        fetchSales(); // Refresh list
      } catch (err) { alert(err instanceof Error ? err.message : 'Unknown error'); }
    }
  };

  if (businessLoading) return <p>Loading business info...</p>;
  if (!activeBusiness) return <div className={styles.container}><h1 className={styles.title}>Sales Report</h1><p>Please select a business to view the report.</p></div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Sales Report</h1>
      <div className={styles.filterCard}>
        <div className={styles.grid}>
          <div>
            <label htmlFor="startDate" className={styles.label}>Start Date:</label>
            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={styles.input} />
          </div>
          <div>
            <label htmlFor="endDate" className={styles.label}>End Date:</label>
            <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={styles.input} />
          </div>
        </div>
        <button onClick={fetchSales} className={styles.button} disabled={loading}>{loading ? 'Loading...' : 'Update Report'}</button>
      </div>

      {error && <div className={styles.errorAlert}><strong>Error:</strong><span> {error}</span></div>}
      {loading && <p>Loading sales...</p>}
      {!loading && sales.length === 0 && !error && <p className={styles.noData}>No sales for the selected period.</p>}

      {!loading && sales.length > 0 && (
        <div className={styles.salesList}>
          {sales.map((sale) => (
            <div key={sale.id} className={styles.saleCard}>
              <div className={styles.saleHeader}>
                <div className={styles.saleInfo}>
                  <span className={styles.saleDate}>{format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                  <span className={styles.salePaymentMethod}>{sale.paymentMethod}</span>
                </div>
                <div className={styles.saleTotal}>Total: {parseFloat(sale.totalAmount).toFixed(2)}€</div>
                <div>
                  <button onClick={() => alert('Edit functionality is disabled.')} className={styles.editButton} title="Edit Sale">✏️</button>
                  <button onClick={() => handleDeleteSale(sale.id)} className={styles.deleteButton} title="Delete Sale">🗑️</button>
                  <button onClick={() => setExpandedSaleId(expandedSaleId === sale.id ? null : sale.id)} className={styles.expandButton}>{expandedSaleId === sale.id ? '▲' : '▼'}</button>
                </div>
              </div>
              {expandedSaleId === sale.id && (
                <div className={styles.saleDetails}>
                  <h4 className={styles.detailsTitle}>Sale Items:</h4>
                  <table className={styles.itemsTable}>
                    <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
                    <tbody>
                      {sale.items.map((item) => {
                        const itemName = item.product?.name || item.combo?.name || 'Unknown';
                        const itemPrice = parseFloat(item.priceAtSale);
                        const subtotal = itemPrice * item.quantity;
                        return (
                          <tr key={item.id}>
                            <td>{itemName}</td>
                            <td>{item.quantity}</td>
                            <td>{itemPrice.toFixed(2)}€</td>
                            <td>{subtotal.toFixed(2)}€</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
