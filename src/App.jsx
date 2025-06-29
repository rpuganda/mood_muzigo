import React, { useState, useEffect, useRef } from 'react';

// Main App Component
const App = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // State variables for Sales Table Input (itemized)
  const [salesEntries, setSalesEntries] = useState([
    {
      id: Date.now().toString() + '-0',
      itemName: '',
      quantitySold: '',
      unitCostPrice: '',
      unitSellPrice: '',
      totalCostPrice: 0,
      totalSellingPrice: 0,
      profit: 0,
    }
  ]);
  const lastRowRef = useRef(null);

  // Daily/Weekly/Monthly Summary States
  const [dailyTotalCollected, setDailyTotalCollected] = useState(0);
  const [dailyTotalCost, setDailyTotalCost] = useState(0);
  const [dailyTotalProfit, setDailyTotalProfit] = useState(0);

  const [weeklyTotalCollected, setWeeklyTotalCollected] = useState(0);
  const [weeklyTotalCost, setWeeklyTotalCost] = useState(0);
  const [weeklyTotalProfit, setWeeklyTotalProfit] = useState(0);

  const [monthlyTotalCollected, setMonthlyTotalCollected] = useState(0);
  const [monthlyTotalCost, setMonthlyTotalCost] = useState(0);
  const [monthlyTotalProfit, setMonthlyTotalProfit] = useState(0);

  // State for all recorded itemized sales
  const [allRecordedSales, setAllRecordedSales] = useState([]);
  // State to control visibility of sales history modal
  const [showSalesHistoryModal, setShowSalesHistoryModal] = useState(false);

  // New state for selected date to view daily summary
  const [selectedViewDate, setSelectedViewDate] = useState(new Date().toISOString().split('T')[0]);


  // --- Local Storage Keys ---
  const SALES_STORAGE_KEY = 'wholesale-business-app-sales-simplified';


  // --- Helper to get date 100 days ago ---
  const get100DaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 100);
    return d.getTime(); // Return timestamp for comparison
  };

  // --- Initial Data Load from Local Storage ---
  useEffect(() => {
    try {
      console.log("App Initializing: Attempting to load data from Local Storage...");
      const storedSales = localStorage.getItem(SALES_STORAGE_KEY);
      if (storedSales) {
        const hundredDaysAgoTimestamp = get100DaysAgo();
        const parsedSales = JSON.parse(storedSales);
        const filteredSales = parsedSales.filter(record => {
            return record.saleTimestamp >= hundredDaysAgoTimestamp;
        });
        setAllRecordedSales(filteredSales);
        console.log("Data Loaded Successfully:", filteredSales);
      } else {
        console.log("No existing data found in Local Storage for key:", SALES_STORAGE_KEY);
      }
    } catch (error) {
      console.error("ERROR during initial data load from Local Storage:", error);
      setMessage(`Error loading data: ${error.message}`);
    } finally {
      setIsInitialized(true); // Mark initialization as complete regardless of success/failure
      setLoading(false); // Stop loading indicator
    }
  }, []);


  // --- Save All Recorded Sales to Local Storage whenever 'allRecordedSales' state changes ---
  useEffect(() => {
    if (!isInitialized) {
      console.log("Skipping save: App not yet initialized.");
      return;
    }

    try {
        const hundredDaysAgoTimestamp = get100DaysAgo();
        const filteredSalesToSave = allRecordedSales.filter(record => {
            return record.saleTimestamp >= hundredDaysAgoTimestamp;
        });

        localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(filteredSalesToSave));
        console.log("Data Saved to Local Storage for key:", SALES_STORAGE_KEY, "Data:", filteredSalesToSave);
        
        updateSummaryDisplays(); // Recalculate summaries based on the now updated `allRecordedSales` state
    } catch (error) {
        console.error("ERROR saving data to Local Storage:", error);
        setMessage(`Error saving data: ${error.message}`);
    }
  }, [allRecordedSales, isInitialized]);


  // --- Update Summary Displays (Daily/Weekly/Monthly) ---
  const updateSummaryDisplays = () => {
    let dailySumCollected = 0;
    let dailySumCost = 0;
    let dailySumProfit = 0;

    let weeklySumCollected = 0;
    let weeklySumCost = 0;
    let weeklySumProfit = 0;

    let monthlySumCollected = 0;
    let monthlySumCost = 0;
    let monthlySumProfit = 0;

    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    allRecordedSales.forEach(sale => {
        const saleDate = new Date(sale.saleDate);

        // For the Selected Daily Summary
        if (sale.saleDate === selectedViewDate) {
            dailySumCollected += sale.totalSellingPrice || 0;
            dailySumCost += sale.totalCostPrice || 0;
            dailySumProfit += sale.profit || 0;
        }

        // For the Weekly Summary (always based on last 7 days from *current* date)
        if (saleDate >= sevenDaysAgo) {
            weeklySumCollected += sale.totalSellingPrice || 0;
            weeklySumCost += sale.totalCostPrice || 0;
            weeklySumProfit += sale.profit || 0;
        }

        // For the Monthly Summary (always based on current month/year)
        if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
            monthlySumCollected += sale.totalSellingPrice || 0;
            monthlySumCost += sale.totalCostPrice || 0;
            monthlySumProfit += sale.profit || 0;
        }
    });

    setDailyTotalCollected(dailySumCollected);
    setDailyTotalCost(dailySumCost);
    setDailyTotalProfit(dailySumProfit);

    setWeeklyTotalCollected(weeklySumCollected);
    setWeeklyTotalCost(weeklySumCost);
    setWeeklyTotalProfit(weeklySumProfit);

    setMonthlyTotalCollected(monthlySumCollected);
    setMonthlyTotalCost(monthlySumCost);
    setMonthlyTotalProfit(monthlySumProfit);
  };

  // Effect to re-calculate summaries when selectedViewDate changes or records update
  useEffect(() => {
    updateSummaryDisplays();
  }, [selectedViewDate, allRecordedSales]);


  // --- Sales Table Handlers (for current sale input) ---
  const calculateEntryTotals = (entry) => {
    const quantity = parseFloat(entry.quantitySold) || 0;
    const unitCost = parseFloat(entry.unitCostPrice) || 0;
    const unitSell = parseFloat(entry.unitSellPrice) || 0;

    const totalCost = unitCost * quantity;
    const totalSell = unitSell * quantity;
    const profit = totalSell - totalCost;

    return { totalCostPrice: totalCost, totalSellingPrice: totalSell, profit: profit };
  };

  const handleSalesEntryChange = (index, e) => {
    const { name, value } = e.target;
    setSalesEntries(prevEntries => prevEntries.map((entry, i) => {
      if (i === index) {
        const newEntry = { ...entry, [name]: value };
        return { ...newEntry, ...calculateEntryTotals(newEntry) };
      }
      return entry;
    }));
  };

  const addSalesEntryRow = () => {
    setSalesEntries(prevEntries => {
        const lastEntry = prevEntries[prevEntries.length - 1];
        if (lastEntry && lastEntry.itemName && parseFloat(lastEntry.quantitySold) > 0 && parseFloat(lastEntry.unitCostPrice) >= 0 && parseFloat(lastEntry.unitSellPrice) >= 0) {
            return [
                ...prevEntries,
                { id: Date.now().toString() + '-' + prevEntries.length, itemName: '', quantitySold: '', unitCostPrice: '', unitSellPrice: '', totalCostPrice: 0, totalSellingPrice: 0, profit: 0 }
            ];
        } else if (prevEntries.length === 1 && !lastEntry.itemName && !lastEntry.quantitySold && !lastEntry.unitCostPrice && !lastEntry.unitSellPrice) {
            setMessage("Please enter details for the current item before adding a new one.");
            return prevEntries;
        } else {
            setMessage("Please ensure the current item's Name, Quantity, Buying Price, and Selling Price are filled with valid numbers before adding a new row.");
            return prevEntries;
        }
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        if (salesEntries.length > 0 && lastRowRef.current) {
            const lastEntry = salesEntries[salesEntries.length - 1];
            if (!lastEntry.itemName && !lastEntry.quantitySold && !lastEntry.unitCostPrice && !lastEntry.unitSellPrice) {
                lastRowRef.current.focus();
            }
        }
    }, 0);
    return () => clearTimeout(timer);
  }, [salesEntries.length]);


  const handleKeyDown = (index, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = e.target.form;
      const indexInForm = Array.prototype.indexOf.call(form.elements, e.target);
      const isLastInputInCurrentRow = e.target.name === 'unitSellPrice';

      if (isLastInputInCurrentRow && index === salesEntries.length - 1) {
          addSalesEntryRow();
      } else {
          const nextElement = form.elements[indexInForm + 1];
          if (nextElement) {
              nextElement.focus();
          } else {
              addSalesEntryRow();
          }
      }
    }
  };


  const removeSalesEntryRow = (idToRemove) => {
    setSalesEntries(prevEntries => {
        const filtered = prevEntries.filter(entry => entry.id !== idToRemove);
        if (filtered.length === 0) {
            return [{ id: Date.now().toString() + '-0', itemName: '', quantitySold: '', unitCostPrice: '', unitSellPrice: '', totalCostPrice: 0, totalSellingPrice: 0, profit: 0 }];
        }
        return filtered;
    });
  };

  const totalSalesTableCost = salesEntries.reduce((sum, entry) => sum + (entry.totalCostPrice || 0), 0);
  const totalSalesTableSelling = salesEntries.reduce((sum, entry) => sum + (entry.totalSellingPrice || 0), 0);
  const totalSalesTableProfit = salesEntries.reduce((sum, entry) => sum + (entry.profit || 0), 0);


  const saveSale = () => {
    const validEntries = salesEntries.filter(entry =>
      entry.itemName && parseFloat(entry.quantitySold) > 0 && parseFloat(entry.unitCostPrice) >= 0 && parseFloat(entry.unitSellPrice) >= 0
    );

    if (validEntries.length === 0) {
      setMessage('Please enter at least one complete item to save the sale.');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const newRecordedSales = validEntries.map(entry => ({
          id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
          itemName: entry.itemName,
          saleDate: today,
          saleTimestamp: Date.now(),
          quantitySold: parseFloat(entry.quantitySold),
          unitCostPrice: parseFloat(entry.unitCostPrice),
          unitSellPrice: parseFloat(entry.unitSellPrice),
          totalCostPrice: entry.totalCostPrice,
          totalSellingPrice: entry.totalSellingPrice,
          profit: entry.profit,
      }));

      setAllRecordedSales(prevAllSales => [...prevAllSales, ...newRecordedSales]);

      setMessage(`Sale saved successfully for ${newRecordedSales.length} item(s)!`);
      setSalesEntries([
        { id: Date.now().toString() + '-0', itemName: '', quantitySold: '', unitCostPrice: '', unitSellPrice: '', totalCostPrice: 0, totalSellingPrice: 0, profit: 0 }
      ]);
      setSelectedViewDate(today);
    } catch (error) {
      console.error("Error saving sale:", error);
      setMessage(`Error saving sale: ${error.message}`);
    }
  };

  const deleteRecordedSale = (saleId) => {
      try {
          const updatedRecordedSales = allRecordedSales.filter(sale => sale.id !== saleId);
          setAllRecordedSales(updatedRecordedSales);
          setMessage('Recorded sale deleted successfully!');
      } catch (error) {
          console.error("Error deleting recorded sale:", error);
          setMessage(`Error deleting recorded sale: ${error.message}`);
      }
  };

  // --- Export Sales Data to CSV ---
  const exportSalesData = () => {
    if (allRecordedSales.length === 0) {
      setMessage("No sales data to export!");
      return;
    }

    try {
      // Define CSV headers
      const headers = [
        "Date", "Item Name", "Quantity", "Unit Cost Price", "Unit Sell Price",
        "Total Cost Price", "Total Selling Price", "Profit"
      ];

      // Convert sales data to CSV format
      const csvRows = [];
      csvRows.push(headers.join(',')); // Add headers row

      allRecordedSales.forEach(sale => {
        const row = [
          `"${new Date(sale.saleDate).toLocaleDateString()}"`, // Format date and wrap in quotes for commas
          `"${sale.itemName.replace(/"/g, '""')}"`, // Escape quotes in item name
          sale.quantitySold,
          Math.round(sale.unitCostPrice),
          Math.round(sale.unitSellPrice),
          Math.round(sale.totalCostPrice),
          Math.round(sale.totalSellingPrice),
          Math.round(sale.profit)
        ];
        csvRows.push(row.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `MoodMuzigo_Sales_Export_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden'; // Hide the link
      document.body.appendChild(link);
      link.click(); // Programmatically click the link to trigger download
      document.body.removeChild(link); // Clean up the link element
      URL.revokeObjectURL(url); // Release the object URL

      setMessage("Sales data exported successfully!");
    } catch (error) {
      console.error("Error exporting sales data:", error);
      setMessage(`Error exporting data: ${error.message}`);
    }
  };


  // Render loading state if data is still being loaded
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
        <div className="flex flex-col items-center justify-center bg-white p-8 rounded-xl shadow-lg animate-pulse">
          <svg className="animate-spin h-10 w-10 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-700 text-lg font-semibold">Loading app...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 font-sans text-gray-800 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-purple-800 tracking-tight mb-2">
          🍬 Mood Muzigo Agencies 🍫
        </h1>
        <p className="text-lg text-purple-600">
          Manage your sales and business.
        </p>
      </header>

      {/* Message Display */}
      {message && (
        <div className={`p-4 mb-6 rounded-lg text-center ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} shadow-md`}>
          {message}
        </div>
      )}

      {/* Record Sale Section (Table-based) */}
      <section className="bg-white p-6 sm:p-8 rounded-xl shadow-lg mb-8 max-w-4xl mx-auto border-b-4 border-pink-500">
        <h2 className="text-2xl font-bold text-pink-700 mb-6">Record a Sale</h2>

        <div className="overflow-x-auto mb-4">
          <table className="w-full table-auto bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Item Name</th>
                <th className="py-3 px-6 text-center">Quantity</th>
                <th className="py-3 px-6 text-right">Buying Price</th>
                <th className="py-3 px-6 text-right">Selling Price</th>
                <th className="py-3 px-6 text-right">Total Cost</th>
                <th className="py-3 px-6 text-right">Total Sell</th>
                <th className="py-3 px-6 text-right">Profit</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {salesEntries.map((entry, index) => (
                <tr key={entry.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left">
                    <input
                      type="text"
                      name="itemName"
                      placeholder="e.g., Chocolate Bar"
                      value={entry.itemName}
                      onChange={(e) => handleSalesEntryChange(index, e)}
                      className="p-2 border border-gray-300 rounded-md w-full focus:ring-1 focus:ring-pink-400"
                      ref={index === salesEntries.length -1 ? lastRowRef : null}
                    />
                  </td>
                  <td className="py-3 px-6 text-center">
                    <input
                      type="number"
                      name="quantitySold"
                      placeholder="Qty"
                      value={entry.quantitySold}
                      onChange={(e) => handleSalesEntryChange(index, e)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      min="1"
                      className="p-2 border border-gray-300 rounded-md w-full text-center focus:ring-1 focus:ring-pink-400"
                    />
                  </td>
                  <td className="py-3 px-6 text-right">
                    <input
                      type="number"
                      name="unitCostPrice"
                      placeholder="Cost"
                      value={entry.unitCostPrice}
                      onChange={(e) => handleSalesEntryChange(index, e)}
                      step="1000"
                      className="p-2 border border-gray-300 rounded-md w-full text-right focus:ring-1 focus:ring-pink-400"
                    />
                  </td>
                  <td className="py-3 px-6 text-right">
                    <input
                      type="number"
                      name="unitSellPrice"
                      placeholder="Sell"
                      value={entry.unitSellPrice}
                      onChange={(e) => handleSalesEntryChange(index, e)}
                      step="1000"
                      className="p-2 border border-gray-300 rounded-md w-full text-right focus:ring-1 focus:ring-pink-400"
                    />
                  </td>
                  <td className="py-3 px-6 text-right font-medium">{Math.round(entry.totalCostPrice)}</td>
                  <td className="py-3 px-6 text-right font-medium">{Math.round(entry.totalSellingPrice)}</td>
                  <td className="py-3 px-6 text-right font-medium">{Math.round(entry.profit)}</td>
                  <td className="py-3 px-6 text-center">
                    {salesEntries.length > 1 && (
                      <button
                        onClick={() => removeSalesEntryRow(entry.id)}
                        className="text-red-500 hover:text-red-700 font-bold py-1 px-2 rounded-full transition-colors duration-200"
                        title="Remove item from current sale"
                      >
                        &#x2715; {/* Unicode X mark */}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
                <tr className="bg-gray-100 font-semibold text-gray-700 text-sm">
                    <td colSpan="4" className="py-3 px-6 text-right">Final Cost Price:</td>
                    <td className="py-3 px-6 text-right">{Math.round(totalSalesTableCost)}</td>
                    <td className="py-3 px-6 text-right">-</td>
                    <td className="py-3 px-6 text-right">-</td>
                    <td className="py-3 px-6 text-center"></td>
                </tr>
                <tr className="bg-gray-100 font-semibold text-gray-700 text-sm">
                    <td colSpan="4" className="py-3 px-6 text-right">Final Selling Price:</td>
                    <td className="py-3 px-6 text-right">-</td>
                    <td className="py-3 px-6 text-right">{Math.round(totalSalesTableSelling)}</td>
                    <td className="py-3 px-6 text-right">-</td>
                    <td className="py-3 px-6 text-center"></td>
                </tr>
                <tr className="bg-gray-100 font-bold text-lg text-purple-800">
                    <td colSpan="4" className="py-3 px-6 text-right">Total Profit (Sale):</td>
                    <td className="py-3 px-6 text-right">-</td>
                    <td className="py-3 px-6 text-right">-</td>
                    <td className="py-3 px-6 text-right">{Math.round(totalSalesTableProfit)}</td>
                    <td className="py-3 px-6 text-center"></td>
                </tr>
            </tfoot>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4">
            <button
                onClick={addSalesEntryRow}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
                Add Another Item
            </button>
            <button
                onClick={saveSale}
                className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            >
                Save Sale
            </button>
        </div>
      </section>

      {/* Daily Summary Section - Now reflects selected date */}
      <section className="bg-white p-6 sm:p-8 rounded-xl shadow-lg mb-8 max-w-4xl mx-auto border-b-4 border-emerald-500">
        <h2 className="text-2xl font-bold text-emerald-700 mb-4">Daily Summary</h2>
        <div className="mb-4">
            <label htmlFor="selectViewDate" className="block text-gray-700 text-sm font-bold mb-2">View Summary for Date:</label>
            <input
                type="date"
                id="selectViewDate"
                value={selectedViewDate}
                onChange={(e) => setSelectedViewDate(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
            />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-emerald-50 p-4 rounded-lg shadow-sm">
            <p className="text-gray-700 text-lg font-semibold">Total Revenue</p>
            <p className="text-3xl font-bold text-emerald-600">{Math.round(dailyTotalCollected)}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg shadow-sm">
            <p className="text-gray-700 text-lg font-semibold">Total Cost</p>
            <p className="text-3xl font-bold text-emerald-600">{Math.round(dailyTotalCost)}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg shadow-sm">
            <p className="text-gray-700 text-lg font-semibold">Total Profit</p>
            <p className="text-3xl font-bold text-emerald-600">{Math.round(dailyTotalProfit)}</p>
          </div>
        </div>
      </section>

      {/* Weekly Summary Section */}
      <section className="bg-white p-6 sm:p-8 rounded-xl shadow-lg mb-8 max-w-4xl mx-auto border-b-4 border-cyan-500">
        <h2 className="text-2xl font-bold text-cyan-700 mb-4">Weekly Summary (Last 7 Days)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-cyan-50 p-4 rounded-lg shadow-sm">
            <p className="text-gray-700 text-lg font-semibold">Total Weekly Revenue</p>
            <p className="text-3xl font-bold text-cyan-600">{Math.round(weeklyTotalCollected)}</p>
          </div>
          <div className="bg-cyan-50 p-4 rounded-lg shadow-sm">
            <p className="text-gray-700 text-lg font-semibold">Total Weekly Cost</p>
            <p className="text-3xl font-bold text-cyan-600">{Math.round(weeklyTotalCost)}</p>
          </div>
          <div className="bg-cyan-50 p-4 rounded-lg shadow-sm">
            <p className="text-gray-700 text-lg font-semibold">Total Weekly Profit</p>
            <p className="text-3xl font-bold text-cyan-600">{Math.round(weeklyTotalProfit)}</p>
          </div>
        </div>
      </section>

      {/* Monthly Summary Section */}
      <section className="bg-white p-6 sm:p-8 rounded-xl shadow-lg mb-8 max-w-4xl mx-auto border-b-4 border-teal-500">
        <h2 className="text-2xl font-bold text-teal-700 mb-4">Monthly Summary (Current Month)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-teal-50 p-4 rounded-lg shadow-sm">
            <p className="text-gray-700 text-lg font-semibold">Total Monthly Revenue</p>
            <p className="text-3xl font-bold text-teal-600">{Math.round(monthlyTotalCollected)}</p>
          </div>
          <div className="bg-teal-50 p-4 rounded-lg shadow-sm">
            <p className="text-gray-700 text-lg font-semibold">Total Monthly Cost</p>
            <p className="text-3xl font-bold text-teal-600">{Math.round(monthlyTotalCost)}</p>
          </div>
          <div className="bg-teal-50 p-4 rounded-lg shadow-sm">
            <p className="text-gray-700 text-lg font-semibold">Total Monthly Profit</p>
            <p className="text-3xl font-bold text-teal-600">{Math.round(monthlyTotalProfit)}</p>
          </div>
        </div>
      </section>

      {/* Sales History Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => setShowSalesHistoryModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          View Sales History
        </button>
      </div>

      {/* Export Button for Sales History */}
      <div className="flex justify-center mb-8">
        <button
          onClick={exportSalesData}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Export Sales Data (CSV)
        </button>
      </div>


      {/* Sales History Modal */}
      {showSalesHistoryModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <h2 className="text-2xl font-bold text-orange-700 mb-6 sticky top-0 bg-white pb-2 z-10">Sales History (Last 100 Days)</h2>
            <button
              onClick={() => setShowSalesHistoryModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold"
              title="Close"
            >
              &times;
            </button>
            {allRecordedSales.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No sales recorded yet. Save a sale to see history!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto bg-white rounded-lg shadow-md">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">Date</th>
                      <th className="py-3 px-6 text-left">Item Name</th>
                      <th className="py-3 px-6 text-center">Qty</th>
                      <th className="py-3 px-6 text-right">Total Cost</th>
                      <th className="py-3 px-6 text-right">Total Sell</th>
                      <th className="py-3 px-6 text-right">Profit</th>
                      <th className="py-3 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm font-light">
                    {allRecordedSales.slice().sort((a, b) => b.saleTimestamp - a.saleTimestamp).map(sale => ( // Display most recent first
                      <tr key={sale.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-6 text-left">{new Date(sale.saleDate).toLocaleDateString()}</td>
                        <td className="py-3 px-6 text-left">{sale.itemName}</td>
                        <td className="py-3 px-6 text-center">{sale.quantitySold}</td>
                        <td className="py-3 px-6 text-right">{Math.round(sale.totalCostPrice)}</td>
                        <td className="py-3 px-6 text-right">{Math.round(sale.totalSellingPrice)}</td>
                        <td className="py-3 px-6 text-right">{Math.round(sale.profit)}</td>
                        <td className="py-3 px-6 text-center">
                          <button
                            onClick={() => deleteRecordedSale(sale.id)}
                            className="text-red-500 hover:text-red-700 font-bold py-1 px-2 rounded-full transition-colors duration-200"
                            title="Delete this record"
                          >
                            &#x2715;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Footer */}
      <footer className="mt-10 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Mood Muzigo Agencies. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
