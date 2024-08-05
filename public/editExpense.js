    document.addEventListener('DOMContentLoaded', async() => {
        const urlParams = new URLSearchParams(window.location.search);
        const expenseId = urlParams.get('id');

        try {
            // Fetch the expense data
            const res = await fetch(`/api/expenses/${expenseId}`);
            if (!res.ok) {
                throw new Error('Failed to fetch expense');
            }
            const expense = await res.json();

            // Populate the existing data fields
            document.getElementById('existingAmount').value = expense.amount;
            document.getElementById('existingDate').value = expense.date;
            document.getElementById('existingCategory').value = expense.category;

            // Fetch categories for the dropdown
            const categoryRes = await fetch('/api/categories');
            if (!categoryRes.ok) {
                throw new Error('Failed to fetch categories');
            }
            const categories = await categoryRes.json();
            const categorySelect = document.getElementById('category');
            categories.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.category;
                option.text = category.category;
                categorySelect.appendChild(option);
            });

        } catch (err) {
            console.error(err);
            alert('Failed to load expense data due to error: ' + err.message);
        }
    });

    async function updateExpense(event) {
        event.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const expenseId = urlParams.get('id');
        const amount = document.getElementById('amount').value || document.getElementById('existingAmount').value;
        const date = document.getElementById('newDate').value || document.getElementById('existingDate').value;
        const category = document.getElementById('category').value || document.getElementById('existingCategory').value;

        try {
            const res = await fetch(`/api/expenses/${expenseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                    date,
                    category
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to update expense');
            }

            alert('Expense updated successfully');
            window.location.href = './dashboard';
        } catch (err) {
            console.error(err);
            alert('Failed to update expense');
        }
    }

    //get categories on load
    document.addEventListener('DOMContentLoaded', async() => {
        try {
            const response = await fetch('/api/categories');
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            const data = await response.json();
            const categorySelect = document.getElementById('category');
            data.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.category;
                option.textContent = category.category.charAt(0).toUpperCase() + category.category.slice(1); // Capitalize first letter
                categorySelect.appendChild(option);
            });
        } catch (error) {
            document.getElementById('errorMessage').innerText = 'Failed to load categories: ' + error.message;
        }
    });