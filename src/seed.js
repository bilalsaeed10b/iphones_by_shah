const samples = [
  ['iPhone 15 Pro',256,'Silver',122500,9.5,94,'Non-PTA','Unlocked','195216'],
  ['iPhone Duo',256,'Star White',245000,10,100,'Non-PTA','Unlocked','195221'],
  ['iPhone 16',128,'Pink',158000,9.5,96,'PTA approved','Unlocked','195226'],
  ['iPhone 13 Pro',256,'Sierra Blue',115000,9,89,'PTA approved','Unlocked','195235'],
  ['iPhone 18 Pro Max',256,'Sky Blue',270000,10,100,'Non-PTA','Unlocked','195310'],
  ['iPhone 18 Pro Max',512,'Copper',295000,9.5,98,'Non-PTA','Unlocked','195318'],
  ['iPhone 15 Pro Max',256,'Black Titanium',122500,9,92,'Non-PTA','JV','195327'],
  ['iPhone X',64,'Space Gray',42000,8.5,84,'PTA approved','Unlocked','195344'],
  ['iPhone 16',128,'Green',156000,9.5,95,'PTA approved','Unlocked','195354']
];
export function seedDevices(base) {
  return samples.map(([model,storage,color,price,condition,battery,pta,carrier,file],i)=>({
    id:`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,model,storage,color,price,condition,battery,pta,carrier,
    sim:'Nano-SIM + eSIM',repairs:'Confirm with Shah before purchasing.',marks:'See the actual device media and confirm with Shah.',includes:'Device only; confirm accessories.',checkingDays:7,
    checkingTerms:'Confirm coverage and exchange terms with Shah before purchase.',description:'A curated pre-owned device. Review the photos and confirm the details before making your choice.',
    availability:i<6&&i!==1?'available':'sold',published:true,archived:false,featured:i===0||i===2,coverIndex:0,
    media:[{id:crypto.randomUUID(),type:'image',url:`${base}stock/phone-${file}.png`,alt:`${model} in ${color}`}],
    createdAt:new Date(Date.UTC(2026,9,11,12-i)).toISOString(),updatedAt:new Date(Date.UTC(2026,9,11,12-i)).toISOString(),sample:true
  }));
}

// Update the original preview once, without replacing locally edited inventory.
export function migratePreviewStock(state) {
  if (state.seedRevision >= 1) return false;
  const duo = state.devices.find(d => d.id === '00000000-0000-4000-8000-000000000002' && d.sample === true && d.model === 'iPhone Duo');
  if (duo) duo.availability = 'sold';
  state.seedRevision = 1;
  return true;
}
