// auth 

const API_KEY = 'HX6AkelS7lbCfF9tO0RSIg==Y01OTFgPrnwMYlZC';
const stocks = ['NVDA','INTC', 'AMZN', 'SNAP', 'AAPL', 'AMD', 'F', 'TSLA', 'PLTR', 'LUMN'];

const selectedStocks = [];
const [ body ] = document.getElementsByTagName('body');
const stocksListContainer = document.getElementById('select-stocks');
const portfolioValue = document.getElementById('portfolio-value');
const container = document.getElementById('stocks-container');
const h1 = document.createElement('h1')

const stockLogoPlaceholder = 'resources/stock_logo_placeholder.png'

let portfolio = [];
let availableStocks = [];
let amount = null;
let totalValue = 0;

function loading(state){
    const [ loading ] = document.getElementsByClassName('loading');
    if(state && !loading){
        const loading = document.createElement('div');
        loading.className = 'loading material-symbols-outlined';
        body.append(loading);
    } else if (!state && loading){
        loading.remove();
    }
}

function amountModal(stock) {
    return new Promise((resolve, reject) => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-container';
        
        const h3 = document.createElement('h3');
        h3.innerText = `How many ${stock.ticker} shares do you own?`;
        
        const input = document.createElement('input');
        input.type = 'number'; // Use 'number' for numerical input
        input.id = 'numOfShares';
        input.min = '0'; // Optional: prevent negative inputs
        
        const btn = document.createElement('input');
        btn.type = 'button';
        btn.value = 'Confirm';
        
        // Append elements to modal container
        modalContainer.append(h3, input, btn);
        modal.append(modalContainer);
        
        // Append modal to body
        document.body.append(modal);
        
        // Add event listener for button click
        btn.addEventListener('click', () => {
            const amount = input.value;
            
            // Ensure the input value is valid
            if (amount && Number(amount) > 0) {
                modal.remove(); // Remove the modal
                resolve(Number(amount)); // Resolve the promise with the input value
            } else {
                alert("Please enter a valid number of shares."); // Validate input
            }
        });
    });
}

function displayPortfolioValue(portfolio){
    totalValue = portfolio?.reduce((accumulator, current) => accumulator + (current.amount * current.price), 0)
    h1.innerText = `$ ${totalValue.toFixed(2) || 0}`;
    portfolioValue.append(h1);
}

