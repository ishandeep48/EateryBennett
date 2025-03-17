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
            const response = await axios.post('/cart',{cart});
            console.log('Successfully sent from my side - the client', response.data);
            window.location.href = '/cart';

        }catch(e){
            console.log(e);
        }
    });
});