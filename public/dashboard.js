//on page load, if the user is not an admin, hide the section with id 'admin'

document.addEventListener('DOMContentLoaded', async() => {
    const errorElement = document.getElementById('error');
    const username = document.getElementById('username');
    const adminSection = document.getElementById('admin');
    const userSection = document.getElementById('user');

    try {
        const res = await fetch('/api/user');
        if (!res.ok) {
            throw new Error('Failed to fetch user data');
        }
        const user = await res.json();
        username.innerText = 'Welcome, ' + user.username;

        if (user.isAdmin) {
            userSection.style.display = 'none';
        } else {
            adminSection.style.display = 'none';
        }
    } catch (err) {
        console.error(err);
        errorElement.innerText = 'Failed to load user data';
    }
});

document.addEventListener('DOMContentLoaded', async() => {
    const expensesTableBody = document.getElementById('expensesTableBody');
    const categoriesBody = document.getElementById('categoriesDisplay');
    const expensesTotals = document.getElementById('totalExpense');
    let total_amount = 0.0;

    try {
        // Fetch expenses
        const res = await fetch('/expenses');
        if (!res.ok) {
            throw new Error('Failed to fetch expenses');
        }
        const expenses = await res.json();
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.id}</td>
                <td>${expense.amount}</td>
                <td>${expense.date}</td>
                <td>${expense.category}</td>
                <td><button class="btn btn-primary" onclick="editExpense(${expense.id})">Edit</button></td>
                <td><button class="btn btn-danger" onclick="deleteExpense(${expense.id})">Delete</button></td>
            `;
            expensesTableBody.appendChild(row);
        });

        // Fetch categories
        const categories_results = await fetch('/api/expenses/categories');
        if (!categories_results.ok) {
            throw new Error("Couldn't fetch the categories data.");
        }

        const categories = await categories_results.json();
        categories.forEach(category => {
            const element_div = document.createElement('div');
            element_div.style.flexBasis = '16.6%';
            // element_div.style.flexBasis = '25%'; // Ensure at least 4 items in a row
            element_div.innerHTML = `
                <div>
                    <subtitle style="font-size: 12px;">${category.category}</subtitle><br>
                    <span id="balance" style="font-size: 12px;">$${category.category_amount.toFixed(2)}</span>
                </div>
            `;
            total_amount += parseFloat(category.category_amount);
            categoriesBody.appendChild(element_div);
        });

        console.log('The total expenses = ', total_amount);
        expensesTotals.innerHTML = '$' + total_amount.toFixed(2);
        console.log("The categories data:", categories);
        // username.innerHTML = 'Welcome, ' + categories[0].username;

    } catch (err) {
        console.error(err);
        errorElement.innerText = 'Failed to load expenses';
    }
});

async function deleteExpense(id) {
    try {
        const res = await fetch(`/api/expenses/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            throw new Error('Failed to delete expense');
        }
        alert('Expense deleted successfully');
        window.location.reload();
    } catch (err) {
        console.error(err);
        alert('Failed to delete expense ' + err.message);
    }
}

//Launch a popup window to edit the expense
function editExpense(id) {
    window.location.href = `/editExpense.html?id=${id}`;
}






// document.addEventListener('DOMContentLoaded', async() => {
//     const expensesTableBody = document.getElementById('expensesTableBody');
//     const errorElement = document.getElementById('error');
//     const categoriesBody = document.getElementById('categoriesDisplay')
//     const expensesTotals = document.getElementById('totalExpense')
//     const total_amount = 0.0;


//     try {
//         const res = await fetch('/expenses');
//         if (!res.ok) {
//             throw new Error('Failed to fetch expenses');
//         }
//         const expenses = await res.json();
//         expenses.forEach(expense => {
//             const row = document.createElement('tr');
//             row.innerHTML = `
//                 <td>${expense.id}</td>
//                 <td>${expense.amount}</td>
//                 <td>${expense.date}</td>
//                 <td>${expense.category}</td>
//                 <td></td>
//                 <td></td>
//             `;
//             expensesTableBody.appendChild(row);
//         });
//         const categories_results = await fetch('/api/expenses/categories');
//         if (!categories_results.ok) {
//             throw new Error("Couldn't fetch the categories data.")
//         }

//         const categories = await categories_results.json();
//         categories.forEach(category => {
//             const element_div = document.createElement('div');
//             element_div.innerHTML = `
//             <div>
//             <subtitle style='font-size = 12px'>${category.category}</subtitle><br>
//             <span id="balance" style='font-size = 12px'>$${category.category_amount}</span>
//             </div>
//             `;
//             // total_amount = total_amount + category.category_amount;
//             categoriesBody.appendChild(element_div);
//         });
//         console.log('The total expenses = ', total_amount);
//         expensesTotals.innerHTML = '$' + total_amount;
//         console.log("The categories data:", categories);

//     } catch (err) {
//         console.error(err);
//         errorElement.innerText = 'Failed to load expenses';
//     }
// });