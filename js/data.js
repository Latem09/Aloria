import {ARMES} from './armes/index.js';
import {EQUIPEMENTS} from './equipements/index.js';
import {CONSOMMABLES} from './consommables/index.js';
import {OBJETS} from './objets/index.js';
export const CATALOGUE={...ARMES,...EQUIPEMENTS,...CONSOMMABLES,...OBJETS};
export const ITEMS=Object.values(CATALOGUE);
export const STATS=[{key:'force',name:'Force',base:10,gain:3,unit:''},{key:'vitalite',name:'Vitalité',base:100,gain:20,unit:' PV'},{key:'agilite',name:'Agilité',base:0,gain:1,unit:' %'},{key:'precision',name:'Précision',base:5,gain:1,unit:' % crit.'},{key:'puissanceCritique',name:'Puissance critique',base:1.25,gain:.03,unit:'×'},{key:'feu',name:'Feu',base:1,gain:.03,unit:'×'},{key:'glace',name:'Glace',base:1,gain:.03,unit:'×'},{key:'foudre',name:'Foudre',base:1,gain:.03,unit:'×'}];
export const SLOTS=[{key:'casque',name:'Casque'},{key:'plastron',name:'Plastron'},{key:'bottes',name:'Bottes'},{key:'arme',name:'Arme'},{key:'talisman',name:'Talisman'},{key:'compagnon',name:'Compagnon'}];
export const DEPART=['lame_modeste','chapeau_aventurier','tunique_aventurier','bottes_aventurier','camomille'];
export const EQUIPE_DEPART={arme:'lame_modeste',casque:'chapeau_aventurier',plastron:'tunique_aventurier',bottes:'bottes_aventurier',talisman:null,compagnon:null};
export function defaultProfile(){return {schemaVersion:2,pseudo:'',level:1,xp:0,avatar:1,title:'Recrue',stats:Object.fromEntries(STATS.map(s=>[s.key,0])),equipped:{...EQUIPE_DEPART},items:[...DEPART],progress:{world:0,level:0},createdAt:Date.now()}}
export function pointsAvailable(p){return Math.max(0,p.level-1-STATS.reduce((n,s)=>n+(p.stats[s.key]||0),0))}
export function normalizeProfile(raw){const d=defaultProfile();if(!raw||typeof raw!=='object')return d;const stats=Object.fromEntries(STATS.map(s=>[s.key,Math.max(0,Math.min(10,Math.floor(Number(raw.stats?.[s.key])||0)))]));const level=Math.max(1,Math.min(81,Math.floor(Number(raw.level)||1)));const available=Math.max(0,level-1);let used=0;for(const s of STATS){const n=Math.min(stats[s.key],Math.max(0,available-used));stats[s.key]=n;used+=n}
// Migration V1 idempotente : conserver pseudo, niveau, XP et stats, retirer exclusivement les IDs de test.
const legacy=raw.schemaVersion!==2;const kept=legacy?[]:Array.isArray(raw.items)?raw.items.filter(id=>CATALOGUE[id]):[];const items=legacy?[...DEPART]:kept;const equipped=legacy?{...EQUIPE_DEPART}:Object.fromEntries(SLOTS.map(s=>[s.key,CATALOGUE[raw.equipped?.[s.key]]?.slot===s.key&&items.includes(raw.equipped[s.key])?raw.equipped[s.key]:null]));return {...d,...raw,schemaVersion:2,level,xp:Math.max(0,Number(raw.xp)||0),stats,equipped,items,progress:{...d.progress,...raw.progress}}}
export function totalStat(p,key){const s=STATS.find(x=>x.key===key);return s.base+s.gain*(p.stats[key]||0)}
export function maxPV(p){return totalStat(p,'vitalite')+Object.values(p.equipped).reduce((sum,id)=>sum+(CATALOGUE[id]?.pv||0),0)}
export function esquive(p){return totalStat(p,'agilite')+Object.values(p.equipped).reduce((sum,id)=>sum+(CATALOGUE[id]?.esquive||0),0)}
export function resistanceElementaire(p,element){return Object.values(p.equipped).reduce((mult,id)=>{const item=CATALOGUE[id];return mult*(item?.resistances?.[element]??1)},1)}
export function seuilXP(level){return 100*level}
export function ajouterXP(p,montant){p.xp+=montant;let levels=0;while(p.level<81&&p.xp>=seuilXP(p.level)){p.xp-=seuilXP(p.level);p.level++;levels++}return levels}
