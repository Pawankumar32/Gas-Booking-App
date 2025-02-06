auth.onAuthStateChanged((user) => {
    if (user) {
        const userRef = db.collection('users').doc(user.uid);
        userRef.get().then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                document.getElementById('user-name').innerText = userData.name;
                loadBookingHistory(user.uid);
                loadNotifications();
            }
        });
    } else {
        window.location.href = "index.html";
    }
});

function toggleQRCode(paymentMethod) {
    const qrCodeContainer = document.getElementById('qr-code-container');
    if (paymentMethod === 'Paytm') {
        qrCodeContainer.classList.remove('hidden');
        // Generate Paytm QR code dynamically (dummy QR code for this example)
        const qrCodeUrl = 'https://dummyimage.com/200x200/000/fff&text=Paytm+QR+Code';
        document.getElementById('qr-code').src = qrCodeUrl;
    } else {
        qrCodeContainer.classList.add('hidden');
    }
}

function bookCylinder() {
    const quantity = document.getElementById('quantity').value;
    const paymentMethod = document.getElementById('payment-method').value;

    auth.onAuthStateChanged((user) => {
        if (user) {
            db.collection('bookings').add({
                userId: user.uid,
                quantity: quantity,
                paymentMethod: paymentMethod,
                status: 'pending',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert('Booking request submitted successfully!');
                document.getElementById('booking-form').reset();
                document.getElementById('qr-code-container').classList.add('hidden');
                sendEmail(user.email, 'Booking Confirmation', `Your booking for ${quantity} cylinder(s) has been received.`);
            }).catch((error) => {
                document.getElementById('booking-error-message').innerText = error.message;
            });
        } else {
            window.location.href = "index.html";
        }
    });
}

function loadBookingHistory(userId) {
    const bookingsPerPage = 5;
    let currentPage = 1;
    let lastVisible;

    function renderBookings(bookings) {
        const bookingHistoryBody = document.getElementById('booking-history-body');
        bookingHistoryBody.innerHTML = '';
        bookings.forEach((doc) => {
            const booking = doc.data();
            const bookingDate = booking.timestamp.toDate().toLocaleString();
            const row = `<tr>
                <td>${bookingDate}</td>
                <td>${booking.status}</td>
                <td>${booking.paymentMethod}</td>
            </tr>`;
            bookingHistoryBody.innerHTML += row;
        });
    }

    function getBookings(page) {
        let query = db.collection('bookings').where('userId', '==', userId).orderBy('timestamp', 'desc').limit(bookingsPerPage);
        if (page > 1) {
            query = query.startAfter(lastVisible);
        }
        query.get().then((snapshot) => {
            lastVisible = snapshot.docs[snapshot.docs.length - 1];
            renderBookings(snapshot.docs);
        });
    }

    document.getElementById('pagination').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            if (e.target.innerText === 'Next') {
                currentPage++;
            } else if (e.target.innerText === 'Prev' && currentPage > 1) {
                currentPage--;
            }
            getBookings(currentPage);
        }
    });

    getBookings(currentPage);
}

function loadNotifications() {
    db.collection('notifications').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
        const notificationsContainer = document.getElementById('notifications');
        notificationsContainer.innerHTML = '';
        snapshot.forEach((doc) => {
            const notification = doc.data();
            const notificationElement = document.createElement('div');
            notificationElement.classList.add('notification');
            notificationElement.innerHTML = `
                <p>${notification.message}</p>
                <p><small>${notification.timestamp.toDate().toLocaleString()}</small></p>
            `;
            notificationsContainer.appendChild(notificationElement);
        });
    });
}

function logout() {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    });
}

// Request permission to send notifications and get the token
function requestNotificationPermission() {
    messaging.requestPermission().then(() => {
        return messaging.getToken();
    }).then((token) => {
        console.log('Token received: ', token);
    }).catch((error) => {
        console.error('Error getting permission for notifications: ', error);
    });
}

// Handle incoming messages
messaging.onMessage((payload) => {
    console.log('Message received: ', payload);
    alert(payload.notification.body);
});

requestNotificationPermission();

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