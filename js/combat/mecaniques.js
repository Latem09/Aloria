// Moteur de règles générique : fiches de capacités, effets, boucliers et tours.
export const arrondi = n => Math.floor(Math.max(0,Number(n)||0)+0.5);
export const borne = n => Math.min(1,Math.max(0,Number(n)||0));
export const CONTROLES = ['gele','etourdissement','ralenti'];
export const NEGATIFS = ['poison','brulure','gele','etourdissement','ralenti','provocation'];
export const EFFETS = {
 brulure:{nom:'Brûlure',description:'Dégâts de feu au début du tour (25 % de l’attaque de l’arme source, selon affinité Feu).'},
 ralenti:{nom:'Ralenti',description:'Esquive ×0,5, critique ×0,5, précision ×0,75.'},
 gele:{nom:'Gelé',description:'Perd le prochain tour entier et annule toute charge.'},
 electrisation:{nom:'Électrisation',description:'Esquive ×1,35, critique ×1,35, précision ×1,15.'},
 surcharge:{nom:'Surcharge',description:'Deux actions consécutives pendant le prochain tour.'},
 poison:{nom:'Poison',description:'Perd 5 % des PV maximum au début de chaque tour. Traverse le bouclier.'},
 provocation:{nom:'Provocation',description:'Attire les attaques monocibles ennemies.'},
 bouclier:{nom:'Bouclier',description:'Absorbe les dégâts avant les PV réels, sauf Poison.'},
 regeneration:{nom:'Régénération',description:'Soigne un pourcentage des PV maximum au début de chaque tour.'},
 etourdissement:{nom:'Étourdissement',description:'Perd le prochain tour entier et annule toute charge.'},
 resistance_controle:{nom:'Résistance au contrôle',description:'Réduit de moitié les chances de Gelé, Étourdissement et Ralenti.'},
 immunise_controle:{nom:'Immunisé au contrôle de foule',description:'Immunité totale à Gelé, Étourdissement et Ralenti.'}
};
export function initialiserCombattant(source,{joueur=false}={}){
 return {...source,joueur,pvMax:source.pvMax??source.pv??100,pvActuels:source.pvActuels??source.pvMax??source.pv??100,effetsActifs:[...(source.effetsActifs||[])],bouclier:source.bouclier??null,charge:source.charge??null};
}
export function effet(c,id){return (c.effetsActifs||[]).find(e=>e.id===id)}
export function facteur(c,stat){let n=1;for(const e of c.effetsActifs||[]){if(e.id==='ralenti')n*=({esquive:.5,critique:.5,precision:.75})[stat]??1;if(e.id==='electrisation')n*=({esquive:1.35,critique:1.35,precision:1.15})[stat]??1}return n}
export function chanceControle(c,id,chance){if(!CONTROLES.includes(id))return borne(chance);if(c.immuniseControle||effet(c,'immunise_controle'))return 0;return borne(Math.min((id==='gele'||id==='etourdissement')?.25:1,chance)*(c.resistanceControle||effet(c,'resistance_controle')?.5:1))}
export function appliquerEffet(c,id,options={}){
 c.effetsActifs??=[];if(CONTROLES.includes(id)&&(c.immuniseControle||effet(c,'immunise_controle')))return false;
 if(id==='poison'&&(c.joueur===false||effet(c,'poison')))return false;
 if(id==='gele'||id==='etourdissement'){c.effetsActifs=c.effetsActifs.filter(e=>e.id!=='gele'&&e.id!=='etourdissement');c.charge=null}
 const data={id,duree:options.duree??1,...options};const i=c.effetsActifs.findIndex(e=>e.id===id);if(i>=0)c.effetsActifs.splice(i,1);c.effetsActifs.push(data);
 if(id==='bouclier')c.bouclier={points:Math.max(0,arrondi(options.points)),duree:data.duree};
 return true;
}
export function degatsSurCible(c,montant,{poison=false}={}){
 let reste=arrondi(montant),absorbes=0;if(!poison&&c.bouclier?.points>0){absorbes=Math.min(reste,c.bouclier.points);c.bouclier.points-=absorbes;reste-=absorbes;if(c.bouclier.points===0){c.bouclier=null;c.effetsActifs=(c.effetsActifs||[]).filter(e=>e.id!=='bouclier')}}
 c.pvActuels=Math.max(0,c.pvActuels-reste);if(c.pvActuels===0){c.effetsActifs=[];c.bouclier=null;c.charge=null}return {pv:reste,bouclier:absorbes,mort:c.pvActuels===0};
}
export function debutTour(c){
 const evenements=[];if(c.pvActuels<=0)return {actions:0,evenements};
 const poison=effet(c,'poison');if(poison){const r=degatsSurCible(c,arrondi(c.pvMax*.05),{poison:true});evenements.push(`Poison : ${r.pv} PV perdus.`)}
 if(c.pvActuels<=0)return {actions:0,evenements,mort:true};
 const brulure=effet(c,'brulure');if(brulure){const n=arrondi((brulure.attaqueArme??0)*.25*(c.affinites?.feu??1));const r=degatsSurCible(c,n);evenements.push(`Brûlure : ${r.pv+r.bouclier} dégâts.`)}
 if(c.pvActuels<=0)return {actions:0,evenements,mort:true};
 const regen=effet(c,'regeneration');if(regen){const soin=Math.min(c.pvMax-c.pvActuels,arrondi(c.pvMax*(regen.pourcentage??0)));c.pvActuels+=soin;evenements.push(`Régénération : +${soin} PV.`)}
 const surcharge=!!effet(c,'surcharge'),controle=!!effet(c,'gele')||!!effet(c,'etourdissement');
 if(controle){c.charge=null;evenements.push('Tour perdu : contrôle de foule.');}
 return {actions:controle?0:surcharge?2:1,evenements};
}
export function finTour(c){
 const expires=[];c.effetsActifs=(c.effetsActifs||[]).filter(e=>{if(e.id==='poison'||e.duree==null)return true;e.duree--;if(e.id==='bouclier'&&c.bouclier)c.bouclier.duree=e.duree;if(e.duree>0)return true;expires.push(e.id);if(e.id==='bouclier')c.bouclier=null;return false});return expires;
}
export function demarrerCharge(c,attaque){if(c.charge)throw Error('Charge déjà en cours');c.charge={attaqueId:attaque.id,restant:Math.max(1,Math.floor(attaque.preparation||attaque.charge||1)),prete:false};return progresserCharge(c)}
export function progresserCharge(c){if(!c.charge)throw Error('Aucune charge');if(c.charge.prete)return {prete:true,lancement:true};c.charge.restant--;c.charge.prete=c.charge.restant<=0;return {prete:c.charge.prete,lancement:false}}
export function annulerCharge(c){c.charge=null}
export function ciblesAttaque(attaque,ennemis,index){const vivants=ennemis.map((c,i)=>({c,i})).filter(x=>x.c.pvActuels>0);if(attaque.ciblage==='tous_ennemis'||attaque.ciblage==='zone')return vivants;if(attaque.ciblage==='plusieurs')return vivants.slice(0,attaque.nombreCibles||2);return vivants.filter(x=>x.i===index)}
export function tentativeEffet(c,definition,alea=Math.random){const id=definition.id||definition.effet;const chance=chanceControle(c,id,definition.chance??definition.probabilite??1);if(alea()>=chance)return false;return appliquerEffet(c,id,definition)}
export function trierEffets(c){return [...(c.effetsActifs||[])].sort((a,b)=>(NEGATIFS.includes(b.id)?1:0)-(NEGATIFS.includes(a.id)?1:0))}
