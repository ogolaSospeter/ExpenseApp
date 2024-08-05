document.getElementById('registerButton').addEventListener('click', async() => {
    const username = document.getElementById('username').value;
    const useremail = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!username || !password || !useremail) {
        alert('Please enter all the fields');
        return;
    }
    ``

    try {
        const res = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, useremail, password })
        });

        if (res.ok) {
            alert('Registered successfully. Redirecting to login page...');
            setTimeout(() => {
                window.location.href = '/'; // Redirect to login page after successful registration
            }, 2000);
        } else {
            const error = await res.text();
            alert('Registration failed: ' + error);
        }
    } catch (err) {
        alert('Something went wrong: ' + err.message);
    }
});