async function fetchStockDetails(stock){
    try {
        loading(true);
        const response = await fetch(`https://api.api-ninjas.com/v1/stockprice?ticker=${stock}`, {
            method: 'GET',
            headers: { 'X-Api-Key': API_KEY},
            contentType: 'application/json', 
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching ticker data:', error);

    } finally {
        loading(false);
    }
}
async function fetchStockLogos(stock){
    try {
        loading(true);
        let logos = []
        for (const stock of stocks) {
            const response = await fetch(`https://api.api-ninjas.com/v1/logo?ticker=${stock}`, {
                method: 'GET',
                headers: { 'X-Api-Key': API_KEY},
                contentType: 'application/json', 
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            logos = [...logos, ...data];
        }
        return logos;
    } catch (error) {
        console.error('Error fetching ticker data:', error);
    }
}

function checkSelectedPortfolio(stock, type){
    const selectedStock = availableStocks.find(el => el.ticker === stock.ticker);
    const [ stocksList ] = document.getElementsByClassName('stocks-list') || [];
    for(const el of stocksList?.children){
        if(el.lastElementChild.innerText === selectedStock.ticker){
            el.classList.remove('logo-selected');
        }
        if(el.lastElementChild.innerText === stock.ticker && type === 'add'){
            el.classList.add('logo-selected');
        }
        if(el.lastElementChild.innerText === stock.ticker && type === 'remove'){
            el.classList.remove('logo-selected');
        }
    }
}

async function selectStock(stock){
    const ticker = stock.lastElementChild.innerText;
    if(selectedStocks.includes(ticker)){
        stock.classList.add('logo-selected');
        const fetchedStock = await fetchStockDetails(ticker)
        const amount = await amountModal(fetchedStock); // Wait for user input
        portfolio.push({
            ...fetchedStock,
            logo: `${availableStocks.find(el => el.ticker === fetchedStock.ticker).image}`,
            amount: amount
        });
        localStorage.setItem('portfolio', JSON.stringify(portfolio));
        displayPortfolioValue(portfolio);
        renderPortfolioStocks(portfolio);
    } else{
        stock.classList.remove('logo-selected');
        stock.display = 'box-shadow: 0px 0px 0px #000';
        portfolio = portfolio.filter(stock => stock.ticker !== ticker)
        renderPortfolioStocks(portfolio);
        displayPortfolioValue(portfolio);
    }
}


function addRemoveToPortfolio(stocksList){
    for(const child of stocksList.children){
        child.addEventListener('click', ()=>{
            const ticker = child.lastElementChild.innerText;
            if(!selectedStocks.includes(ticker)){
                selectedStocks.push(ticker);
                selectStock(child);
            } else {
                selectedStocks.splice(selectedStocks.indexOf(ticker), 1)
                selectStock(child)
            }
        })
    }
}

async function renderAvailableStocks(stocks){
    try {
        const stocksList = document.createElement('div');
        stocksList.className = 'stocks-list';
        stocks.forEach(stock => {
            stocksList.innerHTML += `
            <div class='available-stock'>
                <div class="available-stock-logo-container">
                    <img src=${stock.image} alt='${stock.name} logo' >
                </div>
                <p>${stock.ticker}</p>
            </div>
            `
        })
        stocksListContainer.append(stocksList);
        addRemoveToPortfolio(stocksList);

    } catch (error) {
        console.error('Error fetching ticker data:', error);
    }
}
function renderPortfolioStocks(stocks){
    console.log(stocks);
    container.innerHTML = '';
    // Display the ticker image and price in the browser
    stocks.forEach(stock => {
        const stockElement = document.createElement('article');
        stockElement.className = 'card-container';
        const card = document.createElement('div');
        card.className = 'card'
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front'
        const cardBack = document.createElement('div');
        const closeBtn = document.createElement('span');
        closeBtn.classList = 'close-btn material-symbols-outlined';
        closeBtn.innerText = 'close';
        cardBack.className = 'card-back';
        cardBack.innerHTML = `
            <h2>${(((stock.price * stock.amount) / totalValue) * 100).toFixed(1)} %</h2>
            <p>of total portfolio value</p>
        `
        const imageContainer = document.createElement('div')
        imageContainer.className = "image-container";
        const detailsContainer = document.createElement('div')
        imageContainer.innerHTML=`<img src="${stock.logo || stockLogoPlaceholder}" alt="${stock.name} logo ">`
        detailsContainer.innerHTML = `
            <h3>${stock.name}</h3>
            <h4>${stock.ticker}</h4>
            <h4>$${stock.price}</h4>
        `;
        cardFront.append(closeBtn, imageContainer, detailsContainer);
        // cardBack.append(imageContainer, detailsContainer);
        card.append(cardFront, cardBack);
        stockElement.append(card);
        container.appendChild(stockElement);
        closeBtn.addEventListener('click', ()=>{
            portfolio = portfolio.filter(el => el.ticker !== stock.ticker)
            localStorage.setItem('portfolio', JSON.stringify(portfolio));
            renderPortfolioStocks(portfolio);
            displayPortfolioValue(portfolio);
            checkSelectedPortfolio(stock, 'remove');
        })
        card.addEventListener('click', ()=> {
            card.classList.toggle('flipped'); // Toggle the 'flipped' class to trigger the flip
        });
        if(!selectedStocks.includes(stock.ticker)){
            selectedStocks.push(stock.ticker)
        }
        checkSelectedPortfolio(stock, 'add');
    })

}

document.addEventListener('DOMContentLoaded', async ()=> {
    portfolio = JSON.parse(localStorage.getItem('portfolio')) || [];
    availableStocks = await fetchStockLogos(stocks);
    renderAvailableStocks(availableStocks);
    if(portfolio.length > 0) {
        displayPortfolioValue(portfolio);
        renderPortfolioStocks(portfolio);
    }
    loading(false);
});