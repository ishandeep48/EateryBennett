

document.addEventListener("DOMContentLoaded", function () {
    // Get all food items
    let foodItems = document.querySelectorAll(".food-item");

    // Add event listeners to each food item's buttons
    foodItems.forEach(item => {
        let minusBtn = item.querySelector("button:first-child");
        let plusBtn = item.querySelector("button:last-child");
        let quantitySpan = item.querySelector("span");

        // Increase quantity
        plusBtn.addEventListener("click", function () {
            let quantity = parseInt(quantitySpan.innerText);
            quantitySpan.innerText = quantity + 1;
        });

        // Decrease quantity (but not below 0)
        minusBtn.addEventListener("click", function () {
            let quantity = parseInt(quantitySpan.innerText);
            if (quantity > 0) {
                quantitySpan.innerText = quantity - 1;
            }
        });
    });

    // Handle Submit Button Click
    document.getElementById("submitCart").addEventListener("click", function () {
        let cart = [];

        foodItems.forEach(item => {
            let name = item.children[0].innerText.trim(); // Food Name
            let priceText = item.children[1].innerText.trim().replace("₹", ""); // Remove ₹ symbol
            let price = parseFloat(priceText);
            let quantity = parseInt(item.querySelector("span").innerText);

            // Only store items with quantity > 0
            if (quantity > 0) {
                cart.push({ name, price, quantity });
            }
        });

        // Store cart in localStorage
        localStorage.setItem("cart", JSON.stringify(cart));

        // Redirect to cart.html
        window.location.href = "cart.html";
    });
});





// --------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.includes("cart.html")) {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        let cartItemsDiv = document.getElementById("cartItems");
        let totalAmount = 0;

        if (cart.length === 0) {
            cartItemsDiv.innerHTML = "<p class='text-center'>Your cart is empty.</p>";
            return;
        }

        cart.forEach(item => {
            let itemDiv = document.createElement("div");
            itemDiv.classList.add("row", "text-center", "py-2", "border-bottom");
            itemDiv.innerHTML = `
                <div class="col-md-6">${item.name}</div>
                <div class="col-md-3">₹${item.price}</div>
                <div class="col-md-3">${item.quantity}</div>
            `;
            cartItemsDiv.appendChild(itemDiv);

            totalAmount += item.price * item.quantity;
        });

        document.getElementById("totalAmount").innerText = `Total: ₹${totalAmount}`;
    }
});



