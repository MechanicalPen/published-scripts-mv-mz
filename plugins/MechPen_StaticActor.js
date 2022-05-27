//=============================================================================
// MechPen_StaticActor.js
//=============================================================================
/*:
* @target MV
* @plugindesc v1.0 Static Actor Plugin
* @author MechPen
*
* @help MechPen_StaticActor.js
*
* This plugin removes the sideview actors' motions and replaces the sv_actor
* image frames with a single static image. You can even use the different
* collapse effects!
*
*-----------------------------------------------------------------------------
* How to use this plugin
*-----------------------------------------------------------------------------
* Install to your plugins folder and turn it on in the Plugin Manager.
* In the img\sv_actors folder, place your actor's battle image. it should be
* a single frame image much like sv_enemies.
* Select this image in the [SV] Battler: section. it will appear as a weird
* cut out rectangle in engine, but will look correct in game.
*
* Experiement with adding Collapse Effect Traits (under the Other tab). its fun!
*
*-----------------------------------------------------------------------------
* About the license of this plugin (License)
*-----------------------------------------------------------------------------
* This plugin is released under the MIT License.
*
*-----------------------------------------------------------------------------
* The released versions of this plugin (Change log)
*-----------------------------------------------------------------------------
* version 1.0
* - Basic functionality completed.
*/

(() => {

function Sprite_StaticActor() {
    this.initialize.apply(this, arguments);
}

Sprite_StaticActor.prototype = Object.create(Sprite_Enemy.prototype);
Sprite_StaticActor.prototype.constructor = Sprite_StaticActor;

Sprite_StaticActor.prototype.initialize = function(battler) {
    Sprite_Enemy.prototype.initialize.call(this, battler);
};

Sprite_StaticActor.prototype.initMembers = function() {
    Sprite_Enemy.prototype.initMembers.call(this);
    this.createStateSprite();
};

Sprite_StaticActor.prototype.createStateSprite = Sprite_Actor.prototype.createStateSprite;
Sprite_StaticActor.prototype.updateStateSprite = function() {}; // nothing.

Sprite_StaticActor.prototype.setActorHome = Sprite_Actor.prototype.setActorHome;

Sprite_StaticActor.prototype.setBattler = function(battler) {
    Sprite_Battler.prototype.setBattler.call(this, battler);
    var changed = (battler !== this._enemy);
    if (changed) {
        this._enemy = battler;
        if (battler) {
            this.setActorHome(battler.index());
        }
        this._stateSprite.setup(battler);
    }
};

Sprite_StaticActor.prototype.updateBitmap = function() {
    Sprite_Battler.prototype.updateBitmap.call(this);
    var name = this._enemy.battlerName();
    var hue = 0;
    if (this._battlerName !== name || this._battlerHue !== hue) {
        this._battlerName = name;
        this._battlerHue = hue;
        this.loadBitmap(name, hue);
        this.initVisibility();
    }
};

Sprite_StaticActor.prototype.initVisibility = function() {
    if (!$gameSystem.isSideView()) {
        this.opacity = 0;
    }
};

Sprite_StaticActor.prototype.loadBitmap = function(name, hue) {
	this.bitmap = ImageManager.loadSvActor(name, hue);
};

Spriteset_Battle.prototype.createActors = function() {
    this._actorSprites = [];
    for (var i = 0; i < $gameParty.maxBattleMembers(); i++) {
        this._actorSprites[i] = new Sprite_StaticActor();
		// if you want to flip your actor image, uncomment following line.
		//this._actorSprites[i].scale.x = -1; 
        this._battleField.addChild(this._actorSprites[i]);
    }
};

var MechPen_Actor_performDamage = Game_Actor.prototype.performDamage;
Game_Actor.prototype.performDamage = function() {
    MechPen_Actor_performDamage.call(this);
	this.requestEffect('blink');
};

var MechPen_Actor_performActionStart = Game_Actor.prototype.performActionStart;
Game_Actor.prototype.performActionStart = function(action) {
	MechPen_Actor_performActionStart.call(this, action);
    this.requestEffect('whiten');
};

var MechPen_Actor_performCollapse = Game_Actor.prototype.performCollapse;
Game_Actor.prototype.performCollapse = function() {
    MechPen_Actor_performCollapse.call(this);
    if ($gameParty.inBattle()) {
		switch (this.collapseType()) {
		case 0:
			this.requestEffect('collapse');
			SoundManager.playEnemyCollapse();
			break;
		case 1:
			this.requestEffect('bossCollapse');
			SoundManager.playBossCollapse1();
			break;
		case 2:
			this.requestEffect('instantCollapse');
			break;
		}
    }
};

})();
// EOF