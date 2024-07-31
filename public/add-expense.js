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



document.getElementById('submitExpense').addEventListener('click', async(event) => {
    event.preventDefault(); // Prevent the default form submission

    const amount = document.getElementById('amount').value;
    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value;

    if (!amount || !date || !category) {
        document.getElementById('errorMessage').innerText = 'Please fill out all fields';
        return;
    }

    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount, date, category })
        });

        if (response.ok) {
            alert('Expense added successfully');
            window.location.href = '/dashboard.html'; // Redirect to dashboard or another page
        } else {
            const error = await response.text();
            document.getElementById('errorMessage').innerText = 'Error: ' + error;
        }
    } catch (error) {
        document.getElementById('errorMessage').innerText = 'Something went wrong: ' + error.message;
    }
});