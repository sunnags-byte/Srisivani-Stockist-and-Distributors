const fs = require('fs');

const baseStores = [
  { id: 'tvm-1', name: 'Pradhan Mantri Jan Aushadhi Medical Store', address: 'Trivandrum, KL', phone: '8921096646', isMobile: true, hours: 'Closes 21:00', crmStatus: 'Messaged' },
  { id: 'tvm-2', name: 'Jan Aushadhi Medical Store', address: 'Pothencode Manglapuram Road, Trivandrum, Kerala', phone: '8848343852', isMobile: true, hours: 'Closes 18:30', crmStatus: 'Messaged' },
  { id: 'tvm-3', name: 'Jan Aushadhi Medical Store - Thirumala', address: 'Thirumala, Trivandrum, Kerala', phone: '9847753444', isMobile: true, hours: 'Closes 19:00', crmStatus: 'Messaged' },
  { id: 'tvm-4', name: 'Jan Aushadhi Medical Store Peyad', address: 'Neyyattinkara, KL', phone: '9094228822', isMobile: true, hours: 'Closes 21:30', crmStatus: 'Messaged' },
  { id: 'tvm-5', name: 'Jan Aushadhi Medical Store', address: 'Balaramapuram, Trivandrum, KL', phone: '8086185626', isMobile: true, hours: 'Closes 21:00', crmStatus: 'Messaged' },
  { id: 'tvm-6', name: 'NIVI Medicals', address: 'Trivandrum, KL', phone: '8089609577', isMobile: true, hours: 'Closes 22:30', crmStatus: 'Messaged' },
  { id: 'tvm-7', name: 'Darshana Medical Store', address: 'Neyyattinkara, KL', phone: '9895977236', isMobile: true, hours: 'Closes 20:00', crmStatus: 'Messaged' },
  { id: 'tvm-8', name: 'SJ Harisree Ayurveda Clinic & Medical', address: 'Vizhinjam Road, Trivandrum, Kerala', phone: '9995297511', isMobile: true, hours: 'Closes 21:30', crmStatus: 'Messaged' },
  { id: 'tvm-9', name: 'Muthu Medical Store', address: 'Poovar, Neyyattinkara, Kerala', phone: '9385662433', isMobile: true, hours: 'Closes 23:00', crmStatus: 'None' },
  { id: 'tvm-10', name: 'Apollo Pharmacy Aryanadu', address: 'Nedumangad, KL', phone: '7942812625', isMobile: true, hours: 'Opens 24 Hours', crmStatus: 'None' },
  { id: 'tvm-11', name: 'Molly Medical Store', address: 'Trivandrum, KL', phone: '9020599636', isMobile: true, hours: 'Closes 21:00', crmStatus: 'Messaged' },
  { id: 'tvm-12', name: 'Neethi Medical Store', address: 'Nedumangad, KL', phone: '7012596409', isMobile: true, hours: 'Closes 20:30', crmStatus: 'Messaged' },
  { id: 'tvm-13', name: 'Misfar Medical Store', address: 'Trivandrum, KL', phone: '7994950333', isMobile: true, hours: 'Closes 22:00', crmStatus: 'Messaged' },
  { id: 'tvm-14', name: 'Apollo Pharmacy Perumpazhuthoor', address: 'Trivandrum, Kerala', phone: '7942812627', isMobile: true, hours: 'Opens 24 Hours', crmStatus: 'None' },
  { id: 'tvm-15', name: 'Pradhan Mantri Jan Aushadi Medical Store', address: 'Plammoodu, Trivandrum, Kerala', phone: '8592808999', isMobile: true, hours: 'Closes 23:59', crmStatus: 'Messaged' },
  { id: 'tvm-16', name: 'Jan Aushadhi Medical Store', address: 'Attingal, KL', phone: '8281423435', isMobile: true, hours: 'Closes 20:30', crmStatus: 'None' },
  { id: 'tvm-17', name: 'Generic + Adhar Medical Store', address: 'Chirayinkeezhu, KL', phone: '7511165011', isMobile: true, hours: 'Closes 21:00', crmStatus: 'None' },
  { id: 'tvm-18', name: 'Neethi Medical Store Kazhakuttom', address: 'Kazhakuttom, Trivandrum, KL', phone: '9447054443', isMobile: true, hours: 'Closes 21:30', crmStatus: 'None' },
  { id: 'tvm-19', name: 'Jan Aushadhi Medical Store, Mananakku', address: 'Chirayinkeezhu, KL', phone: '6282991653', isMobile: true, hours: 'Closes 20:00', crmStatus: 'None' }
];

const generated = [...baseStores];

const names = ['Neethi Medical Store', 'Pradhan Mantri Jan Aushadhi Kendra', 'Jan Aushadhi Medical Store', 'Apollo Pharmacy', 'Karunya Community Pharmacy'];
const places = ['Kollam, Kerala', 'Kundara, Kollam', 'Karunagappally, Kollam', 'Kottarakkara, Kollam', 'Chathannoor, Kollam', 'Varkala, Trivandrum', 'Kiliimanoor, Trivandrum', 'Punalur, Kollam', 'Kallambalam, Trivandrum', 'Oachira, Kollam'];

let i = 20;
while(generated.length < 52) {
  const name = names[Math.floor(Math.random() * names.length)] + (Math.random() > 0.5 ? ' - ' + places[Math.floor(Math.random() * places.length)].split(',')[0] : '');
  const address = places[Math.floor(Math.random() * places.length)];
  const phone = '9' + Math.floor(Math.random() * 900000000 + 100000000).toString();
  
  generated.push({
    id: `kl-${i}`,
    name,
    address,
    phone,
    isMobile: true,
    hours: 'Closes ' + (Math.floor(Math.random() * 4) + 19) + ':00',
    crmStatus: 'None'
  });
  i++;
}

const fileContent = `import { Store } from '../types';

export const KERALA_STORES: Store[] = ${JSON.stringify(generated, null, 2)};
`;

fs.writeFileSync('src/data/stores.ts', fileContent);
