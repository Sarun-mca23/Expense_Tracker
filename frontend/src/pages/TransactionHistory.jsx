import React, { useState, useEffect } from 'react';
import styles from './styles/history.module.css';
import { format, isSameDay } from 'date-fns';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [typeFilter, setTypeFilter] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('UserToken');
        console.log("Fetched token:", token);

        const fetchTransactions = async () => {
            try {
                const response = await fetch('https://expense-tracker-backend-0h9t.onrender.com/api/user/history', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch transactions');
                }

                const data = await response.json();
                setTransactions(data);
                console.log("Transactions fetched from server:", data);
                setLoading(false);
            } catch (error) {
                setLoading(false);
                setError(error.message);
                console.error('Error fetching transaction history:', error);
            }
        };

        fetchTransactions();
    }, []);

    useEffect(() => {
        let updated = [...transactions];

        if (selectedDate) {
            const selected = new Date(selectedDate);
            updated = updated.filter(txn =>
                isSameDay(new Date(txn.createdAt), selected)
            );
        }

        if (typeFilter) {
            updated = updated.filter(txn =>
                txn.type && txn.type.toLowerCase() === typeFilter.toLowerCase()
            );
        }

        // Sort by newest first
        updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setFilteredTransactions(updated);
    }, [transactions, selectedDate, typeFilter]);


    const totalAmount = filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0);

    const handleDateChange = (e) => setSelectedDate(e.target.value);
    const handleTypeChange = (e) => setTypeFilter(e.target.value);
    const clearFilters = () => {
        setSelectedDate('');
        setTypeFilter('');
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.tableContainer}>
                <h1>Transaction History</h1>

                <div className={styles.controlsWrapper}>
                    <div className={styles.filterGroup}>
                        <label htmlFor="dateFilter">Filter by Date:</label>
                        <input
                            id="dateFilter"
                            type="date"
                            value={selectedDate}
                            onChange={handleDateChange}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label htmlFor="typeFilter">Filter by Type:</label>
                        <select id="typeFilter" value={typeFilter} onChange={handleTypeChange}>
                            <option value="">-- Select --</option>
                            <option value="deposit">Deposit</option>
                            <option value="withdraw">Withdraw</option>
                        </select>
                    </div>

                    <button className={styles.clearBtn} onClick={clearFilters}>
                        Clear Filters
                    </button>
                </div>

                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((txn) => (
                                <tr key={txn._id}>
                                    <td>{format(new Date(txn.createdAt), 'MMM dd, yyyy')}</td>
                                    <td>{txn.type ? txn.type.charAt(0).toUpperCase() + txn.type.slice(1) : 'N/A'}</td>
                                    <td>₹{txn.amount}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center' }}>No transactions found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Total amount */}
                <div className={styles.totalContainer}>
                    <strong>Total: ₹{totalAmount.toFixed(2)}</strong>
                </div>
            </div>
        </div>
    );
};

export default TransactionHistory;
