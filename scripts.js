let cart = []; // Array to store cart items

// Function to update the cart button text
function updateCartButton() {
    const cartButton = document.getElementById('cart-button');
    cartButton.textContent = `Cart (${cart.length})`;
}

// Function to toggle the shopping cart modal
function toggleCart() {
    const cartModal = document.getElementById('cart-modal');
    const cartItemsList = document.getElementById('cart-items');
    cartItemsList.innerHTML = ''; // Clear previous items in the cart modal

    // Populate cart modal with current items
    cart.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${item.name} - ₱${item.price.toFixed(2)}`;

        // Add a remove button for each cart item
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removeFromCart(index);
        listItem.appendChild(removeButton);

        cartItemsList.appendChild(listItem);
    });

    // Toggle modal visibility
    cartModal.style.display = cartModal.style.display === 'none' ? 'block' : 'none';
}

// Function to handle adding an item to the cart
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function () {
        const productName = this.dataset.name;
        const productPrice = parseFloat(this.dataset.price);

        // Add the item to the cart
        cart.push({ name: productName, price: productPrice });
        updateCartButton(); // Update the cart count
        alert(`${productName} added to cart!`); // Provide feedback to the user
    });
});

// Function to remove an item from the cart
function removeFromCart(index) {
    cart.splice(index, 1); // Remove the item by index
    updateCartButton();    // Update the cart button count
    toggleCart();          // Refresh the cart modal
}

// Function to show the category (Bouquets or Souvenirs)
function showCategory(category) {
    const bouquetsSection = document.getElementById('bouquets-section');
    const souvenirsSection = document.getElementById('souvenirs-section');

    if (category === 'bouquets') {
        bouquetsSection.style.display = 'block';
        souvenirsSection.style.display = 'none';
    } else {
        bouquetsSection.style.display = 'none';
        souvenirsSection.style.display = 'block';
    }
}

// Function to handle checkout button click
function checkout() {
    const checkoutForm = document.getElementById('checkout-form');
    checkoutForm.style.display = 'block'; // Show the checkout form
    const cartModal = document.getElementById('cart-modal');
    cartModal.style.display = 'none'; // Hide the cart modal
}

// Handle the customer details form submission
document.getElementById('customer-details-form').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent page reload

    const customerName = document.getElementById('customer-name').value;
    const customerPhone = document.getElementById('customer-phone').value;

    // Calculate the total price of items in the cart
    const totalPrice = cart.reduce((total, item) => total + item.price, 0);

    // Show confirmation with customer details and total price
    document.getElementById('customer-name-display').textContent = customerName;
    document.getElementById('customer-phone-display').textContent = customerPhone;
    document.getElementById('total-price-display').textContent = totalPrice.toFixed(2);

    // Hide the checkout form and show the confirmation section
    document.getElementById('checkout-form').style.display = 'none';
    document.getElementById('confirmation-section').style.display = 'block';
});

// Finish the checkout process and clear the cart
function finishCheckout() {
    // Clear the cart
    cart = [];
    updateCartButton(); // Update the cart button text

    // Hide the confirmation section
    document.getElementById('confirmation-section').style.display = 'none';
}

// Cancel the checkout process and go back to the cart
function cancelCheckout() {
    // Hide the confirmation section and show the cart modal
    document.getElementById('confirmation-section').style.display = 'none';
    toggleCart(); // Show the cart modal again
}
