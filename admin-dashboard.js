auth.onAuthStateChanged((user) => {
    if (user) {
        const userRef = db.collection('users').doc(user.uid);
        userRef.get().then((doc) => {
            if (doc.exists && doc.data().role === 'admin') {
                loadPendingBookings();
                loadAllBookings();
                loadUserManagement();
            } else {
                window.location.href = "index.html";
            }
        });
    } else {
        window.location.href = "index.html";
    }
});

function loadPendingBookings() {
    db.collection('bookings').where('status', '==', 'pending').onSnapshot((snapshot) => {
        const bookingsContainer = document.getElementById('pending-bookings');
        bookingsContainer.innerHTML = '';
        snapshot.forEach((doc) => {
            const booking = doc.data();
            const bookingElement = document.createElement('div');
            bookingElement.classList.add('booking');
            bookingElement.innerHTML = `
                <p>User ID: ${booking.userId}</p>
                <p>Quantity: ${booking.quantity}</p>
                <p>Payment Method: ${booking.paymentMethod}</p>
                <p>Status: ${booking.status}</p>
                <button onclick="approveBooking('${doc.id}', '${booking.userId}', ${booking.quantity})">Approve</button>
                <button onclick="rejectBooking('${doc.id}', '${booking.userId}')">Reject</button>
            `;
            bookingsContainer.appendChild(bookingElement);
        });
    });
}

function loadAllBookings() {
    db.collection('bookings').onSnapshot((snapshot) => {
        const bookingsContainer = document.getElementById('all-bookings');
        bookingsContainer.innerHTML = '<table><thead><tr><th>User ID</th><th>Quantity</th><th>Payment Method</th><th>Status</th></tr></thead><tbody>';
        snapshot.forEach((doc) => {
            const booking = doc.data();
            const row = `<tr>
                <td>${booking.userId}</td>
                <td>${booking.quantity}</td>
                <td>${booking.paymentMethod}</td>
                <td>${booking.status}</td>
            </tr>`;
            bookingsContainer.innerHTML += row;
        });
        bookingsContainer.innerHTML += '</tbody></table>';
    });
}

function loadUserManagement() {
    db.collection('users').onSnapshot((snapshot) => {
        const userContainer = document.getElementById('user-management');
        userContainer.innerHTML = '<table><thead><tr><th>User ID</th><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>';
        snapshot.forEach((doc) => {
            const user = doc.data();
            const row = `<tr>
                <td>${doc.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
            </tr>`;
            userContainer.innerHTML += row;
        });
        userContainer.innerHTML += '</tbody></table>';
    });
}

function approveBooking(bookingId, userId, quantity) {
    db.collection('bookings').doc(bookingId).update({
        status: 'approved'
    }).then(() => {
        sendEmailToUser(userId, 'Booking Approved', `Your booking for ${quantity} cylinder(s) has been approved.`);
        alert('Booking approved successfully!');
    }).catch((error) => {
        alert('Error approving booking: ' + error.message);
    });
}

function rejectBooking(bookingId, userId) {
    db.collection('bookings').doc(bookingId).update({
        status: 'rejected'
    }).then(() => {
        sendEmailToUser(userId, 'Booking Rejected', 'Your booking has been rejected.');
        alert('Booking rejected successfully!');
    }).catch((error) => {
        alert('Error rejecting booking: ' + error.message);
    });
}

function sendNotification() {
    const message = document.getElementById('notification-message').value;
    db.collection('notifications').add({
        message: message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('Notification sent successfully!');
        document.getElementById('notification-form').reset();
    }).catch((error) => {
        alert('Error sending notification: ' + error.message);
    });
}

function sendEmailToUser(userId, subject, message) {
    db.collection('users').doc(userId).get().then((doc) => {
        if (doc.exists) {
            const user = doc.data();
            sendEmail(user.email, subject, message);
        }
    }).catch((error) => {
        console.error('Error fetching user data:', error);
    });
}

function sendEmail(to, subject, text) {
    fetch('/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            to: to,
            subject: subject,
            text: text
        })
    }).then(response => response.json()).then(data => {
        console.log(data);
    }).catch(error => {
        console.error('Error sending email:', error);
    });
}

function logout() {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    });
}