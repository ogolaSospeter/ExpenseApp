document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginButton');
    const errorElement = document.getElementById('loginError');

    loginButton.addEventListener('click', async() => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            const result = await response.json();
            console.log('Immediate result: ', result);
            if (response.ok) {
                alert('Logged in successfully, redirecting to dashboard...');
                username.innerText = '';
                password.innerText = '';

                setTimeout(() => {
                    console.log('result: ', result);
                    //check if the user is an admin, then redirect to admin dashboard, else redirect to user dashboard
                    if (result.isAdmin) {
                        console.log('Admin logged in by username: ', username);
                        window.location.href = '/dashboard';
                    } else {
                        console.log('User logged in by username: ', username);
                        window.location.href = '/dashboard';
                    }
                    console.log('result attempt 2: ', result);
                }, 2000);
            } else if (result.navigateToRegister) {
                //alert Admin* if admin else User*

                alert(result.isAdmin ?
                    'Admin is not registered. Redirecting to registration page...' :
                    'User is not registered. Redirecting to registration page...');
                username.innerText = '';
                password.innerText = '';
                setTimeout(() => {
                    errorElement.innerText = '';
                    window.location.href = '/register'; // Redirect to registration page after a short delay
                }, 2000);
            } else {
                errorElement.innerText = result.error;
            }
        } catch (err) {
            errorElement.innerText = 'Something went wrong', err;
            setTimeout(() => {
                errorElement.innerText = '';
            }, 2000);
        }
    });
});