import {ATTAQUES} from '../attaques/index.js';
import {MONSTRES} from '../monstres/index.js';
import {NIVEAUX} from '../niveaux/index.js';
import {CATALOGUE,totalStat,maxPV,esquive,resistanceElementaire} from '../data.js';
import {tirerRecompenses} from '../recompenses/index.js';
import {arrondi,borne,initialiserCombattant,appliquerEffet,effet,facteur,degatsSurCible,debutTour,finTour,demarrerCharge,progresserCharge,annulerCharge,ciblesAttaque,tentativeEffet,trierEffets,EFFETS} from './mecaniques.js';
export {arrondi,appliquerEffet,effet,facteur,degatsSurCible,debutTour,finTour,demarrerCharge,progresserCharge,annulerCharge,ciblesAttaque,tentativeEffet,trierEffets,EFFETS};
function log(c,message){c.journal.push(message);if(c.journal.length>5)c.journal.shift()}
function generer(ids){return ids.map((id,i)=>initialiserCombattant({...MONSTRES[id],instance:i},{joueur:false}))}
function syncJoueur(c){c.joueur.pvActuels=c.pv;c.joueur.pvMax=c.pvMax;c.joueur.effetsActifs=c.effetsActifs;c.joueur.bouclier=c.bouclier;c.joueur.charge=c.charge}
function syncCombat(c){c.pv=c.joueur.pvActuels;c.effetsActifs=c.joueur.effetsActifs;c.bouclier=c.joueur.bouclier;c.charge=c.joueur.charge}
export function creerCombat(p,niveauId){const n=NIVEAUX[niveauId];if(!n)throw Error('Niveau inconnu');const joueur=initialiserCombattant({id:'joueur',nom:p.pseudo||'Aventurier',pvMax:maxPV(p),pvActuels:maxPV(p),affinites:Object.fromEntries(['feu','glace','foudre'].map(k=>[k,resistanceElementaire(p,k)]))},{joueur:true});return {niveauId,combatIndex:0,ennemis:generer(n.combats[0]),joueur,pv:joueur.pvActuels,pvMax:joueur.pvMax,effetsActifs:joueur.effetsActifs,bouclier:null,charge:null,phase:'combat',preparationUtilisee:false,effets:[],journal:['Le combat commence.'],tourEnnemi:0,ennemiSuivant:0,actionsRestantes:1,tourJoueurCommence:false,penaliteAppliquee:false}}
export function personnageAttaquant(p){const arme=CATALOGUE[p.equipped.arme];return {joueur:true,force:totalStat(p,'force'),critique:totalStat(p,'precision'),puissanceCritique:totalStat(p,'puissanceCritique'),elements:{feu:totalStat(p,'feu'),glace:totalStat(p,'glace'),foudre:totalStat(p,'foudre')},elementArme:arme?.element||'neutre'}}
export function joueurCible(p){return {esquive:esquive(p),affinites:Object.fromEntries(['feu','glace','foudre'].map(k=>[k,resistanceElementaire(p,k)]))}}
export function resoudreAttaque({attaque,attaquant,cible,arme=0,alea=Math.random}){
 const a=typeof attaque==='string'?ATTAQUES[attaque]:attaque;if(!a)throw Error('Attaque inconnue');
 const precision=borne((a.reussite??1)*facteur(attaquant,'precision'));
 if(alea()>=precision)return {etat:'echec',degats:0,critique:false};
 if(alea()<borne(((cible.esquive??0)+(cible.effetsActifs||[]).filter(e=>e.id==='bonus_agilite').reduce((n,e)=>n+(e.valeur??0),0))/100*facteur(cible,'esquive')))return {etat:'esquive',degats:0,critique:false};
 const critique=alea()<borne((attaquant.critique??0)/100*facteur(attaquant,'critique')); 
 const element=a.element||'neutre';const E=element==='neutre'||(attaquant.joueur&&attaquant.elementArme!==element)?1:(attaquant.elements?.[element]??1);
 const R=element==='neutre'?1:(cible.affinites?.[element]??1);const C=critique?(attaquant.puissanceCritique??1):1;
 const force=(attaquant.force??0)*(1+(attaquant.effetsActifs||[]).filter(e=>e.id==='bonus_force').reduce((n,e)=>n+(e.valeur??0),0));const brut=attaquant.joueur?force+(arme||attaquant.attaqueArme||0)*(a.puissance??1):force*(a.puissance??1);const malus=(attaquant.effetsActifs||[]).filter(e=>e.id==='malus_degats').reduce((n,e)=>n*(1-(e.valeur??0)),1);
 return {etat:'touche',degats:arrondi(brut*E*R*C*(attaquant.bonusDegats??1)*malus),critique};
}
export function degatsPrevus(p,id,cible){const a=ATTAQUES[id],arme=CATALOGUE[p.equipped.arme];if(!a||!arme||!cible)return null;const element=a.element||'neutre';const E=element!=='neutre'&&arme.element===element?totalStat(p,element):1;const R=element==='neutre'?1:(cible.affinites?.[element]??1);const brut=(totalStat(p,'force')+arme.attaque*(a.puissance??1))*E*R;return {normal:arrondi(brut),critique:arrondi(brut*totalStat(p,'puissanceCritique'))}}
function effetsCapacite(a,attaquant,cible,allies,alea,combat){
 const autres=allies.filter(x=>x!==attaquant&&x.pvActuels>0);
 const allie=autres[0];
 for(const def of a.effets||[]){const target=def.cible==='soi'?attaquant:def.cible==='allie_hors_soi'?allie:cible;
  if(!target||target.pvActuels<=0)continue;
  const ok=tentativeEffet(target,def,alea);if(ok)log(combat,`${EFFETS[def.id]?.nom||def.id} appliqué à ${target.nom||'la cible'}.`);
 }
}
function attaquePonderee(e,alea){const ouverture=e.sequenceOuverture||[];e.actionsIA??=0;const n=e.actionsIA++;if(n<ouverture.length)return ouverture[n];const poids=e.poidsAttaques||e.attaques.map(()=>100/e.attaques.length);let roll=alea()*100;for(let i=0;i<e.attaques.length;i++){roll-=poids[i]||0;if(roll<0)return e.attaques[i]}return e.attaques[e.attaques.length-1]}
function message(r){return r.etat==='echec'?'attaque manquée':r.etat==='esquive'?'esquivée':`${r.degats} dégâts${r.critique?' (critique)':''}`}
function terminerTourJoueur(c,alea){syncJoueur(c);for(const id of finTour(c.joueur))log(c,`${EFFETS[id]?.nom||id} expire.`);c.joueur.enTour=false;syncCombat(c);c.tourJoueurCommence=false;if(finCombat(c,alea))return;c.phase='riposte';c.ennemiSuivant=0;c.tourEnnemi++}
function finCombat(c,alea){if(!c.ennemis.every(e=>e.pvActuels<=0))return false;const n=NIVEAUX[c.niveauId];if(c.combatIndex+1<n.combats.length){c.phase='preparation';c.preparationUtilisee=false;log(c,'Combat remporté. Préparez-vous pour le prochain.')}else{c.phase='victoire';c.recompenses=tirerRecompenses(n.recompense,alea);c.joueur.effetsActifs=[];c.joueur.bouclier=null;syncCombat(c);log(c,'Niveau terminé !')}return true}
function debutActionJoueur(c){if(c.tourJoueurCommence)return;c.tourJoueurCommence=true;syncJoueur(c);c.joueur.enTour=true;const tour=debutTour(c.joueur);tour.evenements.forEach(m=>log(c,m));c.actionsRestantes=tour.actions;syncCombat(c);if(tour.mort){c.phase='defaite';c.penaliteAppliquee=false;log(c,'Défaite.');return}if(tour.actions===0){terminerTourJoueur(c,Math.random)}}
export function attaquer(c,p,id,index,alea=Math.random){if(c.phase!=='combat')throw Error('Combat indisponible');const a=ATTAQUES[id],arme=CATALOGUE[p.equipped.arme];if(!a||!arme?.attaques?.includes(id))throw Error('Attaque indisponible');debutActionJoueur(c);if(c.phase!=='combat')return null;
 syncJoueur(c);
 if(c.joueur.charge){if(c.joueur.charge.attaqueId!==id){annulerCharge(c.joueur);log(c,'Préparation abandonnée.');syncCombat(c);finirAction(c,alea);return {etat:'annulation'}}else if(c.joueur.charge.prete){annulerCharge(c.joueur)}else{const avance=progresserCharge(c.joueur);if(avance.prete){annulerCharge(c.joueur)}else{log(c,'Préparation de l’attaque chargée.');syncCombat(c);finirAction(c,alea);return {etat:'preparation'}}}}
 else if(a.preparation||a.charge){const avance=demarrerCharge(c.joueur,a);log(c,avance.prete?'Attaque chargée prête à lancer.':'Préparation de l’attaque chargée.');syncCombat(c);finirAction(c,alea);return {etat:'preparation'}}
 if(a.type==='Soutien'||a.type==='Support'){
   const chance=borne((a.reussite??1)*facteur(c.joueur,'precision'));
   const succes=alea()<chance;
   if(succes){effetsCapacite(a,c.joueur,c.joueur,[c.joueur],alea,c);if(a.bouclier)appliquerEffet(c.joueur,'bouclier',{points:a.bouclier,duree:a.duree??1});if(a.regeneration)appliquerEffet(c.joueur,'regeneration',{pourcentage:a.regeneration,duree:a.duree??1});}
   log(c,`${a.nom} : ${succes?'réussi':'échec'}.`);syncCombat(c);finirAction(c,alea);return {etat:succes?'soutien':'echec',degats:0};
 }
 const provoquants=c.ennemis.map((e,i)=>({e,i})).filter(x=>x.e.pvActuels>0&&effet(x.e,'provocation'));if(provoquants.length&&a.ciblage==='unique_choix'&&!provoquants.some(x=>x.i===index))throw Error('Cette cible est protégée par une provocation.');const targets=ciblesAttaque(a,c.ennemis,index);if(!targets.length)throw Error('Cible invalide');const results=[];
 for(const {c:cible} of targets){const r=resoudreAttaque({attaque:a,attaquant:{...personnageAttaquant(p),effetsActifs:c.joueur.effetsActifs},cible,arme:arme.attaque,alea});if(r.etat==='touche'){const hit=degatsSurCible(cible,r.degats);if(hit.bouclier)log(c,`Bouclier de ${cible.nom} : ${hit.bouclier} dégâts absorbés.`);effetsCapacite(a,c.joueur,cible,[c.joueur],alea,c)}log(c,`${a.nom} sur ${cible.nom} : ${message(r)}.`);results.push(r)}
 syncCombat(c);finirAction(c,alea);return results.length===1?results[0]:results;
}
function finirAction(c,alea){c.actionsRestantes=Math.max(0,c.actionsRestantes-1);if(finCombat(c,alea))return;if(c.actionsRestantes===0)terminerTourJoueur(c,alea)}
export function consommer(c,p,id,alea=Math.random){if(!['combat','preparation'].includes(c.phase))throw Error('Consommable indisponible');if(c.phase==='preparation'&&c.preparationUtilisee)throw Error('Une seule utilisation en préparation');const it=CATALOGUE[id];if(it?.category!=='consumables')throw Error('Objet non consommable');const i=p.items.indexOf(id);if(i<0)throw Error('Objet absent');if(c.phase==='combat'){debutActionJoueur(c);if(c.phase!=='combat')return;if(c.joueur.charge)throw Error('Impossible pendant une attaque chargée')}
 if(it.soin&&c.pv>=maxPV(p)&&!it.effets?.length)throw Error('PV déjà au maximum');p.items.splice(i,1);c.pv=Math.min(maxPV(p),c.pv+(it.soin||0));syncJoueur(c);if(it.antidote){c.joueur.effetsActifs=c.joueur.effetsActifs.filter(e=>e.id!=='poison')}for(const def of it.effets||[])appliquerEffet(c.joueur,def.id,def);syncCombat(c);log(c,`${it.name} utilisé.`);if(c.phase==='preparation')c.preparationUtilisee=true;else finirAction(c,alea)}
