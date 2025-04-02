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
    document.querySelectorAll('.cart-item').forEach(item=>{
        const minusBtn = item.querySelector('.minus-btn');
        const plusBtn = item.querySelector('.plus-btn');
        const quantityvalue= item.querySelector('.quantity');
        
        plusBtn.addEventListener('click',()=>{
            const current = parseInt(quantityvalue.textContent);
            quantityvalue.textContent  = current+1;
        })
        minusBtn.addEventListener('click',()=>{
            const current = parseInt(quantityvalue.textContent);
            if(current>0){
            quantityvalue.textContent=current-1;
        }
        })
    })

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
    
});