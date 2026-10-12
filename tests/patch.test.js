import test from 'node:test';
import assert from 'node:assert/strict';
import {MONSTRES} from '../js/monstres/index.js';
import {MONDES} from '../js/mondes/index.js';
import {NIVEAUX} from '../js/niveaux/index.js';
import {defaultProfile,resistanceElementaire} from '../js/data.js';
import {joueurCible} from '../js/combat/index.js';
test('catalogues centralisés conservant les fiches existantes',()=>{
 assert.equal(MONSTRES.loup_sauvage.pv,20);
 assert.equal(MONDES.pourtour_auren.niveaux[0],'lisiere_foret');
 assert.deepEqual(NIVEAUX.lisiere_foret.combats,[['loup_sauvage'],['loup_sauvage','loup_sauvage']]);
});
test('résistances neutres sans équipement spécifique',()=>{
 const p=defaultProfile();
 for(const e of ['feu','glace','foudre']){
  assert.equal(resistanceElementaire(p,e),1);
  assert.equal(joueurCible(p).affinites[e],1);
 }
});