export function actionEnnemiSuivante(c,p,alea=Math.random){
 if(c.phase!=='riposte')throw Error('Ce n’est pas la phase ennemie');
 while(c.ennemiSuivant<c.ennemis.length&&c.ennemis[c.ennemiSuivant].pvActuels<=0)c.ennemiSuivant++;
 if(c.ennemiSuivant>=c.ennemis.length){c.phase='combat';return null}
 const e=c.ennemis[c.ennemiSuivant];
 if(!e.tourEnCours){const tour=debutTour(e);e.tourEnCours=true;e.enTour=true;e.actionsEnnemies=tour.actions;for(const msg of tour.evenements)log(c,`${e.nom} — ${msg}`);}
 if(e.pvActuels<=0||e.actionsEnnemies<=0){e.tourEnCours=false;finTour(e);e.enTour=false;c.ennemiSuivant++;finRiposte(c);return {ennemi:e,attaque:null}}
 let id=e.charge?.attaqueId||attaquePonderee(e,alea);const a=ATTAQUES[id];if(!a){e.actionsEnnemies=0;return actionEnnemiSuivante(c,p,alea)}
 if(e.charge){if(!e.charge.prete){const avance=progresserCharge(e);if(!avance.prete){log(c,`${e.nom} prépare une attaque.`);e.actionsEnnemies--;if(e.actionsEnnemies===0){e.tourEnCours=false;finTour(e);e.enTour=false;c.ennemiSuivant++}finRiposte(c);return {ennemi:e,attaque:id}}}annulerCharge(e)}
 else if(a.preparation||a.charge){demarrerCharge(e,a);log(c,`${e.nom} prépare une attaque.`);e.actionsEnnemies--;if(e.actionsEnnemies===0){e.tourEnCours=false;finTour(e);e.enTour=false;c.ennemiSuivant++}finRiposte(c);return {ennemi:e,attaque:id}}
 const allies=c.ennemis.filter(x=>x.pvActuels>0);const joueur={...joueurCible(p),...c.joueur,esquive:esquive(p)};
 const boost=allies.some(x=>x.famille==='Loup'&&effet(x,'ralliement'))&&e.famille==='Loup'?1.1:1;
 if(a.type==='Soutien'){
  const targets=a.ciblage==='tous_ennemis'?[c.joueur]:a.ciblage==='tous_allies'?allies:a.ciblage==='allie_hors_soi'?allies.filter(x=>x!==e).slice(0,1):[e];
  for(const target of targets){if(alea()<(a.reussite??1)){if(id==='ralliement'){for(const wolf of allies.filter(x=>x.famille==='Loup'))appliquerEffet(wolf,'ralliement',{duree:2});}else effetsCapacite(a,e,target,allies,alea,c);log(c,`${e.nom} — ${a.nom} réussit.`)}else log(c,`${e.nom} — ${a.nom} échoue.`)}
 }else{
  const target=c.joueur;const r=resoudreAttaque({attaque:a,attaquant:{...e,bonusDegats:boost},cible:joueur,alea});
  if(r.etat==='touche'){degatsSurCible(c.joueur,r.degats);effetsCapacite(a,e,target,allies,alea,c)}
  syncCombat(c);log(c,`${e.nom} — ${a.nom} : ${message(r)}. ${c.pv} PV restants.`);
  if(c.pv<=0){c.phase='defaite';c.penaliteAppliquee=false;log(c,'Défaite.');return {ennemi:e,attaque:id,resultat:r}}
 }
 e.actionsEnnemies--;if(e.actionsEnnemies<=0){e.tourEnCours=false;finTour(e);e.enTour=false;c.ennemiSuivant++}finRiposte(c);return {ennemi:e,attaque:id};
}
function finRiposte(c){while(c.ennemiSuivant<c.ennemis.length&&c.ennemis[c.ennemiSuivant].pvActuels<=0)c.ennemiSuivant++;if(c.ennemiSuivant>=c.ennemis.length){c.phase='combat';c.effets=c.effets.filter(x=>x.expireApres>c.tourEnnemi)}}
export function combatSuivant(c){if(c.phase!=='preparation')throw Error('Pas en préparation');c.combatIndex++;c.ennemis=generer(NIVEAUX[c.niveauId].combats[c.combatIndex]);c.phase='combat';c.effets=[];c.ennemiSuivant=0;c.tourEnnemi=0;c.actionsRestantes=1;c.tourJoueurCommence=false;log(c,`Combat ${c.combatIndex+1} !`)}
