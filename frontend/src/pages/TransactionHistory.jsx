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
    const [editMode, setEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem('UserToken');

        if (!token) {
            setError('No token found. Please log in again.');
            setLoading(false);
            return;
        }

        const fetchTransactions = async () => {
            try {
                const response = await fetch('https://expense-tracker-frontend-bz32.onrender.com/api/user/history', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch transactions');
                }

                const data = await response.json();
                setTransactions(data.transactions || data);
                setLoading(false);
            } catch (error) {
                setLoading(false);
                setError(error.message);
            }
        };

        const fetchBalance = async () => {
            try {
                const response = await fetch('https://expense-tracker-frontend-bz32.onrender.comapi/user/me', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch balance');
                }

                const data = await response.json();
                setBalance(data.balance);
            } catch (error) {
                console.error('Error fetching balance:', error);
            }
        };

        fetchTransactions();
        fetchBalance();
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

    const handleCheckboxChange = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        const token = localStorage.getItem('UserToken');

        if (!token) {
            console.error('No token found! User might not be logged in.');
            return;
        }

        try {
            let updatedTransactions = [...transactions];
            let newBalance = balance;

            for (const id of selectedIds) {
                const txn = transactions.find(t => t._id === id);

                console.log('Sending DELETE request with token:', token);

                const response = await fetch(`http://localhost:2022/api/user/history/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Failed to delete transaction ${id}:`, response.status, errorText);
                    continue;
                }

                if (txn) {
                    if (txn.type === 'deposit') {
                        newBalance -= txn.amount;
                    } else if (txn.type === 'withdraw') {
                        newBalance += txn.amount;
                    }

                    updatedTransactions = updatedTransactions.filter(t => t._id !== id);
                }
            }

            setTransactions(updatedTransactions);
            setBalance(newBalance);
            setEditMode(false);
            setSelectedIds([]);
        } catch (error) {
            console.error('Error deleting transactions:', error);
        }
    };

    const toggleEditMode = () => {
        if (editMode && selectedIds.length > 0) {
            handleDeleteSelected();
        } else {
            setEditMode(!editMode);
            setSelectedIds([]);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.tableContainer}>
                <h1>Transaction History</h1>

                <div className={styles.balanceDisplay}>
                    <strong>Current Balance: ₹{balance.toFixed(2)}</strong>
                </div>

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
                            <th>Description</th>
                            {editMode && <th>Select</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((txn) => (
                                <tr key={txn._id}>
                                    <td>{format(new Date(txn.createdAt), 'MMM dd, yyyy')}</td>
                                    <td>{txn.type ? txn.type.charAt(0).toUpperCase() + txn.type.slice(1) : 'N/A'}</td>
                                    <td>₹{txn.amount}</td>
                                    <td>{txn.description || '—'}</td>
                                    {editMode && (
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(txn._id)}
                                                onChange={() => handleCheckboxChange(txn._id)}
                                            />
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={editMode ? 5 : 4} style={{ textAlign: 'center' }}>No transactions found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className={styles.totalContainer}>
                    <strong>Total: ₹{totalAmount.toFixed(2)}</strong>
                </div>

                <div className={styles.editButtonWrapper}>
                    <button className={styles.editBtn} onClick={toggleEditMode}>
                        {editMode && selectedIds.length > 0 ? 'Delete Selected' : editMode ? 'Cancel' : 'Edit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionHistory;
