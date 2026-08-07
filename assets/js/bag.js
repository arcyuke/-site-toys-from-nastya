const TELEGRAM_USERNAME = 'SKIANORAK';
const MOBILE_BASIC = /\/mobilebasic(?:\/|$)/.test(window.location.pathname);

function getCart(){try{return JSON.parse(localStorage.getItem('cart_guest'))||[]}catch{return[]}}
function saveCart(cart){localStorage.setItem('cart_guest',JSON.stringify(cart))}
function money(value){return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`}
function cartImage(path){
  if(!path||/^(?:[a-z]+:|\/|#)/i.test(path))return path;
  return MOBILE_BASIC?`../${path}`:path;
}

function renderCart(){
  const itemsNode=document.getElementById('cart-items');
  const summaryNode=document.getElementById('cart-summary');
  const checkoutPanel=document.getElementById('checkout-panel');
  const cart=getCart();
  if(!cart.length){
    itemsNode.innerHTML='<p class="empty-cart">корзинка пока пуста ♡</p>';
    summaryNode.innerHTML='';
    checkoutPanel.hidden=true;
    return;
  }
  itemsNode.innerHTML=cart.map((item,index)=>`
    <article class="cart-item">
      <img src="${cartImage(item.image)}" alt="${item.name}">
      <div>
        <h2>${item.name}</h2>
        <p>вариант: ${item.size}</p>
        <div class="quantity-controls">
          <button data-action="minus" data-index="${index}" aria-label="уменьшить количество">−</button>
          <span>${item.quantity}</span>
          <button data-action="plus" data-index="${index}" aria-label="увеличить количество">+</button>
        </div>
        <button class="remove-item" data-action="remove" data-index="${index}">удалить</button>
      </div>
      <div class="cart-item-total">${money(item.price*item.quantity)}</div>
    </article>`).join('');
  const total=cart.reduce((sum,item)=>sum+item.price*item.quantity,0);
  summaryNode.innerHTML=`<button class="clear-cart" id="clear-cart">очистить</button><strong>итого: ${money(total)}</strong>`;
  checkoutPanel.hidden=false;

  document.querySelectorAll('[data-action]').forEach((button)=>button.addEventListener('click',()=>changeCart(button.dataset.action,Number(button.dataset.index))));
  document.getElementById('clear-cart')?.addEventListener('click',()=>{saveCart([]);renderCart()});
}

function changeCart(action,index){
  const cart=getCart();
  const item=cart[index];
  if(!item)return;
  if(action==='plus'&&item.quantity<item.stock)item.quantity+=1;
  if(action==='minus')item.quantity-=1;
  if(action==='remove'||item.quantity<=0)cart.splice(index,1);
  saveCart(cart);
  renderCart();
}

function checkout(){
  const cart=getCart();
  const contact=document.getElementById('contact').value.trim();
  if(!cart.length)return;
  if(contact.length<3){alert('укажите telegram или телефон');return}
  const total=cart.reduce((sum,item)=>sum+item.price*item.quantity,0);
  const lines=['привет! хочу оформить заказ в магазине игрушек Настюши ♡','',...cart.map((item,index)=>`${index+1}. ${item.name}\nвариант: ${item.size}\nколичество: ${item.quantity}\nсумма: ${money(item.price*item.quantity)}`),'',`итого: ${money(total)}`,`контакт: ${contact}`];
  const url=`https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(lines.join('\n'))}`;
  window.open(url,'_blank','noopener');
}

document.addEventListener('DOMContentLoaded',()=>{
  renderCart();
  document.getElementById('checkout')?.addEventListener('click',checkout);
});
