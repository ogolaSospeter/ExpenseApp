document.addEventListener('DOMContentLoaded', function() {
    // Initialize MDB dropdowns if needed
    var dropdowns = document.querySelectorAll('[data-mdb-dropdown-init]');
    dropdowns.forEach(function(dropdown) {
        new mdb.Dropdown(dropdown);
    });
});

//on page load, if the user is not an admin, hide the section with id 'admin'
document.addEventListener('DOMContentLoaded', async() => {
    const errorElement = document.getElementById('error');
    const username = document.getElementById('username');
    const userSection = document.getElementById('user');
    const main = document.getElementById('mainheader');

    try {
        const res = await fetch('/api/user');
        if (!res.ok) {
            throw new Error('Failed to fetch user data');
        }
        const user = await res.json();
        username.innerText = user.username;
        if (user.isAdmin) {
            main.innerHTML = 'Expenses Administration Dashboard';
        } else {
            main.innerHTML = 'View and Manage all your Expenses';
        }
    } catch (err) {
        console.error(err);
        errorElement.innerText = 'Failed to load user data';
    }
});

document.addEventListener('DOMContentLoaded', async() => {
    const adminSection = document.getElementById('cards-container');
    try {
        const userResponse = await fetch('/api/user');
        if (!userResponse.ok) {
            throw new Error('Failed to fetch user data');
        }
        const user = await userResponse.json();

        if (user.isAdmin) {
            const chartResponse = await fetch('/api/chartdata');
            if (!chartResponse.ok) {
                throw new Error('Failed to fetch categories');
            }
            const categories = await chartResponse.json();
            console.log('Fetched data:', categories);

            const colors = ['#f08080', '#87cefa', '#98fb98', '#e6e6fa', '#ffdab9', '#d8bfd8', '#ff69b4', '#dda0dd', '#ff7f50', '#6495ed', '#ff6347', '#40e0d0', '#ee82ee', '#ff4500', '#da70d6', '#ff8c00', '#ff69b4', '#ff1493', '#ff00ff'];
            const defaultColor = '#F1C692';
            // const background-images = {""}
            const categoryImages = [
                { name: "Education", image: "https://img.freepik.com/free-vector/online-courses-cartoon-composition-with-graduate-student-climbing-textbooks-pile-get-diploma-from-monitor_1284-27833.jpg?t=st=1722503333~exp=1722506933~hmac=c454b76c51c8c8b9cd0ffb39ca7992518db34652008ca8798a044d2b2a418757&w=740" },
                { name: "Entertainment", image: "https://img.freepik.com/premium-psd/headphone-isolated-transparent-background_1263815-1256.jpg?w=740" },
                { name: "Food and Dining", image: "https://img.freepik.com/free-vector/hand-drawn-flat-design-people-eating-illustration_23-2149194115.jpg?t=st=1722503481~exp=1722507081~hmac=052b8bbebf6052285f26da8c00e585dad86f45d2e61cfc66b970d52de700263a&w=740" },
                { name: "Health and Fitness", image: "https://img.freepik.com/free-vector/running-treadmill-man-with-exercise-tools-with-modern-isometric-style-vector-illustration_82472-821.jpg?t=st=1722503528~exp=1722507128~hmac=3a8e16e5a1a66b425ec4a08519810f9b8a74d6a665807c72e4ff9296572954e1&w=740" },
                { name: "Housing", image: "https://img.freepik.com/premium-photo/model-house-with-house-front-word-blue-bottom_706452-26432.jpg?w=740" }, { name: "Insurance", image: "https://img.freepik.com/free-vector/illustration-people-with-insurance-policy_53876-43704.jpg?t=st=1722503146~exp=1722506746~hmac=565ac4b3a9f6b51874eef7a1ad66d1477bbc288e7be0b95a48f31c09d69af9ab&w=740" },
                { name: "Miscellaneous", image: "https://img.freepik.com/free-photo/fun-3d-illustration-american-referee_183364-81236.jpg?t=st=1722503756~exp=1722507356~hmac=f8ae575bf9ef3ea81f26d0f3f3116d8caf8d21fb453b799e35d17913ffa3c9ce&w=740" },
                { name: "Personal Care", image: "https://img.freepik.com/free-vector/social-security-concept-illustration_114360-25291.jpg?t=st=1722503618~exp=1722507218~hmac=1833aa5f402967afda3c5d172a6bdf7522a17b148906912226a6e52f442dcaf7&w=740" },
                { name: "Savings and Investments", image: "https://img.freepik.com/free-photo/worker-with-briefcase-green-dollar-symbol_1156-599.jpg?t=st=1722503791~exp=1722507391~hmac=20a2f32d1f87e50e82d3b64fd0745ede62dbec6373d9eb95cb35d7f664cb6978&w=740" },
                { name: "Shopping", image: "https://img.freepik.com/free-vector/abstract-shopping-bag-design_1394-1084.jpg?t=st=1722503829~exp=1722507429~hmac=29a7fc50b88ab8b6f2e8b6741e1ecc4bc1e4cf46b0086fbafd3d9aff11cdbed4&w=740" },
                { name: "Transportation", image: "https://img.freepik.com/free-photo/fun-3d-cartoon-teenage-boy_183364-80095.jpg?t=st=1722503972~exp=1722507572~hmac=4f00acba92e611d4b01733e5bfed9bfc4e7453c124d0e1ac2fc6278bc7d9e7e9&w=740" },
                { name: "Travel", image: "https://img.freepik.com/free-photo/fun-3d-cartoon-teenage-boy_183364-80095.jpg?t=st=1722503972~exp=1722507572~hmac=4f00acba92e611d4b01733e5bfed9bfc4e7453c124d0e1ac2fc6278bc7d9e7e9&w=740" }
            ];
            const defaultImage = 'https://img.freepik.com/free-vector/illustration-character-surfing-internet_53876-40833.jpg?t=st=1722504144~exp=172250774';


            categories.forEach(category => {
                const card = document.createElement('div');
                card.className = 'card';
                card.addEventListener('mouseover', () => {
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                    card.style.backgroundColor = randomColor;
                });
                card.addEventListener('mouseout', () => {
                    card.style.backgroundColor = defaultColor;
                });

                const img = document.createElement('img');
                const categoryImage = categoryImages.find(image => image.name === category.category);
                img.src = categoryImage ? categoryImage.image : defaultImage;
                img.className = 'card-img-bottom';
                img.alt = 'Category Image';
                img.style.width = '130px';
                img.style.height = '120px';
                img.style.objectFit = 'cover';
                //position at the bottom right corner of the card
                img.style.position = 'absolute';
                img.style.right = '0';
                img.style.bottom = '0';
                //overlay the image with the background color
                img.style.mixBlendMode = 'multiply';

                card.appendChild(img);

                card.innerHTML += `
                    <div class="card-body">
                        <h5 class="card-title">${category.category}</h5>
                        <p class="card-text">Kshs. ${category.total_amount.toFixed(2)}</p>
                    </div>
                `;
                adminSection.appendChild(card);
            });
        } else {
            adminSection.style.display = 'none';
        }
    } catch (err) {
        console.error(err);
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.innerText = 'Failed to load categories';
        }
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
            row.innerHTML = ` <td> ${ expense.id } </td> 
                                <td> ${ expense.amount } </td> 
                                <td> ${ expense.date } </td> 
                                <td> ${ expense.category } </td>
                                <td> <button class = "btn btn-primary" onclick = "editExpense(${expense.id})"> Edit </button></td>
                                <td> <button class = "btn btn-danger" onclick = "deleteExpense(${expense.id})" > Delete </button></td>
                                `;
            expensesTableBody.appendChild(row);
        });

        // Fetch categories
        const categories_results = await fetch('/api/expenses/categories');
        if (!categories_results.ok) {
            throw new Error("Couldn't fetch the categories data.");
        }

        const categories = await categories_results.json();
        console.log("The categories data:", categories);
        categories.forEach(category => {
            console.log('Category:', category.category);
            const element_div = document.createElement('div');
            element_div.style.flexBasis = '16.6%';
            // element_div.style.flexBasis = '25%'; // Ensure at least 4 items in a row
            element_div.innerHTML = ` <div >
                                <subtitle style = "font-size: 12px;" > ${category.category } </subtitle><br> 
                                <span id = "balance" style = "font-size: 12px;" > $${category.category_amount.toFixed(2) } </span> 
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
    window.location.href = `/editExpense?id=${id}`;
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