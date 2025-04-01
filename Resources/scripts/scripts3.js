document.addEventListener("DOMContentLoaded", function () {
    let total = 0;
    const submitBtn = document.getElementById('submitCart');
    const totalDisplay = document.getElementById('totalAmount');

    document.querySelectorAll('.food-item').forEach(item => {
        const minusBtn = item.querySelector('.minus-btn');
        const plusBtn = item.querySelector('.plus-btn');
        const quantitySpan = item.querySelector('.quantity');
        const price = parseFloat(item.children[1].textContent.replace('₹', ''));
        
        const updateTotal = (change) => {
            total += change;
            totalDisplay.textContent = total.toFixed(2);
            submitBtn.disabled = total <= 0;
        };

        plusBtn.addEventListener('click', () => {
            const current = parseInt(quantitySpan.textContent);
            quantitySpan.textContent = current + 1;
            updateTotal(price);
        });

        minusBtn.addEventListener('click', () => {
            const current = parseInt(quantitySpan.textContent);
            if (current > 0) {
                quantitySpan.textContent = current - 1;
                updateTotal(-price);
            }
        });
    });

    submitBtn.addEventListener('click',async function() {

        const cart =[];
        const eatery=document.getElementById('eatery-name').value;
        // const eatery=eatery;
        document.querySelectorAll('.food-item').forEach(item=>{
            const qty = parseInt(item.querySelector('.quantity').textContent);
            if(qty>0){
                cart.push({
                    name: item.children[0].textContent.trim(),
                    price:parseFloat(item.children[1].textContent.replace('₹', '')),
                    quantity:qty
                });
            }
        })

        try{
            const response = await axios.post('/cart',{cart,eatery});
            console.log('Successfully sent from my side - the client', response.data);
            window.location.href = '/cart';

        }catch(e){
            console.log(e);
        }
    });
    document.querySelector('#eateryStatus').addEventListener('change', async function() {
        const statusText = document.getElementById('statusText');
        const isOpen = this.checked;
        statusText.textContent = isOpen ? 'Open' : 'Closed';

        try {
            const response = await axios.post('/eatery-status', {
                eatery: '<%= eatery %>',
                isOpen: isOpen
            });

            console.log('Status updated successfully:', response.data);
        } catch (error) {
            console.error('Error updating status:', error);
            // Revert the toggle if the request failed
            this.checked = !isOpen;
            statusText.textContent = !isOpen ? 'Open' : 'Closed';
        }
    });


    // document.querySelectorAll('.edit-price-btn').forEach(button => {
    //     button.addEventListener('click', function() {
    //         const priceInput = this.previousElementSibling;
    //         if (priceInput.readOnly) {
    //             priceInput.readOnly = false;
    //             this.innerHTML = '<i class="fas fa-check"></i>';
    //         } else {
    //             priceInput.readOnly = true;
    //             this.innerHTML = '<i class="fas fa-pencil-alt"></i>';
    //         }
    //     });
    // });

    // // Handle item deletion
    // async function deleteItem(itemName) {
    //     if (confirm(`Are you sure you want to delete ${itemName}?`)) {
    //         try {
    //             await axios.delete('/delete-menu-item', {
    //                 data: {
    //                     eatery: '<%= eatery %>',
    //                     itemName: itemName
    //                 }
    //             });
    //             // Remove the item from DOM
    //             document.querySelector(`[data-item-name="${itemName}"]`).remove();
    //         } catch (error) {
    //             console.error('Error deleting item:', error);
    //             alert('Failed to delete item');
    //         }
    //     }
    // }

    // // Handle menu update
    // async function confirmUpdate() {
    //     const menuItems = Array.from(document.querySelectorAll('.menu-item')).map(item => ({
    //         name: item.dataset.itemName,
    //         isAvailable: item.querySelector('.availability-toggle').checked,
    //         price: parseFloat(item.querySelector('.price-input').value)
    //     }));

    //     try {
    //         await axios.patch('/update-menu', {
    //             eatery: '<%= eatery %>',
    //             items: menuItems
    //         });
    //         alert('Menu updated successfully!');
    //     } catch (error) {
    //         console.error('Error updating menu:', error);
    //         alert('Failed to update menu');
    //     }
    // }
    // document.getElementById('eateryStatus').addEventListener('change', function() {
    //     const statusText = document.getElementById('statusText');
    //     statusText.textContent = this.checked ? 'Open' : 'Closed';
    // });
    
});