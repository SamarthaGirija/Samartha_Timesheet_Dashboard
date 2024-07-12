document.addEventListener("DOMContentLoaded", () => {
    const eidInput = document.getElementById("eid");
    eidInput.addEventListener("keypress", preventSpecialChars);

    const registerForm = document.getElementById('registerForm');

    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission

        // Validate email domain
        const emailInput = document.getElementById('email').value;
        if (!emailInput.endsWith('@samarthainfo.com')) {
            alert('Please enter an email that ends with domain samarthainfo.com.');
            return;
        }

        // Validate EID and Employee Name
        if (!validateEid() || !validateEmployeeName()) {
            return; // Prevent form submission if validation fails
        }

        // Handle form submission
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            // Clear previous error messages
            document.getElementById('eid-error').textContent = '';
            document.getElementById('email-error').textContent = '';
            document.getElementById('name-error').textContent = '';
            const messageContainer = document.getElementById("form-message");

            if (!response.ok || !result.success) {
                if (result.errors) {
                    result.errors.forEach(error => {
                        if (error.field === 'eid') {
                            document.getElementById('eid-error').textContent = error.message;
                        } else if (error.field === 'email') {
                            document.getElementById('email-error').textContent = error.message;
                        } else if (error.field === 'employeeName') {
                            document.getElementById('name-error').textContent = error.message;
                        }
                    });
                }
                messageContainer.textContent = result.message;
                messageContainer.style.color = 'red';
            } else {
                // Registration successful, redirect or show success message
                alert('Registration successful! Redirecting to login...');
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again later.');
        }
    });
});

function validateEmployeeName() {
    const employeeName = document.getElementById("employeeName").value;
    const nameError = document.getElementById("name-error");

    if (employeeName.length > 60) {
        nameError.textContent = "Employee Name must not be more than 60 characters.";
        return false;
    } else {
        nameError.textContent = "";
        return true;
    }
}

function validateEid() {
    const eid = document.getElementById("eid").value;
    const eidError = document.getElementById("eid-error");
    const eidRegex = /^\d{1,6}$/;

    if (!eidRegex.test(eid)) {
        eidError.textContent = "Employee ID must be between 1 and 6 digits with no special characters.";
        return false;
    } else {
        eidError.textContent = "";
        return true;
    }
}

function preventSpecialChars(event) {
    const keyCode = event.keyCode || event.which;
    const keyValue = String.fromCharCode(keyCode);
    const regex = /^[0-9\b]+$/;  // Allow only digits and backspace

    if (!regex.test(keyValue)) {
        event.preventDefault();
    }
}
