'use client';

import React, { useState, useEffect } from 'react';
import styles from './SalesReport.module.css';

interface ProductReport {
  name: string;
  quantity: number;
  total: number;
}

interface PaymentMethodReport {
  method: string;
  total: number;
}

interface SalesReportData {
  productsReport: ProductReport[];
  paymentMethodsReport: PaymentMethodReport[];
}

export default function SalesReportPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [report, setReport] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/sales?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch report');
      }
      const data: SalesReportData = await response.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch report on initial load or when dates change (if desired, or only on button click)
  // useEffect(() => {
  //   fetchSalesReport();
  // }, [startDate, endDate]); // Uncomment to fetch automatically on date change

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Informe de Ventas</h1>

      <div className={styles.filterCard}>
        <h2 className={styles.filterTitle}>Filtros de Fecha</h2>
        <div className={styles.grid}>
          <div>
            <label htmlFor="startDate" className={styles.label}>Fecha de Inicio:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.input}
            />
          </div>
          <div>
            <label htmlFor="endDate" className={styles.label}>Fecha de Fin:</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.input}
            />
          </div>
        </div>
        <button
          onClick={fetchSalesReport}
          className={styles.button}
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Generar Reporte'}
        </button>
      </div>

      {error && (
        <div className={styles.errorAlert} role="alert">
          <strong className={styles.errorStrong}>Error:</strong>
          <span className={styles.errorSpan}> {error}</span>
        </div>
      )}

      {report && (
        <div className={styles.reportGrid}>
          <div className={styles.reportCard}>
            <h2 className={styles.reportSectionTitle}>Ventas por Producto</h2>
            {report.productsReport.length > 0 ? (
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th scope="col" className={styles.tableTh}>Producto</th>
                    <th scope="col" className={`${styles.tableTh} ${styles.tableThRight}`}>Cantidad</th>
                    <th scope="col" className={`${styles.tableTh} ${styles.tableThRight}`}>Total</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {report.productsReport.map((item, index) => (
                    <tr key={index}>
                      <td className={`${styles.tableTd} ${styles.tableTdName}`}>{item.name}</td>
                      <td className={`${styles.tableTd} ${styles.tableTdValue} ${styles.tableThRight}`}>{item.quantity}</td>
                      <td className={`${styles.tableTd} ${styles.tableTdValue} ${styles.tableThRight}`}>{item.total.toFixed(2)}€</td>
                    </tr>
                  ))}
                  <tr className={styles.tableHead}>
                    <td className={`${styles.tableTd} ${styles.tableTdBold}`}>Total</td>
                    <td className={`${styles.tableTd} ${styles.tableTdBold} ${styles.tableThRight}`}></td>
                    <td className={`${styles.tableTd} ${styles.tableTdBold} ${styles.tableThRight}`}>
                      {report.productsReport.reduce((sum, item) => sum + item.total, 0).toFixed(2)}€
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className={styles.noData}>No hay datos de ventas por producto para el período seleccionado.</p>
            )}
          </div>

          <div className={styles.reportCard}>
            <h2 className={styles.reportSectionTitle}>Ventas por Medio de Pago</h2>
            {report.paymentMethodsReport.length > 0 ? (
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th scope="col" className={styles.tableTh}>Medio de Pago</th>
                    <th scope="col" className={`${styles.tableTh} ${styles.tableThRight}`}>Total</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {report.paymentMethodsReport.map((item, index) => (
                    <tr key={index}>
                      <td className={`${styles.tableTd} ${styles.tableTdName}`}>{item.method}</td>
                      <td className={`${styles.tableTd} ${styles.tableTdValue} ${styles.tableThRight}`}>{item.total.toFixed(2)}€</td>
                    </tr>
                  ))}
                  <tr className={styles.tableHead}>
                    <td className={`${styles.tableTd} ${styles.tableTdBold}`}>Total</td>
                    <td className={`${styles.tableTd} ${styles.tableTdBold} ${styles.tableThRight}`}>
                      {report.paymentMethodsReport.reduce((sum, item) => sum + item.total, 0).toFixed(2)}€
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className={styles.noData}>No hay datos de ventas por medio de pago para el período seleccionado.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
