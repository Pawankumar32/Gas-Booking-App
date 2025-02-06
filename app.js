function toggleForm(form) {
    document.getElementById('login-form').classList.toggle('hidden', form !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', form !== 'register');
}

function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            db.collection('users').doc(user.uid).get().then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    if (userData.role === 'admin') {
                        window.location.href = "admin-dashboard.html";  // Redirect to admin dashboard
                    } else {
                        window.location.href = "user-dashboard.html";  // Redirect to user dashboard
                    }
                }
            });
        })
        .catch((error) => {
            const errorMessage = error.message;
            document.getElementById('login-error-message').innerText = errorMessage;
        });
}

function register() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('role').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            db.collection('users').doc(user.uid).set({
                name: name,
                email: user.email,
                role: role,
                encryptedPassword: encrypt(password)
            }).then(() => {
                if (role === 'admin') {
                    window.location.href = "admin-dashboard.html";  // Redirect to admin dashboard
                } else {
                    window.location.href = "user-dashboard.html";  // Redirect to user dashboard
                }
            });
        })
        .catch((error) => {
            const errorMessage = error.message;
            document.getElementById('register-error-message').innerText = errorMessage;
        });
}

// Session management to keep users logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                if (userData.role === 'admin') {
                    window.location.href = "admin-dashboard.html";  // Redirect to admin dashboard
                } else {
                    window.location.href = "user-dashboard.html";  // Redirect to user dashboard
                }
            }
        });
    }
});

function logout() {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    });
}

function encrypt(text) {
    const cipher = crypto.createCipher('aes-256-cbc', 'd6F3Efeq');
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}