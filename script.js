const courierLogos = {
    'FedEx': 'images/fedex.png',
    'DHL': 'images/dhl.png',
    'Amazon': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    'Canada Post': 'images/canada-post.png',
    'Loomis Express': 'images/Loomis.png',
    'Purolator': 'images/purolator.png'
};

// Package/Pallet toggle
const packageTab = document.getElementById('packageTab');
const palletTab = document.getElementById('palletTab');
const form = document.getElementById('quoteForm');

packageTab.addEventListener('click', () => {
    packageTab.classList.add('active');
    palletTab.classList.remove('active');
    packageTab.setAttribute('aria-selected', 'true');
    palletTab.setAttribute('aria-selected', 'false');
    form.setAttribute('aria-labelledby', 'packageTab');
});

palletTab.addEventListener('click', () => {
    palletTab.classList.add('active');
    packageTab.classList.remove('active');
    palletTab.setAttribute('aria-selected', 'true');
    packageTab.setAttribute('aria-selected', 'false');
    form.setAttribute('aria-labelledby', 'palletTab');
});

function calculateAllQuotes(weightInKg, shipFrom, shipTo) {
    const carriers = {
        'FedEx': { baseRate: 18, ratePerKg: 3.5 },
        'DHL': { baseRate: 20, ratePerKg: 4.0 },
        'Amazon': { baseRate: 10, ratePerKg: 2.0 },
        'Canada Post': { baseRate: 15, ratePerKg: 2.5 },
        'Loomis Express': { baseRate: 16, ratePerKg: 2.8 },
        'Purolator': { baseRate: 17, ratePerKg: 3.2 }
    };

    if(shipFrom==='us' && shipTo==='ca') { carriers['FedEx'].baseRate+=5; carriers['Purolator'].baseRate-=2; }
    else if(shipFrom==='gb' && shipTo==='de'){ carriers['DHL'].baseRate-=3; carriers['FedEx'].ratePerKg=2.8; }
    else if(shipTo==='au'){ for(let c in carriers){ carriers[c].baseRate+=10; carriers[c].ratePerKg+=1; } }

    const quotes=[];
    for(const carrier in carriers){
        const {baseRate, ratePerKg}=carriers[carrier];
        const estimatedWeightCost = weightInKg*ratePerKg;
        const totalQuote = baseRate + estimatedWeightCost;
        quotes.push({ carrier, totalQuote: totalQuote.toFixed(2), baseRate: baseRate.toFixed(2), weightCost: estimatedWeightCost.toFixed(2) });
    }
    quotes.sort((a,b)=>parseFloat(a.totalQuote)-parseFloat(b.totalQuote));
    return quotes;
}

function bookCourier(carrier, price, details){
    const msg=document.createElement('div');
    msg.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:10px;box-shadow:0 4px 8px rgba(0,0,0,0.2);z-index:1001;text-align:center;';
    msg.innerHTML=`<h4 style="margin-bottom:10px;">Booking Confirmed!</h4>
        <p>You have selected <strong>${carrier}</strong> for <strong>$${price}</strong>.</p>
        <div style="margin-top:20px;">
            <button onclick='printBooking("${carrier}","${price}",${JSON.stringify(details)})'>Print</button>
            <button onclick='downloadBooking("${carrier}","${price}",${JSON.stringify(details)})'>Download</button>
            <button onclick='this.parentNode.parentNode.remove()'>OK</button>
        </div>`;
    document.body.appendChild(msg);
}

function printBooking(carrier, price, details){
    const w=window.open('','_blank');
    w.document.write(`<html><head><title>Booking</title></head><body><pre>
Carrier: ${carrier}
Price: $${price}
Ship From: ${details.shipFromCountry}
Ship To: ${details.shipToCountry}
Weight: ${details.weight} ${details.weightUnit}
L: ${details.dimL || 'N/A'}, W: ${details.dimW || 'N/A'}, H: ${details.dimH || 'N/A'}
</pre></body></html>`);
    w.print();
}

function downloadBooking(carrier, price, details){
    const content=`Carrier: ${carrier}\nPrice: $${price}\nShip From: ${details.shipFromCountry}\nShip To: ${details.shipToCountry}\nWeight: ${details.weight} ${details.weightUnit}\nL:${details.dimL||'N/A'} W:${details.dimW||'N/A'} H:${details.dimH||'N/A'}`;
    const blob=new Blob([content], {type:'text/plain'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='booking.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

form.addEventListener('submit', function(e){
    e.preventDefault();
    const weightInput = document.getElementById('weight').value;
    const weightUnit = document.getElementById('weightUnit').value;
    const shipFrom = document.getElementById('shipFrom');
    const shipFromCountry = shipFrom.options[shipFrom.selectedIndex].text;
    const shipTo = document.getElementById('shipTo');
    const shipToCountry = shipTo.options[shipTo.selectedIndex].text;
    const dimL=document.getElementById('dimL').value;
    const dimW=document.getElementById('dimW').value;
    const dimH=document.getElementById('dimH').value;

    if(!weightInput || !shipFrom.value || !shipTo.value){
        alert("Please fill all required fields.");
        return;
    }

    let weightInKg=parseFloat(weightInput);
    if(weightUnit==='lbs'){ weightInKg*=0.453592; }

    const quotes = calculateAllQuotes(weightInKg, shipFrom.value, shipTo.value);

    const modal = document.createElement('div');
    modal.className='modal-overlay';
    let html='';
    quotes.forEach(q=>{
        html+=`
        <div class="quote-item">
            <div class="quote-details">
                <div style="display:flex;align-items:center;gap:8px;">
                    <img src="${courierLogos[q.carrier]}" alt="${q.carrier}" />
                    <h5>${q.carrier}</h5>
                </div>
                <p>Base Rate: $${q.baseRate}</p>
                <p>Weight Cost: $${q.weightCost}</p>
            </div>
            <div style="text-align:right;">
                <div class="quote-price">$${q.totalQuote}</div>
                <button class="book-btn" onclick='bookCourier("${q.carrier}","${q.totalQuote}",${JSON.stringify({shipFromCountry,shipToCountry,weight:weightInput,weightUnit,dimL,dimW,dimH})})'>Book Now</button>
            </div>
        </div>`;
    });

    modal.innerHTML=`<div class="modal-content">
        <div class="modal-header">
            <h4>Estimated Quotes</h4>
            <button class="close-button" onclick="this.parentNode.parentNode.parentNode.remove()">&times;</button>
        </div>
        ${html}
    </div>`;
    document.body.appendChild(modal);
});